/**
 * Secret-safe project usage and guardrail metadata for Testing.
 */
import { NextResponse } from "next/server"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { getProjectUsageSnapshot } from "@/lib/project-usage"
import { parseBoundedQuery } from "@/lib/query-limits"

export const dynamic = "force-dynamic"

/** Returns bounded project usage counts plus safe retention/rate-limit policy metadata. */
export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN", "MEMBER", "VIEWER"])
  if (accessError) return accessError

  const bounds = parseBoundedQuery(new URL(request.url).searchParams, {
    defaultLimit: 1,
    maxLimit: 1,
    defaultWindow: "30d",
  })
  if (!bounds.ok) {
    return NextResponse.json({ error: bounds.error }, { status: 400 })
  }

  const usage = await getProjectUsageSnapshot(projectId, bounds.value)
  return NextResponse.json({
    usage,
    rateLimits: usage.rateLimits,
    retention: usage.retention,
  })
}
