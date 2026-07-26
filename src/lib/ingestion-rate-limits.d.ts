export const DEFAULT_INGESTION_RATE_LIMITS: {
  tokenPerMinute: number
  projectPerMinute: number
}
export function getIngestionRateLimitWindowStart(now?: Date | string): Date
export function getRateLimitRetryAfterSeconds(now?: Date | string): number
