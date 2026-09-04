import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

test("runtime settings model and migration support self-hosted job backend", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8")
  const migration = await readFile("prisma/migrations/20260905090000_runtime_settings/migration.sql", "utf8")

  assert.match(schema, /model RuntimeSetting/)
  assert.match(schema, /jobBackend\s+String\s+@default\("inngest"\)\s+@map\("job_backend"\)/)
  assert.match(schema, /selfHostedWorkerUrl/)
  assert.match(schema, /@@map\("runtime_settings"\)/)
  assert.match(migration, /CREATE TABLE "runtime_settings"/)
  assert.match(migration, /'inngest', 'self_hosted', 'manual'/)
})

test("notification dispatch can route through self-hosted worker without provider secrets", async () => {
  const jobService = await readFile("src/lib/job-service.ts", "utf8")
  const notificationJobs = await readFile("src/lib/notification-jobs.ts", "utf8")

  assert.match(jobService, /MERIDIAN_DEFAULT_JOB_BACKEND/)
  assert.match(jobService, /MERIDIAN_SELF_HOSTED_WORKER_URL/)
  assert.match(jobService, /MERIDIAN_SELF_HOSTED_WORKER_SECRET/)
  assert.match(jobService, /\/v1\/jobs\/notification/)
  assert.match(jobService, /self_hosted/)
  assert.match(jobService, /manual/)
  assert.match(notificationJobs, /dispatchNotificationJobsByBackend/)
  assert.doesNotMatch(notificationJobs, /@\/inngest\/client/)
  assert.doesNotMatch(jobService, /RESEND_API_KEY|PADDLE_API_KEY|PADDLE_NOTIFICATION_WEBHOOK_SECRET|webhookUrlEncrypted|signingSecretEncrypted/)
})

test("self-hosted executor route authenticates worker and reuses notification handler", async () => {
  const route = await readFile("src/app/api/runtime/notification-jobs/execute/route.ts", "utf8")

  assert.match(route, /MERIDIAN_SELF_HOSTED_WORKER_SECRET/)
  assert.match(route, /timingSafeEqual/)
  assert.match(route, /executeNotificationJobAttempt/)
  assert.match(route, /notificationJobId/)
  assert.match(route, /generation/)
  assert.match(route, /invalid_notification_job_payload/)
  assert.doesNotMatch(route, /RESEND_API_KEY|PADDLE_API_KEY|PADDLE_NOTIFICATION_WEBHOOK_SECRET|webhookUrlEncrypted|signingSecretEncrypted/)
})
