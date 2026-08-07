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
  assert.match(landing, /Reliability/)
  assert.match(landing, /readiness checks/)
  assert.match(landing, /manual recovery/)
  assert.match(landing, /durable notifications/)
  assert.match(landing, /bounded evidence/)
  assert.match(landing, /Free Sandbox/)
  assert.match(landing, /Solo Beta/)
  assert.match(landing, /Agency Beta/)
  assert.match(landing, /Enterprise Pilot/)
  assert.match(landing, /AuthEntryPanel/)
  assert.doesNotMatch(landing, /Security and reliability|Built for evidence, not secret sprawl|ShieldCheck|LockKeyhole/)
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

test("homepage uses Meridian dark theme and a DotField hero background", async () => {
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")
  const dotField = await readFile("src/components/marketing/dot-field.tsx", "utf8")
  const dotFieldCss = await readFile("src/components/marketing/dot-field.css", "utf8")
  const landingCss = await readFile("src/components/marketing/landing-page.css", "utf8")

  assert.match(landing, /liquid glass/i)
  assert.match(landing, /import "\.\/landing-page\.css"/)
  assert.match(landing, /className="dark min-h-screen overflow-hidden bg-background text-foreground"/)
  assert.match(landing, /DotField/)
  assert.match(landing, /gradientFrom="#A855F7"/)
  assert.match(landing, /gradientTo="#B497CF"/)
  assert.match(landing, /glowColor="#120F17"/)
  assert.match(landing, /data-testid="homepage-bottom-blur"/)
  assert.match(landingCss, /\.homepage-bottom-blur/)
  assert.match(landingCss, /height:\s*5vh/)
  assert.match(landingCss, /backdrop-filter:\s*blur\(14px\)/)
  assert.match(landingCss, /mask-image:\s*linear-gradient/)
  assert.doesNotMatch(landing, /next\/image|meridian-automation-map-screenshot\.svg|blur-\[/)
  assert.doesNotMatch(landing, /bg-slate-|text-slate-|border-white|bg-white|text-white|cyan-|emerald-|indigo-/)
  assert.match(landing, /InteractiveAutomationMap/)
  assert.match(landing, /IntegrationBeamDemo/)
  assert.match(dotField, /"use client"/)
  assert.match(dotField, /requestAnimationFrame/)
  assert.match(dotField, /ResizeObserver/)
  assert.match(dotFieldCss, /\.dot-field-container/)
})

test("homepage header is a centered fixed rounded bar", async () => {
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")

  assert.match(landing, /<header\s+className=\{cn\(\s*"fixed left-1\/2 top-4 z-40/)
  assert.match(landing, /border border-border\/80 bg-card\/90/)
  assert.match(landing, /shadow-2xl shadow-black\/30 backdrop-blur-xl/)
  assert.match(landing, /-translate-x-1\/2/)
  assert.match(landing, /rounded-full/)
  assert.doesNotMatch(landing, /GlassSurface/)
  assert.doesNotMatch(landing, /backgroundOpacity=|saturation=|distortionScale=|displace=/)
  assert.doesNotMatch(landing, /<header className="sticky top-0|border-b border-white|bg-card\/90 px-3 py-2 shadow-2xl/)
})

test("homepage uses subtle BorderGlow for content cards and full BorderGlow for login and billing", async () => {
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")
  const borderGlow = await readFile("src/components/marketing/border-glow.tsx", "utf8")
  const borderGlowCss = await readFile("src/components/marketing/border-glow.css", "utf8")
  const landingCss = await readFile("src/components/marketing/landing-page.css", "utf8")

  assert.match(landing, /BorderGlow/)
  assert.match(landing, /glowColor="40 80 80"/)
  assert.match(landing, /subtleGlowFillOpacity = 0/)
  assert.match(landing, /fillOpacity = 0\.42/)
  assert.match(landing, /fillOpacity=\{fillOpacity\}/)
  assert.match(landing, /<GlowFrame radius=\{32\} fillOpacity=\{subtleGlowFillOpacity\}>\s*<InteractiveAutomationMap \/>/)
  assert.match(landing, /<GlowFrame radius=\{32\} fillOpacity=\{subtleGlowFillOpacity\}>\s*<IntegrationBeamDemo \/>/)
  assert.match(landing, /<GlowFrame key=\{plan\.id\}/)
  assert.match(landing, /<GlowFrame>\s*<AuthEntryPanel title="Start Meridian" description="" footerCopy="" \/>/)
  assert.match(borderGlow, /"use client"/)
  assert.match(borderGlow, /onPointerMove/)
  assert.match(borderGlowCss, /\.border-glow-card/)
  assert.doesNotMatch(landing, /<GlowFrame key=\{title\}/)
  assert.doesNotMatch(landing, /<GlowFrame key=\{card\.title\}/)
  assert.doesNotMatch(landing, /<GlowFrame key=\{item\.title\}/)
  assert.doesNotMatch(landing, /<GlowFrame radius=\{32\} fillOpacity=\{subtleGlowFillOpacity\}>\s*<div className=\{cn\("rounded-\[2rem\]/)
  assert.match(landing, /hero-shine-card/)
  assert.match(landingCss, /\.hero-shine-card::before/)
  assert.match(landingCss, /animation:\s*hero-card-border-shine 7s linear infinite/)
  assert.doesNotMatch(landing, /SpecularButton/)
  assert.doesNotMatch(landing, /autoAnimate=\{plan\.id === "agency_beta"\}/)
})

test("homepage headings use lilac tone and hero title uses scroll-triggered stroke text", async () => {
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")
  const strokeText = await readFile("src/components/marketing/stroke-text.tsx", "utf8")
  const strokeTextCss = await readFile("src/components/marketing/stroke-text.css", "utf8")

  assert.match(landing, /import StrokeText from/)
  assert.match(landing, /const headingClass = "text-\[#D8B4FE\]"/)
  assert.match(landing, /<StrokeText\s+text="Meridian"/)
  assert.match(landing, /trigger="scroll"/)
  assert.match(landing, /strokeColor="#C4B5FD"/)
  assert.match(landing, /fillColor="#D8B4FE"/)
  assert.doesNotMatch(landing, /<h1[^>]*>\s*Meridian\s*<\/h1>/)
  assert.match(strokeText, /"use client"/)
  assert.match(strokeText, /IntersectionObserver/)
  assert.match(strokeText, /stroke-text--animate/)
  assert.match(strokeTextCss, /@keyframes stroke-text-draw/)
  assert.match(strokeTextCss, /@keyframes stroke-text-fill-wipe/)
  assert.doesNotMatch(strokeText, /gsap|ScrollTrigger/)
})

test("billing plan choice buttons have a visible hover state inside glowing cards", async () => {
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")

  assert.match(landing, /Choose \{plan\.name\}/)
  assert.match(landing, /hover:border-primary/)
  assert.match(landing, /hover:bg-primary/)
  assert.match(landing, /hover:text-primary-foreground/)
  assert.match(landing, /hover:shadow-\[0_0_28px_color-mix\(in_oklch,var\(--primary\),transparent_45%\)\]/)
})

test("homepage hero and section layout use larger brand type with golden-ratio columns", async () => {
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")

  assert.match(landing, /lg:grid-cols-\[0\.618fr_1fr\]/)
  assert.match(landing, /text-6xl/)
  assert.match(landing, /md:text-8xl/)
  assert.match(landing, /xl:text-\[9rem\]/)
  assert.match(landing, /items-center/)
})

test("homepage sign-in panel omits launch-only helper copy", async () => {
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")
  const panel = await readFile("src/components/auth/auth-entry-panel.tsx", "utf8")

  assert.match(landing, /description=""/)
  assert.match(landing, /footerCopy=""/)
  assert.match(panel, /description \?/)
  assert.match(panel, /footerCopy \?/)
  assert.doesNotMatch(landing, /callback returns|No public page exposes|private project\/member data/)
})

test("homepage browser-only visuals avoid hydration-unstable ids and shader CSS vars", async () => {
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")
  const dotField = await readFile("src/components/marketing/dot-field.tsx", "utf8")

  assert.match(dotField, /useId/)
  assert.doesNotMatch(dotField, /Math\.random/)
  assert.doesNotMatch(landing, /lineColor="var\(|baseColor="var\(/)
  assert.doesNotMatch(landing, /SpecularButton/)
})

test("interactive homepage map uses the Meridian React Flow graph without dashboard persistence", async () => {
  const demoMap = await readFile("src/components/marketing/interactive-automation-map.tsx", "utf8")
  const landing = await readFile("src/components/marketing/landing-page.tsx", "utf8")

  assert.match(demoMap, /"use client"/)
  assert.match(demoMap, /homepage-demo-map/)
  assert.match(demoMap, /ReactFlow/)
  assert.match(demoMap, /EndpointGraphNode/)
  assert.match(demoMap, /useNodesState/)
  assert.match(demoMap, /const \[isInteractive, setIsInteractive\] = useState\(false\)/)
  assert.match(demoMap, /Enable graph interaction/)
  assert.match(demoMap, /nodesDraggable=\{isInteractive\}/)
  assert.match(demoMap, /panOnDrag=\{isInteractive\}/)
  assert.match(demoMap, /zoomOnScroll=\{isInteractive\}/)
  assert.match(demoMap, /className=\{cn\("h-full", !isInteractive && "pointer-events-none"\)\}/)
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
