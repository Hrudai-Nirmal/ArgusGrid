/**
 * Public homepage visual showing telemetry streams entering Meridian.
 */

"use client"

import { useRef } from "react"
import { Bot, Braces, GitBranch, Network, RadioTower, Workflow } from "lucide-react"

import { AnimatedBeam } from "@/components/marketing/animated-beam"
import { cn } from "@/lib/utils"

const providers = [
  { id: "dify", name: "Dify", detail: "Agent runs", icon: Bot, className: "left-[6%] top-[12%]" },
  { id: "n8n", name: "n8n", detail: "Workflow state", icon: Workflow, className: "left-[4%] bottom-[16%]" },
  { id: "github", name: "GitHub Actions", detail: "Deploy jobs", icon: GitBranch, className: "right-[4%] top-[14%]" },
  { id: "rest", name: "REST metrics", detail: "Endpoint samples", icon: RadioTower, className: "right-[5%] bottom-[18%]" },
  { id: "sdk", name: "SDK/API", detail: "Custom telemetry", icon: Braces, className: "left-1/2 top-[2%] -translate-x-1/2" },
]

/**
 * Renders animated provider-to-Meridian ingestion paths.
 */
export function IntegrationBeamDemo() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const meridianRef = useRef<HTMLDivElement | null>(null)
  const difyRef = useRef<HTMLDivElement | null>(null)
  const n8nRef = useRef<HTMLDivElement | null>(null)
  const githubRef = useRef<HTMLDivElement | null>(null)
  const restRef = useRef<HTMLDivElement | null>(null)
  const sdkRef = useRef<HTMLDivElement | null>(null)
  const refsByProvider = {
    dify: difyRef,
    n8n: n8nRef,
    github: githubRef,
    rest: restRef,
    sdk: sdkRef,
  }

  return (
    <div ref={containerRef} className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-2xl shadow-black/30">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, color-mix(in oklch, var(--primary), transparent 82%), transparent 34%), radial-gradient(circle at 70% 75%, color-mix(in oklch, var(--muted-foreground), transparent 88%), transparent 30%)",
        }}
      />
      <div
        className="absolute inset-0 bg-[size:32px_32px]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklch, var(--foreground), transparent 94%) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground), transparent 94%) 1px, transparent 1px)",
        }}
      />
      <AnimatedBeam containerRef={containerRef} fromRef={difyRef} toRef={meridianRef} curvature={-80} delay={0.1} />
      <AnimatedBeam containerRef={containerRef} fromRef={n8nRef} toRef={meridianRef} curvature={90} delay={0.6} />
      <AnimatedBeam containerRef={containerRef} fromRef={githubRef} toRef={meridianRef} curvature={-80} delay={1.1} reverse />
      <AnimatedBeam containerRef={containerRef} fromRef={restRef} toRef={meridianRef} curvature={90} delay={1.6} reverse />
      <AnimatedBeam containerRef={containerRef} fromRef={sdkRef} toRef={meridianRef} curvature={120} delay={2.1} />

      {providers.map((provider) => {
        const Icon = provider.icon
        return (
          <div
            key={provider.id}
            ref={refsByProvider[provider.id as keyof typeof refsByProvider]}
            className={cn("absolute z-10 w-44 rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-xl shadow-black/30", provider.className)}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex size-8 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground">
                <Icon className="size-4" />
              </span>
              {provider.name}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{provider.detail}</div>
          </div>
        )
      })}

      <div ref={meridianRef} className="absolute left-1/2 top-1/2 z-20 w-56 -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-border bg-card p-5 text-center text-card-foreground shadow-2xl shadow-black/40">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-black/20">
          <Network className="size-6" />
        </div>
        <div className="mt-3 text-lg font-semibold">Meridian</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">Runs, metrics, alerts, logs, and client proof evidence.</div>
      </div>
    </div>
  )
}
