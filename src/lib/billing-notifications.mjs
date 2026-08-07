/*
 * Secret-safe billing warning and notification copy helpers.
 */

const RESOURCE_LABELS = {
  workflowRuns: "Workflow runs",
  metricSamples: "Metric samples",
  notificationJobs: "Notification jobs",
  reportShares: "Report shares",
}

const EVENT_COPY = {
  "billing.low_credits": {
    subject: "[Meridian] Low credits warning",
    text: "Your Meridian project is running low on prepaid credits. Add credits or adjust spend protection in Billing to avoid blocked usage.",
  },
  "billing.credits_exhausted": {
    subject: "[Meridian] Credits exhausted",
    text: "Your Meridian project has exhausted prepaid credits. Extra usage may be blocked until credits are added or the billing period renews.",
  },
  "billing.limit_blocked": {
    subject: "[Meridian] Usage blocked by billing limits",
    text: "A Meridian usage was blocked because the project reached its plan or credit limit. Open Billing to review usage, credits, and spend protection.",
  },
  "billing.rate_limit_hit": {
    subject: "[Meridian] Ingestion rate limit reached",
    text: "A Meridian telemetry source hit the ingestion rate limit. Review the sending workflow cadence and retry after the indicated cooldown.",
  },
  "billing.payment_failed": {
    subject: "[Meridian] Payment needs attention",
    text: "Your Meridian subscription payment needs attention. Paid access can continue briefly during grace, but billing should be reviewed soon.",
  },
  "billing.grace_ending": {
    subject: "[Meridian] Subscription grace ending soon",
    text: "Your Meridian subscription grace period is ending soon. Update billing to avoid falling back to the free plan.",
  },
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(999, Math.round(value)))
}

function daysUntil(value, now) {
  const date = new Date(String(value ?? ""))
  if (Number.isNaN(date.getTime())) return null
  return Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
}

function addUsageWarning(warnings, id, label, used, limit) {
  if (!Number.isFinite(limit) || limit <= 0) return
  const percentUsed = clampPercent((Number(used ?? 0) / limit) * 100)
  if (percentUsed >= 100) {
    warnings.push({
      id: `${id}_limit_reached`,
      severity: "critical",
      title: `${label} limit reached`,
      message: `${label} are at ${percentUsed}% of the current plan limit. Add credits, upgrade, or reduce usage to avoid blocked writes.`,
      action: "Review Billing usage and credits.",
      percentUsed,
    })
    return
  }
  if (percentUsed >= 80) {
    warnings.push({
      id: `${id}_approaching_limit`,
      severity: "warning",
      title: "Plan limit approaching",
      message: `${label} are at ${percentUsed}% of the current plan limit.`,
      action: "Consider adding credits before usage is blocked.",
      percentUsed,
    })
  }
}

/**
 * Builds in-app billing warnings from safe entitlement, subscription, and rate-limit evidence.
 */
export function buildBillingWarningCards({ entitlement, subscription, rateLimitWarning, now = new Date() }) {
  const warnings = []
  if (!entitlement) return warnings

  const creditPool = Number(entitlement.creditPool ?? 0)
  const creditsRemaining = Number(entitlement.creditsRemaining ?? 0)
  if (creditPool > 0 && creditsRemaining <= 0) {
    warnings.push({
      id: "credits_exhausted",
      severity: "critical",
      title: "Credits exhausted",
      message: "No prepaid credits remain. Extra usage may be blocked until credits are added or the billing period renews.",
      action: "Buy credits or upgrade the plan.",
      percentUsed: 100,
    })
  } else if (creditPool > 0 && creditsRemaining <= Math.max(10, Math.ceil(creditPool * 0.1))) {
    warnings.push({
      id: "low_credits",
      severity: "warning",
      title: "Low credits",
      message: `${creditsRemaining.toLocaleString("en-US")} prepaid credits remain.`,
      action: "Add a credit pack before extra usage is blocked.",
      percentUsed: clampPercent(((creditPool - creditsRemaining) / creditPool) * 100),
    })
  }

  const limits = entitlement.planLimits ?? {}
  addUsageWarning(warnings, "workflow_runs", RESOURCE_LABELS.workflowRuns, entitlement.usage?.workflowRuns, limits.workflowRuns)
  addUsageWarning(warnings, "metric_samples", RESOURCE_LABELS.metricSamples, entitlement.usage?.metricSamples, limits.metricSamples)
  addUsageWarning(warnings, "notification_jobs", RESOURCE_LABELS.notificationJobs, entitlement.usage?.notificationJobs, limits.notificationJobs)
  addUsageWarning(warnings, "report_shares", RESOURCE_LABELS.reportShares, entitlement.usage?.reportShares, limits.reportShares)

  const graceDays = entitlement.isProvisional ? daysUntil(entitlement.provisionalEndsAt, now) : null
  if (graceDays !== null && graceDays >= 0 && graceDays <= 7) {
    warnings.push({
      id: "subscription_grace_ending",
      severity: graceDays <= 2 ? "critical" : "warning",
      title: "Subscription grace ending",
      message: `Grace access ends in ${graceDays} day${graceDays === 1 ? "" : "s"}.`,
      action: "Update billing before access falls back.",
      percentUsed: null,
    })
  }

  if (String(subscription?.status ?? "").toLowerCase() === "past_due") {
    warnings.push({
      id: "payment_attention_required",
      severity: "warning",
      title: "Payment needs attention",
      message: "The current subscription is past due. Access can continue briefly, but billing should be reviewed.",
      action: "Open account billing and update payment details.",
      percentUsed: null,
    })
  }

  if (rateLimitWarning) {
    warnings.push({
      id: "rate_limit_hit",
      severity: "warning",
      title: "Rate limit hit",
      message: `A ${rateLimitWarning.scope} ingestion limit was hit. Retry after ${rateLimitWarning.retryAfterSeconds} seconds.`,
      action: "Reduce sender burst rate or wait for the next minute window.",
      percentUsed: 100,
    })
  }

  return warnings
}

/**
 * Returns bounded provider-neutral email content for durable billing notification jobs.
 */
export function getBillingNotificationEmailContent({ eventType, projectName }) {
  const copy = EVENT_COPY[eventType] ?? {
    subject: "[Meridian] Billing notification",
    text: "Meridian recorded a billing notification for your project. Open Billing for current usage, credits, and subscription state.",
  }
  const safeProjectName = String(projectName || "Meridian project").replace(/\s+/g, " ").trim().slice(0, 120)

  return {
    subject: copy.subject,
    text: [
      copy.subject.replace("[Meridian] ", ""),
      "",
      copy.text,
      "",
      `Project: ${safeProjectName}`,
      "Open Meridian Billing to review plan usage, credits, billing history, and sync health.",
    ].join("\n"),
  }
}
