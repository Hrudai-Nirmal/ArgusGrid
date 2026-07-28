export type PaddlePriceIdConfig = {
  soloBetaPriceId?: string | null
  agencyBetaPriceId?: string | null
  enterprisePilotPriceId?: string | null
  credits500PriceId?: string | null
  credits2000PriceId?: string | null
  credits10000PriceId?: string | null
}

export function normalizePaddleBillingEnvironment(value: unknown): "sandbox" | "production"
export function getMeridianBillingKeyFromPriceId(priceId: string | null | undefined, config?: PaddlePriceIdConfig): string | null
export function getPaddlePriceIdConfig(env?: Record<string, string | undefined>): PaddlePriceIdConfig
export function getMeridianBillingKeyFromCheckoutId(checkoutId: string | null | undefined): string | null
export function getCreditAmountFromBillingKey(billingKey: string | null | undefined): number | null
export function getPlanAccessState(subscription?: { status?: string | null; scheduledChangeAction?: string | null } | null): {
  hasAccess: boolean
  label: string
  tone: "good" | "warn" | "muted"
}
export function sanitizePaddleFailure(value: unknown): string
