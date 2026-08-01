/**
 * Server-side entitlement checks derived from verified Paddle billing mirrors.
 */

import "server-only"

import type { Prisma, PrismaClient } from "@prisma/client"

import {
  buildUsageEntitlement,
  canConsumeEntitlementResource,
  getBillingPlanFromEvidence,
} from "@/lib/billing-entitlements.mjs"
import { normalizeProjectOperationsPolicy } from "@/lib/billing-plans.mjs"
import { getPrisma } from "@/lib/prisma"

type BillingPrisma = PrismaClient | Prisma.TransactionClient
type BillingResourceKind = "workflow_run" | "metric_sample" | "notification_job" | "report_share"

const PAID_TRANSACTION_STATUSES = ["completed", "paid"]
const CREDIT_PURCHASE_SOURCE = "credit_purchase"
const CREDIT_USAGE_SOURCE = "usage_charge"

function currentMonthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
}

function getEntitlementPeriodStart(subscription: { currentBillingPeriodStartsAt: Date | null } | null) {
  return subscription?.currentBillingPeriodStartsAt ?? currentMonthStart()
}

async function getUsageCounts(prisma: BillingPrisma, projectId: string, periodStart: Date) {
  const [workflowRuns, metricSamples, notificationJobs, reportShares] = await Promise.all([
    prisma.workflowRun.count({ where: { node: { projectId }, startedAt: { gte: periodStart } } }),
    prisma.metricSample.count({ where: { node: { projectId }, sampledAt: { gte: periodStart } } }),
    prisma.notificationJob.count({ where: { projectId, createdAt: { gte: periodStart } } }),
    prisma.reportShare.count({ where: { projectId, createdAt: { gte: periodStart } } }),
  ])

  return { workflowRuns, metricSamples, notificationJobs, reportShares }
}

async function createEntitlementAuditLog(prisma: BillingPrisma, input: {
  projectId: string
  organizationId: string
  resource: BillingResourceKind
  reason: string
  limit: number
  used: number
  creditsRemaining: number
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      action: "billing.entitlement_denied",
      entity: "billing",
      entityId: input.projectId,
      metadata: {
        resource: input.resource,
        reason: input.reason,
        limit: input.limit,
        used: input.used,
        creditsRemaining: input.creditsRemaining,
      },
    },
  })
}

async function getCreditLedgerTotals(prisma: BillingPrisma, input: { projectId: string; organizationId: string }) {
  const [ledgerEntries, creditTransactions] = await Promise.all([
    prisma.billingCreditLedgerEntry.findMany({
      where: {
        OR: [
          { projectId: input.projectId },
          { organizationId: input.organizationId },
        ],
      },
      select: { amount: true, source: true, paddleTransactionId: true },
    }),
    prisma.paddleTransaction.findMany({
      where: {
        OR: [
          { projectId: input.projectId },
          { organizationId: input.organizationId },
        ],
        status: { in: PAID_TRANSACTION_STATUSES },
        creditAmount: { gt: 0 },
      },
      select: { paddleTransactionId: true, creditAmount: true },
    }),
  ])
  const ledgeredTransactionIds = new Set(
    ledgerEntries
      .filter((entry) => entry.source === CREDIT_PURCHASE_SOURCE && entry.paddleTransactionId)
      .map((entry) => entry.paddleTransactionId)
  )
  const ledgerPurchasedCredits = ledgerEntries
    .filter((entry) => entry.amount > 0)
    .reduce((sum, entry) => sum + entry.amount, 0)
  const legacyPurchasedCredits = creditTransactions
    .filter((transaction) => !ledgeredTransactionIds.has(transaction.paddleTransactionId))
    .reduce((sum, transaction) => sum + (transaction.creditAmount ?? 0), 0)
  const consumedCredits = Math.abs(
    ledgerEntries
      .filter((entry) => entry.amount < 0)
      .reduce((sum, entry) => sum + entry.amount, 0)
  )

  return {
    purchasedCredits: ledgerPurchasedCredits + legacyPurchasedCredits,
    consumedCredits,
  }
}

/**
 * Returns the current project entitlement summary from signed billing evidence.
 */
