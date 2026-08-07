/**
 * Public homepage Automation Map preview using Meridian's React Flow node surface.
 */

"use client"

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "@xyflow/react"

import { EndpointGraphNode } from "@/components/meridian/endpoint-node"
import type { EndpointNodeData } from "@/lib/meridian-data"

const nodeTypes = { endpoint: EndpointGraphNode }

const marketingNodeData: EndpointNodeData[] = [
  {
    id: "marketing-intake",
    label: "Client Intake",
    description: "Captures a new support request from the customer channel.",
    icon: "ai",
    status: "active",
    statusReason: "Recent workflow runs are healthy.",
    category: "Execution Health",
    apiUrl: "",
    cadence: "Live",
    auth: "None",
    position: { x: 80, y: 180 },
    metrics: [
      { label: "Success rate", value: "99.2%", delta: "+1.1%", tone: "good" },
      { label: "Avg latency", value: "1.4s", delta: "-180ms", tone: "good" },
    ],
    runs: [],
    alerts: [],
    latencySeries: [1.8, 1.6, 1.4],
    costSeries: [8, 9, 8.2],
    qualitySeries: [92, 94, 95],
    heatmap: [],
    parameters: [],
  },
  {
    id: "marketing-triage",
    label: "AI Triage",
    description: "Classifies intent, gathers account context, and drafts the response.",
    icon: "workflow",
    status: "active",
    statusReason: "Latest submitted run passed.",
    category: "Agent/Tool Behavior",
    apiUrl: "",
    cadence: "On run",
    auth: "Token",
    position: { x: 380, y: 90 },
    metrics: [
      { label: "Eval score", value: "94", delta: "+2", tone: "good" },
      { label: "Tokens", value: "42k", delta: "-4%", tone: "good" },
    ],
    runs: [],
    alerts: [],
    latencySeries: [2.6, 2.1, 1.9],
    costSeries: [12, 14, 13],
    qualitySeries: [90, 93, 94],
    heatmap: [],
    parameters: [],
  },
  {
    id: "marketing-metrics",
    label: "REST Metric",
    description: "Polls the customer-owned endpoint when scheduled monitoring is enabled.",
    icon: "api",
    status: "degraded",
    statusReason: "Latency is above the soft threshold.",
    category: "Performance",
    apiUrl: "",
    cadence: "Manual",
    auth: "Header",
    position: { x: 650, y: 250 },
    metrics: [
      { label: "Latency", value: "2.8s", delta: "+620ms", tone: "warn" },
      { label: "Cost today", value: "$18", delta: "+6%", tone: "neutral" },
    ],
    runs: [],
    alerts: [{ title: "Latency crossed soft threshold", severity: "warning", time: "18 min ago" }],
    latencySeries: [2.0, 2.4, 2.8],
    costSeries: [14, 16, 18],
    qualitySeries: [92, 91, 90],
    heatmap: [],
    parameters: [],
  },
  {
    id: "marketing-proof",
    label: "Client Proof",
    description: "Packages uptime, run success, incidents, cost, tokens, and ROI evidence.",
    icon: "security",
    status: "active",
    statusReason: "Latest report is ready to share.",
    category: "ROI",
    apiUrl: "",
    cadence: "30d",
    auth: "Read-only",
    position: { x: 930, y: 140 },
    metrics: [
      { label: "Reports", value: "3", delta: "+1", tone: "good" },
      { label: "Incidents", value: "0 active", delta: "-2", tone: "good" },
    ],
    runs: [],
    alerts: [],
    latencySeries: [1, 1, 1],
    costSeries: [0, 0, 0],
    qualitySeries: [95, 96, 96],
    heatmap: [],
    parameters: [],
  },
]

const initialMarketingNodes: Node[] = marketingNodeData.map((node) => ({
  id: node.id,
  type: "endpoint",
  position: node.position,
  data: node as unknown as Record<string, unknown>,
}))

const initialMarketingEdges: Edge[] = [
  {
    id: "marketing-intake-triage",
    source: "marketing-intake",
    target: "marketing-triage",
    label: "classify",
    animated: true,
    style: { stroke: "var(--primary)", strokeWidth: 2 },
    labelStyle: { fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 600 },
  },
  {
    id: "marketing-triage-metrics",
    source: "marketing-triage",
    target: "marketing-metrics",
    label: "measure",
    animated: true,
    style: { stroke: "var(--primary)", strokeWidth: 2 },
    labelStyle: { fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 600 },
  },
  {
    id: "marketing-metrics-proof",
    source: "marketing-metrics",
    target: "marketing-proof",
    label: "prove",
    animated: true,
    style: { stroke: "var(--primary)", strokeWidth: 2 },
    labelStyle: { fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 600 },
  },
]

/**
 * Renders a marketing-only Automation Map using the same React Flow node surface.
 */
export function InteractiveAutomationMap() {
  const [nodes, , onNodesChange] = useNodesState(initialMarketingNodes)
  const [edges] = useEdgesState(initialMarketingEdges)

  return (
    <div data-testid="homepage-demo-map" className="relative h-[540px] overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl shadow-black/35">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        edgesFocusable={false}
        fitView
        minZoom={0.45}
        maxZoom={1.25}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="var(--border)" />
        <Controls showInteractive={false} />
        <MiniMap pannable={false} zoomable={false} nodeStrokeWidth={3} />
      </ReactFlow>
      <div data-testid="homepage-map-helper" className="pointer-events-none absolute right-4 top-4 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-lg shadow-black/25">
        Drag nodes to rearrange the automation map.
      </div>
    </div>
  )
}
