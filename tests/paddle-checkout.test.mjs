import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  getPaddleCheckoutUnavailableReason,
  isPaddleCheckoutReady,
  normalizePaddleEnvironment,
} from "../src/lib/paddle-checkout.mjs"

test("Paddle checkout helpers normalize environment and readiness safely", () => {
  assert.equal(normalizePaddleEnvironment("production"), "production")
  assert.equal(normalizePaddleEnvironment("sandbox"), "sandbox")
  assert.equal(normalizePaddleEnvironment("weird"), "sandbox")
  assert.equal(isPaddleCheckoutReady({ clientToken: "test_client_token", priceId: "pri_123" }), true)
  assert.equal(isPaddleCheckoutReady({ clientToken: "", priceId: "pri_123" }), false)
  assert.match(getPaddleCheckoutUnavailableReason({ clientToken: "", priceId: "pri_123" }), /NEXT_PUBLIC_PADDLE_CLIENT_TOKEN/)
  assert.match(getPaddleCheckoutUnavailableReason({ clientToken: "test_client_token", priceId: "" }), /NEXT_PUBLIC_PADDLE_PRICE_/)
})

test("Billing UI wires secure checkout without exposing server secrets", async () => {
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")
  const envExample = await readFile(".env.example", "utf8")

  assert.match(dashboard, /cdn\.paddle\.com\/paddle\/v2\/paddle\.js/)
  assert.match(dashboard, /Secure billing checkout/)
  assert.match(dashboard, /startPaddleCheckout/)
  assert.match(dashboard, /NEXT_PUBLIC_PADDLE_CLIENT_TOKEN/)
  assert.match(dashboard, /NEXT_PUBLIC_PADDLE_PRICE_SOLO_BETA/)
  assert.match(dashboard, /NEXT_PUBLIC_PADDLE_PRICE_CREDITS_500/)
  assert.match(dashboard, /checkout\.completed/)
  assert.match(dashboard, /Configure price/)
  assert.doesNotMatch(dashboard, /PADDLE_API_KEY/)
  assert.match(envExample, /NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=/)
  assert.match(envExample, /NEXT_PUBLIC_PADDLE_ENVIRONMENT=/)
  assert.match(envExample, /NEXT_PUBLIC_PADDLE_PRICE_AGENCY_BETA=/)
})
