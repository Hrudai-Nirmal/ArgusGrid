/**
 * Database-backed workflow-ingestion rate limits for serverless production.
 */
import "server-only"

import type { Prisma, PrismaClient } from "@prisma/client"

import {
  DEFAULT_INGESTION_RATE_LIMITS,
  getIngestionRateLimitWindowStart,
  getRateLimitRetryAfterSeconds,
} from "@/lib/ingestion-rate-limits.mjs"

type DatabaseClient = PrismaClient | Prisma.TransactionClient

type RateLimitScope = {
  scopeType: "token" | "project"
  scopeId: string
  projectId: string
  limit: number
}

export type IngestionRateLimitResult =
  | { allowed: true; windowStart: Date; retryAfterSeconds: number }
  | { allowed: false; scopeType: "token" | "project"; limit: number; count: number; windowStart: Date; retryAfterSeconds: number }

async function incrementRateLimitScope(prisma: DatabaseClient, scope: RateLimitScope, windowStart: Date) {
  return prisma.ingestionRateLimitBucket.upsert({
    where: {
      scopeType_scopeId_windowStart: {
        scopeType: scope.scopeType,
        scopeId: scope.scopeId,
        windowStart,
      },
    },
    update: { count: { increment: 1 } },
    create: {
      scopeType: scope.scopeType,
      scopeId: scope.scopeId,
      windowStart,
      count: 1,
      projectId: scope.projectId,
    },
    select: { count: true },
  })
}

/**
 * Increments token/project minute buckets and reports whether ingestion may continue.
 */
export async function enforceIngestionRateLimit(
  prisma: DatabaseClient,
  input: { projectId: string; tokenId: string; now?: Date }
): Promise<IngestionRateLimitResult> {
  const now = input.now ?? new Date()
  const windowStart = getIngestionRateLimitWindowStart(now)
  const retryAfterSeconds = getRateLimitRetryAfterSeconds(now)
  const scopes: RateLimitScope[] = [
    {
      scopeType: "token",
      scopeId: input.tokenId,
      projectId: input.projectId,
      limit: DEFAULT_INGESTION_RATE_LIMITS.tokenPerMinute,
    },
    {
      scopeType: "project",
      scopeId: input.projectId,
      projectId: input.projectId,
      limit: DEFAULT_INGESTION_RATE_LIMITS.projectPerMinute,
    },
  ]

  for (const scope of scopes) {
    const bucket = await incrementRateLimitScope(prisma, scope, windowStart)
    if (bucket.count > scope.limit) {
      return {
        allowed: false,
        scopeType: scope.scopeType,
        limit: scope.limit,
        count: bucket.count,
        windowStart,
        retryAfterSeconds,
      }
    }
  }

  return { allowed: true, windowStart, retryAfterSeconds }
}
