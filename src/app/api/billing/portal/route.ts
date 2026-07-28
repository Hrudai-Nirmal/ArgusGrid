/**
 * Authenticated Paddle customer portal session minting.
 */

import { NextResponse } from "next/server"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { getPaddleInstance } from "@/lib/paddle-server"
import { getPrisma } from "@/lib/prisma"
import { logServerError } from "@/lib/server-logging"

export const dynamic = "force-dynamic"

type PortalRequestBody = {
  projectId?: unknown
}

async function parseJsonBody(request: Request): Promise<PortalRequestBody> {
  try {
    const body = await request.json()
    return body && typeof body === "object" ? body as PortalRequestBody : {}
  } catch {
    return {}
  }
}

/** Creates a short-lived Paddle customer portal URL for owners and admins. */
export async function POST(request: Request) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const body = await parseJsonBody(request)
  const projectId = typeof body.projectId === "string" ? body.projectId : null
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 })
  }

  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const prisma = getPrisma()
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, organizationId: true } })
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 })
  }

  const subscription = await prisma.paddleSubscription.findFirst({
    where: {
      OR: [
        { projectId: project.id },
        { organizationId: project.organizationId },
      ],
      paddleCustomerId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
  })

  if (!subscription?.paddleCustomerId) {
    return NextResponse.json({ error: "No Paddle customer is available for this project yet." }, { status: 404 })
  }

  try {
    const paddle = getPaddleInstance()
    const session = await paddle.customerPortalSessions.create(subscription.paddleCustomerId, [subscription.paddleSubscriptionId])
    const portalUrl =
      session.urls.subscriptions[0]?.updateSubscriptionPaymentMethod ??
      session.urls.subscriptions[0]?.cancelSubscription ??
      session.urls.general.overview

    return NextResponse.json({ url: portalUrl })
  } catch (portalError) {
    const incident = logServerError("paddle.portal_session_failed", portalError, { component: "billing", projectId })
    return NextResponse.json({
      error: "Paddle customer portal is temporarily unavailable.",
      incidentId: incident.incidentId,
    }, { status: 502 })
  }
}
