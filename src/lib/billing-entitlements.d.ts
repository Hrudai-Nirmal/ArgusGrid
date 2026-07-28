export type BillingResourceKind = "workflow_run" | "metric_sample" | "notification_job" | "report_share"

export type BillingEntitlementUsage = {
  workflowRuns?: number
  metricSamples?: number
  notificationJobs?: number
  reportShares?: number
}

export type BillingPlanEvidence = {
  subscription?: { status?: string | null; billingKey?: string | null } | null
  transactions?: {
    status?: string | null
    billingKey?: string | null
    createdAt?: string | Date | null
    completedAt?: string | Date | null
    billedAt?: string | Date | null
  }[]
  now?: Date
}

export function getPlanByBillingKey(billingKey: unknown): {
  id: string
  name: string
  includedCredits: number
  workflowRunLimit: number
  metricSampleLimit: number
  notificationJobLimit: number
  reportShareLimit: number
}
export function getBillingPlanFromEvidence(input: BillingPlanEvidence): {
  plan: ReturnType<typeof getPlanByBillingKey>
  source: "subscription" | "provisional_transaction" | "free"
  isProvisional: boolean
  provisionalEndsAt: string | null
}
export function buildUsageEntitlement(input: {
  planId: string
  usage: BillingEntitlementUsage
  purchasedCredits?: number
  spendProtection?: "use_credits" | "stop_at_plan" | string
}): {
  plan: ReturnType<typeof getPlanByBillingKey>
  usage: Required<BillingEntitlementUsage>
  overage: Required<BillingEntitlementUsage>
  spendProtection: string
  creditPool: number
  creditsUsed: number
  creditsRemaining: number
}
export function canConsumeEntitlementResource(
  entitlement: ReturnType<typeof buildUsageEntitlement>,
  resource: BillingResourceKind,
  amount?: number
): {
  allowed: boolean
  reason: string
  limit: number
  used: number
  creditsRemainingAfter: number
}
