/**
 * Authenticated Paddle Billing mirror endpoint.
 */

import { NextResponse } from "next/server"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { getProjectBillingEntitlement } from "@/lib/billing-entitlements-server"
import { getPlanAccessState } from "@/lib/paddle-billing.mjs"
import { getPaddleServerEnvironment, hasPaddleServerConfig } from "@/lib/paddle-server"
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

  const [latestSubscription, paddleTransactions, paddleCustomers] = await Promise.all([
    getLatestSubscription(project.id, project.organizationId),
    getRecentTransactions(project.id, project.organizationId),
    prisma.paddleCustomer.findMany({
      where: { organizationId: project.organizationId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, email: true, updatedAt: true },
    }),
  ])
  const paddleSubscriptions = latestSubscription ? [latestSubscription] : []
  const entitlement = await getProjectBillingEntitlement(project.id, prisma)

  return NextResponse.json({
    billing: {
      environment: getPaddleServerEnvironment(),
      checkoutConfigured: Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN),
      webhookConfigured: Boolean(process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET),
      serverConfigured: hasPaddleServerConfig(),
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
    },
  })
}
