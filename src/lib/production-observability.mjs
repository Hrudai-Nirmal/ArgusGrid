/**
 * Secret-safe production observability summaries for operator-facing readiness UI.
 */

export const OPERATIONAL_STATUSES = ["ready", "warning", "blocked"]

const STALE_POLL_AFTER_MS = 10 * 60 * 1000
const QUEUE_WARNING_THRESHOLD = 25

function count(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function plural(value, singular, pluralValue = `${singular}s`) {
  return value === 1 ? singular : pluralValue
}

function getDateMs(value) {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Rolls child operational states into one summary state.
 */
export function getOperationalStatus(statuses) {
  if (statuses.includes("blocked")) return "blocked"
  if (statuses.includes("warning")) return "warning"
  return "ready"
}

function buildDependenciesCard(diagnostics) {
  const failedChecks = Object.entries(diagnostics.checks ?? {})
    .filter(([, ready]) => !ready)
    .map(([name]) => name)
  const issueCount = diagnostics.issues?.length ?? 0
  const warningCount = diagnostics.warnings?.length ?? 0
  const status = failedChecks.length || issueCount ? "blocked" : warningCount ? "warning" : "ready"

  return {
    id: "dependencies",
    title: "Core dependencies",
    status,
    value: failedChecks.length ? `${failedChecks.length} failing` : "Ready",
    detail: failedChecks.length
      ? `Check ${failedChecks.join(", ")} readiness before customer QA.`
      : warningCount
        ? `${warningCount} safe runtime ${plural(warningCount, "warning")} active.`
        : "Database, auth, encryption, cron, email, and durable jobs are configured.",
    evidence: failedChecks.length ? failedChecks : ["database", "auth", "cron", "email", "jobs"],
    runbook: "docs/incident-response.md",
  }
}

function buildPollingCard(diagnostics, now) {
  const latestPoll = diagnostics.latestPoll
  if (!latestPoll) {
    return {
      id: "polling",
      title: "Polling freshness",
      status: "warning",
      value: "No poll evidence",
      detail: "No completed poll has been recorded yet. Run a manual poll or verify cron-job.org.",
      evidence: [],
      runbook: "README.md#cron-joborg-polling",
    }
  }

  const finishedAt = getDateMs(latestPoll.finishedAt) ?? getDateMs(latestPoll.startedAt)
  const ageMs = finishedAt === null ? null : now.getTime() - finishedAt
  const isFailed = String(latestPoll.status).toUpperCase() === "FAILED"
  const isStale = ageMs !== null && ageMs > STALE_POLL_AFTER_MS
  const status = isFailed ? "blocked" : isStale ? "warning" : "ready"

  return {
    id: "polling",
    title: "Polling freshness",
    status,
    value: isFailed ? "Latest poll failed" : isStale ? "Stale" : "Fresh",
    detail: isFailed
      ? latestPoll.errorSummary || "Latest poll failed. Check endpoint configs and cron execution."
      : isStale
        ? "Latest poll evidence is older than ten minutes."
        : `${latestPoll.sampledNodes ?? 0} nodes sampled and ${latestPoll.createdSamples ?? 0} samples created.`,
    evidence: [
      `status:${latestPoll.status}`,
      `sampledNodes:${latestPoll.sampledNodes ?? 0}`,
      `createdSamples:${latestPoll.createdSamples ?? 0}`,
    ],
    runbook: "docs/incident-response.md",
  }
}

function buildNotificationJobsCard(diagnostics) {
  const jobs = diagnostics.notificationJobs ?? {}
  const failed = count(jobs.FAILED)
  const queued = count(jobs.QUEUED)
  const retrying = count(jobs.RETRYING)
  const running = count(jobs.RUNNING)
  const waiting = queued + retrying + running
  const status = failed > 0 ? "blocked" : waiting > QUEUE_WARNING_THRESHOLD ? "warning" : "ready"

  return {
    id: "notification-jobs",
    title: "Notification jobs",
    status,
    value: failed ? `${failed} failed` : waiting ? `${waiting} active` : "Ready",
    detail: failed
      ? "Retry or inspect failed email, Slack, and webhook jobs from Testing or Logs."
      : waiting > QUEUE_WARNING_THRESHOLD
        ? "The queue has elevated active work. Confirm Inngest is processing."
        : "No failed durable notification jobs are currently reported.",
    evidence: [`queued:${queued}`, `retrying:${retrying}`, `running:${running}`, `failed:${failed}`],
    runbook: "README.md#durable-notification-jobs-with-inngest",
  }
}

function buildUsageGuardrailsCard(usage) {
  const buckets = count(usage?.counts?.rateLimitBuckets)
  const activeTokens = count(usage?.counts?.activeIngestionTokens)
  const status = buckets > 0 ? "warning" : "ready"

  return {
    id: "usage-guardrails",
    title: "Usage guardrails",
    status,
    value: buckets ? `${buckets} rate-limit buckets` : "No throttling",
    detail: buckets
      ? "Recent ingestion traffic hit durable rate-limit buckets. Check client retry behavior."
      : `${activeTokens} active telemetry ${plural(activeTokens, "token")} and no recent throttling evidence.`,
    evidence: [
      `workflowRuns:${count(usage?.counts?.workflowRuns)}`,
      `metricSamples:${count(usage?.counts?.metricSamples)}`,
      `activeTokens:${activeTokens}`,
      `rateLimitBuckets:${buckets}`,
    ],
    runbook: "README.md#enterprise-usage-guardrails",
  }
}

function buildRuntimeCard(diagnostics) {
  const runtime = diagnostics.runtime ?? {}
  const blocked = runtime.isProduction && (!runtime.externalSideEffectsEnabled || !runtime.backgroundJobsEnabled || !runtime.cronEnabled)
  const status = blocked ? "blocked" : runtime.isProduction ? "ready" : "warning"

  return {
    id: "runtime-safety",
    title: "Runtime safety",
    status,
    value: runtime.label ?? "Unknown runtime",
    detail: blocked
      ? "Production is missing one or more live side-effect policies."
      : runtime.isProduction
        ? "Production side effects, background jobs, and cron policy are enabled."
        : "Non-production runtime guardrails are active by design.",
    evidence: [
      `sideEffects:${Boolean(runtime.externalSideEffectsEnabled)}`,
      `backgroundJobs:${Boolean(runtime.backgroundJobsEnabled)}`,
      `cron:${Boolean(runtime.cronEnabled)}`,
    ],
    runbook: "README.md#ci-versioning-and-release-safety",
  }
}

/**
 * Builds a project operations overview from existing safe health and usage signals.
 */
export function buildProductionObservabilityOverview({ diagnostics, usage, now = new Date() }) {
  const cards = [
    buildDependenciesCard(diagnostics),
    buildRuntimeCard(diagnostics),
    buildPollingCard(diagnostics, now),
    buildNotificationJobsCard(diagnostics),
    buildUsageGuardrailsCard(usage),
  ]
  const status = getOperationalStatus(cards.map((card) => card.status))

  return {
    status,
    checkedAt: now.toISOString(),
    summary: status === "blocked"
      ? "One or more production-critical checks need operator attention."
      : status === "warning"
        ? "Meridian is serving, with operational signals worth watching."
        : "Meridian production signals are healthy.",
    cards,
  }
}
