export type BillingWarningSeverity = "info" | "warning" | "critical"

export type BillingWarningCard = {
  id: string
  severity: BillingWarningSeverity
  title: string
  message: string
  action: string
  percentUsed: number | null
}

export function buildBillingWarningCards(input: {
  entitlement: {
    plan?: { id: string; name: string }
    usage?: {
      workflowRuns?: number
      metricSamples?: number
      notificationJobs?: number
      reportShares?: number
    }
    creditPool?: number
    creditsRemaining?: number
    spendProtection?: string
    planLimits?: {
      workflowRuns?: number | null
      metricSamples?: number | null
      notificationJobs?: number | null
      reportShares?: number | null
    }
    isProvisional?: boolean
    provisionalEndsAt?: string | null
  } | null
  subscription?: { status?: string | null; nextBilledAt?: string | null } | null
  rateLimitWarning?: { scope: string; limit: number; retryAfterSeconds: number } | null
  now?: Date
}): BillingWarningCard[]

export function getBillingNotificationEmailContent(input: {
  eventType: string
  projectName: string
}): {
  subject: string
  text: string
}
