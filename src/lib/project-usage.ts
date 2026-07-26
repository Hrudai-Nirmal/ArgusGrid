/**
 * Secret-safe project usage counters for enterprise pilot guardrails.
 */
import "server-only"

import { DEFAULT_INGESTION_RATE_LIMITS } from "@/lib/ingestion-rate-limits.mjs"
import { getPrisma } from "@/lib/prisma"
import { dateBoundsWhere, type BoundedQuery } from "@/lib/query-limits"
import { buildRetentionSummaryRows, DEFAULT_RETENTION_POLICY_DAYS } from "@/lib/retention-policy.mjs"

export type ProjectUsageSnapshot = {
  window: string
  counts: {
    workflowRuns: number
    metricSamples: number
    alerts: number
    notificationJobs: number
    notificationDeliveries: number
    reportShares: number
    activeIngestionTokens: number
    rateLimitBuckets: number
  }
  rateLimits: typeof DEFAULT_INGESTION_RATE_LIMITS
  retention: ReturnType<typeof buildRetentionSummaryRows>
}

/**
 * Counts bounded, high-volume operational rows for a project.
 */
export async function getProjectUsageSnapshot(projectId: string, bounds: Pick<BoundedQuery, "window" | "start" | "end">): Promise<ProjectUsageSnapshot> {
  const prisma = getPrisma()
  const createdAtWhere = dateBoundsWhere(bounds)
  const [workflowRuns, metricSamples, alerts, notificationJobs, notificationDeliveries, reportShares, activeIngestionTokens, rateLimitBuckets] =
    await Promise.all([
      prisma.workflowRun.count({
        where: {
          ...(createdAtWhere ? { startedAt: createdAtWhere } : {}),
          node: { projectId },
        },
      }),
      prisma.metricSample.count({
        where: {
          ...(createdAtWhere ? { sampledAt: createdAtWhere } : {}),
          node: { projectId },
        },
      }),
      prisma.alertEvent.count({
        where: {
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
          OR: [{ node: { projectId } }, { rule: { projectId } }],
        },
      }),
      prisma.notificationJob.count({
        where: {
          projectId,
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
      }),
      prisma.alertNotificationDelivery.count({
        where: {
          ...(createdAtWhere ? { attemptedAt: createdAtWhere } : {}),
          alertEvent: {
            OR: [{ node: { projectId } }, { rule: { projectId } }],
          },
        },
      }),
      prisma.reportShare.count({
        where: {
          projectId,
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
      }),
      prisma.ingestionToken.count({
        where: { projectId, revokedAt: null },
      }),
      prisma.ingestionRateLimitBucket.count({
        where: {
          projectId,
          ...(createdAtWhere ? { windowStart: createdAtWhere } : {}),
        },
      }),
    ])

  return {
    window: bounds.window,
    counts: {
      workflowRuns,
      metricSamples,
      alerts,
      notificationJobs,
      notificationDeliveries,
      reportShares,
      activeIngestionTokens,
      rateLimitBuckets,
    },
    rateLimits: DEFAULT_INGESTION_RATE_LIMITS,
    retention: buildRetentionSummaryRows(DEFAULT_RETENTION_POLICY_DAYS),
  }
}
