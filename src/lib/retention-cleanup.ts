/**
 * Operational retention cleanup for bounded enterprise pilot storage.
 */
import "server-only"

import { buildEffectiveRetentionPolicy } from "@/lib/operations-policy-enforcement.mjs"
import { getPrisma } from "@/lib/prisma"
import { DEFAULT_RETENTION_POLICY_DAYS, getRetentionCutoff } from "@/lib/retention-policy.mjs"
import { logServerError } from "@/lib/server-logging"

export type RetentionCleanupResult = {
  metricSamples: number
  workflowRuns: number
  notificationJobs: number
  notificationDeliveries: number
  pollExecutions: number
  auditLogs: number
  rateLimitBuckets: number
  effectiveRetentionDays: number
}

/**
 * Deletes old high-volume operational rows while preserving long-lived project configuration.
 */
export async function cleanupExpiredOperationalData(options: { projectId?: string; now?: Date } = {}): Promise<RetentionCleanupResult> {
  const prisma = getPrisma()
  const now = options.now ?? new Date()
  const project = options.projectId
    ? await prisma.project.findUnique({
        where: { id: options.projectId },
        select: { operationsPolicy: true },
      })
    : null
  const policy = options.projectId && project
    ? buildEffectiveRetentionPolicy(project.operationsPolicy)
    : DEFAULT_RETENTION_POLICY_DAYS

  try {
    const [
      metricSamples,
      workflowRuns,
      notificationJobs,
      notificationDeliveries,
      pollExecutions,
      auditLogs,
      rateLimitBuckets,
    ] = await prisma.$transaction([
      prisma.metricSample.deleteMany({
        where: {
          sampledAt: { lt: getRetentionCutoff(now, policy.metricSamples) },
          ...(options.projectId ? { node: { projectId: options.projectId } } : {}),
        },
      }),
      prisma.workflowRun.deleteMany({
        where: {
          startedAt: { lt: getRetentionCutoff(now, policy.workflowRuns) },
          ...(options.projectId ? { node: { projectId: options.projectId } } : {}),
        },
      }),
      prisma.notificationJob.deleteMany({
        where: {
          ...(options.projectId ? { projectId: options.projectId } : {}),
          status: { in: ["SENT", "FAILED", "SKIPPED", "CANCELLED"] },
          completedAt: { lt: getRetentionCutoff(now, policy.notificationJobs) },
        },
      }),
      prisma.alertNotificationDelivery.deleteMany({
        where: {
          attemptedAt: { lt: getRetentionCutoff(now, policy.notificationDeliveries) },
          ...(options.projectId ? { alertEvent: { OR: [{ node: { projectId: options.projectId } }, { rule: { projectId: options.projectId } }] } } : {}),
        },
      }),
      prisma.pollExecution.deleteMany({
        where: options.projectId ? { id: "__project_scoped_poll_executions_are_not_supported__" } : { startedAt: { lt: getRetentionCutoff(now, policy.pollExecutions) } },
      }),
      prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: getRetentionCutoff(now, policy.auditLogs) },
          ...(options.projectId ? { projectId: options.projectId } : {}),
        },
      }),
      prisma.ingestionRateLimitBucket.deleteMany({
        where: {
          windowStart: { lt: getRetentionCutoff(now, policy.rateLimitBuckets) },
          ...(options.projectId ? { projectId: options.projectId } : {}),
        },
      }),
    ])

    return {
      metricSamples: metricSamples.count,
      workflowRuns: workflowRuns.count,
      notificationJobs: notificationJobs.count,
      notificationDeliveries: notificationDeliveries.count,
      pollExecutions: pollExecutions.count,
      auditLogs: auditLogs.count,
      rateLimitBuckets: rateLimitBuckets.count,
      effectiveRetentionDays: policy.metricSamples,
    }
  } catch (error) {
    logServerError("retention.cleanup_failed", error, { component: "retention" })
    throw error
  }
}
