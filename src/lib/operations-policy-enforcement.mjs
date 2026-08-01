/*
 * Enforced project operations policy helpers for polling, retention, and spend posture.
 */

import { DEFAULT_PROJECT_OPERATIONS_POLICY, normalizeProjectOperationsPolicy } from "./billing-plans.mjs"
import { DEFAULT_RETENTION_POLICY_DAYS } from "./retention-policy.mjs"

const MODE_DEFAULT_POLLING_CADENCE_MIN = {
  cost_saver: null,
  balanced: 15,
  priority: 5,
}

/**
 * Returns the effective automatic polling cadence for a node under project policy.
 * `null` means scheduled polling is disabled and only explicit manual polls may run.
 *
 * @param {unknown} policy
 * @param {number | null | undefined} nodeCadenceMin
 */
export function getEffectivePollingCadenceMin(policy = DEFAULT_PROJECT_OPERATIONS_POLICY, nodeCadenceMin = 15) {
  const normalized = normalizeProjectOperationsPolicy(policy)
  const policyCadence = normalized.pollingCadenceMin ?? MODE_DEFAULT_POLLING_CADENCE_MIN[normalized.operationsMode]
  if (policyCadence === null) return null
  return Math.max(Number(nodeCadenceMin ?? 15), policyCadence)
}

/**
 * Uses the project-selected retention window for high-volume operational evidence.
 *
 * @param {unknown} policy
 */
export function buildEffectiveRetentionPolicy(policy = DEFAULT_PROJECT_OPERATIONS_POLICY) {
  const normalized = normalizeProjectOperationsPolicy(policy)
  return {
    ...DEFAULT_RETENTION_POLICY_DAYS,
    metricSamples: normalized.retentionDays,
    workflowRuns: normalized.retentionDays,
    notificationJobs: normalized.retentionDays,
    notificationDeliveries: normalized.retentionDays,
    pollExecutions: normalized.retentionDays,
  }
}

/**
 * Builds reader-facing policy status rows for Billing and Testing surfaces.
 *
 * @param {unknown} policy
 */
export function getPolicyEnforcementStatusRows(policy = DEFAULT_PROJECT_OPERATIONS_POLICY) {
  const normalized = normalizeProjectOperationsPolicy(policy)
  const cadence = getEffectivePollingCadenceMin(normalized, normalized.pollingCadenceMin ?? 15)
  return [
    {
      id: "operations-mode",
      label: "Operations mode",
      status: "Enforced",
      detail: `${normalized.operationsMode.replace("_", " ")} controls the default polling and recovery posture for this project.`,
    },
    {
      id: "polling",
      label: "Polling cadence",
      status: "Enforced",
      detail: cadence === null ? "Scheduled REST metric polling is disabled; manual owner/admin polls still work." : `Scheduled REST metric polling cannot run more frequently than every ${cadence} minutes.`,
    },
    {
      id: "retention",
      label: "Retention",
      status: "Enforced",
      detail: `Manual retention cleanup uses ${normalized.retentionDays} days for high-volume project evidence.`,
    },
    {
      id: "spend",
      label: "Spend protection",
      status: "Enforced",
      detail: normalized.spendProtection === "stop_at_plan" ? "Writes stop at included plan limits instead of consuming credits." : "Allowed overage writes consume prepaid credits after included usage.",
    },
  ]
}
