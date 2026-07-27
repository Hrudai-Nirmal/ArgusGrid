/**
 * Durable Inngest workers for notification delivery and outbox recovery.
 */
import "server-only"

import { inngest } from "@/inngest/client"
import { executeNotificationJobAttempt, markNotificationJobFailed, recoverNotificationJobs } from "@/lib/notification-jobs"
import { cleanupExpiredOperationalData } from "@/lib/retention-cleanup"

export type BackgroundRecoveryMode = "off" | "minimal" | "full"
export type RetentionCleanupMode = "manual" | "weekly" | "daily"

const BACKGROUND_RECOVERY_MODES = new Set<BackgroundRecoveryMode>(["off", "minimal", "full"])
const RETENTION_CLEANUP_MODES = new Set<RetentionCleanupMode>(["manual", "weekly", "daily"])
const MINIMAL_RECOVERY_CRON = "17 */6 * * *"
const FULL_RECOVERY_CRON = "*/15 * * * *"
const WEEKLY_RETENTION_CRON = "23 2 * * 0"
const DAILY_RETENTION_CRON = "17 2 * * *"

/**
 * Returns the configured notification recovery posture; default keeps Inngest idle.
 */
export function getBackgroundRecoveryMode(): BackgroundRecoveryMode {
  const value = process.env.MERIDIAN_BACKGROUND_RECOVERY_MODE?.trim() as BackgroundRecoveryMode | undefined
  return value && BACKGROUND_RECOVERY_MODES.has(value) ? value : "off"
}

/**
 * Returns the configured retention cleanup posture; default is manual-only.
 */
export function getRetentionCleanupMode(): RetentionCleanupMode {
  const value = process.env.MERIDIAN_RETENTION_CLEANUP_MODE?.trim() as RetentionCleanupMode | undefined
  return value && RETENTION_CLEANUP_MODES.has(value) ? value : "manual"
}

/**
 * Maps the recovery mode to the cron string used when scheduled recovery is enabled.
 */
export function getBackgroundRecoveryCron(mode = getBackgroundRecoveryMode()) {
  return mode === "full" ? FULL_RECOVERY_CRON : MINIMAL_RECOVERY_CRON
}

/**
 * Maps the cleanup mode to the cron string used when scheduled retention is enabled.
 */
export function getRetentionCleanupCron(mode = getRetentionCleanupMode()) {
  return mode === "daily" ? DAILY_RETENTION_CRON : WEEKLY_RETENTION_CRON
}

export const processNotificationJob = inngest.createFunction(
  {
    id: "process-notification-job",
    triggers: { event: "meridian/notification.process" },
    retries: 4,
    concurrency: { limit: 5 },
    onFailure: async ({ event, error }) => {
      const failedEvent = event.data.event as { data?: { jobId?: string; generation?: number } }
      if (failedEvent.data?.jobId && typeof failedEvent.data.generation === "number") {
        await markNotificationJobFailed(failedEvent.data.jobId, failedEvent.data.generation, error)
      }
    },
  },
  async ({ event, step }) => {
    return step.run("deliver-notification", () => executeNotificationJobAttempt(event.data.jobId as string, event.data.generation as number))
  }
)

export const recoverQueuedNotifications = inngest.createFunction(
  {
    id: "recover-queued-notifications",
    triggers: { cron: getBackgroundRecoveryCron() },
    retries: 2,
  },
  async ({ step }) => step.run("recover-notification-outbox", recoverNotificationJobs)
)

export const cleanupOperationalRetention = inngest.createFunction(
  {
    id: "cleanup-operational-retention",
    triggers: { cron: getRetentionCleanupCron() },
    retries: 2,
  },
  async ({ step }) => step.run("cleanup-operational-retention", cleanupExpiredOperationalData)
)

/**
 * Returns the functions that should be synced in this runtime's idle-cost posture.
 */
export function getActiveInngestFunctions() {
  const functions: Array<typeof processNotificationJob | typeof recoverQueuedNotifications | typeof cleanupOperationalRetention> = [processNotificationJob]
  if (getBackgroundRecoveryMode() !== "off") functions.push(recoverQueuedNotifications)
  if (getRetentionCleanupMode() !== "manual") functions.push(cleanupOperationalRetention)
  return functions
}
