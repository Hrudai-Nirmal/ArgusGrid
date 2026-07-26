import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  DEFAULT_RETENTION_POLICY_DAYS,
  buildRetentionSummaryRows,
  getRetentionCutoff,
} from "../src/lib/retention-policy.mjs"
import {
  DEFAULT_INGESTION_RATE_LIMITS,
  getIngestionRateLimitWindowStart,
  getRateLimitRetryAfterSeconds,
} from "../src/lib/ingestion-rate-limits.mjs"

test("retention policy keeps enterprise pilot raw data bounded", () => {
  assert.equal(DEFAULT_RETENTION_POLICY_DAYS.metricSamples, 90)
  assert.equal(DEFAULT_RETENTION_POLICY_DAYS.workflowRuns, 90)
  assert.equal(DEFAULT_RETENTION_POLICY_DAYS.notificationJobs, 30)
  assert.equal(DEFAULT_RETENTION_POLICY_DAYS.auditLogs, 365)

  const cutoff = getRetentionCutoff(new Date("2026-07-23T12:00:00.000Z"), 90)
  assert.equal(cutoff.toISOString(), "2026-04-24T12:00:00.000Z")
})

test("retention summaries are operator readable and secret safe", () => {
  const rows = buildRetentionSummaryRows(DEFAULT_RETENTION_POLICY_DAYS)
  assert.ok(rows.some((row) => row.label === "Workflow runs" && row.days === 90))
  assert.ok(rows.some((row) => row.label === "Notification jobs" && row.days === 30))
  assert.doesNotMatch(JSON.stringify(rows), /token|secret|password|key/i)
})

test("ingestion rate limit windows are minute bucketed", () => {
  assert.equal(DEFAULT_INGESTION_RATE_LIMITS.tokenPerMinute, 60)
  assert.equal(DEFAULT_INGESTION_RATE_LIMITS.projectPerMinute, 300)
  assert.equal(getIngestionRateLimitWindowStart(new Date("2026-07-23T12:34:56.789Z")).toISOString(), "2026-07-23T12:34:00.000Z")
  assert.equal(getRateLimitRetryAfterSeconds(new Date("2026-07-23T12:34:56.789Z")), 4)
})

test("schema stores durable ingestion rate buckets", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8")

  assert.match(schema, /model IngestionRateLimitBucket/)
  assert.match(schema, /@@unique\(\[scopeType,\s*scopeId,\s*windowStart\]\)/)
  assert.match(schema, /@@index\(\[windowStart\]\)/)
})

test("workflow ingestion enforces rate limits before writing runs", async () => {
  const source = await readFile("src/app/api/ingest/runs/route.ts", "utf8")
  const limitIndex = source.indexOf("enforceIngestionRateLimit")
  const writeIndex = source.indexOf("workflowRun")

  assert.notEqual(limitIndex, -1)
  assert.notEqual(writeIndex, -1)
  assert.ok(limitIndex < writeIndex)
  assert.match(source, /markIngestionTokenUsed/)
})

test("Inngest exposes a retention cleanup sweep", async () => {
  const functionsSource = await readFile("src/inngest/functions.ts", "utf8")
  const routeSource = await readFile("src/app/api/inngest/route.ts", "utf8")
  const pollingSource = await readFile("src/lib/polling.ts", "utf8")

  assert.match(functionsSource, /cleanupOperationalRetention/)
  assert.match(functionsSource, /cleanup-operational-retention/)
  assert.match(routeSource, /cleanupOperationalRetention/)
  assert.match(pollingSource, /DEFAULT_RETENTION_POLICY_DAYS\.metricSamples/)
})

test("Testing UI exposes project usage and guardrail evidence", async () => {
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")
  const usageRoute = await readFile("src/app/api/projects/[projectId]/usage/route.ts", "utf8")

  assert.match(dashboard, /Project usage/)
  assert.match(dashboard, /loadProjectUsage/)
  assert.match(usageRoute, /retention/)
  assert.match(usageRoute, /rateLimits/)
})
