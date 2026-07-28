/*
 * Client-safe Paddle Billing checkout configuration helpers.
 */

export const PADDLE_ENVIRONMENTS = ["sandbox", "production"]

/**
 * Normalizes a Paddle environment value for Paddle.js initialization.
 * @param {unknown} value
 */
export function normalizePaddleEnvironment(value) {
  const environment = String(value ?? "sandbox").trim().toLowerCase()
  return PADDLE_ENVIRONMENTS.includes(environment) ? environment : "sandbox"
}

/**
 * Returns whether the browser-safe Paddle checkout config can open an overlay.
 * @param {{ clientToken?: string | null, priceId?: string | null }} input
 */
export function isPaddleCheckoutReady(input) {
  return Boolean(input.clientToken?.trim() && input.priceId?.trim())
}

/**
 * Describes why a Paddle checkout action is unavailable.
 * @param {{ clientToken?: string | null, priceId?: string | null }} input
 */
export function getPaddleCheckoutUnavailableReason(input) {
  if (!input.clientToken?.trim()) return "Add NEXT_PUBLIC_PADDLE_CLIENT_TOKEN to enable Paddle checkout."
  if (!input.priceId?.trim()) return "Add the matching NEXT_PUBLIC_PADDLE_PRICE_* value for this plan or credit pack."
  return ""
}
