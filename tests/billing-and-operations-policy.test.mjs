import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  DEFAULT_PROJECT_OPERATIONS_POLICY,
  MERIDIAN_CREDIT_PACKS,
  MERIDIAN_PRICING_PLANS,
  normalizeProjectOperationsPolicy,
} from "../src/lib/billing-plans.mjs"

test("pricing plans expose safe USD and INR beta rates", () => {
  assert.deepEqual(
    MERIDIAN_PRICING_PLANS.map((plan) => plan.id),
    ["free_sandbox", "solo_beta", "agency_beta", "enterprise_pilot"]
  )
  assert.equal(MERIDIAN_PRICING_PLANS.find((plan) => plan.id === "solo_beta")?.monthlyUsd, 59)
  assert.equal(MERIDIAN_PRICING_PLANS.find((plan) => plan.id === "solo_beta")?.monthlyInr, 4999)
  assert.equal(MERIDIAN_PRICING_PLANS.find((plan) => plan.id === "agency_beta")?.includedCredits, 3000)
  assert.doesNotMatch(JSON.stringify(MERIDIAN_PRICING_PLANS), /secret|token|password|credential/i)
})

test("credit packs use prepaid USD and INR rates", () => {
  assert.deepEqual(
    MERIDIAN_CREDIT_PACKS.map((pack) => pack.credits),
    [500, 2000, 10000]
  )
  assert.equal(MERIDIAN_CREDIT_PACKS[0].usd, 19)
  assert.equal(MERIDIAN_CREDIT_PACKS[0].inr, 1599)
})

test("default operations policy is zero-idle and cost-safe", () => {
  assert.equal(DEFAULT_PROJECT_OPERATIONS_POLICY.operationsMode, "cost_saver")
  assert.equal(DEFAULT_PROJECT_OPERATIONS_POLICY.pollingCadenceMin, null)
  assert.equal(DEFAULT_PROJECT_OPERATIONS_POLICY.notificationReliability, "standard")
  assert.equal(DEFAULT_PROJECT_OPERATIONS_POLICY.retentionDays, 30)
  assert.equal(DEFAULT_PROJECT_OPERATIONS_POLICY.spendProtection, "use_credits")
})

test("operations policy normalization clamps unsafe customizations", () => {
  const normalized = normalizeProjectOperationsPolicy({
    operationsMode: "priority",
    pollingCadenceMin: 1,
    notificationReliability: "priority",
    retentionDays: 180,
    spendProtection: "stop_at_plan",
  })

  assert.equal(normalized.operationsMode, "priority")
  assert.equal(normalized.pollingCadenceMin, 1)
  assert.equal(normalized.notificationReliability, "priority")
  assert.equal(normalized.retentionDays, 180)
  assert.equal(normalized.spendProtection, "stop_at_plan")

  const fallback = normalizeProjectOperationsPolicy({
    operationsMode: "unknown",
    pollingCadenceMin: 2,
    notificationReliability: "turbo",
    retentionDays: 999,
    spendProtection: "bill_forever",
  })
  assert.deepEqual(fallback, DEFAULT_PROJECT_OPERATIONS_POLICY)
  assert.deepEqual(normalizeProjectOperationsPolicy(null), DEFAULT_PROJECT_OPERATIONS_POLICY)
})

test("schema, API, and dashboard wire billing and operations policy", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8")
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")
  const workspace = await readFile("src/lib/workspace.ts", "utf8")
  const route = await readFile("src/app/api/projects/[projectId]/operations-policy/route.ts", "utf8")

  assert.match(schema, /model ProjectOperationsPolicy/)
  assert.match(schema, /operationsPolicy\s+ProjectOperationsPolicy\?/)
  assert.match(route, /requireProjectRole\(userId, projectId, \["OWNER", "ADMIN"\]\)/)
  assert.match(route, /operations-policy.updated/)
  assert.match(workspace, /operationsPolicy/)
  assert.match(dashboard, /id: "billing"/)
  assert.match(dashboard, /BillingSection/)
  assert.match(dashboard, /Usage by category/)
  assert.match(dashboard, /Operations Policy/)
  assert.match(dashboard, /activeSection === "billing" && !projectUsage/)
})
