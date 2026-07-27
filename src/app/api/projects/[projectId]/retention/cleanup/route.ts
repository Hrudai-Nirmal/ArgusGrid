/**
 * Owner/admin manual retention cleanup for zero-idle deployments.
 */
import { NextResponse } from "next/server"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { createAuditLog } from "@/lib/audit-log"
import { getPrisma } from "@/lib/prisma"
import { cleanupExpiredOperationalData } from "@/lib/retention-cleanup"

export const dynamic = "force-dynamic"

/** Runs one operational retention cleanup pass after an explicit operator action. */
export async function POST(_: Request, context: { params: Promise<{ projectId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const result = await cleanupExpiredOperationalData()
  await createAuditLog(getPrisma(), {
    action: "retention.cleaned",
    entity: "retention",
    entityId: projectId,
    projectId,
    userId,
    metadata: result,
  })

  return NextResponse.json({ ok: true, result }, { status: 202 })
}
