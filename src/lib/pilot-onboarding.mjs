/*
 * Pilot onboarding checklist logic for turning a new Meridian workspace into a
 * verified first monitored workflow without counting sample fallback evidence.
 */

const PILOT_ONBOARDING_STEPS = [
  {
    id: "project",
    label: "Project selected",
    detail: "Create or select the workspace that represents the client automation environment.",
    section: "projects",
  },
  {
    id: "node",
    label: "Workflow node added",
    detail: "Add the automation, agent, endpoint, or workflow you want Meridian to monitor.",
    section: "map",
  },
  {
    id: "integration",
    label: "Integration setup started",
    detail: "Choose an SDK, Dify, n8n, GitHub Actions, or REST metric path and create the required setup.",
    section: "integrations",
  },
  {
    id: "signal",
    label: "First real signal received",
    detail: "Send a submitted workflow run or poll a persisted metric sample. Sample fallback rows do not count.",
    section: "integrations",
  },
  {
    id: "alert-rule",
    label: "Alert rule configured",
    detail: "Create a metric or workflow-run rule so Meridian can flag reliability, cost, token, or quality issues.",
    section: "alerts",
  },
  {
    id: "client-proof",
    label: "Client proof created",
    detail: "Create a report link once real evidence exists so stakeholders can review read-only proof.",
    section: "reports",
  },
]

const NEXT_ACTION_LABELS = new Map([
  ["project", "Create or select project"],
  ["node", "Add first workflow node"],
  ["integration", "Choose integration path"],
  ["signal", "Send first signal"],
  ["alert-rule", "Create first alert rule"],
  ["client-proof", "Create client proof"],
])

const FIRST_WORKFLOW_STARTER_CHOICES = [
  {
    id: "dify",
    label: "Dify workflow",
    detail: "Monitor a Dify chatbot, agent, or workflow by posting one completed run to Meridian.",
    section: "integrations",
    actionLabel: "Set up Dify",
  },
  {
    id: "n8n",
    label: "n8n workflow",
    detail: "Send execution status and step timing from an n8n HTTP Request node.",
    section: "integrations",
    actionLabel: "Set up n8n",
  },
  {
    id: "javascript-sdk",
    label: "JavaScript SDK",
    detail: "Use the published npm package for Node.js jobs, scripts, and serverless handlers.",
    section: "integrations",
    actionLabel: "Use SDK",
  },
  {
    id: "github-actions",
    label: "GitHub Actions",
    detail: "Report CI workflow status, duration, and job evidence into the selected node.",
    section: "integrations",
    actionLabel: "Set up CI",
  },
  {
    id: "custom-rest-metric",
    label: "REST metric",
    detail: "Poll a JSON endpoint for health, latency, cost, queue depth, or a custom metric.",
    section: "integrations",
    actionLabel: "Configure REST",
  },
]

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

/**
 * Builds the private-beta/pilot setup checklist from real project evidence.
 *
 * @param {{
 *   hasProject: boolean,
 *   nodeCount: number,
 *   hasIntegrationSetup: boolean,
 *   realRunCount: number,
 *   realMetricCount: number,
 *   alertRuleCount: number,
 *   activeReportCount: number,
 * }} evidence
 * @returns {{
 *   items: Array<{ id: string, label: string, detail: string, section: string, completed: boolean }>,
 *   completedCount: number,
 *   totalCount: number,
 *   percentComplete: number,
 *   nextActionLabel: string,
 *   nextActionSection: string,
 *   activationTitle: string,
 *   activationDetail: string,
 *   starterChoices: Array<{ id: string, label: string, detail: string, section: string, actionLabel: string }>,
 * }}
 */
export function buildPilotOnboardingChecklist(evidence) {
  const realSignalCount = Math.max(0, evidence.realRunCount || 0) + Math.max(0, evidence.realMetricCount || 0)
  const completedById = new Map([
    ["project", Boolean(evidence.hasProject)],
    ["node", (evidence.nodeCount || 0) > 0],
    ["integration", Boolean(evidence.hasIntegrationSetup)],
    ["signal", realSignalCount > 0],
    ["alert-rule", (evidence.alertRuleCount || 0) > 0],
    ["client-proof", (evidence.activeReportCount || 0) > 0],
  ])

  const items = PILOT_ONBOARDING_STEPS.map((step) => ({
    ...step,
    completed: completedById.get(step.id) ?? false,
  }))
  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length
  const nextIncomplete = items.find((item) => !item.completed)

  return {
    items,
    completedCount,
    totalCount,
    percentComplete: clampPercent((completedCount / totalCount) * 100),
    nextActionLabel: nextIncomplete ? NEXT_ACTION_LABELS.get(nextIncomplete.id) ?? nextIncomplete.label : "Review pilot evidence",
    nextActionSection: nextIncomplete?.section ?? "control-room",
    activationTitle: "Create your first monitored workflow",
    activationDetail: "Add a node, choose a starter path, then send one real signal so Meridian can show runs, metrics, alerts, and client proof.",
    starterChoices: FIRST_WORKFLOW_STARTER_CHOICES,
  }
}
