import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  getMeridianBillingKeyFromPriceId,
  getPlanAccessState,
  sanitizePaddleFailure,
} from "../src/lib/paddle-billing.mjs"

test("Paddle billing helpers map configured price ids to Meridian billing keys", () => {
  assert.equal(
    getMeridianBillingKeyFromPriceId("pri_solo", {
      soloBetaPriceId: "pri_solo",
      agencyBetaPriceId: "pri_agency",
      enterprisePilotPriceId: "pri_enterprise",
      credits500PriceId: "pri_credits_500",
      credits2000PriceId: "pri_credits_2000",
      credits10000PriceId: "pri_credits_10000",
    }),
    "solo_beta"
  )
  assert.equal(getMeridianBillingKeyFromPriceId("unknown", {}), null)
})

test("Paddle subscription access state keeps active and trialing subscriptions enabled", () => {
  assert.equal(getPlanAccessState(null).hasAccess, false)
  assert.equal(getPlanAccessState({ status: "active" }).hasAccess, true)
  assert.equal(getPlanAccessState({ status: "trialing" }).hasAccess, true)
  assert.equal(getPlanAccessState({ status: "past_due" }).hasAccess, true)
  assert.equal(getPlanAccessState({ status: "paused" }).hasAccess, false)
  assert.equal(getPlanAccessState({ status: "canceled" }).hasAccess, false)
  assert.equal(getPlanAccessState({ status: "active", scheduledChangeAction: "cancel" }).label, "Active, cancel scheduled")
})

test("Paddle failure summaries are bounded and secret-safe", () => {
  const summary = sanitizePaddleFailure(
    "Webhook failed with pdl_live_apikey_bad and pdl_ntfset_bad plus https://example.com/secret/path ".repeat(20)
  )

  assert.ok(summary.length <= 240)
  assert.doesNotMatch(summary, /pdl_live_apikey/i)
  assert.doesNotMatch(summary, /pdl_ntfset/i)
  assert.doesNotMatch(summary, /https:\/\/example\.com/)
})

test("Prisma schema stores Paddle customers, subscriptions, transactions, and processed events", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8")

  assert.match(schema, /model PaddleCustomer/)
  assert.match(schema, /paddleCustomerId\s+String\s+@unique/)
  assert.match(schema, /model PaddleSubscription/)
  assert.match(schema, /paddleSubscriptionId\s+String\s+@unique/)
  assert.match(schema, /model PaddleTransaction/)
  assert.match(schema, /paddleTransactionId\s+String\s+@unique/)
  assert.match(schema, /model PaddleWebhookEvent/)
  assert.match(schema, /paddleEventId\s+String\s+@unique/)
  assert.match(schema, /paddleCustomers\s+PaddleCustomer\[\]/)
  assert.match(schema, /paddleSubscriptions\s+PaddleSubscription\[\]/)
  assert.match(schema, /paddleTransactions\s+PaddleTransaction\[\]/)
  assert.match(schema, /model BillingCreditLedgerEntry/)
  assert.match(schema, /idempotencyKey\s+String\s+@unique/)
  assert.match(schema, /creditLedgerEntries\s+BillingCreditLedgerEntry\[\]/)
})

test("Paddle webhook route verifies raw signed payloads and never exposes secrets", async () => {
  const route = await readFile("src/app/api/paddle/webhook/route.ts", "utf8")
  const processor = await readFile("src/lib/paddle-webhook.ts", "utf8")

  assert.match(route, /request\.text\(\)/)
  assert.match(route, /paddle-signature/)
  assert.match(route, /webhooks\.unmarshal/)
  assert.match(route, /PADDLE_NOTIFICATION_WEBHOOK_SECRET/)
  assert.match(processor, /processPaddleWebhookEvent/)
  assert.match(processor, /paddleWebhookEvent\.upsert/)
  assert.match(processor, /paddleSubscription\.upsert/)
  assert.match(processor, /paddleTransaction\.upsert/)
  assert.match(processor, /grantPurchasedCredits/)
  assert.doesNotMatch(route + processor, /console\.log/)
  assert.doesNotMatch(route + processor, /pdl_(live|sdbx)_apikey_[A-Za-z0-9_]+/)
  assert.doesNotMatch(route + processor, /pdl_ntfset_[A-Za-z0-9_]+/)
})

test("Billing API and UI expose mirrored Paddle state without server keys", async () => {
  const billingRoute = await readFile("src/app/api/billing/route.ts", "utf8")
  const portalRoute = await readFile("src/app/api/billing/portal/route.ts", "utf8")
  const invoiceRoute = await readFile("src/app/api/billing/invoices/[transactionId]/route.ts", "utf8")
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")

  assert.match(billingRoute, /paddleSubscriptions/)
  assert.match(billingRoute, /paddleTransactions/)
  assert.match(billingRoute, /creditLedger/)
  assert.match(portalRoute, /customerPortalSessions|portalSessions/)
  assert.match(invoiceRoute, /encodeURIComponent\(transaction\.paddleTransactionId\)/)
  assert.match(invoiceRoute, /\/invoice\?disposition=attachment/)
  assert.match(invoiceRoute, /requireProjectRole/)
  assert.match(dashboard, /Manage subscription/)
  assert.match(dashboard, /Billing history/)
  assert.match(dashboard, /refreshBillingStatus/)
  assert.match(dashboard, /Refresh status/)
  assert.match(dashboard, /Download invoice/)
  assert.doesNotMatch(dashboard, /Refresh billing/)
  assert.doesNotMatch(dashboard, /Paddle Billing checkout/)
  assert.doesNotMatch(dashboard, /PADDLE_API_KEY/)
  assert.doesNotMatch(dashboard, /PADDLE_NOTIFICATION_WEBHOOK_SECRET/)
})
