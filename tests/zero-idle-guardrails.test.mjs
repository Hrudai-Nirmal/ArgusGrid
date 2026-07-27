import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

test("Inngest defaults to event-driven jobs without always-on recovery", async () => {
  const functionsSource = await readFile("src/inngest/functions.ts", "utf8")
  const routeSource = await readFile("src/app/api/inngest/route.ts", "utf8")

  assert.match(functionsSource, /getBackgroundRecoveryMode/)
  assert.match(functionsSource, /off|minimal|full/)
  assert.match(functionsSource, /MINIMAL_RECOVERY_CRON\s*=\s*"17 \*\/6 \* \* \*"/)
  assert.match(functionsSource, /FULL_RECOVERY_CRON\s*=\s*"\*\/15 \* \* \* \*"/)
  assert.match(routeSource, /getActiveInngestFunctions/)
  assert.doesNotMatch(routeSource, /functions:\s*\[processNotificationJob,\s*recoverQueuedNotifications,\s*cleanupOperationalRetention\]/)
})

test("Vercel has no default scheduled polling cron", async () => {
  const vercelConfig = JSON.parse(await readFile("vercel.json", "utf8"))

  assert.ok(!("crons" in vercelConfig), "vercel.json should not schedule idle production polling by default")
})

test("dashboard live stream is manual until the operator clicks Go live", async () => {
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")

  assert.match(dashboard, /liveModeEnabled/)
  assert.match(dashboard, /Go live/)
  assert.match(dashboard, /Pause live/)
  assert.match(dashboard, /liveModeEnabledRef/)
  assert.match(dashboard, /if \(!liveModeEnabled\)/)
  assert.match(dashboard, /new EventSource/)
})

test("Testing exposes manual zero-idle operator controls", async () => {
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")

  assert.match(dashboard, /Recover queued jobs now/)
  assert.match(dashboard, /Run retention cleanup now/)
  assert.match(dashboard, /Idle posture/)
  assert.match(dashboard, /Scheduled polling: Off by default/)
})

test("manual recovery and cleanup routes exist", async () => {
  const recoveryRoute = await readFile("src/app/api/projects/[projectId]/notification-jobs/recover/route.ts", "utf8")
  const cleanupRoute = await readFile("src/app/api/projects/[projectId]/retention/cleanup/route.ts", "utf8")

  assert.match(recoveryRoute, /recoverNotificationJobs/)
  assert.match(recoveryRoute, /notification-jobs.recovered/)
  assert.match(cleanupRoute, /cleanupExpiredOperationalData/)
  assert.match(cleanupRoute, /retention.cleaned/)
})
