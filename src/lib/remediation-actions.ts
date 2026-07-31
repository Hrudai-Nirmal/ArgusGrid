/**
 * Secret-safe outbound remediation action delivery for alert incidents.
 */
import "server-only"

import { randomBytes, randomUUID } from "node:crypto"
import type { AlertSeverity, PrismaClient, ProjectRemediationAction } from "@prisma/client"

import {
  buildRemediationSignature,
  normalizeRemediationActionMode,
  normalizeRemediationActionType,
  normalizeRemediationEvents,
  shouldSkipRemediationForCooldown,
} from "@/lib/remediation-actions.mjs"
import { decryptSecret, encryptSecret } from "@/lib/crypto"
import { canUseExternalSideEffects } from "@/lib/runtime-environment"

export type RemediationActionEventType = "alert.opened" | "remediation.test"
export type RemediationActionType = "pause_service" | "disable_intake" | "scale_worker_down" | "trigger_rollback" | "custom_webhook"
export type RemediationActionMode = "manual" | "automatic"

type ExecuteRemediationActionInput = {
  projectId: string
  actionId: string
  eventType: RemediationActionEventType
  alertEventId?: string | null
  dryRun?: boolean
}

const severityRank: Record<AlertSeverity, number> = { INFO: 0, WARNING: 1, CRITICAL: 2 }

function sanitizeFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "Remediation action failed."
  return message.replace(/https?:\/\/\S+/gi, "[endpoint]").slice(0, 240)
}

function getRemediationRecipient(action: Pick<ProjectRemediationAction, "name" | "url">) {
  try {
    return `${action.name} (${new URL(action.url).host})`
  } catch {
    return action.name
  }
}

function getHost(url: string) {
  try {
    return new URL(url).host
  } catch {
    return "configured endpoint"
  }
}

function severityAllows(minimumSeverity: AlertSeverity, alertSeverity: AlertSeverity) {
  return severityRank[alertSeverity] >= severityRank[minimumSeverity]
}

function serializeRemediationAction(action: ProjectRemediationAction) {
  return {
    id: action.id,
    name: action.name,
    actionType: normalizeRemediationActionType(action.actionType) as RemediationActionType,
    recipient: getRemediationRecipient(action),
    host: getHost(action.url),
    enabled: action.enabled,
    mode: normalizeRemediationActionMode(action.mode) as RemediationActionMode,
    minimumSeverity: action.minimumSeverity,
    eventFilters: normalizeRemediationEvents(action.eventFilters) as RemediationActionEventType[],
    cooldownMinutes: action.cooldownMinutes,
    lastTriggeredAt: action.lastTriggeredAt?.toISOString() ?? null,
    createdAt: action.createdAt.toISOString(),
    updatedAt: action.updatedAt.toISOString(),
  }
}

export function createRemediationSigningSecret() {
  return randomBytes(32).toString("hex")
}

export function encryptRemediationSigningSecret(secret: string) {
  return encryptSecret(secret)
}

export function serializeProjectRemediationAction(action: ProjectRemediationAction) {
  return serializeRemediationAction(action)
}

async function buildPayload(prisma: PrismaClient, input: ExecuteRemediationActionInput, action: ProjectRemediationAction, deliveryId: string) {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { id: true, name: true, slug: true },
  })
  if (!project) return null

  if (input.eventType === "remediation.test") {
    const now = new Date().toISOString()
    return {
      event: "remediation.test" as const,
      deliveryId,
      createdAt: now,
      dryRun: Boolean(input.dryRun),
      project,
      action: {
        id: action.id,
        name: action.name,
        type: normalizeRemediationActionType(action.actionType),
        mode: normalizeRemediationActionMode(action.mode),
      },
      alert: null,
      meridian: { product: "Meridian", version: "remediation-v1" },
    }
  }

  if (!input.alertEventId) return null
  const alert = await prisma.alertEvent.findUnique({
    where: { id: input.alertEventId },
    include: {
      node: { select: { id: true, label: true } },
      rule: { select: { id: true, name: true } },
    },
  })
  if (!alert) return null

  return {
    event: input.eventType,
    deliveryId,
    createdAt: new Date().toISOString(),
    dryRun: Boolean(input.dryRun),
    project,
    action: {
      id: action.id,
      name: action.name,
      type: normalizeRemediationActionType(action.actionType),
      mode: normalizeRemediationActionMode(action.mode),
    },
    node: alert.node ? { id: alert.node.id, label: alert.node.label } : null,
    rule: alert.rule ? { id: alert.rule.id, name: alert.rule.name } : null,
    alert: {
      id: alert.id,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      status: alert.resolvedAt ? "resolved" : "open",
      createdAt: alert.createdAt.toISOString(),
      lastSeenAt: alert.lastSeenAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    },
    meridian: { product: "Meridian", version: "remediation-v1" },
  }
}

