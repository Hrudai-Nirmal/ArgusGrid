export const PADDLE_ENVIRONMENTS: string[]
export function normalizePaddleEnvironment(value: unknown): "sandbox" | "production"
export function isPaddleCheckoutReady(input: { clientToken?: string | null; priceId?: string | null }): boolean
export function getPaddleCheckoutUnavailableReason(input: { clientToken?: string | null; priceId?: string | null }): string