export async function getProjectBillingEntitlement(projectId: string, prisma: BillingPrisma = getPrisma()) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      organizationId: true,
      operationsPolicy: true,
    },
  })
  if (!project) return null

  const [latestSubscription, recentTransactions] = await Promise.all([
    prisma.paddleSubscription.findFirst({
      where: {
        OR: [{ projectId }, { organizationId: project.organizationId }],
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.paddleTransaction.findMany({
      where: {
        OR: [{ projectId }, { organizationId: project.organizationId }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])
  const planEvidence = getBillingPlanFromEvidence({
    subscription: latestSubscription,
    transactions: recentTransactions as never[],
  })
  const periodStart = getEntitlementPeriodStart(latestSubscription)
  const [usage, creditLedgerTotals] = await Promise.all([
    getUsageCounts(prisma, projectId, periodStart),
    getCreditLedgerTotals(prisma, { projectId, organizationId: project.organizationId }),
  ])
  const operationsPolicy = normalizeProjectOperationsPolicy(project.operationsPolicy)
  const entitlement = buildUsageEntitlement({
    planId: planEvidence.plan.id,
    usage,
    purchasedCredits: creditLedgerTotals.purchasedCredits,
    consumedCredits: creditLedgerTotals.consumedCredits,
    spendProtection: operationsPolicy.spendProtection,
  })

  return {
    projectId,
    organizationId: project.organizationId,
    periodStart: periodStart.toISOString(),
    plan: planEvidence.plan,
    source: planEvidence.source,
    isProvisional: planEvidence.isProvisional,
    provisionalEndsAt: planEvidence.provisionalEndsAt,
    usage: entitlement.usage,
    overage: entitlement.overage,
    creditPool: entitlement.creditPool,
    creditsUsed: entitlement.creditsUsed,
    creditsRemaining: entitlement.creditsRemaining,
    spendProtection: entitlement.spendProtection,
    entitlement,
  }
}

/**
 * Authorizes a single project resource write and records safe denial evidence.
 */
export async function authorizeProjectUsage(prisma: BillingPrisma, input: {
  projectId: string
  resource: BillingResourceKind
  amount?: number
  auditDenied?: boolean
}) {
  const summary = await getProjectBillingEntitlement(input.projectId, prisma)
  if (!summary) {
    return {
      allowed: false,
      status: 404,
      error: "Project not found for billing entitlement check.",
    }
  }

  const decision = canConsumeEntitlementResource(summary.entitlement, input.resource, input.amount ?? 1)
  if (!decision.allowed && input.auditDenied !== false) {
    await createEntitlementAuditLog(prisma, {
      projectId: summary.projectId,
      organizationId: summary.organizationId,
      resource: input.resource,
      reason: decision.reason,
      limit: decision.limit,
      used: decision.used,
      creditsRemaining: decision.creditsRemainingAfter,
    })
  }

  return {
    allowed: decision.allowed,
    status: decision.allowed ? 200 : 402,
    error: decision.allowed ? null : "Billing entitlement limit reached.",
    reason: decision.reason,
    resource: input.resource,
    limit: decision.limit,
    used: decision.used,
    creditsNeeded: decision.creditsNeeded,
    creditsRemaining: decision.creditsRemainingAfter,
    organizationId: summary.organizationId,
    plan: {
      id: summary.plan.id,
      name: summary.plan.name,
      source: summary.source,
      isProvisional: summary.isProvisional,
      provisionalEndsAt: summary.provisionalEndsAt,
    },
  }
}

/**
 * Consumes prepaid credits for allowed overage writes with idempotent ledger evidence.
 */
export async function consumeProjectUsageCredits(prisma: BillingPrisma, input: {
  projectId: string
  resource: BillingResourceKind
  amount?: number
  idempotencyKey: string
  description: string
  metadata?: Prisma.InputJsonValue
}) {
  const authorization = await authorizeProjectUsage(prisma, {
    projectId: input.projectId,
    resource: input.resource,
    amount: input.amount ?? 1,
  })
  const creditsNeeded = authorization.creditsNeeded ?? 0
  if (!authorization.allowed || creditsNeeded <= 0) {
    return { ...authorization, creditsCharged: 0 }
  }
  if (!authorization.organizationId) {
    return {
      ...authorization,
      allowed: false,
      status: 404,
      error: "Project not found for billing credit ledger.",
      creditsCharged: 0,
    }
  }

  const existingLedgerEntry = await prisma.billingCreditLedgerEntry.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true },
  })
  if (!existingLedgerEntry) {
    await prisma.billingCreditLedgerEntry.create({
      data: {
        source: CREDIT_USAGE_SOURCE,
        amount: -creditsNeeded,
        resource: input.resource,
        description: input.description,
        idempotencyKey: input.idempotencyKey,
        metadata: input.metadata,
        projectId: input.projectId,
        organizationId: authorization.organizationId,
      },
    })
    await prisma.auditLog.create({
      data: {
        organizationId: authorization.organizationId,
        projectId: input.projectId,
        action: "billing.credits_consumed",
        entity: "billing",
        entityId: input.projectId,
        metadata: {
          resource: input.resource,
          creditsCharged: creditsNeeded,
          idempotencyKey: input.idempotencyKey,
          description: input.description,
        },
      },
    })
  }

  return { ...authorization, creditsCharged: creditsNeeded }
}

/**
 * Idempotently grants durable prepaid credits after a verified paid credit-pack transaction.
 */
export async function grantPurchasedCredits(prisma: BillingPrisma, input: {
  organizationId: string
  projectId?: string | null
  userId?: string | null
  paddleTransactionId: string
  credits: number
  billingKey?: string | null
}) {
  if (input.credits <= 0) return null

  return prisma.billingCreditLedgerEntry.upsert({
    where: { idempotencyKey: `${CREDIT_PURCHASE_SOURCE}:${input.paddleTransactionId}` },
    update: {},
    create: {
      source: CREDIT_PURCHASE_SOURCE,
      amount: input.credits,
      resource: "credit_pack",
      description: "Prepaid credits purchased through verified checkout.",
      idempotencyKey: `${CREDIT_PURCHASE_SOURCE}:${input.paddleTransactionId}`,
      paddleTransactionId: input.paddleTransactionId,
      userId: input.userId ?? null,
      organizationId: input.organizationId,
      projectId: input.projectId ?? null,
      metadata: { billingKey: input.billingKey ?? null },
    },
  })
}
