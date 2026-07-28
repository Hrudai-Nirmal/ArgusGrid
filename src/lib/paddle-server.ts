/**
 * Server-only Paddle SDK construction and environment helpers.
 */

import "server-only"

import { Environment, LogLevel, Paddle, type PaddleOptions } from "@paddle/paddle-node-sdk"

import { normalizePaddleBillingEnvironment } from "@/lib/paddle-billing.mjs"

/**
 * Returns the configured Paddle environment without exposing key values.
 */
export function getPaddleServerEnvironment() {
  return normalizePaddleBillingEnvironment(process.env.PADDLE_ENVIRONMENT ?? process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT)
}

/**
 * Returns whether enough server-side Paddle config exists for API calls.
 */
export function hasPaddleServerConfig() {
  return Boolean(getPaddleApiKey())
}

function getPaddleApiKey() {
  const environment = getPaddleServerEnvironment()
  return process.env.PADDLE_API_KEY ?? (environment === "production" ? process.env.PADDLE_LIVE_API_KEY : process.env.PADDLE_SANDBOX_API_KEY)
}

/**
 * Creates a Paddle SDK instance using server-only credentials.
 */
export function getPaddleInstance() {
  const apiKey = getPaddleApiKey()
  if (!apiKey) {
    throw new Error("Paddle API key is not configured.")
  }

  const environment = getPaddleServerEnvironment()
  const options: PaddleOptions = {
    environment: environment === "production" ? Environment.production : Environment.sandbox,
    logLevel: LogLevel.error,
  }

  return new Paddle(apiKey, options)
}
