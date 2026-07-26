/**
 * Owner/admin production observability overview for one Meridian project.
 */
import { NextResponse } from "next/server"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { getProductionObservabilitySnapshot } from "@/lib/production-observability"

export const dynamic = "force-dynamic"

/** Returns secret-safe operational status cards and usage pressure for project operators. */
export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const overview = await getProductionObservabilitySnapshot(projectId)
  return NextResponse.json({ overview })
}
