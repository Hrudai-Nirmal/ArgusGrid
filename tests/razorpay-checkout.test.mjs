import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  MINIMUM_RAZORPAY_AMOUNT_PAISE,
  normalizeRazorpayOrderRequest,
  verifyRazorpayPaymentSignature,
} from "../src/lib/razorpay-checkout.mjs"

test("Razorpay order request validation enforces paise minimum and safe currency", () => {
  assert.equal(MINIMUM_RAZORPAY_AMOUNT_PAISE, 100)
  assert.deepEqual(normalizeRazorpayOrderRequest({ amount: 100, currency: "inr", receipt: "solo-beta" }), {
    amount: 100,
    currency: "INR",
    receipt: "solo-beta",
  })
  assert.throws(() => normalizeRazorpayOrderRequest({ amount: 99, currency: "INR" }), /minimum/i)
  assert.throws(() => normalizeRazorpayOrderRequest({ amount: 100, currency: "US" }), /currency/i)
})

test("Razorpay signature verification uses order id, payment id, and server secret", () => {
  const secret = "test_secret"
  const orderId = "order_test_123"
  const paymentId = "pay_test_456"
  const signature = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex")

  assert.equal(
    verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature,
      secret,
    }),
    true
  )
  assert.equal(
    verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature: "bad_signature",
      secret,
    }),
    false
  )
})

test("Razorpay routes and Billing UI wire Standard Checkout without exposing key secret", async () => {
  const createRoute = await readFile("src/app/api/create-order/route.ts", "utf8")
  const verifyRoute = await readFile("src/app/api/verify-payment/route.ts", "utf8")
  const dashboard = await readFile("src/components/meridian/dashboard.tsx", "utf8")
  const envExample = await readFile(".env.example", "utf8")

  assert.match(createRoute, /new Razorpay/)
  assert.match(createRoute, /RAZORPAY_KEY_ID/)
  assert.match(createRoute, /RAZORPAY_KEY_SECRET/)
  assert.match(createRoute, /MINIMUM_RAZORPAY_AMOUNT_PAISE/)
  assert.match(verifyRoute, /verifyRazorpayPaymentSignature/)
  assert.match(verifyRoute, /Signature mismatch/)
  assert.match(dashboard, /checkout\.razorpay\.com\/v1\/checkout\.js/)
  assert.match(dashboard, /\/api\/create-order/)
  assert.match(dashboard, /\/api\/verify-payment/)
  assert.match(dashboard, /NEXT_PUBLIC_RAZORPAY_KEY_ID/)
  assert.match(dashboard, /payment\.failed/)
  assert.match(dashboard, /ondismiss/)
  assert.match(envExample, /RAZORPAY_KEY_ID=/)
  assert.match(envExample, /RAZORPAY_KEY_SECRET=/)
  assert.match(envExample, /NEXT_PUBLIC_RAZORPAY_KEY_ID=/)
  assert.doesNotMatch(dashboard, /RAZORPAY_KEY_SECRET/)
})
