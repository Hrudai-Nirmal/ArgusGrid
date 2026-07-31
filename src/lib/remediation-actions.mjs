import { createHmac } from "node:crypto"

export const REMEDIATION_ACTION_TYPES = [
  "pause_service",
  "disable_intake",
  "scale_worker_down",
  "trigger_rollback",
  "custom_webhook",
]

export const REMEDIATION_ACTION_MODES = ["manual", "automatic"]

export const REMEDIATION_ACTION_EVENTS = ["alert.opened", "remediation.test"]

export function normalizeRemediationActionType(value) {
  return REMEDIATION_ACTION_TYPES.includes(value) ? value : "custom_webhook"
}

export function normalizeRemediationActionMode(value) {
  return REMEDIATION_ACTION_MODES.includes(value) ? value : "manual"
}

export function normalizeRemediationEvents(value) {
  if (!Array.isArray(value)) return REMEDIATION_ACTION_EVENTS
  const events = value.filter((event) => REMEDIATION_ACTION_EVENTS.includes(event))
  return events.length ? events : REMEDIATION_ACTION_EVENTS
}

export function buildRemediationSignature({ timestamp, body, secret }) {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")
  return `sha256=${digest}`
}

export function shouldSkipRemediationForCooldown({ lastTriggeredAt, cooldownMinutes, now = new Date() }) {
  if (!lastTriggeredAt || cooldownMinutes <= 0) return false
  return now.getTime() - lastTriggeredAt.getTime() < cooldownMinutes * 60 * 1000
}
