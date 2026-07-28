/*
 * Public-safe Meridian beta pricing, credit packs, and project operations policy helpers.
 */

export const MERIDIAN_PRICING_PLANS = [
  {
    id: "free_sandbox",
    name: "Free Sandbox",
    monthlyUsd: 0,
    monthlyInr: 0,
    includedCredits: 0,
    projectLimit: 1,
    nodeLimit: 3,
    workflowRunLimit: 500,
    metricSampleLimit: 500,
    notificationJobLimit: 100,
    reportShareLimit: 1,
    retentionDays: 7,
    summary: "Setup and proof only; no always-on polling.",
  },
  {
    id: "solo_beta",
    name: "Solo Beta",
    monthlyUsd: 59,
    monthlyInr: 4999,
    includedCredits: 500,
    projectLimit: 1,
    nodeLimit: 10,
    workflowRunLimit: 10_000,
    metricSampleLimit: 10_000,
    notificationJobLimit: 5_000,
    reportShareLimit: 5,
    retentionDays: 30,
    summary: "One serious workflow or client with controlled production monitoring.",
  },
  {
    id: "agency_beta",
    name: "Agency Beta",
    monthlyUsd: 179,
    monthlyInr: 14999,
    includedCredits: 3000,
    projectLimit: 5,
    nodeLimit: 50,
    workflowRunLimit: 100_000,
    metricSampleLimit: 100_000,
    notificationJobLimit: 50_000,
    reportShareLimit: 50,
    retentionDays: 90,
    summary: "Multiple client workflows, branded proof, and richer operations evidence.",
  },
  {
    id: "enterprise_pilot",
    name: "Enterprise Pilot",
    monthlyUsd: 799,
    monthlyInr: 64999,
    includedCredits: 10_000,
    projectLimit: null,
    nodeLimit: null,
    workflowRunLimit: 500_000,
    metricSampleLimit: 500_000,
    notificationJobLimit: 250_000,
    reportShareLimit: 250,
    retentionDays: 180,
    summary: "Custom reliability, retention, and volume for high-touch pilots.",
  },
]

export const MERIDIAN_CREDIT_PACKS = [
  { credits: 500, usd: 19, inr: 1599 },
  { credits: 2000, usd: 69, inr: 5999 },
  { credits: 10000, usd: 249, inr: 20999 },
]

export const DEFAULT_PROJECT_OPERATIONS_POLICY = {
  operationsMode: "cost_saver",
  pollingCadenceMin: null,
  notificationReliability: "standard",
  retentionDays: 30,
  spendProtection: "use_credits",
}

const OPERATIONS_MODES = new Set(["cost_saver", "balanced", "priority"])
const POLLING_CADENCES = new Set([null, 60, 15, 5, 1])
const NOTIFICATION_RELIABILITY = new Set(["standard", "priority"])
const RETENTION_DAYS = new Set([7, 30, 90, 180])
const SPEND_PROTECTION = new Set(["stop_at_plan", "use_credits"])

/**
 * @param {unknown} value
 */
function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

/**
 * @param {unknown} value
 * @returns {{
 *   operationsMode: "cost_saver" | "balanced" | "priority",
 *   pollingCadenceMin: number | null,
 *   notificationReliability: "standard" | "priority",
 *   retentionDays: 7 | 30 | 90 | 180,
 *   spendProtection: "stop_at_plan" | "use_credits",
 * }}
 */
export function normalizeProjectOperationsPolicy(value = {}) {
  const source = value && typeof value === "object" ? /** @type {Record<string, unknown>} */ (value) : {}
  const pollingCadenceMin = numberOrNull(source.pollingCadenceMin)
  const retentionDays = Number(source.retentionDays)
  const normalized = {
    operationsMode: OPERATIONS_MODES.has(source.operationsMode) ? source.operationsMode : DEFAULT_PROJECT_OPERATIONS_POLICY.operationsMode,
    pollingCadenceMin: POLLING_CADENCES.has(pollingCadenceMin) ? pollingCadenceMin : DEFAULT_PROJECT_OPERATIONS_POLICY.pollingCadenceMin,
    notificationReliability: NOTIFICATION_RELIABILITY.has(source.notificationReliability) ? source.notificationReliability : DEFAULT_PROJECT_OPERATIONS_POLICY.notificationReliability,
    retentionDays: RETENTION_DAYS.has(retentionDays) ? retentionDays : DEFAULT_PROJECT_OPERATIONS_POLICY.retentionDays,
    spendProtection: SPEND_PROTECTION.has(source.spendProtection) ? source.spendProtection : DEFAULT_PROJECT_OPERATIONS_POLICY.spendProtection,
  }

  return normalized
}

/**
 * @param {unknown} policy
 */
export function getOperationsPolicyCopy(policy = DEFAULT_PROJECT_OPERATIONS_POLICY) {
  const normalized = normalizeProjectOperationsPolicy(policy)
  const cadence = normalized.pollingCadenceMin ? `Every ${normalized.pollingCadenceMin} min` : "Manual only"
  const mode = normalized.operationsMode.replace("_", " ")
  const reliability = normalized.notificationReliability === "priority" ? "Priority recovery" : "Standard recovery"
  const spend = normalized.spendProtection === "stop_at_plan" ? "Stop at plan limit" : "Use prepaid credits after included usage"

  return {
    mode,
    cadence,
    reliability,
    retention: `${normalized.retentionDays} days`,
    spend,
  }
}
