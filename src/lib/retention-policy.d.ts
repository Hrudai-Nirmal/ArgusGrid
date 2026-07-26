export const DEFAULT_RETENTION_POLICY_DAYS: {
  rateLimitBuckets: number
  metricSamples: number
  workflowRuns: number
  notificationJobs: number
  notificationDeliveries: number
  pollExecutions: number
  auditLogs: number
}
export function getRetentionCutoff(now: Date | string, days: number): Date
export function buildRetentionSummaryRows(policy?: typeof DEFAULT_RETENTION_POLICY_DAYS): {
  id: string
  label: string
  days: number
  summary: string
}[]
