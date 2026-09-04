/**
 * Fixed self-hosted worker executor route for durable notification jobs.
 */
import { timingSafeEqual } from "node:crypto"

import { executeNotificationJobAttempt } from "@/lib/notification-jobs"
import { logServerError } from "@/lib/server-logging"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

type NotificationExecutorPayload = {
  notificationJobId: string
  generation: number
}

const MAX_NOTIFICATION_JOB_ID_LENGTH = 128

class NotificationExecutorValidationError extends Error {}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? ""
  const [scheme, token] = authorization.split(" ")
  return scheme === "Bearer" && token ? token : null
}

function isAuthorized(request: Request, sharedSecret: string) {
  const token = getBearerToken(request)
  if (!token) return false

  const tokenBuffer = Buffer.from(token)
  const secretBuffer = Buffer.from(sharedSecret)

  return tokenBuffer.length === secretBuffer.length && timingSafeEqual(tokenBuffer, secretBuffer)
}

async function parseNotificationExecutorPayload(request: Request): Promise<NotificationExecutorPayload> {
  const payload = await request.json().catch(() => null)
  const candidate = payload && typeof payload === "object" ? payload as { notificationJobId?: unknown; generation?: unknown } : null
  const notificationJobId = typeof candidate?.notificationJobId === "string"
    ? candidate.notificationJobId.trim()
    : ""
  const generation = Number(candidate?.generation)

  if (!notificationJobId || notificationJobId.length > MAX_NOTIFICATION_JOB_ID_LENGTH) {
    throw new NotificationExecutorValidationError("notificationJobId is required")
  }

  if (!Number.isInteger(generation) || generation < 0) {
    throw new NotificationExecutorValidationError("generation must be a non-negative integer")
  }

  return { notificationJobId, generation }
}

/**
 * Executes one queued Meridian notification job for the authenticated self-hosted worker.
 */
export async function POST(request: Request) {
  const sharedSecret = process.env.MERIDIAN_SELF_HOSTED_WORKER_SECRET

  if (!sharedSecret) {
    return Response.json({ ok: false, error: "self_hosted_worker_secret_missing" }, { status: 503 })
  }

  if (!isAuthorized(request, sharedSecret)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  try {
    const payload = await parseNotificationExecutorPayload(request)
    const result = await executeNotificationJobAttempt(payload.notificationJobId, payload.generation)

    return Response.json({ ok: true, result })
  } catch (error) {
    if (error instanceof NotificationExecutorValidationError) {
      return Response.json({ ok: false, error: "invalid_notification_job_payload" }, { status: 400 })
    }

    logServerError("runtime.notification_job_execute_failed", error, { component: "self_hosted_worker" })

    return Response.json({ ok: false, error: "notification_execution_failed" }, { status: 502 })
  }
}
