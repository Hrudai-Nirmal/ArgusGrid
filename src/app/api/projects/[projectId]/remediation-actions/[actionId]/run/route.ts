import { NextResponse } from "next/server"
import { z } from "zod"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { createAuditLog } from "@/lib/audit-log"
import { getPrisma } from "@/lib/prisma"
import { executeRemediationActionAttempt } from "@/lib/remediation-actions"

const manualRunSchema = z.object({
  alertId: z.string().min(1),
})

export async function POST(request: Request, context: { params: Promise<{ projectId: string; actionId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId, actionId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const parsed = manualRunSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Manual remediation requires an alertId.", details: parsed.error.flatten() }, { status: 400 })
  }

  const prisma = getPrisma()
  const [action, alert] = await Promise.all([
    prisma.projectRemediationAction.findFirst({ where: { id: actionId, projectId }, select: { id: true, name: true } }),
    prisma.alertEvent.findFirst({
      where: {
        id: parsed.data.alertId,
        OR: [{ node: { projectId } }, { rule: { projectId } }],
      },
      select: { id: true, title: true, severity: true },
    }),
  ])
  if (!action) {
    return NextResponse.json({ error: "Remediation action not found." }, { status: 404 })
  }
  if (!alert) {
    return NextResponse.json({ error: "Alert not found for this project." }, { status: 404 })
  }

  const result = await executeRemediationActionAttempt(prisma, {
    projectId,
    actionId,
    alertEventId: alert.id,
    eventType: "alert.opened",
  })
  await createAuditLog(prisma, {
    action: "remediation.ran",
    entity: "remediation-action",
    entityId: action.id,
    projectId,
    userId,
    metadata: { name: action.name, alertId: alert.id, title: alert.title, severity: alert.severity, status: result.status },
  })

  return NextResponse.json({ ok: result.ok, status: result.status, message: result.message, attemptId: result.attemptId ?? null }, { status: result.ok ? 200 : 502 })
}
