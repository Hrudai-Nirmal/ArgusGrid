/*
 * Secret-safe billing entitlement calculations for plan limits, credits, and provisional access.
 */

import { MERIDIAN_PRICING_PLANS } from "./billing-plans.mjs"

export const BILLING_RESOURCE_LIMIT_FIELDS = {
  workflow_run: "workflowRunLimit",
  metric_sample: "metricSampleLimit",
  notification_job: "notificationJobLimit",
  report_share: "reportShareLimit",
}

const PLAN_KEYS = new Set(MERIDIAN_PRICING_PLANS.map((plan) => plan.id))
const PAID_STATUSES = new Set(["completed", "paid"])
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"])
const PROVISIONAL_ACCESS_MS = 24 * 60 * 60 * 1000

export function getPlanByBillingKey(billingKey) {
  return MERIDIAN_PRICING_PLANS.find((plan) => plan.id === billingKey) ?? MERIDIAN_PRICING_PLANS[0]
}

function normalizeStatus(value) {
  return String(value ?? "").toLowerCase()
}

function getTransactionTime(transaction) {
  const value = transaction?.completedAt ?? transaction?.billedAt ?? transaction?.createdAt
  const date = value instanceof Date ? value : new Date(String(value ?? ""))
  return Number.isNaN(date.getTime()) ? null : date
}

function isPlanKey(value) {
  return PLAN_KEYS.has(value) && value !== "free_sandbox" && !String(value).startsWith("credits_")
}

/**
 * Chooses the active plan from trusted server-side Paddle evidence.
 */
export function getBillingPlanFromEvidence({ subscription, transactions = [], now = new Date() }) {
  if (subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(normalizeStatus(subscription.status)) && isPlanKey(subscription.billingKey)) {
    return {
      plan: getPlanByBillingKey(subscription.billingKey),
      source: "subscription",
      isProvisional: false,
      provisionalEndsAt: null,
    }
  }

  const provisional = transactions
    .filter((transaction) => PAID_STATUSES.has(normalizeStatus(transaction.status)) && isPlanKey(transaction.billingKey))
    .map((transaction) => ({ transaction, createdAt: getTransactionTime(transaction) }))
    .filter((entry) => entry.createdAt && now.getTime() - entry.createdAt.getTime() <= PROVISIONAL_ACCESS_MS)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0]

  if (provisional) {
    return {
      plan: getPlanByBillingKey(provisional.transaction.billingKey),
      source: "provisional_transaction",
      isProvisional: true,
      provisionalEndsAt: new Date(provisional.createdAt.getTime() + PROVISIONAL_ACCESS_MS).toISOString(),
    }
  }

  return {
    plan: getPlanByBillingKey("free_sandbox"),
    source: "free",
    isProvisional: false,
    provisionalEndsAt: null,
  }
}

function getIncludedUsageOverage(plan, usage) {
  return {
    workflowRuns: Math.max(0, Number(usage.workflowRuns ?? 0) - plan.workflowRunLimit),
    metricSamples: Math.max(0, Number(usage.metricSamples ?? 0) - plan.metricSampleLimit),
    notificationJobs: Math.max(0, Number(usage.notificationJobs ?? 0) - plan.notificationJobLimit),
    reportShares: Math.max(0, Number(usage.reportShares ?? 0) - plan.reportShareLimit),
  }
}

function sumOverage(overage) {
  return overage.workflowRuns + overage.metricSamples + overage.notificationJobs + overage.reportShares
}

/**
 * Builds a complete usage entitlement summary from plan, usage, credits, and spend policy.
 */
export function buildUsageEntitlement({ planId, usage, purchasedCredits = 0, spendProtection = "use_credits" }) {
  const plan = getPlanByBillingKey(planId)
  const overage = getIncludedUsageOverage(plan, usage)
  const creditPool = plan.includedCredits + Math.max(0, Number(purchasedCredits ?? 0))
  const creditsUsed = sumOverage(overage)
  const creditsRemaining = Math.max(0, creditPool - creditsUsed)

  return {
    plan,
    usage: {
      workflowRuns: Number(usage.workflowRuns ?? 0),
      metricSamples: Number(usage.metricSamples ?? 0),
      notificationJobs: Number(usage.notificationJobs ?? 0),
      reportShares: Number(usage.reportShares ?? 0),
    },
    overage,
    spendProtection,
    creditPool,
    creditsUsed,
    creditsRemaining,
  }
}

function getUsageFieldForResource(resource) {
  if (resource === "workflow_run") return "workflowRuns"
  if (resource === "metric_sample") return "metricSamples"
  if (resource === "notification_job") return "notificationJobs"
  if (resource === "report_share") return "reportShares"
  return null
}

/**
 * Decides whether a resource write can proceed under the current entitlement.
 */
export function canConsumeEntitlementResource(entitlement, resource, amount = 1) {
  const limitField = BILLING_RESOURCE_LIMIT_FIELDS[resource]
  const usageField = getUsageFieldForResource(resource)
  if (!limitField || !usageField) {
    return {
      allowed: false,
      reason: "Unknown billing resource.",
      limit: 0,
      used: 0,
      creditsRemainingAfter: entitlement.creditsRemaining,
    }
  }

  const requested = Math.max(1, Number(amount ?? 1))
  const limit = entitlement.plan[limitField]
  const used = entitlement.usage[usageField]
  const includedRemaining = Math.max(0, limit - used)
  const creditsNeeded = Math.max(0, requested - includedRemaining)

  if (creditsNeeded === 0) {
    return {
      allowed: true,
      reason: "Within plan included usage.",
      limit,
      used,
      creditsRemainingAfter: entitlement.creditsRemaining,
    }
  }

  if (entitlement.spendProtection === "stop_at_plan") {
    return {
      allowed: false,
      reason: "Project has reached the plan limit and spend protection is set to stop at plan.",
      limit,
      used,
      creditsRemainingAfter: entitlement.creditsRemaining,
    }
  }

  if (entitlement.creditsRemaining >= creditsNeeded) {
    return {
      allowed: true,
      reason: "Using prepaid credits after included usage.",
      limit,
      used,
      creditsRemainingAfter: entitlement.creditsRemaining - creditsNeeded,
    }
  }

  return {
    allowed: false,
    reason: "Project has reached the plan limit and does not have enough remaining credits.",
    limit,
    used,
    creditsRemainingAfter: entitlement.creditsRemaining,
  }
}
