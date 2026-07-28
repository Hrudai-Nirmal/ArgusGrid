export const MINIMUM_RAZORPAY_AMOUNT_PAISE: number

export type RazorpayOrderRequest = {
  amount: number
  currency: string
  receipt: string
}

export function normalizeRazorpayOrderRequest(value: unknown): RazorpayOrderRequest
export function verifyRazorpayPaymentSignature(input: {
  orderId: string
  paymentId: string
  signature: string
  secret: string
}): boolean
