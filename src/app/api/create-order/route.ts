/**
 * Creates Razorpay Standard Checkout orders for authenticated Meridian billing actions.
 */
import { NextResponse } from "next/server"
import Razorpay from "razorpay"

import { getApiUserId } from "@/lib/api-session"
import { MINIMUM_RAZORPAY_AMOUNT_PAISE, normalizeRazorpayOrderRequest } from "@/lib/razorpay-checkout.mjs"

export const dynamic = "force-dynamic"

/** Creates a Razorpay order using server-only credentials. */
export async function POST(request: Request) {
  const { error } = await getApiUserId()
  if (error) return error

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Razorpay credentials are not configured." }, { status: 401 })
  }

  let orderInput
  try {
    orderInput = normalizeRazorpayOrderRequest(await request.json())
  } catch (validationError) {
    const message = validationError instanceof Error ? validationError.message : "Invalid order request."
    return NextResponse.json({ error: message, minimumAmountPaise: MINIMUM_RAZORPAY_AMOUNT_PAISE }, { status: 400 })
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const order = await razorpay.orders.create({
      amount: orderInput.amount,
      currency: orderInput.currency,
      receipt: orderInput.receipt,
    })

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (orderError) {
    const statusCode = typeof orderError === "object" && orderError && "statusCode" in orderError ? Number(orderError.statusCode) : 500
    return NextResponse.json(
      { error: statusCode === 401 ? "Razorpay authentication failed." : "Razorpay order creation failed." },
      { status: statusCode === 401 ? 401 : 500 }
    )
  }
}
