/**
 * Operational retention cleanup for bounded enterprise pilot storage.
 */
import "server-only"

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
}

/**
 * Deletes old high-volume operational rows while preserving long-lived project configuration.
 */
export async function cleanupExpiredOperationalData(now = new Date()): Promise<RetentionCleanupResult> {
  const prisma = getPrisma()
  const policy = DEFAULT_RETENTION_POLICY_DAYS

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
        where: { sampledAt: { lt: getRetentionCutoff(now, policy.metricSamples) } },
      }),
      prisma.workflowRun.deleteMany({
        where: { startedAt: { lt: getRetentionCutoff(now, policy.workflowRuns) } },
      }),
      prisma.notificationJob.deleteMany({
        where: {
          status: { in: ["SENT", "FAILED", "SKIPPED", "CANCELLED"] },
          completedAt: { lt: getRetentionCutoff(now, policy.notificationJobs) },
        },
      }),
      prisma.alertNotificationDelivery.deleteMany({
        where: { attemptedAt: { lt: getRetentionCutoff(now, policy.notificationDeliveries) } },
      }),
      prisma.pollExecution.deleteMany({
        where: { startedAt: { lt: getRetentionCutoff(now, policy.pollExecutions) } },
      }),
      prisma.auditLog.deleteMany({
        where: { createdAt: { lt: getRetentionCutoff(now, policy.auditLogs) } },
      }),
      prisma.ingestionRateLimitBucket.deleteMany({
        where: { windowStart: { lt: getRetentionCutoff(now, policy.rateLimitBuckets) } },
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
    }
  } catch (error) {
    logServerError("retention.cleanup_failed", error, { component: "retention" })
    throw error
  }
}
