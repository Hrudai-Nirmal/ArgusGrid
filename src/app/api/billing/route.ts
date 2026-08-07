/**
 * Authenticated Paddle Billing mirror endpoint.
 */

import { NextResponse } from "next/server"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { getProjectBillingEntitlement } from "@/lib/billing-entitlements-server"
import { buildBillingWarningCards } from "@/lib/billing-notifications.mjs"
import { buildBillingSyncHealthSummary, getPlanAccessState } from "@/lib/paddle-billing.mjs"
import { getPaddleServerEnvironment, hasPaddleServerConfig, hasPaddleWebhookSecret } from "@/lib/paddle-server"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function serializeSubscription(subscription: Awaited<ReturnType<typeof getLatestSubscription>> | null) {
  const access = getPlanAccessState(subscription)
  return subscription ? {
    id: subscription.id,
    status: subscription.status,
    billingKey: subscription.billingKey,
    priceId: subscription.priceId,
    productId: subscription.productId,
    currencyCode: subscription.currencyCode,
    currentPeriodStartsAt: subscription.currentBillingPeriodStartsAt?.toISOString() ?? null,
    currentPeriodEndsAt: subscription.currentBillingPeriodEndsAt?.toISOString() ?? null,
    nextBilledAt: subscription.nextBilledAt?.toISOString() ?? null,
    scheduledChangeAction: subscription.scheduledChangeAction,
    scheduledChangeEffectiveAt: subscription.scheduledChangeEffectiveAt?.toISOString() ?? null,
    canceledAt: subscription.canceledAt?.toISOString() ?? null,
    access,
  } : {
    id: null,
    status: "free",
    billingKey: "free_sandbox",
    priceId: null,
    productId: null,
    currencyCode: null,
    currentPeriodStartsAt: null,
    currentPeriodEndsAt: null,
    nextBilledAt: null,
    scheduledChangeAction: null,
    scheduledChangeEffectiveAt: null,
    canceledAt: null,
    access,
  }
}

function serializeTransaction(transaction: Awaited<ReturnType<typeof getRecentTransactions>>[number]) {
  return {
    id: transaction.id,
    status: transaction.status,
    billingKey: transaction.billingKey,
    creditAmount: transaction.creditAmount,
    totalAmount: transaction.totalAmount,
    currencyCode: transaction.currencyCode,
    completedAt: transaction.completedAt?.toISOString() ?? null,
    billedAt: transaction.billedAt?.toISOString() ?? null,
    createdAt: transaction.createdAt.toISOString(),
  }
}

function serializeCreditLedgerEntry(entry: Awaited<ReturnType<typeof getRecentCreditLedgerEntries>>[number]) {
  return {
    id: entry.id,
    source: entry.source,
    amount: entry.amount,
    resource: entry.resource,
    description: entry.description,
    createdAt: entry.createdAt.toISOString(),
  }
}

function serializeBillingConfirmation(event: Awaited<ReturnType<typeof getRecentWebhookConfirmations>>[number] | null) {
  return event ? {
    type: event.eventType,
    status: event.status,
    occurredAt: event.occurredAt?.toISOString() ?? null,
    processedAt: event.processedAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
  } : null
}

async function getLatestSubscription(projectId: string, organizationId: string) {
  return getPrisma().paddleSubscription.findFirst({
    where: {
      OR: [
        { projectId },
        { organizationId },
      ],
    },
    orderBy: { updatedAt: "desc" },
  })
}

