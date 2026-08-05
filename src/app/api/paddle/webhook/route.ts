/**
 * Paddle Billing webhook endpoint with raw-body signature verification.
 */

import { NextRequest, NextResponse } from "next/server"

import { getPaddleInstance, getPaddleWebhookSecret } from "@/lib/paddle-server"
import { processPaddleWebhookEvent } from "@/lib/paddle-webhook"
import { sanitizePaddleFailure } from "@/lib/paddle-billing.mjs"
import { logServerError } from "@/lib/server-logging"

export const dynamic = "force-dynamic"

/** Receives verified Paddle webhook notifications and mirrors safe billing state. */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("paddle-signature")
  const rawBody = await request.text()
  const secret = getPaddleWebhookSecret()

  if (!signature || !rawBody) {
    return NextResponse.json({ error: "Missing Paddle webhook signature or body." }, { status: 400 })
  }
  if (!secret) {
    return NextResponse.json({ error: "Paddle webhook secret is not configured." }, { status: 503 })
  }

  try {
    const paddle = getPaddleInstance()
    const event = await paddle.webhooks.unmarshal(rawBody, secret, signature)
    const result = await processPaddleWebhookEvent(event)
    return NextResponse.json({ received: true, status: result.status })
  } catch (error) {
    const incident = logServerError("paddle.webhook_failed", error, { component: "billing" })
    return NextResponse.json({
      error: "Paddle webhook processing failed.",
      message: sanitizePaddleFailure(error),
      incidentId: incident.incidentId,
    }, { status: 500 })
  }
}
