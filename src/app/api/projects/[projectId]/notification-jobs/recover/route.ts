/**
 * Owner/admin manual recovery for queued or stale notification jobs.
 */
import { NextResponse } from "next/server"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { createAuditLog } from "@/lib/audit-log"
import { recoverNotificationJobs } from "@/lib/notification-jobs"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/** Runs one bounded project-scoped notification outbox recovery pass. */
export async function POST(_: Request, context: { params: Promise<{ projectId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const result = await recoverNotificationJobs({ projectId })
  await createAuditLog(getPrisma(), {
    action: "notification-jobs.recovered",
    entity: "notification-job",
    entityId: projectId,
    projectId,
    userId,
    metadata: { recovered: result.recovered },
  })

  return NextResponse.json({ ok: true, result }, { status: 202 })
}
