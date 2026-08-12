import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

test("Meridian logo asset is available as a safe static SVG", async () => {
  const logo = await readFile("public/meridian-logo.svg", "utf8")

  assert.match(logo, /<svg[^>]+viewBox="0 0 500 500"/)
  assert.match(logo, /Outer Meridian Ring/)
  assert.doesNotMatch(logo, /<script|onload=|onclick=|href=["']https?:|foreignObject/i)
})

test("signed-in app, auth panel, and landing page use the shared Meridian logo", async () => {
  const logoComponent = await readFile("src/components/brand/meridian-logo.tsx", "utf8")
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")
  const landingPage = await readFile("src/components/marketing/landing-page.tsx", "utf8")
  const authPanel = await readFile("src/components/auth/auth-entry-panel.tsx", "utf8")

  assert.match(logoComponent, /src="\/meridian-logo\.svg"/)
  assert.match(logoComponent, /alt="Meridian logo"/)
  assert.match(dashboard, /<MeridianLogo/)
  assert.match(landingPage, /<MeridianLogo/)
  assert.match(authPanel, /<MeridianLogo/)
  assert.doesNotMatch(dashboard + landingPage + authPanel, /<Network className="size-[56]"/)
})
