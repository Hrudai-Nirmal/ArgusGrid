import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import { buildBillingSupportPacket } from "../src/lib/billing-support.mjs"

test("buildBillingSupportPacket summarizes entitlement and sync state without secrets", () => {
  const packet = buildBillingSupportPacket({
    projectName: "Portfolio Monitor",
    generatedAt: "2026-08-12T10:00:00.000Z",
    billing: {
      environment: "sandbox",
      sync: {
        label: "Healthy",
        status: "healthy",
        message: "Signed billing confirmations are arriving.",
        failedConfirmations: 0,
        lastConfirmation: {
          type: "transaction.completed",
          status: "PROCESSED",
          processedAt: "2026-08-12T09:30:00.000Z",
          occurredAt: null,
          createdAt: "2026-08-12T09:29:00.000Z",
        },
      },
      subscription: {
        status: "active",
        billingKey: "solo_beta",
        currentPeriodEndsAt: "2026-09-12T00:00:00.000Z",
        access: { label: "Active", hasAccess: true },
      },
      entitlement: {
        plan: { id: "solo_beta", name: "Solo Beta", source: "subscription", isProvisional: false, provisionalEndsAt: null },
        periodStart: "2026-08-01T00:00:00.000Z",
        usage: { workflowRuns: 410, metricSamples: 55, notificationJobs: 12, reportShares: 2 },
        creditPool: 500,
        creditsUsed: 25,
        creditsRemaining: 475,
        spendProtection: "use_credits",
      },
      warnings: [{ id: "low_credits", severity: "warning", title: "Low credits", action: "Buy credits" }],
      supportEvents: [
        {
          id: "evt_1",
          action: "billing.entitlement_denied",
          createdAt: "2026-08-12T09:00:00.000Z",
          metadata: { resource: "workflow_run", reason: "Plan limit reached", limit: 500, used: 500, creditsRemaining: 0 },
        },
      ],
    },
  })

  assert.match(packet, /Billing support packet/)
  assert.match(packet, /Portfolio Monitor/)
  assert.match(packet, /Solo Beta/)
  assert.match(packet, /workflow runs: 410/)
  assert.match(packet, /credits remaining: 475/)
  assert.match(packet, /billing\.entitlement_denied/)
  assert.match(packet, /Plan limit reached/)
  assert.doesNotMatch(packet, /pdl_|secret|token|webhook|hooks\.slack|postgresql:\/\/|Bearer\s+/i)
})

test("billing API and dashboard expose a support packet without raw provider payloads", async () => {
  const helper = await readFile("src/lib/billing-support.mjs", "utf8")
  const billingRoute = await readFile("src/app/api/billing/route.ts", "utf8")
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")
  const readme = await readFile("README.md", "utf8")
  const qa = await readFile("docs/private-beta-qa.md", "utf8")

  assert.match(billingRoute, /supportEvents/)
  assert.match(billingRoute, /billing\.entitlement_denied/)
  assert.match(billingRoute, /billing\.credits_consumed/)
  assert.match(dashboard, /buildBillingSupportPacket/)
  assert.match(dashboard, /Copy support packet/)
  assert.match(dashboard, /Billing support packet copied/)
  assert.match(readme, /Billing support packet/)
  assert.match(qa, /Copy support packet/)
  assert.doesNotMatch(helper + billingRoute + dashboard, /PADDLE_API_KEY|PADDLE_NOTIFICATION_WEBHOOK_SECRET|pdl_(live|sdbx)_apikey|rawPayload/)
})
