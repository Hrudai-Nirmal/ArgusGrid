import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  buildEffectiveRetentionPolicy,
  getEffectivePollingCadenceMin,
  getPolicyEnforcementStatusRows,
} from "../src/lib/operations-policy-enforcement.mjs"

test("effective polling cadence enforces manual and minimum cadence policy", () => {
  assert.equal(getEffectivePollingCadenceMin({ operationsMode: "cost_saver", pollingCadenceMin: null }, 5), null)
  assert.equal(getEffectivePollingCadenceMin({ operationsMode: "balanced", pollingCadenceMin: null }, 1), 15)
  assert.equal(getEffectivePollingCadenceMin({ operationsMode: "priority", pollingCadenceMin: null }, 1), 5)
  assert.equal(getEffectivePollingCadenceMin({ operationsMode: "priority", pollingCadenceMin: 1 }, 1), 1)
  assert.equal(getEffectivePollingCadenceMin({ operationsMode: "balanced", pollingCadenceMin: 60 }, 5), 60)
})

test("effective retention policy uses project retention for high-volume operational data", () => {
  const policy = buildEffectiveRetentionPolicy({ retentionDays: 7 })

  assert.equal(policy.metricSamples, 7)
  assert.equal(policy.workflowRuns, 7)
  assert.equal(policy.notificationJobs, 7)
  assert.equal(policy.notificationDeliveries, 7)
  assert.equal(policy.rateLimitBuckets, 2)
  assert.equal(policy.auditLogs, 365)
})

test("policy enforcement status rows are reader-facing and enforced", () => {
  const rows = getPolicyEnforcementStatusRows({
    operationsMode: "balanced",
    pollingCadenceMin: 15,
    notificationReliability: "standard",
    retentionDays: 30,
    spendProtection: "stop_at_plan",
  })

  assert.equal(rows.every((row) => row.status === "Enforced"), true)
  assert.match(rows.map((row) => row.detail).join(" "), /poll/i)
  assert.match(rows.map((row) => row.detail).join(" "), /credits/i)
})

test("polling source enforces project operations policy cadence", async () => {
  const pollingSource = await readFile("src/lib/polling.ts", "utf8")

  assert.match(pollingSource, /getEffectivePollingCadenceMin/)
  assert.match(pollingSource, /operationsPolicy/)
  assert.match(pollingSource, /policySkippedNodes/)
  assert.match(pollingSource, /polling\.skipped_by_policy/)
})

test("retention cleanup uses project operations policy when project scoped", async () => {
  const cleanupSource = await readFile("src/lib/retention-cleanup.ts", "utf8")
  const routeSource = await readFile("src/app/api/projects/[projectId]/retention/cleanup/route.ts", "utf8")

  assert.match(cleanupSource, /buildEffectiveRetentionPolicy/)
  assert.match(cleanupSource, /projectId/)
  assert.match(routeSource, /cleanupExpiredOperationalData\(\{ projectId \}\)/)
  assert.match(routeSource, /effectiveRetentionDays/)
})

test("credit consumption writes safe billing audit evidence", async () => {
  const source = await readFile("src/lib/billing-entitlements-server.ts", "utf8")

  assert.match(source, /billing\.credits_consumed/)
  assert.match(source, /creditsCharged/)
  assert.match(source, /idempotencyKey/)
})

test("billing UI marks operations policies as enforced", async () => {
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")
  const readme = await readFile("README.md", "utf8")

  assert.match(dashboard, /Policy enforcement/)
  assert.match(dashboard, /Enforced/)
  assert.doesNotMatch(dashboard, /not yet automatically enforced/)
  assert.match(readme, /Operations Policy Enforcement/)
})
