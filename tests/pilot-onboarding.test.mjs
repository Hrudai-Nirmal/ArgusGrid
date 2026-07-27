import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import { buildPilotOnboardingChecklist } from "../src/lib/pilot-onboarding.mjs"

test("buildPilotOnboardingChecklist tracks the first pilot setup path", () => {
  const checklist = buildPilotOnboardingChecklist({
    hasProject: true,
    nodeCount: 1,
    hasIntegrationSetup: true,
    realRunCount: 1,
    realMetricCount: 0,
    alertRuleCount: 1,
    activeReportCount: 1,
  })

  assert.deepEqual(
    checklist.items.map((item) => [item.id, item.completed]),
    [
      ["project", true],
      ["node", true],
      ["integration", true],
      ["signal", true],
      ["alert-rule", true],
      ["client-proof", true],
    ]
  )
  assert.equal(checklist.completedCount, 6)
  assert.equal(checklist.totalCount, 6)
  assert.equal(checklist.percentComplete, 100)
  assert.match(checklist.nextActionLabel, /Review pilot evidence/)
})

test("buildPilotOnboardingChecklist waits for real signals before marking telemetry complete", () => {
  const checklist = buildPilotOnboardingChecklist({
    hasProject: true,
    nodeCount: 1,
    hasIntegrationSetup: true,
    realRunCount: 0,
    realMetricCount: 0,
    alertRuleCount: 0,
    activeReportCount: 0,
  })

  assert.equal(checklist.items.find((item) => item.id === "signal")?.completed, false)
  assert.equal(checklist.items.find((item) => item.id === "alert-rule")?.completed, false)
  assert.equal(checklist.nextActionSection, "integrations")
  assert.match(checklist.nextActionLabel, /Send first signal/)
})

test("dashboard moves sign out into a dedicated account management space", async () => {
  const source = await readFile("src/components/meridian/dashboard.tsx", "utf8")
  const headerSource = source.match(/<header[\s\S]*?<\/header>/)?.[0] ?? ""

  assert.doesNotMatch(headerSource, /Sign out/)
  assert.match(source, /id:\s*"account"/)
  assert.match(source, /function AccountSection/)
  assert.match(source, /Account management/)
  assert.match(source, /signOut\(\{\s*callbackUrl:\s*"\/"\s*\}\)/)
})

test("dashboard exposes pilot onboarding checklist from Control Room", async () => {
  const source = await readFile("src/components/meridian/dashboard.tsx", "utf8")

  assert.match(source, /buildPilotOnboardingChecklist/)
  assert.match(source, /Pilot setup checklist/)
  assert.match(source, /Copy setup packet/)
})
