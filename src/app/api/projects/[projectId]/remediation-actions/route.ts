/**
 * Project-scoped safe remediation action collection routes.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { createAuditLog } from "@/lib/audit-log"
import { getPrisma } from "@/lib/prisma"
import {
  createRemediationSigningSecret,
  encryptRemediationSigningSecret,
  serializeProjectRemediationAction,
} from "@/lib/remediation-actions"

const remediationActionEvents = ["alert.opened", "remediation.test"] as const
const remediationActionTypes = ["pause_service", "disable_intake", "scale_worker_down", "trigger_rollback", "custom_webhook"] as const

const remediationActionSchema = z.object({
  name: z.string().min(1).max(120),
  actionType: z.enum(remediationActionTypes).default("custom_webhook"),
  url: z.string().url().max(2048),
  enabled: z.boolean().default(true),
  mode: z.enum(["manual", "automatic"]).default("manual"),
  minimumSeverity: z.enum(["INFO", "WARNING", "CRITICAL"]).default("CRITICAL"),
  eventFilters: z.array(z.enum(remediationActionEvents)).default(["alert.opened", "remediation.test"]),
  cooldownMinutes: z.number().int().min(0).max(1440).default(30),
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

export async function GET(_: Request, context: { params: Promise<{ projectId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const prisma = getPrisma()
  const actions = await prisma.projectRemediationAction.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ actions: actions.map(serializeProjectRemediationAction) })
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const parsed = remediationActionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid remediation action payload.", details: parsed.error.flatten() }, { status: 400 })
  }
  if (!validateActionUrl(parsed.data.url)) {
    return NextResponse.json({ error: "Remediation action URL must use HTTPS." }, { status: 400 })
  }

  const prisma = getPrisma()
  const projectExists = await prisma.project.count({ where: { id: projectId } })
  if (!projectExists) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 })
  }

  const signingSecret = createRemediationSigningSecret()
  const action = await prisma.projectRemediationAction.create({
    data: {
      name: parsed.data.name,
      actionType: parsed.data.actionType,
      url: parsed.data.url,
      enabled: parsed.data.enabled,
      mode: parsed.data.mode,
      minimumSeverity: parsed.data.minimumSeverity,
      eventFilters: parsed.data.eventFilters,
      cooldownMinutes: parsed.data.cooldownMinutes,
      signingSecretEncrypted: encryptRemediationSigningSecret(signingSecret),
      projectId,
    },
  })
  await createAuditLog(prisma, {
    action: "remediation.created",
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

  return NextResponse.json(
    {
      action: serializeProjectRemediationAction(action),
      signingSecret,
    },
    { status: 201 }
  )
}
