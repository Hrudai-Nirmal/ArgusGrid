import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  buildBillingWarningCards,
  getBillingNotificationEmailContent,
} from "../src/lib/billing-notifications.mjs"

test("billing warning cards flag low credits and plan usage pressure", () => {
  const warnings = buildBillingWarningCards({
    entitlement: {
      plan: { id: "solo_beta", name: "Solo Beta" },
      usage: {
        workflowRuns: 8500,
        metricSamples: 1000,
        notificationJobs: 100,
        reportShares: 1,
      },
      creditPool: 500,
      creditsRemaining: 42,
      spendProtection: "use_credits",
      planLimits: {
        workflowRuns: 10000,
        metricSamples: 10000,
        notificationJobs: 5000,
        reportShares: 5,
      },
      isProvisional: false,
      provisionalEndsAt: null,
    },
    subscription: { status: "active", nextBilledAt: "2026-08-30T00:00:00.000Z" },
    rateLimitWarning: null,
  })

  assert.ok(warnings.some((warning) => warning.id === "low_credits" && warning.severity === "warning"))
  assert.ok(warnings.some((warning) => warning.id === "workflow_runs_approaching_limit" && warning.percentUsed === 85))
  assert.doesNotMatch(JSON.stringify(warnings), /pdl_|secret|token|webhook|https?:\/\//i)
})

test("billing warning cards flag exhausted credits, grace ending, payment issues, and rate limits", () => {
  const warnings = buildBillingWarningCards({
    entitlement: {
      plan: { id: "agency_beta", name: "Agency Beta" },
      usage: {
        workflowRuns: 100000,
        metricSamples: 100000,
        notificationJobs: 50000,
        reportShares: 50,
      },
      creditPool: 3000,
      creditsRemaining: 0,
      spendProtection: "stop_at_plan",
      planLimits: {
        workflowRuns: 100000,
        metricSamples: 100000,
        notificationJobs: 50000,
        reportShares: 50,
      },
      isProvisional: true,
      provisionalEndsAt: "2026-08-09T00:00:00.000Z",
    },
    subscription: { status: "past_due", nextBilledAt: null },
    rateLimitWarning: { scope: "project", limit: 300, retryAfterSeconds: 12 },
    now: new Date("2026-08-07T00:00:00.000Z"),
  })

  assert.ok(warnings.some((warning) => warning.id === "credits_exhausted" && warning.severity === "critical"))
  assert.ok(warnings.some((warning) => warning.id === "subscription_grace_ending"))
  assert.ok(warnings.some((warning) => warning.id === "payment_attention_required"))
  assert.ok(warnings.some((warning) => warning.id === "rate_limit_hit"))
})

test("billing notification email content is bounded and support friendly", () => {
  const content = getBillingNotificationEmailContent({
    eventType: "billing.limit_blocked",
    projectName: "Portfolio Monitoring",
  })

  assert.match(content.subject, /\[Meridian\]/)
  assert.match(content.text, /usage was blocked/i)
  assert.match(content.text, /Billing/i)
  assert.ok(content.text.length < 1200)
  assert.doesNotMatch(content.text, /pdl_|secret|token|webhook|https?:\/\//i)
})

test("billing API, jobs, and UI expose notifications without provider secrets", async () => {
  const billingRoute = await readFile("src/app/api/billing/route.ts", "utf8")
  const jobs = await readFile("src/lib/notification-jobs.ts", "utf8")
  const ingestRoute = await readFile("src/app/api/ingest/runs/route.ts", "utf8")
  const reportSharesRoute = await readFile("src/app/api/projects/[projectId]/report-shares/route.ts", "utf8")
  const polling = await readFile("src/lib/polling.ts", "utf8")
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")
  const readme = await readFile("README.md", "utf8")
  const qa = await readFile("docs/private-beta-qa.md", "utf8")

  assert.match(billingRoute, /buildBillingWarningCards/)
  assert.match(billingRoute, /warnings/)
  assert.match(jobs, /queueBillingNotificationJobs/)
  assert.match(jobs, /billing\.limit_blocked/)
  assert.match(jobs, /billing\.rate_limit_hit/)
  assert.match(jobs, /getBillingNotificationEmailContent/)
  assert.match(ingestRoute, /queueBillingNotificationJobs/)
  assert.match(ingestRoute, /billing\.rate_limit_hit/)
  assert.match(reportSharesRoute, /billing\.limit_blocked/)
  assert.match(polling, /billing\.limit_blocked/)
  assert.match(dashboard, /Billing alerts/)
  assert.match(dashboard, /Plan limit approaching/)
  assert.match(dashboard, /Email billing alerts follow existing email notification preferences/)
  assert.match(readme, /Billing notifications/i)
  assert.match(qa, /Billing alerts/i)
  assert.doesNotMatch(billingRoute + jobs + ingestRoute + reportSharesRoute + polling + dashboard, /PADDLE_API_KEY|PADDLE_NOTIFICATION_WEBHOOK_SECRET|pdl_(live|sdbx)_apikey/)
})
