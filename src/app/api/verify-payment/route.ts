/**
 * Verifies Razorpay Standard Checkout success callbacks using server-only key secret.
 */
import { NextResponse } from "next/server"

import { getApiUserId } from "@/lib/api-session"
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay-checkout.mjs"

export const dynamic = "force-dynamic"

/** Verifies the Razorpay payment signature before any billing fulfilment is trusted. */
export async function POST(request: Request) {
  const { error } = await getApiUserId()
  if (error) return error

  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    return NextResponse.json({ error: "Razorpay credentials are not configured." }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : ""
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : ""
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : ""

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing Razorpay payment verification fields." }, { status: 400 })
  }

  const verified = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature,
    secret: keySecret,
  })

  if (!verified) {
    return NextResponse.json({ error: "Signature mismatch. Payment was not verified." }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    verified: true,
    paymentId,
    orderId,
  })
}
