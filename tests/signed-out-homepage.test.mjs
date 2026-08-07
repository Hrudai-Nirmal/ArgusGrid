import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

test("home route renders a signed-out landing page while preserving signed-in dashboard flow", async () => {
  const page = await readFile("src/app/page.tsx", "utf8")

  assert.match(page, /LandingPage/)
  assert.doesNotMatch(page, /return <SignInScreen \/>/)
  assert.match(page, /if \(!session\?\.user\?\.id\)/)
  assert.match(page, /return <MeridianDashboard initialWorkspace=\{workspace\} currentUser=\{session\.user\} \/>/)
})

test("signed-out homepage contains the required Meridian product sections", async () => {
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")

  assert.match(landing, /AI automation control room/i)
  assert.match(landing, /Automation Map/)
  assert.match(landing, /client proof/i)
  assert.match(landing, /Dify/)
  assert.match(landing, /n8n/)
  assert.match(landing, /GitHub Actions/)
  assert.match(landing, /REST metrics/)
  assert.match(landing, /SDK/)
  assert.match(landing, /RBAC/)
  assert.match(landing, /secret-safe logs/)
  assert.match(landing, /signed webhooks/)
  assert.match(landing, /durable notifications/)
  assert.match(landing, /billing safety/)
  assert.match(landing, /Free Sandbox/)
  assert.match(landing, /Solo Beta/)
  assert.match(landing, /Agency Beta/)
  assert.match(landing, /Enterprise Pilot/)
  assert.match(landing, /AuthEntryPanel/)
  assert.doesNotMatch(landing, /PADDLE_API_KEY|PADDLE_NOTIFICATION_WEBHOOK_SECRET|CRON_SECRET|RESEND_API_KEY|pdl_(live|sdbx)_apikey|Bearer\s+[A-Za-z0-9_-]{20,}/)
})

test("auth entry panel keeps OAuth and email registration flows reusable", async () => {
  const panel = await readFile("src/components/auth/auth-entry-panel.tsx", "utf8")
  const signIn = await readFile("src/components/auth/sign-in-screen.tsx", "utf8")

  assert.match(panel, /getCsrfToken/)
  assert.match(panel, /\/api\/auth\/signin\/github/)
  assert.match(panel, /\/api\/auth\/signin\/google/)
  assert.match(panel, /csrfToken/)
  assert.match(panel, /callbackUrl/)
  assert.match(panel, /Continue with GitHub/)
  assert.match(panel, /Continue with Google/)
  assert.match(panel, /Email/)
  assert.match(panel, /Password/)
  assert.match(panel, /Create account/)
  assert.match(panel, /\/api\/auth\/register/)
  assert.match(signIn, /AuthEntryPanel/)
  assert.doesNotMatch(panel, /console\.log|passwordHash|PADDLE_API_KEY|PADDLE_NOTIFICATION_WEBHOOK_SECRET/)
})

test("dashboard defaults to Automation Map unless tutorial auto-start selects a step", async () => {
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")

  assert.match(dashboard, /DEFAULT_DASHBOARD_SECTION\s*=\s*"map"/)
  assert.match(dashboard, /section:\s*shouldOpen \? \(firstWorkflowTutorialSteps\[stepIndex\]\?\.section as DashboardSection\) : DEFAULT_DASHBOARD_SECTION/)
  assert.match(dashboard, /useState<DashboardSection>\(\(\) => getInitialFirstWorkflowTutorialState\(initialWorkspace\)\.section\)/)
})

test("public metadata describes Meridian as monitor and client ROI software", async () => {
  const layout = await readFile("src/app/layout.tsx", "utf8")

  assert.match(layout, /Monitor AI automations/)
  assert.match(layout, /prove client ROI/)
})

test("homepage uses dark liquid glass styling with a blurred Automation Map screenshot hero", async () => {
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")
  const screenshot = await readFile("public/meridian-automation-map-screenshot.svg", "utf8")

  assert.match(landing, /liquid glass/i)
  assert.match(landing, /bg-slate-950/)
  assert.match(landing, /meridian-automation-map-screenshot\.svg/)
  assert.match(landing, /blur-\[/)
  assert.match(landing, /InteractiveAutomationMap/)
  assert.match(landing, /IntegrationBeamDemo/)
  assert.match(screenshot, /Meridian Automation Map/)
  assert.match(screenshot, /Support Triage/)
  assert.match(screenshot, /Client Proof/)
})

test("interactive homepage map uses the Meridian React Flow graph without dashboard persistence", async () => {
  const demoMap = await readFile("src/components/marketing/interactive-automation-map.tsx", "utf8")
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")

  assert.match(demoMap, /"use client"/)
  assert.match(demoMap, /homepage-demo-map/)
  assert.match(demoMap, /ReactFlow/)
  assert.match(demoMap, /EndpointGraphNode/)
  assert.match(demoMap, /useNodesState/)
  assert.match(demoMap, /nodesDraggable/)
  assert.match(demoMap, /nodesConnectable=\{false\}/)
  assert.match(demoMap, /proOptions=\{\{ hideAttribution: true \}\}/)
  assert.doesNotMatch(demoMap, /fetch\(|\/api\/projects|autosave|saveGraph|onConnect/)
  assert.doesNotMatch(landing, /demo graph visitors can touch|This public demo/i)
})

test("integration paths use animated beams to show ingestion into Meridian", async () => {
  const beam = await readFile("src/components/marketing/animated-beam.tsx", "utf8")
  const integrations = await readFile("src/components/marketing/integration-beam-demo.tsx", "utf8")

  assert.match(beam, /motion\/react/)
  assert.match(beam, /AnimatedBeamProps/)
  assert.match(beam, /ResizeObserver/)
  assert.match(integrations, /AnimatedBeam/)
  assert.match(integrations, /Dify/)
  assert.match(integrations, /n8n/)
  assert.match(integrations, /GitHub Actions/)
  assert.match(integrations, /REST metrics/)
  assert.match(integrations, /SDK\/API/)
  assert.match(integrations, /Meridian/)
})

test("homepage integration flow uses opaque Meridian theme surfaces only", async () => {
  const beam = await readFile("src/components/marketing/animated-beam.tsx", "utf8")
  const integrations = await readFile("src/components/marketing/integration-beam-demo.tsx", "utf8")

  assert.match(integrations, /bg-card/)
  assert.match(integrations, /border-border/)
  assert.match(integrations, /text-card-foreground/)
  assert.match(integrations, /bg-secondary/)
  assert.match(integrations, /text-secondary-foreground/)
  assert.match(beam, /pathColor = "var\(--border\)"/)
  assert.match(beam, /gradientStartColor = "var\(--primary\)"/)
  assert.match(beam, /gradientStopColor = "var\(--foreground\)"/)
  assert.doesNotMatch(integrations, /bg-slate-950\/70|bg-white\/\[[^\]]+\]|bg-white\/10|bg-white\/12|backdrop-blur-xl/)
  assert.doesNotMatch(integrations, /#(?:7dd3fc|c4b5fd|34d399|a78bfa|67e8f9|f0abfc|fbbf24|60a5fa)/i)
})

test("homepage automation map helper avoids React Flow zoom controls", async () => {
  const demoMap = await readFile("src/components/marketing/interactive-automation-map.tsx", "utf8")

  assert.match(demoMap, /data-testid="homepage-map-helper"/)
  assert.match(demoMap, /absolute right-4 top-4/)
  assert.doesNotMatch(demoMap, /absolute bottom-4 left-4/)
})
