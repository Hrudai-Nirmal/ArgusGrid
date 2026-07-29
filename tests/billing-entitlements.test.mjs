import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  buildUsageEntitlement,
  canConsumeEntitlementResource,
  getBillingPlanFromEvidence,
} from "../src/lib/billing-entitlements.mjs"

test("billing evidence trusts active subscriptions before free fallback", () => {
  const evidence = getBillingPlanFromEvidence({
    subscription: { status: "active", billingKey: "agency_beta" },
    transactions: [],
    now: new Date("2026-07-28T12:00:00Z"),
  })

  assert.equal(evidence.plan.id, "agency_beta")
  assert.equal(evidence.source, "subscription")
  assert.equal(evidence.isProvisional, false)
})

test("paid plan transactions grant provisional access while subscription webhooks catch up", () => {
  const evidence = getBillingPlanFromEvidence({
    subscription: null,
    transactions: [
      {
        status: "completed",
        billingKey: "solo_beta",
        createdAt: "2026-07-28T11:30:00Z",
      },
    ],
    now: new Date("2026-07-28T12:00:00Z"),
  })

  assert.equal(evidence.plan.id, "solo_beta")
  assert.equal(evidence.source, "provisional_transaction")
  assert.equal(evidence.isProvisional, true)
})

test("stale or unpaid plan transactions do not grant access", () => {
  const evidence = getBillingPlanFromEvidence({
    subscription: null,
    transactions: [
      {
        status: "payment_failed",
        billingKey: "enterprise_pilot",
        createdAt: "2026-07-28T11:30:00Z",
      },
      {
        status: "completed",
        billingKey: "agency_beta",
        createdAt: "2026-07-26T11:30:00Z",
      },
    ],
    now: new Date("2026-07-28T12:00:00Z"),
  })

  assert.equal(evidence.plan.id, "free_sandbox")
  assert.equal(evidence.source, "free")
})

test("credits allow controlled overage when spend protection permits it", () => {
  const entitlement = buildUsageEntitlement({
    planId: "solo_beta",
    usage: {
      workflowRuns: 10000,
      metricSamples: 10000,
      notificationJobs: 5000,
      reportShares: 5,
    },
    purchasedCredits: 500,
    spendProtection: "use_credits",
  })

  const decision = canConsumeEntitlementResource(entitlement, "workflow_run", 25)
  assert.equal(decision.allowed, true)
  assert.equal(decision.creditsRemainingAfter, 975)
})

test("durable credit balances separate purchased grants from consumed usage", () => {
  const entitlement = buildUsageEntitlement({
    planId: "free_sandbox",
    usage: {
      workflowRuns: 500,
      metricSamples: 0,
      notificationJobs: 0,
      reportShares: 0,
    },
    purchasedCredits: 750,
    consumedCredits: 125,
    spendProtection: "use_credits",
  })

  const decision = canConsumeEntitlementResource(entitlement, "workflow_run", 10)
  assert.equal(entitlement.creditPool, 750)
  assert.equal(entitlement.creditsUsed, 125)
  assert.equal(entitlement.creditsRemaining, 625)
  assert.equal(decision.allowed, true)
  assert.equal(decision.creditsNeeded, 10)
  assert.equal(decision.creditsRemainingAfter, 615)
})

test("subscription grace period keeps paid access briefly after cancellation", () => {
  const evidence = getBillingPlanFromEvidence({
    subscription: {
      status: "canceled",
      billingKey: "agency_beta",
      currentBillingPeriodEndsAt: "2026-07-28T12:00:00Z",
    },
    transactions: [],
    now: new Date("2026-08-02T12:00:00Z"),
  })

  assert.equal(evidence.plan.id, "agency_beta")
  assert.equal(evidence.source, "subscription_grace")
  assert.equal(evidence.isProvisional, true)
  assert.equal(evidence.provisionalEndsAt, "2026-08-04T12:00:00.000Z")
})

test("stop-at-plan spend protection blocks overage even with credits", () => {
  const entitlement = buildUsageEntitlement({
    planId: "solo_beta",
    usage: {
      workflowRuns: 10000,
      metricSamples: 0,
      notificationJobs: 0,
      reportShares: 0,
    },
    purchasedCredits: 10000,
    spendProtection: "stop_at_plan",
  })

  const decision = canConsumeEntitlementResource(entitlement, "workflow_run", 1)
  assert.equal(decision.allowed, false)
  assert.match(decision.reason, /plan limit/i)
})

test("billing entitlement source hooks enforcement and logs safely", async () => {
  const ingestRoute = await readFile("src/app/api/ingest/runs/route.ts", "utf8")
  const polling = await readFile("src/lib/polling.ts", "utf8")
  const billingRoute = await readFile("src/app/api/billing/route.ts", "utf8")
  const logsRoute = await readFile("src/app/api/projects/[projectId]/logs/route.ts", "utf8")
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")

  assert.match(ingestRoute, /authorizeProjectUsage/)
  assert.match(ingestRoute, /workflow_run/)
  assert.match(polling, /authorizeProjectUsage/)
  assert.match(polling, /metric_sample/)
  assert.match(ingestRoute + polling, /consumeProjectUsageCredits/)
  assert.match(billingRoute, /entitlement/)
  assert.match(logsRoute, /paddleWebhookEvent/)
  assert.match(logsRoute, /billing/)
  assert.match(dashboard, /Credits remaining/)
  assert.doesNotMatch(ingestRoute + polling + logsRoute + dashboard, /PADDLE_SANDBOX_API_KEY|PADDLE_NOTIFICATION_WEBHOOK_SECRET/)
})
