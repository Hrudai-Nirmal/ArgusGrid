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

  const latestSubscription = await prisma.paddleSubscription.findFirst({
    where: {
      OR: [{ projectId }, { organizationId: project.organizationId }],
    },
    orderBy: { updatedAt: "desc" },
  })
  const recentTransactions = await prisma.paddleTransaction.findMany({
    where: {
      OR: [{ projectId }, { organizationId: project.organizationId }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  const planEvidence = getBillingPlanFromEvidence({
    subscription: latestSubscription,
    transactions: recentTransactions as never[],
  })
  const periodStart = getEntitlementPeriodStart(latestSubscription)
  const usage = await getUsageCounts(prisma, projectId, periodStart)
  const purchasedCredits = recentTransactions
    .filter((transaction) => PAID_TRANSACTION_STATUSES.includes(transaction.status.toLowerCase()))
    .reduce((sum, transaction) => sum + (transaction.creditAmount ?? 0), 0)
  const operationsPolicy = normalizeProjectOperationsPolicy(project.operationsPolicy)
  const entitlement = buildUsageEntitlement({
    planId: planEvidence.plan.id,
    usage,
    purchasedCredits,
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
    creditsRemaining: decision.creditsRemainingAfter,
    plan: {
      id: summary.plan.id,
      name: summary.plan.name,
      source: summary.source,
      isProvisional: summary.isProvisional,
      provisionalEndsAt: summary.provisionalEndsAt,
    },
  }
}
