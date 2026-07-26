/**
 * Enterprise pilot retention defaults and operator-facing summaries.
 */

export const DEFAULT_RETENTION_POLICY_DAYS = {
  rateLimitBuckets: 2,
  metricSamples: 90,
  workflowRuns: 90,
  notificationJobs: 30,
  notificationDeliveries: 90,
  pollExecutions: 90,
  auditLogs: 365,
}

const RETENTION_LABELS = {
  rateLimitBuckets: "Rate-limit buckets",
  metricSamples: "Metric samples",
  workflowRuns: "Workflow runs",
  notificationJobs: "Notification jobs",
  notificationDeliveries: "Notification deliveries",
  pollExecutions: "Poll executions",
  auditLogs: "Audit logs",
}

/**
 * Computes the exclusive cleanup cutoff for a retention duration.
 */
export function getRetentionCutoff(now, days) {
  return new Date(new Date(now).getTime() - days * 24 * 60 * 60 * 1000)
}

/**
 * Builds compact retention rows for Testing and documentation surfaces.
 */
export function buildRetentionSummaryRows(policy = DEFAULT_RETENTION_POLICY_DAYS) {
  return Object.entries(policy).map(([key, days]) => ({
    id: key,
    label: RETENTION_LABELS[key] ?? key,
    days,
    summary: `${RETENTION_LABELS[key] ?? key} retained for ${days} days`,
  }))
}
