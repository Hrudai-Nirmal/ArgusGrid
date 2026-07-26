import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  buildProductionObservabilityOverview,
  getOperationalStatus,
} from "../src/lib/production-observability.mjs"

const READY_DIAGNOSTICS = {
  ok: true,
  checkedAt: "2026-07-26T12:00:00.000Z",
  checks: {
    database: true,
    schema: true,
    auth: true,
    encryption: true,
    cron: true,
    email: true,
    jobs: true,
  },
  latestPoll: {
    status: "SUCCESS",
    startedAt: "2026-07-26T11:59:00.000Z",
    finishedAt: "2026-07-26T11:59:05.000Z",
    durationMs: 5000,
    sampledNodes: 2,
    createdSamples: 2,
    evaluatedAlerts: 1,
    rollupsQueued: 0,
    deletedSamples: 0,
    errorSummary: null,
  },
  notificationJobs: {
    SENT: 12,
    FAILED: 0,
    QUEUED: 0,
    RETRYING: 0,
    RUNNING: 0,
  },
  issues: [],
  warnings: [],
  runtime: {
    label: "Production",
    isProduction: true,
    externalSideEffectsEnabled: true,
    backgroundJobsEnabled: true,
    cronEnabled: true,
  },
}

const READY_USAGE = {
  window: "24h",
  counts: {
    workflowRuns: 20,
    metricSamples: 10,
    alerts: 1,
    notificationJobs: 12,
    notificationDeliveries: 12,
    reportShares: 2,
    activeIngestionTokens: 1,
    rateLimitBuckets: 0,
  },
}

test("production observability summarizes ready, warning, and blocked states", () => {
  const ready = getOperationalStatus(["ready", "ready", "ready"])
  const warning = getOperationalStatus(["ready", "warning", "ready"])
  const blocked = getOperationalStatus(["ready", "blocked", "warning"])

  assert.equal(ready, "ready")
  assert.equal(warning, "warning")
  assert.equal(blocked, "blocked")
})

test("production observability blocks on dependency failures", () => {
  const overview = buildProductionObservabilityOverview({
    diagnostics: {
      ...READY_DIAGNOSTICS,
      ok: false,
      checks: { ...READY_DIAGNOSTICS.checks, database: false },
      issues: [{ code: "DATABASE_UNAVAILABLE", message: "The database is temporarily unavailable." }],
    },
    usage: READY_USAGE,
    now: new Date("2026-07-26T12:00:00.000Z"),
  })

  assert.equal(overview.status, "blocked")
  assert.ok(overview.cards.some((card) => card.id === "dependencies" && card.status === "blocked"))
  assert.doesNotMatch(JSON.stringify(overview), /postgres:\/\/|DATABASE_URL|password|secret|npg_/i)
})

test("production observability warns on stale poll and rate-limit pressure", () => {
  const overview = buildProductionObservabilityOverview({
    diagnostics: {
      ...READY_DIAGNOSTICS,
      latestPoll: {
        ...READY_DIAGNOSTICS.latestPoll,
        finishedAt: "2026-07-26T11:20:00.000Z",
      },
    },
    usage: {
      ...READY_USAGE,
      counts: { ...READY_USAGE.counts, rateLimitBuckets: 4 },
    },
    now: new Date("2026-07-26T12:00:00.000Z"),
  })

  assert.equal(overview.status, "warning")
  assert.ok(overview.cards.some((card) => card.id === "polling" && card.status === "warning"))
  assert.ok(overview.cards.some((card) => card.id === "usage-guardrails" && card.status === "warning"))
})

test("production observability blocks when notification jobs have failures", () => {
  const overview = buildProductionObservabilityOverview({
    diagnostics: {
      ...READY_DIAGNOSTICS,
      notificationJobs: { ...READY_DIAGNOSTICS.notificationJobs, FAILED: 2 },
    },
    usage: READY_USAGE,
    now: new Date("2026-07-26T12:00:00.000Z"),
  })

  assert.equal(overview.status, "blocked")
  assert.ok(overview.cards.some((card) => card.id === "notification-jobs" && card.status === "blocked"))
})

test("production observability API and Testing UI are wired", async () => {
  const route = await readFile("src/app/api/projects/[projectId]/operations/overview/route.ts", "utf8")
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")

  assert.match(route, /getProductionObservabilitySnapshot/)
  assert.match(route, /OWNER.*ADMIN/s)
  assert.match(dashboard, /Production observability/)
  assert.match(dashboard, /loadProductionObservability/)
  assert.match(dashboard, /Ready.*Warning.*Blocked/s)
})