async function getRecentTransactions(projectId: string, organizationId: string) {
  return getPrisma().paddleTransaction.findMany({
    where: {
      OR: [
        { projectId },
        { organizationId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })
}

async function getRecentCreditLedgerEntries(projectId: string, organizationId: string) {
  return getPrisma().billingCreditLedgerEntry.findMany({
    where: {
      OR: [
        { projectId },
        { organizationId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      source: true,
      amount: true,
      resource: true,
      description: true,
      createdAt: true,
    },
  })
}

function getBillingResourceIds({
  customers,
  subscription,
  transactions,
}: {
  customers: { paddleCustomerId: string }[]
  subscription: Awaited<ReturnType<typeof getLatestSubscription>> | null
  transactions: Awaited<ReturnType<typeof getRecentTransactions>>
}) {
  return Array.from(new Set([
    ...customers.map((customer) => customer.paddleCustomerId),
    subscription?.paddleSubscriptionId,
    subscription?.paddleCustomerId,
    ...transactions.flatMap((transaction) => [
      transaction.paddleTransactionId,
      transaction.paddleSubscriptionId,
      transaction.paddleCustomerId,
    ]),
  ].filter((value): value is string => Boolean(value))))
}

async function getRecentWebhookConfirmations(resourceIds: string[]) {
  if (resourceIds.length === 0) return []

  return getPrisma().paddleWebhookEvent.findMany({
    where: { resourceId: { in: resourceIds } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      eventType: true,
      status: true,
      occurredAt: true,
      processedAt: true,
      createdAt: true,
    },
  })
}

/** Returns secret-safe mirrored Paddle subscription and transaction state. */
export async function GET(request: Request) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const projectId = new URL(request.url).searchParams.get("projectId")
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 })
  }

  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN", "MEMBER", "VIEWER"])
  if (accessError) return accessError

  const prisma = getPrisma()
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, organizationId: true } })
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 })
  }

  const [latestSubscription, paddleTransactions, paddleCustomers, creditLedgerEntries] = await Promise.all([
    getLatestSubscription(project.id, project.organizationId),
    getRecentTransactions(project.id, project.organizationId),
    prisma.paddleCustomer.findMany({
      where: { organizationId: project.organizationId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, paddleCustomerId: true, email: true, updatedAt: true },
    }),
    getRecentCreditLedgerEntries(project.id, project.organizationId),
  ])
  const paddleSubscriptions = latestSubscription ? [latestSubscription] : []
  const entitlement = await getProjectBillingEntitlement(project.id, prisma)
  const checkoutConfigured = Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN)
  const webhookConfigured = hasPaddleWebhookSecret()
  const serverConfigured = hasPaddleServerConfig()
  const billingResourceIds = getBillingResourceIds({
    customers: paddleCustomers,
    subscription: latestSubscription,
    transactions: paddleTransactions,
  })
  const billingConfirmations = await getRecentWebhookConfirmations(billingResourceIds)
  const recentRateLimitJob = await prisma.notificationJob.findFirst({
    where: {
      projectId: project.id,
      eventType: "billing.rate_limit_hit",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })
  const latestConfirmation = billingConfirmations[0] ?? null
  const failedConfirmations = billingConfirmations.filter((event) => event.status === "FAILED").length
  const syncSummary = buildBillingSyncHealthSummary({
    checkoutConfigured,
    webhookConfigured,
    serverConfigured,
    lastConfirmationAt: latestConfirmation?.processedAt ?? latestConfirmation?.occurredAt ?? latestConfirmation?.createdAt ?? null,
    lastConfirmationType: latestConfirmation?.eventType ?? null,
    lastConfirmationStatus: latestConfirmation?.status ?? null,
    failedConfirmations,
  })
  const billingWarnings = buildBillingWarningCards({
    entitlement: entitlement ? {
      plan: entitlement.plan,
      usage: entitlement.usage,
      creditPool: entitlement.creditPool,
      creditsRemaining: entitlement.creditsRemaining,
      spendProtection: entitlement.spendProtection,
      planLimits: {
        workflowRuns: entitlement.plan.workflowRunLimit,
        metricSamples: entitlement.plan.metricSampleLimit,
        notificationJobs: entitlement.plan.notificationJobLimit,
        reportShares: entitlement.plan.reportShareLimit,
      },
      isProvisional: entitlement.isProvisional,
      provisionalEndsAt: entitlement.provisionalEndsAt,
    } : null,
    subscription: latestSubscription ? {
      status: latestSubscription.status,
      nextBilledAt: latestSubscription.nextBilledAt?.toISOString() ?? null,
    } : null,
    rateLimitWarning: recentRateLimitJob ? { scope: "project", limit: 0, retryAfterSeconds: 60 } : null,
  })

  return NextResponse.json({
    billing: {
      environment: getPaddleServerEnvironment(),
      checkoutConfigured,
      webhookConfigured,
      serverConfigured,
      sync: {
        checkoutConfigured,
        webhookConfigured,
        serverConfigured,
        status: syncSummary.status,
        label: syncSummary.label,
        message: syncSummary.message,
        requiresAttention: syncSummary.requiresAttention,
        lastConfirmation: serializeBillingConfirmation(latestConfirmation),
        failedConfirmations,
      },
      warnings: billingWarnings,
      subscription: serializeSubscription(paddleSubscriptions[0] ?? null),
      customer: {
        hasCustomer: paddleCustomers.length > 0,
        email: paddleCustomers[0]?.email ?? null,
        updatedAt: paddleCustomers[0]?.updatedAt.toISOString() ?? null,
      },
      entitlement: entitlement ? {
        plan: {
          id: entitlement.plan.id,
          name: entitlement.plan.name,
          source: entitlement.source,
          isProvisional: entitlement.isProvisional,
          provisionalEndsAt: entitlement.provisionalEndsAt,
        },
        periodStart: entitlement.periodStart,
        usage: entitlement.usage,
        overage: entitlement.overage,
        creditPool: entitlement.creditPool,
        creditsUsed: entitlement.creditsUsed,
        creditsRemaining: entitlement.creditsRemaining,
        spendProtection: entitlement.spendProtection,
      } : null,
      transactions: paddleTransactions.map(serializeTransaction),
      creditLedger: creditLedgerEntries.map(serializeCreditLedgerEntry),
    },
  })
}
