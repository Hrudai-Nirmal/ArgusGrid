import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const OWNER_ADMIN_ROUTE_FILES = [
  "src/app/api/projects/[projectId]/exports/runs.csv/route.ts",
  "src/app/api/projects/[projectId]/exports/metrics.csv/route.ts",
  "src/app/api/projects/[projectId]/exports/alerts.csv/route.ts",
  "src/app/api/projects/[projectId]/ingestion-tokens/route.ts",
  "src/app/api/projects/[projectId]/ingestion-tokens/[tokenId]/route.ts",
  "src/app/api/projects/[projectId]/operations/overview/route.ts",
  "src/app/api/projects/[projectId]/poll/run/route.ts",
  "src/app/api/projects/[projectId]/report-presets/route.ts",
  "src/app/api/projects/[projectId]/report-presets/[presetId]/route.ts",
  "src/app/api/projects/[projectId]/report-shares/route.ts",
  "src/app/api/projects/[projectId]/report-shares/[shareId]/route.ts",
  "src/app/api/projects/[projectId]/slack/route.ts",
  "src/app/api/projects/[projectId]/slack/[slackId]/route.ts",
  "src/app/api/projects/[projectId]/slack/[slackId]/test/route.ts",
  "src/app/api/projects/[projectId]/webhooks/route.ts",
  "src/app/api/projects/[projectId]/webhooks/[webhookId]/route.ts",
  "src/app/api/projects/[projectId]/webhooks/[webhookId]/test/route.ts",
  "src/app/api/projects/[projectId]/notification-jobs/[jobId]/retry/route.ts",
  "src/app/api/projects/[projectId]/notification-jobs/[jobId]/cancel/route.ts",
]

test("sensitive project routes require owner or admin roles", async () => {
  for (const routeFile of OWNER_ADMIN_ROUTE_FILES) {
    const source = await readFile(routeFile, "utf8")
    assert.match(
      source,
      /requireProjectRole\(userId,\s*projectId,\s*\["OWNER",\s*"ADMIN"\]\)/,
      `${routeFile} must stay owner/admin-only`
    )
  }
})

test("public report assets remain no-store and sniff protected", async () => {
  const mapRoute = await readFile("src/app/reports/[shareToken]/map.png/route.ts", "utf8")
  const brandRoute = await readFile("src/app/reports/[shareToken]/brand-image/route.ts", "utf8")

  for (const source of [mapRoute, brandRoute]) {
    assert.match(source, /Cache-Control["']:\s*["']private,\s*no-store["']/)
    assert.match(source, /X-Content-Type-Options["']:\s*["']nosniff["']/)
  }
})

test("Next config applies enterprise pilot browser security headers", async () => {
  const source = await readFile("next.config.ts", "utf8")

  assert.match(source, /async\s+headers\(\)/)
  assert.match(source, /X-Content-Type-Options/)
  assert.match(source, /Referrer-Policy/)
  assert.match(source, /Permissions-Policy/)
  assert.match(source, /X-Frame-Options/)
  assert.match(source, /Strict-Transport-Security/)
  assert.match(source, /\/reports\/:path\*/)
  assert.match(source, /private,\s*no-store/)
})

test("browser permissions policy allows Razorpay checkout without weakening core denials", async () => {
  const source = await readFile("next.config.ts", "utf8")

  assert.doesNotMatch(source, /payment=\(\)/)
  assert.match(source, /payment=\(self "https:\/\/checkout\.razorpay\.com"/)
  assert.match(source, /accelerometer=\(self "https:\/\/checkout\.razorpay\.com"/)
  assert.match(source, /gyroscope=\(self "https:\/\/checkout\.razorpay\.com"/)
  assert.match(source, /camera=\(\)/)
  assert.match(source, /microphone=\(\)/)
  assert.match(source, /geolocation=\(\)/)
  assert.match(source, /usb=\(\)/)
  assert.match(source, /browsing-topics=\(\)/)
})

test("production smoke verifies security headers", async () => {
  const source = await readFile("scripts/smoke.mjs", "utf8")

  assert.match(source, /assertSecurityHeaders/)
  assert.match(source, /x-content-type-options/)
  assert.match(source, /referrer-policy/)
  assert.match(source, /permissions-policy/)
  assert.match(source, /x-frame-options/)
})

test("security docs include the enterprise pilot hardening pass", async () => {
  const qa = await readFile("docs/private-beta-qa.md", "utf8")
  const context = await readFile("context.md", "utf8")

  assert.match(qa, /Security [Hh]ardening/)
  assert.match(qa, /browser security headers/)
  assert.match(context, /Security & Access Hardening v1/)
})
