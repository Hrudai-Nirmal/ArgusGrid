export type MeridianPlanId = "free_sandbox" | "solo_beta" | "agency_beta" | "enterprise_pilot"
export type ProjectOperationsMode = "cost_saver" | "balanced" | "priority"
export type NotificationReliability = "standard" | "priority"
export type SpendProtection = "stop_at_plan" | "use_credits"

export type MeridianPricingPlan = {
  id: MeridianPlanId
  name: string
  monthlyUsd: number
  monthlyInr: number
  includedCredits: number
  projectLimit: number | null
  nodeLimit: number | null
  workflowRunLimit: number
  metricSampleLimit: number
  notificationJobLimit: number
  reportShareLimit: number
  retentionDays: number
  summary: string
}

export type MeridianCreditPack = {
  credits: number
  usd: number
  inr: number
}

export type ProjectOperationsPolicy = {
  operationsMode: ProjectOperationsMode
  pollingCadenceMin: number | null
  notificationReliability: NotificationReliability
  retentionDays: 7 | 30 | 90 | 180
  spendProtection: SpendProtection
}

export const MERIDIAN_PRICING_PLANS: MeridianPricingPlan[]
export const MERIDIAN_CREDIT_PACKS: MeridianCreditPack[]
export const DEFAULT_PROJECT_OPERATIONS_POLICY: ProjectOperationsPolicy
export function normalizeProjectOperationsPolicy(value?: Partial<ProjectOperationsPolicy> | Record<string, unknown> | null): ProjectOperationsPolicy
export function getOperationsPolicyCopy(policy?: Partial<ProjectOperationsPolicy> | Record<string, unknown>): {
  mode: string
  cadence: string
  reliability: string
  retention: string
  spend: string
}
