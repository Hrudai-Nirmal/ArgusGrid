/**
 * Paddle webhook processing and billing mirror helpers.
 */

import "server-only"

import type { Prisma, PrismaClient } from "@prisma/client"

import {
  getCreditAmountFromBillingKey,
  getMeridianBillingKeyFromCheckoutId,
  getMeridianBillingKeyFromPriceId,
  getPaddlePriceIdConfig,
  sanitizePaddleFailure,
} from "@/lib/paddle-billing.mjs"
import { grantPurchasedCredits } from "@/lib/billing-entitlements-server"
import { getPrisma } from "@/lib/prisma"

type PaddleObject = Record<string, unknown>
type PaddleTransaction = Prisma.TransactionClient

const PADDLE_CUSTOMER_EVENTS = new Set(["customer.created", "customer.updated"])
const PADDLE_SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "subscription.activated",
  "subscription.past_due",
  "subscription.paused",
  "subscription.resumed",
  "subscription.trialing",
])
const PADDLE_TRANSACTION_EVENTS = new Set([
  "transaction.completed",
  "transaction.paid",
  "transaction.payment_failed",
  "transaction.canceled",
  "transaction.updated",
])

function asObject(value: unknown): PaddleObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as PaddleObject : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringField(source: PaddleObject, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim()) return value
  }
  return null
}

function numberField(source: PaddleObject, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return null
}

