/**
 * Durable workflow-ingestion rate limit constants and minute-window helpers.
 */

export const DEFAULT_INGESTION_RATE_LIMITS = {
  tokenPerMinute: 60,
  projectPerMinute: 300,
}

/**
 * Floors a timestamp to the current minute for fixed-window rate limiting.
 */
export function getIngestionRateLimitWindowStart(now = new Date()) {
  const timestamp = new Date(now).getTime()
  return new Date(Math.floor(timestamp / 60_000) * 60_000)
}

/**
 * Returns the number of seconds until the next ingestion rate-limit bucket.
 */
export function getRateLimitRetryAfterSeconds(now = new Date()) {
  const timestamp = new Date(now).getTime()
  return Math.max(1, Math.ceil((60_000 - (timestamp % 60_000)) / 1000))
}
