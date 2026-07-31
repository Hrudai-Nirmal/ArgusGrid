/**
 * Project remediation action mutation routes.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { createAuditLog } from "@/lib/audit-log"
import { getPrisma } from "@/lib/prisma"
import { serializeProjectRemediationAction } from "@/lib/remediation-actions"

const remediationActionEvents = ["alert.opened", "remediation.test"] as const
const remediationActionTypes = ["pause_service", "disable_intake", "scale_worker_down", "trigger_rollback", "custom_webhook"] as const

const updateRemediationActionSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  actionType: z.enum(remediationActionTypes).optional(),
  url: z.string().url().max(2048).optional(),
  enabled: z.boolean().optional(),
  mode: z.enum(["manual", "automatic"]).optional(),
  minimumSeverity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  eventFilters: z.array(z.enum(remediationActionEvents)).optional(),
  cooldownMinutes: z.number().int().min(0).max(1440).optional(),
})

function validateActionUrl(url: string) {
  try {
    return new URL(url).protocol === "https:"
  } catch {
    return false
  }
}

function getActionHost(url: string) {
  try {
    return new URL(url).host
  } catch {
    return "configured endpoint"
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string; actionId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId, actionId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const parsed = updateRemediationActionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid remediation action payload.", details: parsed.error.flatten() }, { status: 400 })
  }
  if (parsed.data.url && !validateActionUrl(parsed.data.url)) {
    return NextResponse.json({ error: "Remediation action URL must use HTTPS." }, { status: 400 })
  }

  const prisma = getPrisma()
  const existing = await prisma.projectRemediationAction.findFirst({ where: { id: actionId, projectId } })
  if (!existing) {
    return NextResponse.json({ error: "Remediation action not found." }, { status: 404 })
  }

  const action = await prisma.projectRemediationAction.update({
    where: { id: actionId },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.actionType !== undefined ? { actionType: parsed.data.actionType } : {}),
      ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
      ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {}),
      ...(parsed.data.mode !== undefined ? { mode: parsed.data.mode } : {}),
      ...(parsed.data.minimumSeverity !== undefined ? { minimumSeverity: parsed.data.minimumSeverity } : {}),
      ...(parsed.data.eventFilters !== undefined ? { eventFilters: parsed.data.eventFilters } : {}),
      ...(parsed.data.cooldownMinutes !== undefined ? { cooldownMinutes: parsed.data.cooldownMinutes } : {}),
    },
  })
  await createAuditLog(prisma, {
    action: "remediation.updated",
    entity: "remediation-action",
    entityId: action.id,
    projectId,
    userId,
    metadata: {
      name: action.name,
      host: getActionHost(action.url),
      actionType: action.actionType,
      enabled: action.enabled,
      mode: action.mode,
      minimumSeverity: action.minimumSeverity,
      eventFilters: action.eventFilters,
      cooldownMinutes: action.cooldownMinutes,
    },
  })

  return NextResponse.json({ action: serializeProjectRemediationAction(action) })
}

export async function DELETE(_: Request, context: { params: Promise<{ projectId: string; actionId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId, actionId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const prisma = getPrisma()
  const action = await prisma.projectRemediationAction.findFirst({
    where: { id: actionId, projectId },
    select: { id: true, name: true, url: true },
  })
  if (!action) {
    return NextResponse.json({ error: "Remediation action not found." }, { status: 404 })
  }

  await prisma.projectRemediationAction.delete({ where: { id: action.id } })
  await createAuditLog(prisma, {
    action: "remediation.deleted",
    entity: "remediation-action",
    entityId: action.id,
    projectId,
    userId,
    metadata: { name: action.name, host: getActionHost(action.url) },
  })

  return NextResponse.json({ ok: true })
}
