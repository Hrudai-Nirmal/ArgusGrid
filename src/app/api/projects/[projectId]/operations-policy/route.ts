/**
 * Owner/admin project operations policy controls for cost, freshness, and reliability.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { getApiUserId, requireProjectRole } from "@/lib/api-session"
import { createAuditLog } from "@/lib/audit-log"
import { normalizeProjectOperationsPolicy } from "@/lib/billing-plans.mjs"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const operationsPolicySchema = z.object({
  operationsMode: z.enum(["cost_saver", "balanced", "priority"]),
  pollingCadenceMin: z.union([z.literal(1), z.literal(5), z.literal(15), z.literal(60), z.null()]),
  notificationReliability: z.enum(["standard", "priority"]),
  retentionDays: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal(180)]),
  spendProtection: z.enum(["stop_at_plan", "use_credits"]),
})

/** Saves the selected project's operations policy. */
export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { error, userId } = await getApiUserId()
  if (error) return error

  const { projectId } = await context.params
  const accessError = await requireProjectRole(userId, projectId, ["OWNER", "ADMIN"])
  if (accessError) return accessError

  const parsed = operationsPolicySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid operations policy.", details: parsed.error.flatten() }, { status: 400 })
  }

  const policy = normalizeProjectOperationsPolicy(parsed.data)
  const prisma = getPrisma()
  const saved = await prisma.projectOperationsPolicy.upsert({
    where: { projectId },
    update: policy,
    create: {
      ...policy,
      projectId,
    },
  })

  await createAuditLog(prisma, {
    action: "operations-policy.updated",
    entity: "operations-policy",
    entityId: saved.id,
    projectId,
    userId,
    metadata: policy,
  })

  return NextResponse.json({ ok: true, operationsPolicy: policy })
}
