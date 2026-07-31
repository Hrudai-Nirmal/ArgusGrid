import { NextResponse } from "next/server"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { createAuditLog } from "@/lib/audit-log"
import { getPrisma } from "@/lib/prisma"
import { executeRemediationActionAttempt } from "@/lib/remediation-actions"

export async function POST(_: Request, context: { params: Promise<{ projectId: string; actionId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId, actionId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const prisma = getPrisma()
  const action = await prisma.projectRemediationAction.findFirst({
    where: { id: actionId, projectId },
    select: { id: true, name: true },
  })
  if (!action) {
    return NextResponse.json({ error: "Remediation action not found." }, { status: 404 })
  }

  const result = await executeRemediationActionAttempt(prisma, {
    projectId,
    actionId,
    eventType: "remediation.test",
    dryRun: true,
  })
  await createAuditLog(prisma, {
    action: "remediation.tested",
    entity: "remediation-action",
    entityId: action.id,
    projectId,
    userId,
    metadata: { name: action.name, status: result.status },
  })

  return NextResponse.json({ ok: result.ok, status: result.status, message: result.message, attemptId: result.attemptId ?? null }, { status: result.ok ? 200 : 502 })
}
