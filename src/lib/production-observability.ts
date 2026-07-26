/**
 * Server-side production observability snapshot assembly for project operators.
 */
import "server-only"

import { getReadinessStatus } from "@/lib/health"
import { buildProductionObservabilityOverview } from "@/lib/production-observability.mjs"
import { getProjectUsageSnapshot, type ProjectUsageSnapshot } from "@/lib/project-usage"

export type ProductionObservabilitySnapshot = {
  status: "ready" | "warning" | "blocked"
  checkedAt: string
  summary: string
  cards: {
    id: string
    title: string
    status: "ready" | "warning" | "blocked"
    value: string
    detail: string
    evidence: string[]
    runbook: string
  }[]
  usage: ProjectUsageSnapshot
}

/**
 * Returns a secret-safe operations overview for one project.
 */
export async function getProductionObservabilitySnapshot(projectId: string): Promise<ProductionObservabilitySnapshot> {
  const now = new Date()
  const [diagnostics, usage] = await Promise.all([
    getReadinessStatus(),
    getProjectUsageSnapshot(projectId, {
      window: "24h",
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      end: null,
    }),
  ])
  const overview = buildProductionObservabilityOverview({ diagnostics, usage, now }) as Omit<ProductionObservabilitySnapshot, "usage">

  return {
    ...overview,
    usage,
  }
}
