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
