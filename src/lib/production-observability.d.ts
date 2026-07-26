export type OperationalStatus = "ready" | "warning" | "blocked"

export type OperationalCard = {
  id: string
  title: string
  status: OperationalStatus
  value: string
  detail: string
  evidence: string[]
  runbook: string
}

export type ProductionObservabilityOverview = {
  status: OperationalStatus
  checkedAt: string
  summary: string
  cards: OperationalCard[]
}

export const OPERATIONAL_STATUSES: OperationalStatus[]

export function getOperationalStatus(statuses: OperationalStatus[]): OperationalStatus

export function buildProductionObservabilityOverview(input: {
  diagnostics: Record<string, unknown>
  usage: Record<string, unknown>
  now?: Date
}): ProductionObservabilityOverview
