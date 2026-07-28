/*
 * Secret-safe Paddle billing helpers shared by tests, routes, and UI serialization.
 */

const SECRET_PATTERN = /pdl_(?:live|sdbx)_apikey_[A-Za-z0-9_]+|pdl_ntfset_[A-Za-z0-9_]+|https?:\/\/\S+/gi

/**
 * Returns the Paddle environment Meridian should use server-side.
 */
export function normalizePaddleBillingEnvironment(value) {
  return value === "production" || value === "live" ? "production" : "sandbox"
}

/**
 * Builds a client-safe map from Paddle price IDs to Meridian billing keys.
 */
export function getMeridianBillingKeyFromPriceId(priceId, config = {}) {
  const entries = [
    ["solo_beta", config.soloBetaPriceId],
    ["agency_beta", config.agencyBetaPriceId],
    ["enterprise_pilot", config.enterprisePilotPriceId],
    ["credits_500", config.credits500PriceId],
    ["credits_2000", config.credits2000PriceId],
    ["credits_10000", config.credits10000PriceId],
  ]

  return entries.find(([, configuredPriceId]) => configuredPriceId && configuredPriceId === priceId)?.[0] ?? null
}

/**
 * Returns the current server-configured Paddle price mapping.
 */
export function getPaddlePriceIdConfig(env = process.env) {
  return {
    soloBetaPriceId: env.NEXT_PUBLIC_PADDLE_PRICE_SOLO_BETA,
    agencyBetaPriceId: env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY_BETA,
    enterprisePilotPriceId: env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_PILOT,
    credits500PriceId: env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_500,
    credits2000PriceId: env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_2000,
    credits10000PriceId: env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_10000,
  }
}

/**
 * Parses a Meridian checkout id stored in Paddle custom data.
 */
export function getMeridianBillingKeyFromCheckoutId(checkoutId) {
  if (checkoutId === "plan-solo_beta") return "solo_beta"
  if (checkoutId === "plan-agency_beta") return "agency_beta"
  if (checkoutId === "plan-enterprise_pilot") return "enterprise_pilot"
  if (checkoutId === "credits-500") return "credits_500"
  if (checkoutId === "credits-2000") return "credits_2000"
  if (checkoutId === "credits-10000") return "credits_10000"
  return null
}

/**
 * Converts a billing key into a purchased credit amount when relevant.
 */
export function getCreditAmountFromBillingKey(billingKey) {
  if (billingKey === "credits_500") return 500
  if (billingKey === "credits_2000") return 2000
  if (billingKey === "credits_10000") return 10000
  return null
}

/**
 * Returns a customer-facing access summary for a mirrored subscription row.
 */
export function getPlanAccessState(subscription) {
  if (!subscription) {
    return {
      hasAccess: false,
      label: "Free Sandbox",
      tone: "muted",
    }
  }

  const status = String(subscription.status ?? "").toLowerCase()
  const scheduledAction = subscription.scheduledChangeAction ?? null
  const hasAccess = status === "active" || status === "trialing" || status === "past_due"
  const baseLabel =
    status === "trialing" ? "Trialing" :
    status === "active" ? "Active" :
    status === "past_due" ? "Past due" :
    status === "paused" ? "Paused" :
    status === "canceled" ? "Canceled" :
    status || "Unknown"

  return {
    hasAccess,
    label: scheduledAction ? `${baseLabel}, ${String(scheduledAction).replace("_", " ")} scheduled` : baseLabel,
    tone: hasAccess ? (status === "past_due" ? "warn" : "good") : "muted",
  }
}

/**
 * Removes known secret shapes and bounds operational failure copy.
 */
export function sanitizePaddleFailure(value) {
  const message = String(value ?? "Paddle billing operation failed.")
    .replace(SECRET_PATTERN, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()

  return message.slice(0, 240)
}