async function recordAttempt(
  prisma: PrismaClient,
  input: ExecuteRemediationActionInput,
  action: ProjectRemediationAction,
  data: { status: "SENT" | "FAILED" | "SKIPPED"; deliveryId: string; responseStatus?: number | null; failureReason?: string | null }
) {
  const now = new Date()
  const attempt = await prisma.remediationActionAttempt.create({
    data: {
      actionId: action.id,
      projectId: input.projectId,
      alertEventId: input.alertEventId ?? null,
      eventType: input.eventType,
      deliveryId: data.deliveryId,
      status: data.status,
      responseStatus: data.responseStatus ?? null,
      failureReason: data.failureReason ?? null,
      attemptedAt: now,
      sentAt: data.status === "SENT" ? now : null,
    },
  })
  if (data.status === "SENT" && input.eventType === "alert.opened") {
    await prisma.projectRemediationAction.update({
      where: { id: action.id },
      data: { lastTriggeredAt: now },
      select: { id: true },
    })
  }
  return attempt
}

async function postSignedRemediation(action: ProjectRemediationAction, eventType: RemediationActionEventType, deliveryId: string, body: string) {
  const timestamp = new Date().toISOString()
  const signature = buildRemediationSignature({
    timestamp,
    body,
    secret: decryptSecret(action.signingSecretEncrypted),
  })

  return fetch(action.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Meridian-Remediation/1.0",
      "X-Meridian-Action": eventType,
      "X-Meridian-Delivery": deliveryId,
      "X-Meridian-Timestamp": timestamp,
      "X-Meridian-Signature": signature,
    },
    body,
  })
}

/** Performs one remediation POST attempt and records safe operator evidence. */
export async function executeRemediationActionAttempt(prisma: PrismaClient, input: ExecuteRemediationActionInput) {
  const action = await prisma.projectRemediationAction.findFirst({
    where: { id: input.actionId, projectId: input.projectId },
  })
  if (!action) return { ok: false, status: "MISSING" as const, message: "Remediation action not found." }

  const deliveryId = `remediation_${randomUUID()}`
  if (!action.enabled) {
    await recordAttempt(prisma, input, action, { status: "SKIPPED", deliveryId, failureReason: "Remediation action is disabled." })
    return { ok: true, status: "SKIPPED" as const, message: "Action skipped because it is disabled." }
  }
  if (!normalizeRemediationEvents(action.eventFilters).includes(input.eventType)) {
    await recordAttempt(prisma, input, action, { status: "SKIPPED", deliveryId, failureReason: "Action does not accept this event." })
    return { ok: true, status: "SKIPPED" as const, message: "Action skipped because the event is not enabled." }
  }
  if (input.eventType === "alert.opened" && shouldSkipRemediationForCooldown({ lastTriggeredAt: action.lastTriggeredAt, cooldownMinutes: action.cooldownMinutes })) {
    await recordAttempt(prisma, input, action, { status: "SKIPPED", deliveryId, failureReason: "Action cooldown is still active." })
    return { ok: true, status: "SKIPPED" as const, message: "Action skipped because cooldown is active." }
  }
  if (!canUseExternalSideEffects()) {
    await recordAttempt(prisma, input, action, { status: "SKIPPED", deliveryId, failureReason: "External remediation is disabled in this runtime." })
    return { ok: true, status: "SKIPPED" as const, message: "Action skipped by runtime safety policy." }
  }

  const payload = await buildPayload(prisma, input, action, deliveryId)
  if (!payload) {
    await recordAttempt(prisma, input, action, { status: "SKIPPED", deliveryId, failureReason: "Remediation source data is unavailable." })
    return { ok: true, status: "SKIPPED" as const, message: "Action skipped because source data is unavailable." }
  }
  const body = JSON.stringify(payload)

  try {
    const response = await postSignedRemediation(action, input.eventType, deliveryId, body)
    if (!response.ok) throw new Error(`Remediation endpoint returned HTTP ${response.status}.`)
    const attempt = await recordAttempt(prisma, input, action, { status: "SENT", deliveryId, responseStatus: response.status })
    return { ok: true, status: "SENT" as const, attemptId: attempt.id, message: "Remediation action sent." }
  } catch (error) {
    const failureReason = sanitizeFailure(error)
    const attempt = await recordAttempt(prisma, input, action, { status: "FAILED", deliveryId, failureReason })
    return { ok: false, status: "FAILED" as const, attemptId: attempt.id, message: failureReason }
  }
}

/** Executes matching automatic alert-opened remediation actions after alert commit. */
export async function executeAutomaticRemediationActions(prisma: PrismaClient, alertEventId: string) {
  const alert = await prisma.alertEvent.findUnique({
    where: { id: alertEventId },
    include: {
      node: { select: { projectId: true } },
      rule: { select: { projectId: true } },
    },
  })
  const projectId = alert?.node?.projectId ?? alert?.rule?.projectId
  if (!alert || !projectId) return { attempted: 0 }

  const actions = await prisma.projectRemediationAction.findMany({
    where: { projectId, enabled: true, mode: "automatic" },
  })
  let attempted = 0
  for (const action of actions) {
    if (!severityAllows(action.minimumSeverity, alert.severity)) continue
    if (!normalizeRemediationEvents(action.eventFilters).includes("alert.opened")) continue
    attempted += 1
    await executeRemediationActionAttempt(prisma, {
      projectId,
      actionId: action.id,
      alertEventId,
      eventType: "alert.opened",
    })
  }
  return { attempted }
}
