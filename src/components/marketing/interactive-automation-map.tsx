/**
 * Lightweight draggable Automation Map demo for the public homepage.
 */

"use client"

import { useRef, useState, type PointerEvent } from "react"
import { Bot, FileCheck2, RadioTower, Workflow } from "lucide-react"

import { cn } from "@/lib/utils"

type DemoNodeId = "intake" | "triage" | "metrics" | "proof"

type DragState = {
  nodeId: DemoNodeId
  x: number
  y: number
}

const demoNodes = [
  { id: "intake", title: "Client intake", detail: "New request", icon: Bot, tone: "from-cyan-300/20 to-indigo-300/10" },
  { id: "triage", title: "AI triage", detail: "Dify / n8n run", icon: Workflow, tone: "from-violet-300/20 to-cyan-300/10" },
  { id: "metrics", title: "REST metric", detail: "Cost + latency", icon: RadioTower, tone: "from-emerald-300/20 to-sky-300/10" },
  { id: "proof", title: "Client Proof", detail: "Report ready", icon: FileCheck2, tone: "from-amber-200/20 to-fuchsia-300/10" },
] as const

const demoSlots = [
  { x: 14, y: 44 },
  { x: 39, y: 22 },
  { x: 61, y: 58 },
  { x: 84, y: 36 },
]

const demoEdges: [DemoNodeId, DemoNodeId][] = [
  ["intake", "triage"],
  ["triage", "metrics"],
  ["metrics", "proof"],
]

/**
 * Renders a non-production graph demo where nodes can be dragged between slots.
 */
export function InteractiveAutomationMap() {
  const boardRef = useRef<HTMLDivElement | null>(null)
  const [nodeSlots, setNodeSlots] = useState<Record<DemoNodeId, number>>({
    intake: 0,
    triage: 1,
    metrics: 2,
    proof: 3,
  })
  const [draggingNodeId, setDraggingNodeId] = useState<DemoNodeId | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)

  function getBoardPoint(event: PointerEvent<HTMLDivElement>) {
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    }
  }

  function handlePointerDown(nodeId: DemoNodeId, event: PointerEvent<HTMLDivElement>) {
    const point = getBoardPoint(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraggingNodeId(nodeId)
    setDragState({ nodeId, x: point.x, y: point.y })
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingNodeId) return
    const point = getBoardPoint(event)
    if (!point) return
    setDragState({ nodeId: draggingNodeId, x: point.x, y: point.y })
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!draggingNodeId) return
    const point = getBoardPoint(event)
    if (point) {
      const nearestSlotIndex = demoSlots.reduce((nearest, slot, index) => {
        const slotX = (slot.x / 100) * point.width
        const slotY = (slot.y / 100) * point.height
        const nearestSlot = demoSlots[nearest]
        const nearestX = (nearestSlot.x / 100) * point.width
        const nearestY = (nearestSlot.y / 100) * point.height
        const distance = Math.hypot(point.x - slotX, point.y - slotY)
        const nearestDistance = Math.hypot(point.x - nearestX, point.y - nearestY)
        return distance < nearestDistance ? index : nearest
      }, 0)
      const currentSlotIndex = nodeSlots[draggingNodeId]
      const swappedNodeId = demoNodes.find((node) => nodeSlots[node.id] === nearestSlotIndex)?.id

      setNodeSlots((current) => ({
        ...current,
        [draggingNodeId]: nearestSlotIndex,
        ...(swappedNodeId ? { [swappedNodeId]: currentSlotIndex } : {}),
      }))
    }
    setDraggingNodeId(null)
    setDragState(null)
  }

  function getNodeCenter(nodeId: DemoNodeId) {
    const slot = demoSlots[nodeSlots[nodeId]]
    return { x: slot.x, y: slot.y }
  }

  return (
    <div
      ref={boardRef}
      data-testid="homepage-demo-map"
      className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.055] shadow-2xl shadow-black/35 backdrop-blur-2xl"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(129,140,248,0.24),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(45,212,191,0.14),transparent_26%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {demoEdges.map(([source, target]) => {
          const start = getNodeCenter(source)
          const end = getNodeCenter(target)
          return (
            <path
              key={`${source}-${target}`}
              d={`M ${start.x} ${start.y} C ${(start.x + end.x) / 2} ${start.y}, ${(start.x + end.x) / 2} ${end.y}, ${end.x} ${end.y}`}
              stroke="rgba(191,219,254,0.42)"
              strokeWidth="0.42"
              fill="none"
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      {demoNodes.map((node) => {
        const slot = demoSlots[nodeSlots[node.id]]
        const Icon = node.icon
        const isDragging = draggingNodeId === node.id && dragState?.nodeId === node.id
        const style = isDragging
          ? { left: dragState.x, top: dragState.y, transform: "translate(-50%, -50%) scale(1.04)" }
          : { left: `${slot.x}%`, top: `${slot.y}%`, transform: "translate(-50%, -50%)" }

        return (
          <div
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={`Drag ${node.title} node`}
            className={cn(
              "absolute z-10 w-48 cursor-grab select-none rounded-2xl border border-white/15 bg-gradient-to-br p-4 text-white shadow-2xl shadow-black/30 backdrop-blur-xl transition-[box-shadow,border-color] active:cursor-grabbing",
              node.tone,
              isDragging ? "border-cyan-200/60 shadow-cyan-950/50" : "hover:border-white/30"
            )}
            style={style}
            onPointerDown={(event) => handlePointerDown(node.id, event)}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/12 text-cyan-100">
                <Icon className="size-4" />
              </span>
              {node.title}
            </div>
            <div className="mt-3 text-xs text-slate-300">{node.detail}</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-cyan-200/80" />
            </div>
          </div>
        )
      })}
      <div className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-slate-300 backdrop-blur-xl">
        Drag nodes to swap positions. Demo only.
      </div>
    </div>
  )
}