function dateField(source: PaddleObject, ...keys: string[]) {
  const value = stringField(source, ...keys)
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (!value || typeof value !== "object") return {}
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function getEventEnvelope(event: unknown) {
  const envelope = asObject(event)
  return {
    id: stringField(envelope, "eventId", "event_id", "id") ?? `missing-${crypto.randomUUID()}`,
    type: stringField(envelope, "eventType", "event_type") ?? "unknown",
    occurredAt: dateField(envelope, "occurredAt", "occurred_at") ?? new Date(),
    data: asObject(envelope.data),
  }
}

function getCustomData(data: PaddleObject) {
  return asObject(data.customData ?? data.custom_data)
}

function getFirstItem(data: PaddleObject) {
  const items = asArray(data.items)
  return asObject(items[0])
}

function getPriceId(data: PaddleObject) {
  const firstItem = getFirstItem(data)
  const itemPrice = asObject(firstItem.price)
  return stringField(data, "priceId", "price_id") ?? stringField(itemPrice, "id")
}

function getProductId(data: PaddleObject) {
  const firstItem = getFirstItem(data)
  const itemPrice = asObject(firstItem.price)
  const itemProduct = asObject(firstItem.product)
  return stringField(data, "productId", "product_id") ?? stringField(itemPrice, "productId", "product_id") ?? stringField(itemProduct, "id")
}

function getBillingPeriod(data: PaddleObject) {
  return asObject(data.currentBillingPeriod ?? data.current_billing_period ?? data.billingPeriod ?? data.billing_period)
}

function getScheduledChange(data: PaddleObject) {
  return asObject(data.scheduledChange ?? data.scheduled_change)
}

function getTransactionTotals(data: PaddleObject) {
  const details = asObject(data.details)
  return asObject(details.totals)
}

function resolveBillingKey(data: PaddleObject) {
  const customData = getCustomData(data)
  const checkoutKey = getMeridianBillingKeyFromCheckoutId(stringField(customData, "meridianCheckoutId", "meridian_checkout_id"))
  if (checkoutKey) return checkoutKey
  return getMeridianBillingKeyFromPriceId(getPriceId(data), getPaddlePriceIdConfig())
}

async function getPaddleContext(tx: PaddleTransaction, data: PaddleObject) {
  const customData = getCustomData(data)
  const projectId = stringField(customData, "meridianProjectId", "meridian_project_id")
  const userId = stringField(customData, "meridianUserId", "meridian_user_id")
  const email = stringField(data, "email")

  if (projectId) {
    const project = await tx.project.findUnique({ where: { id: projectId }, select: { id: true, organizationId: true } })
    if (project) return { projectId: project.id, organizationId: project.organizationId, userId }
  }

  if (userId) {
    const membership = await tx.membership.findFirst({ where: { userId }, select: { organizationId: true } })
    if (membership) return { projectId: null, organizationId: membership.organizationId, userId }
  }

  if (email) {
    const user = await tx.user.findUnique({ where: { email }, select: { id: true, memberships: { take: 1, select: { organizationId: true } } } })
    if (user) return { projectId: null, organizationId: user.memberships[0]?.organizationId ?? null, userId: user.id }
  }

  return { projectId: null, organizationId: null, userId: userId ?? null }
}

async function upsertPaddleCustomer(tx: PaddleTransaction, data: PaddleObject, environment: string) {
  const paddleCustomerId = stringField(data, "customerId", "customer_id", "id")
  if (!paddleCustomerId) return null

  const context = await getPaddleContext(tx, data)
  return tx.paddleCustomer.upsert({
    where: { paddleCustomerId },
    create: {
      paddleCustomerId,
      email: stringField(data, "email"),
      name: stringField(data, "name"),
      environment,
      userId: context.userId,
      organizationId: context.organizationId,
    },
    update: {
      email: stringField(data, "email"),
      name: stringField(data, "name"),
      environment,
      userId: context.userId,
      organizationId: context.organizationId,
    },
  })
}

async function upsertPaddleSubscription(tx: PaddleTransaction, data: PaddleObject, environment: string) {
  const paddleSubscriptionId = stringField(data, "subscriptionId", "subscription_id", "id")
  const paddleCustomerId = stringField(data, "customerId", "customer_id")
  if (!paddleSubscriptionId || !paddleCustomerId) return null

  const context = await getPaddleContext(tx, data)
  const billingPeriod = getBillingPeriod(data)
  const scheduledChange = getScheduledChange(data)

  await upsertPaddleCustomer(tx, { ...data, id: paddleCustomerId }, environment)

  return tx.paddleSubscription.upsert({
    where: { paddleSubscriptionId },
    create: {
      paddleSubscriptionId,
      paddleCustomerId,
      status: stringField(data, "status") ?? "unknown",
      billingKey: resolveBillingKey(data),
      priceId: getPriceId(data),
      productId: getProductId(data),
      currencyCode: stringField(data, "currencyCode", "currency_code"),
      currentBillingPeriodStartsAt: dateField(billingPeriod, "startsAt", "starts_at"),
      currentBillingPeriodEndsAt: dateField(billingPeriod, "endsAt", "ends_at"),
      nextBilledAt: dateField(data, "nextBilledAt", "next_billed_at"),
      scheduledChangeAction: stringField(scheduledChange, "action"),
      scheduledChangeEffectiveAt: dateField(scheduledChange, "effectiveAt", "effective_at"),
      canceledAt: dateField(data, "canceledAt", "canceled_at"),
      environment,
      items: jsonValue(data.items),
      customData: jsonValue(getCustomData(data)),
      userId: context.userId,
      organizationId: context.organizationId,
      projectId: context.projectId,
    },
    update: {
      paddleCustomerId,
      status: stringField(data, "status") ?? "unknown",
      billingKey: resolveBillingKey(data),
      priceId: getPriceId(data),
      productId: getProductId(data),
      currencyCode: stringField(data, "currencyCode", "currency_code"),
      currentBillingPeriodStartsAt: dateField(billingPeriod, "startsAt", "starts_at"),
      currentBillingPeriodEndsAt: dateField(billingPeriod, "endsAt", "ends_at"),
      nextBilledAt: dateField(data, "nextBilledAt", "next_billed_at"),
      scheduledChangeAction: stringField(scheduledChange, "action"),
      scheduledChangeEffectiveAt: dateField(scheduledChange, "effectiveAt", "effective_at"),
      canceledAt: dateField(data, "canceledAt", "canceled_at"),
      environment,
      items: jsonValue(data.items),
      customData: jsonValue(getCustomData(data)),
      userId: context.userId,
      organizationId: context.organizationId,
      projectId: context.projectId,
    },
  })
}

async function upsertPaddleTransaction(tx: PaddleTransaction, data: PaddleObject, environment: string) {
  const paddleTransactionId = stringField(data, "transactionId", "transaction_id", "id")
  const paddleCustomerId = stringField(data, "customerId", "customer_id")
  if (!paddleTransactionId) return null

  const context = await getPaddleContext(tx, data)
  const checkout = asObject(data.checkout)
  const billingKey = resolveBillingKey(data)
  const totals = getTransactionTotals(data)

  if (paddleCustomerId) {
    await upsertPaddleCustomer(tx, { ...data, id: paddleCustomerId }, environment)
  }

  return tx.paddleTransaction.upsert({
    where: { paddleTransactionId },
    create: {
      paddleTransactionId,
      paddleCustomerId,
      paddleSubscriptionId: stringField(data, "subscriptionId", "subscription_id"),
      status: stringField(data, "status") ?? "unknown",
      billingKey,
      checkoutId: stringField(checkout, "url") ? null : stringField(checkout, "id"),
      creditAmount: getCreditAmountFromBillingKey(billingKey),
      priceId: getPriceId(data),
      productId: getProductId(data),
      totalAmount: numberField(totals, "total"),
      currencyCode: stringField(data, "currencyCode", "currency_code"),
      billedAt: dateField(data, "billedAt", "billed_at"),
      completedAt: dateField(data, "createdAt", "created_at", "updatedAt", "updated_at"),
      environment,
      details: jsonValue(data.details),
      customData: jsonValue(getCustomData(data)),
      userId: context.userId,
      organizationId: context.organizationId,
      projectId: context.projectId,
    },
    update: {
      paddleCustomerId,
      paddleSubscriptionId: stringField(data, "subscriptionId", "subscription_id"),
      status: stringField(data, "status") ?? "unknown",
      billingKey,
      checkoutId: stringField(checkout, "url") ? null : stringField(checkout, "id"),
      creditAmount: getCreditAmountFromBillingKey(billingKey),
      priceId: getPriceId(data),
      productId: getProductId(data),
      totalAmount: numberField(totals, "total"),
      currencyCode: stringField(data, "currencyCode", "currency_code"),
      billedAt: dateField(data, "billedAt", "billed_at"),
      completedAt: dateField(data, "createdAt", "created_at", "updatedAt", "updated_at"),
      environment,
      details: jsonValue(data.details),
      customData: jsonValue(getCustomData(data)),
      userId: context.userId,
      organizationId: context.organizationId,
      projectId: context.projectId,
    },
  })
}

/**
 * Idempotently mirrors a verified Paddle webhook event into Meridian billing tables.
 */
export async function processPaddleWebhookEvent(event: unknown, prisma: PrismaClient = getPrisma()) {
  const envelope = getEventEnvelope(event)
  const environment = stringField(asObject(event), "environment") ?? "sandbox"
  const resourceId = stringField(envelope.data, "id", "subscriptionId", "subscription_id", "transactionId", "transaction_id", "customerId", "customer_id")

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.paddleWebhookEvent.findUnique({ where: { paddleEventId: envelope.id } })
      if (existing?.status === "PROCESSED") {
        return { status: "duplicate" as const, eventId: envelope.id, eventType: envelope.type }
      }

      await tx.paddleWebhookEvent.upsert({
        where: { paddleEventId: envelope.id },
        create: {
          paddleEventId: envelope.id,
          eventType: envelope.type,
          resourceId,
          environment,
          status: "PROCESSING",
          occurredAt: envelope.occurredAt,
        },
        update: {
          eventType: envelope.type,
          resourceId,
          environment,
          status: "PROCESSING",
          errorSummary: null,
          occurredAt: envelope.occurredAt,
        },
      })

      if (PADDLE_CUSTOMER_EVENTS.has(envelope.type)) {
        await upsertPaddleCustomer(tx, envelope.data, environment)
      }
      if (PADDLE_SUBSCRIPTION_EVENTS.has(envelope.type)) {
        await upsertPaddleSubscription(tx, envelope.data, environment)
      }
      if (PADDLE_TRANSACTION_EVENTS.has(envelope.type)) {
        const transaction = await upsertPaddleTransaction(tx, envelope.data, environment)
        if (
          transaction?.creditAmount &&
          transaction.creditAmount > 0 &&
          transaction.organizationId &&
          ["completed", "paid"].includes(transaction.status.toLowerCase())
        ) {
          await grantPurchasedCredits(tx, {
            organizationId: transaction.organizationId,
            projectId: transaction.projectId,
            userId: transaction.userId,
            paddleTransactionId: transaction.paddleTransactionId,
            credits: transaction.creditAmount,
            billingKey: transaction.billingKey,
          })
        }
      }

      await tx.paddleWebhookEvent.update({
        where: { paddleEventId: envelope.id },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          errorSummary: null,
        },
      })

      return { status: "processed" as const, eventId: envelope.id, eventType: envelope.type }
    })
  } catch (error) {
    await prisma.paddleWebhookEvent.upsert({
      where: { paddleEventId: envelope.id },
      create: {
        paddleEventId: envelope.id,
        eventType: envelope.type,
        resourceId,
        environment,
        status: "FAILED",
        errorSummary: sanitizePaddleFailure(error),
        occurredAt: envelope.occurredAt,
      },
      update: {
        status: "FAILED",
        errorSummary: sanitizePaddleFailure(error),
        processedAt: new Date(),
      },
    })
    throw error
  }
}
