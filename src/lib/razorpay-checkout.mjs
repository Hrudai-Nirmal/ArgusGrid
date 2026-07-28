/*
 * Server-safe Razorpay Standard Checkout helpers.
 */
import { createHmac, timingSafeEqual } from "node:crypto"

export const MINIMUM_RAZORPAY_AMOUNT_PAISE = 100

/**
 * Validates and normalizes a Razorpay order request before it reaches the SDK.
 * @param {unknown} value
 */
export function normalizeRazorpayOrderRequest(value) {
  const source = value && typeof value === "object" ? /** @type {Record<string, unknown>} */ (value) : {}
  const amount = Number(source.amount)
  const currency = String(source.currency ?? "INR").trim().toUpperCase()
  const receipt = String(source.receipt ?? `meridian-${Date.now()}`).trim().slice(0, 40)

  if (!Number.isSafeInteger(amount) || amount < MINIMUM_RAZORPAY_AMOUNT_PAISE) {
    throw new Error(`Amount is below the minimum of ${MINIMUM_RAZORPAY_AMOUNT_PAISE} paise.`)
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Currency must be a 3-letter ISO code.")
  }
  if (!receipt) {
    throw new Error("Receipt is required.")
  }

  return { amount, currency, receipt }
}

/**
 * Performs Razorpay's required HMAC-SHA256 checkout signature verification.
 * @param {{
 *   orderId: string,
 *   paymentId: string,
 *   signature: string,
 *   secret: string,
 * }} input
 */
export function verifyRazorpayPaymentSignature(input) {
  if (!input.orderId || !input.paymentId || !input.signature || !input.secret) return false

  const generated = createHmac("sha256", input.secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex")

  const generatedBuffer = Buffer.from(generated, "hex")
  const receivedBuffer = Buffer.from(input.signature, "hex")
  if (generatedBuffer.length !== receivedBuffer.length) return false

  return timingSafeEqual(generatedBuffer, receivedBuffer)
}
