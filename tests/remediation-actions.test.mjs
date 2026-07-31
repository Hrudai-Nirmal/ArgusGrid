import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  buildRemediationSignature,
  normalizeRemediationActionMode,
  normalizeRemediationActionType,
  shouldSkipRemediationForCooldown,
} from "../src/lib/remediation-actions.mjs"

test("remediation action helpers normalize safe public enums", () => {
  assert.equal(normalizeRemediationActionType("pause_service"), "pause_service")
  assert.equal(normalizeRemediationActionType("disable_intake"), "disable_intake")
  assert.equal(normalizeRemediationActionType("scale_worker_down"), "scale_worker_down")
  assert.equal(normalizeRemediationActionType("trigger_rollback"), "trigger_rollback")
  assert.equal(normalizeRemediationActionType("custom_webhook"), "custom_webhook")
  assert.equal(normalizeRemediationActionType("rm -rf"), "custom_webhook")
  assert.equal(normalizeRemediationActionMode("automatic"), "automatic")
  assert.equal(normalizeRemediationActionMode("manual"), "manual")
  assert.equal(normalizeRemediationActionMode("surprise"), "manual")
})

test("remediation signatures use timestamp plus raw JSON body", () => {
  const timestamp = "2026-07-31T10:00:00.000Z"
  const body = JSON.stringify({ eventType: "remediation.test", action: { id: "act_1" } })
  const secret = "test-remediation-secret"
  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")

  assert.equal(buildRemediationSignature({ timestamp, body, secret }), `sha256=${expected}`)
})

test("remediation cooldown skips only recent action attempts", () => {
  const now = new Date("2026-07-31T10:00:00.000Z")

  assert.equal(shouldSkipRemediationForCooldown({ lastTriggeredAt: null, cooldownMinutes: 30, now }), false)
  assert.equal(shouldSkipRemediationForCooldown({ lastTriggeredAt: new Date("2026-07-31T09:45:00.000Z"), cooldownMinutes: 30, now }), true)
  assert.equal(shouldSkipRemediationForCooldown({ lastTriggeredAt: new Date("2026-07-31T09:20:00.000Z"), cooldownMinutes: 30, now }), false)
})

test("remediation schema adds project actions and safe attempt evidence", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8")

  assert.match(schema, /model ProjectRemediationAction/)
  assert.match(schema, /model RemediationActionAttempt/)
  assert.match(schema, /remediationActions\s+ProjectRemediationAction\[\]/)
  assert.match(schema, /signingSecretEncrypted\s+String/)
  assert.match(schema, /@@index\(\[projectId, enabled\]\)/)
  assert.match(schema, /@@index\(\[alertEventId, createdAt\]\)/)
  assert.doesNotMatch(schema, /ProjectRemediationAction[\s\S]*rawSecret/)
})

test("remediation routes and UI expose secret-safe action controls", async () => {
  const collectionRoute = await readFile("src/app/api/projects/[projectId]/remediation-actions/route.ts", "utf8")
  const itemRoute = await readFile("src/app/api/projects/[projectId]/remediation-actions/[actionId]/route.ts", "utf8")
  const testRoute = await readFile("src/app/api/projects/[projectId]/remediation-actions/[actionId]/test/route.ts", "utf8")
  const runRoute = await readFile("src/app/api/projects/[projectId]/remediation-actions/[actionId]/run/route.ts", "utf8")
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")

  assert.match(collectionRoute, /requireProjectRole\(userId, projectId, \["OWNER", "ADMIN"\]\)/)
  assert.match(collectionRoute, /serializeProjectRemediationAction/)
  assert.match(collectionRoute, /createRemediationSigningSecret/)
  assert.match(itemRoute, /remediation.updated/)
  assert.match(testRoute, /executeRemediationActionAttempt/)
  assert.match(runRoute, /alertId/)
  assert.match(dashboard, /Remediation actions/)
  assert.match(dashboard, /Manual approval/)
  assert.match(dashboard, /Automatic on alert/)
  assert.match(dashboard, /Test action/)
  assert.match(dashboard, /Run action/)
  assert.doesNotMatch(dashboard, /signingSecretEncrypted/)
})

test("alert lifecycle and logs include remediation evidence without secrets", async () => {
  const alertEvents = await readFile("src/lib/alert-events.ts", "utf8")
  const logsRoute = await readFile("src/app/api/projects/[projectId]/logs/route.ts", "utf8")
  const workspace = await readFile("src/lib/workspace.ts", "utf8")

  assert.match(alertEvents, /executeAutomaticRemediationActions/)
  assert.match(logsRoute, /remediationActionAttempt/)
  assert.match(logsRoute, /type: "actions"/)
  assert.match(workspace, /remediationActionStatus/)
  assert.match(workspace, /remediationActionFailureReason/)
  assert.doesNotMatch(logsRoute, /signingSecretEncrypted/)
})
