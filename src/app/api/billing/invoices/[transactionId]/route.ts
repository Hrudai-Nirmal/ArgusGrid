/**
 * Authenticated billing invoice download redirect.
 */

import { NextResponse } from "next/server"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { getPaddleRestConfig } from "@/lib/paddle-server"
import { getPrisma } from "@/lib/prisma"
import { logServerError } from "@/lib/server-logging"

export const dynamic = "force-dynamic"

function invoiceUrlFromResponse(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null
  const data = "data" in payload ? (payload as { data?: unknown }).data : payload
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const url = (data as { url?: unknown }).url
  return typeof url === "string" && url.startsWith("https://") ? url : null
}

/**
 * Redirects owners/admins/members/viewers to a short-lived invoice PDF URL for their own transaction.
 */
export async function GET(request: Request, context: { params: Promise<{ transactionId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const projectId = new URL(request.url).searchParams.get("projectId")
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 })
  }

  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN", "MEMBER", "VIEWER"])
  if (accessError) return accessError

  const { transactionId } = await context.params
  const prisma = getPrisma()
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, organizationId: true } })
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 })
  }

  const transaction = await prisma.paddleTransaction.findFirst({
    where: {
      id: transactionId,
      OR: [
        { projectId: project.id },
        { organizationId: project.organizationId },
      ],
    },
    select: { paddleTransactionId: true },
  })
  if (!transaction) {
    return NextResponse.json({ error: "Billing transaction not found." }, { status: 404 })
  }

  try {
    const config = getPaddleRestConfig()
    const response = await fetch(`${config.baseUrl}/transactions/${encodeURIComponent(transaction.paddleTransactionId)}/invoice?disposition=attachment`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    })
    const payload = await response.json().catch(() => null)
    const url = invoiceUrlFromResponse(payload)
    if (!response.ok || !url) {
      return NextResponse.json({ error: "Invoice is not available for this transaction yet." }, { status: response.status === 404 ? 404 : 502 })
    }

    return NextResponse.redirect(url)
  } catch (invoiceError) {
    const incident = logServerError("billing.invoice_download_failed", invoiceError, { component: "billing", projectId })
    return NextResponse.json({
      error: "Invoice download is temporarily unavailable.",
      incidentId: incident.incidentId,
    }, { status: 502 })
  }
}
