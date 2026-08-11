/*
 * Secret-safe billing support packet formatting for customer-visible support
 * handoffs when access, limits, credits, or payment confirmation need review.
 */

const SECRET_PATTERNS = [
  /pdl_(?:live|sdbx)_apikey_[A-Za-z0-9_]+/gi,
  /postgres(?:ql)?:\/\/\S+/gi,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /mdn_[A-Za-z0-9_-]+/gi,
  /https:\/\/hooks\.slack\.com\/\S+/gi,
  /GOCSPX-[A-Za-z0-9_-]+/gi,
]

function redactSupportText(value) {
  let text = String(value ?? "")
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, "[redacted]")
  }
  return text
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "not available"
  if (typeof value === "boolean") return value ? "yes" : "no"
  return redactSupportText(value)
}

function formatMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return "metadata: none"
  const allowedKeys = ["resource", "reason", "limit", "used", "creditsRemaining", "creditsCharged", "description"]
  const parts = allowedKeys
    .filter((key) => Object.prototype.hasOwnProperty.call(metadata, key))
    .map((key) => `${key}: ${formatValue(metadata[key])}`)

  return parts.length ? parts.join(", ") : "metadata: safe summary unavailable"
}

/**
 * Builds a copyable, secret-safe billing support packet from already mirrored
 * billing state. The output intentionally avoids provider IDs, URLs, raw
 * payloads, credentials, tokens, and environment values.
 *
 * @param {{
 *   projectName: string,
 *   generatedAt?: string,
 *   billing: {
 *     environment?: string,
 *     sync?: {
 *       label?: string,
 *       status?: string,
 *       message?: string,
 *       failedConfirmations?: number,
 *       lastConfirmation?: { type?: string, status?: string, processedAt?: string | null, occurredAt?: string | null, createdAt?: string } | null,
 *     },
 *     subscription?: { status?: string, billingKey?: string | null, currentPeriodEndsAt?: string | null, access?: { label?: string, hasAccess?: boolean } },
 *     entitlement?: {
 *       plan?: { id?: string, name?: string, source?: string, isProvisional?: boolean, provisionalEndsAt?: string | null },
 *       periodStart?: string,
 *       usage?: { workflowRuns?: number, metricSamples?: number, notificationJobs?: number, reportShares?: number },
 *       creditPool?: number,
 *       creditsUsed?: number,
 *       creditsRemaining?: number,
 *       spendProtection?: string,
 *     } | null,
 *     warnings?: Array<{ id?: string, severity?: string, title?: string, action?: string }>,
 *     supportEvents?: Array<{ id?: string, action?: string, createdAt?: string, metadata?: Record<string, unknown> | null }>,
 *   },
 * }} input
 */
export function buildBillingSupportPacket(input) {
  const billing = input.billing ?? {}
  const entitlement = billing.entitlement
  const sync = billing.sync ?? {}
  const subscription = billing.subscription ?? {}
  const usage = entitlement?.usage ?? {}
  const warnings = billing.warnings ?? []
  const supportEvents = billing.supportEvents ?? []
  const lastConfirmation = sync.lastConfirmation
  const lines = [
    "Billing support packet",
    `Generated: ${formatValue(input.generatedAt ?? new Date().toISOString())}`,
    `Project: ${formatValue(input.projectName)}`,
    "",
    "Access",
    `Plan: ${formatValue(entitlement?.plan?.name ?? subscription.billingKey ?? "Free Sandbox")}`,
    `Entitlement source: ${formatValue(entitlement?.plan?.source ?? "free")}`,
    `Subscription status: ${formatValue(subscription.status)}`,
    `Access label: ${formatValue(subscription.access?.label)}`,
    `Has access: ${formatValue(subscription.access?.hasAccess)}`,
    `Provisional: ${formatValue(entitlement?.plan?.isProvisional)}`,
    `Provisional ends: ${formatValue(entitlement?.plan?.provisionalEndsAt)}`,
    `Current period ends: ${formatValue(subscription.currentPeriodEndsAt)}`,
    "",
    "Usage and credits",
    `Period start: ${formatValue(entitlement?.periodStart)}`,
    `workflow runs: ${formatValue(usage.workflowRuns)}`,
    `metric samples: ${formatValue(usage.metricSamples)}`,
    `notification jobs: ${formatValue(usage.notificationJobs)}`,
    `report shares: ${formatValue(usage.reportShares)}`,
    `credit pool: ${formatValue(entitlement?.creditPool)}`,
    `credits used: ${formatValue(entitlement?.creditsUsed)}`,
    `credits remaining: ${formatValue(entitlement?.creditsRemaining)}`,
    `spend protection: ${formatValue(entitlement?.spendProtection)}`,
    "",
    "Billing sync",
    `Environment: ${formatValue(billing.environment)}`,
    `Sync status: ${formatValue(sync.label ?? sync.status)}`,
    `Sync message: ${formatValue(sync.message)}`,
    `Failed confirmations: ${formatValue(sync.failedConfirmations ?? 0)}`,
    `Last confirmation: ${lastConfirmation ? `${formatValue(lastConfirmation.type)} / ${formatValue(lastConfirmation.status)} / ${formatValue(lastConfirmation.processedAt ?? lastConfirmation.occurredAt ?? lastConfirmation.createdAt)}` : "none"}`,
    "",
    "Warnings",
    warnings.length
      ? warnings.map((warning) => `- ${formatValue(warning.severity)}: ${formatValue(warning.title)} / action: ${formatValue(warning.action)}`).join("\n")
      : "- none",
    "",
    "Recent billing support events",
    supportEvents.length
      ? supportEvents.slice(0, 8).map((event) => `- ${formatValue(event.createdAt)} / ${formatValue(event.action)} / ${formatMetadata(event.metadata)}`).join("\n")
      : "- none",
  ]

  return redactSupportText(lines.join("\n"))
}
