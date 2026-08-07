/**
 * Signed-out Meridian homepage with dark liquid glass styling.
 */

import type { ReactNode } from "react"
import { Activity, ArrowRight, BarChart3, BellRing, FileCheck2, Gauge, Network, RefreshCw, TimerReset } from "lucide-react"

import { AuthEntryPanel } from "@/components/auth/auth-entry-panel"
import BorderGlow from "@/components/marketing/border-glow"
import DotField from "@/components/marketing/dot-field"
import { IntegrationBeamDemo } from "@/components/marketing/integration-beam-demo"
import { InteractiveAutomationMap } from "@/components/marketing/interactive-automation-map"
import StrokeText from "@/components/marketing/stroke-text"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MERIDIAN_PRICING_PLANS } from "@/lib/billing-plans.mjs"
import { cn } from "@/lib/utils"

import "./landing-page.css"

const valueCards = [
  {
    title: "Monitor automations",
    body: "Track Dify, n8n, GitHub Actions, REST metrics, and SDK/API telemetry from one Automation Map.",
    icon: Activity,
  },
  {
    title: "Catch failures early",
    body: "Create metric and workflow-run alert rules, then route incidents to email, Slack, signed webhooks, and durable notification jobs.",
    icon: BellRing,
  },
  {
    title: "Track cost and tokens",
    body: "Watch latency, cost, tokens, quality, and run status so AI workflow drift becomes visible before clients notice.",
    icon: BarChart3,
  },
  {
    title: "Prove ROI",
    body: "Turn live operations evidence into client proof reports with periods, comparisons, incident timelines, and exports.",
    icon: FileCheck2,
  },
]

const reliabilityItems = [
  {
    title: "readiness checks",
    body: "Health, schema, auth, billing sync, and runtime posture are surfaced before a pilot depends on them.",
    icon: Gauge,
  },
  {
    title: "durable notifications",
    body: "Alert delivery uses queued jobs, delivery evidence, retries, and operator-visible terminal states.",
    icon: BellRing,
  },
  {
    title: "manual recovery",
    body: "Operators can recover queued jobs, clean retention, and poll projects on demand without always-on idle usage.",
    icon: RefreshCw,
  },
  {
    title: "bounded evidence",
    body: "Exports, logs, telemetry, and report payloads are capped so private-beta projects stay predictable.",
    icon: TimerReset,
  },
]

const pricingPreviewNames = ["Free Sandbox", "Solo Beta", "Agency Beta", "Enterprise Pilot"]
const glowFrameColors = ["#A855F7", "#B497CF", "#7C3AED"]
const subtleGlowFillOpacity = 0
const liquidGlassCard =
  "border-border/70 bg-card/55 text-card-foreground shadow-2xl shadow-black/30 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/45"
const softPanel = "border-border/70 bg-secondary/45 text-secondary-foreground backdrop-blur-2xl supports-[backdrop-filter]:bg-secondary/35"
const badgeClass = "w-fit border-border bg-secondary text-secondary-foreground"
const headingClass = "text-[#D8B4FE]"

function formatLimit(value: number | null) {
  return value === null ? "Custom" : value.toLocaleString("en-US")
}

function GlowFrame({
  children,
  className,
  radius = 28,
  fillOpacity = 0.42,
}: {
  children: ReactNode
  className?: string
  radius?: number
  fillOpacity?: number
}) {
  return (
    <BorderGlow
      className={className}
      edgeSensitivity={30}
      glowColor="40 80 80"
      backgroundColor="color-mix(in oklch, var(--card), transparent 45%)"
      borderRadius={radius}
      glowRadius={40}
      glowIntensity={1}
      coneSpread={25}
      animated={false}
      colors={glowFrameColors}
      fillOpacity={fillOpacity}
    >
      {children}
    </BorderGlow>
  )
}

/**
 * Renders the public signed-out Meridian landing page.
 */
export function LandingPage() {
  return (
    <main className="dark min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 12%, color-mix(in oklch, var(--primary), transparent 84%), transparent 30%), radial-gradient(circle at 86% 18%, color-mix(in oklch, var(--muted-foreground), transparent 90%), transparent 26%), linear-gradient(180deg, var(--background), color-mix(in oklch, var(--background), var(--card) 26%) 48%, var(--background))",
        }}
      />
      <div data-testid="homepage-bottom-blur" className="homepage-bottom-blur pointer-events-none fixed inset-x-0 bottom-0 z-30 backdrop-blur-lg" />
      <header
        className={cn(
          "fixed left-1/2 top-4 z-40 w-[min(calc(100%-1rem),66rem)] -translate-x-1/2 rounded-full",
          "border border-border/80 bg-card/90 px-2 py-2 text-foreground shadow-2xl shadow-black/30 backdrop-blur-xl",
        )}
      >
        <div className="flex w-full items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2 rounded-full px-2 py-1 font-semibold text-foreground">
            <span className="flex size-9 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground shadow-lg shadow-black/20">
              <Network className="size-5" />
            </span>
            Meridian
          </a>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <a className="transition hover:text-foreground" href="#product">
              Product
            </a>
            <a className="transition hover:text-foreground" href="#integrations">
              Integrations
            </a>
            <a className="transition hover:text-foreground" href="#pricing">
              Pricing
            </a>
            <a className="transition hover:text-foreground" href="#start">
              Sign in
            </a>
          </nav>
          <a className={cn(buttonVariants(), "rounded-full border border-border bg-primary text-primary-foreground hover:bg-primary/90")} href="#start">
            Start beta
            <ArrowRight data-icon="inline-end" />
          </a>
        </div>
      </header>

      <section id="top" className="relative z-10 min-h-screen overflow-hidden pt-24">
        <div className="absolute inset-0">
          <DotField
            dotRadius={1.5}
            dotSpacing={14}
            bulgeStrength={67}
            glowRadius={160}
            sparkle={false}
            waveAmplitude={0}
            cursorRadius={500}
            cursorForce={0.1}
            bulgeOnly
            gradientFrom="#A855F7"
            gradientTo="#B497CF"
            glowColor="#120F17"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--background), transparent 14%), color-mix(in oklch, var(--background), transparent 34%) 42%, var(--background))",
          }}
        />
        <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[0.618fr_1fr]">
          <div className="grid gap-7">
            <Badge className={badgeClass} variant="outline">
              AI automation control room for agencies and operators
            </Badge>
            <div className="grid gap-5">
              <h1 className="max-w-4xl text-7xl leading-[0.82] tracking-tight md:text-9xl xl:text-[11rem]">
                <StrokeText
                  text="Meridian"
                  trigger="scroll"
                  strokeColor="#C4B5FD"
                  fillColor="#D8B4FE"
                  strokeWidth={1.4}
                  drawDuration={1.6}
                  fillDelay={0.2}
                  fontSize={190}
                  fontWeight={800}
                  letterSpacing={-7}
                />
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-muted-foreground">
                Monitor AI automations, catch failures, control cost and tokens, and prove client ROI from one graph-first workspace.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a className={cn(buttonVariants({ size: "lg" }), "border border-border bg-primary text-primary-foreground hover:bg-primary/90")} href="#start">
                Sign in or register
                <ArrowRight data-icon="inline-end" />
              </a>
              <a className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-border bg-secondary text-secondary-foreground hover:bg-muted")} href="#product">
                Explore the map
              </a>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {[
                ["Zero-idle defaults", "Manual refresh and polling until a pilot needs background work."],
                ["Client proof", "Reports, CSV exports, periods, comparisons, and print-ready links."],
                ["Ops evidence", "Runs, alerts, logs, delivery status, billing history, and usage."],
              ].map(([title, body]) => (
                <div key={title} className={cn("h-full rounded-2xl p-4", liquidGlassCard)}>
                  <div className="font-semibold text-card-foreground">{title}</div>
                  <div className="mt-1">{body}</div>
                </div>
              ))}
            </div>
          </div>

          <HeroGlassPanel />
        </div>
      </section>

      <section id="product" className="relative z-10 border-y border-border py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5">
          <div className="grid max-w-3xl gap-3">
            <Badge className={badgeClass} variant="outline">
              Automation Map first
            </Badge>
            <h2 className={cn("text-3xl font-semibold tracking-tight md:text-5xl", headingClass)}>A graph-first map for the workflows clients depend on.</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Drag nodes to explore how Meridian frames automation health, run evidence, metric signals, and client proof in one connected workspace.
            </p>
          </div>
          <GlowFrame radius={32} fillOpacity={subtleGlowFillOpacity}>
            <InteractiveAutomationMap />
          </GlowFrame>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {valueCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title} className={cn("h-full", liquidGlassCard)}>
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">{card.body}</CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section id="integrations" className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-20">
        <div className="grid max-w-3xl gap-3">
          <Badge className={badgeClass} variant="outline">
            Integration paths
          </Badge>
          <h2 className={cn("text-3xl font-semibold tracking-tight md:text-5xl", headingClass)}>Watch data flow into Meridian.</h2>
          <p className="text-lg leading-8 text-muted-foreground">
            Dify, n8n, GitHub Actions, REST metrics, and SDK/API telemetry all become one operational evidence stream for runs, metrics, alerts, and client proof.
          </p>
        </div>
        <GlowFrame radius={32} fillOpacity={subtleGlowFillOpacity}>
          <IntegrationBeamDemo />
        </GlowFrame>
      </section>

      <section className="relative z-10 border-y border-border py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge className={badgeClass} variant="outline">
              Reliability
            </Badge>
            <h2 className={cn("mt-4 text-3xl font-semibold tracking-tight md:text-5xl", headingClass)}>Designed to keep automation evidence dependable.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {reliabilityItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className={cn("grid h-full gap-2 rounded-2xl p-4 text-sm", liquidGlassCard)}>
                  <div className="flex items-center gap-3 font-medium text-card-foreground">
                    <Icon className="size-5 text-primary" />
                    <span>{item.title}</span>
                  </div>
                  <p className="leading-6 text-muted-foreground">{item.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-20">
        <div className="grid max-w-3xl gap-3">
          <Badge className={badgeClass} variant="outline">
            Private beta pricing
          </Badge>
          <h2 className={cn("text-3xl font-semibold tracking-tight md:text-5xl", headingClass)}>Start conservatively, scale with credits.</h2>
          <p className="text-lg leading-8 text-muted-foreground">
            Plans include monthly usage, with prepaid credits available inside Billing after sign-in. Public pricing buttons lead to account creation, not checkout.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {MERIDIAN_PRICING_PLANS.filter((plan) => pricingPreviewNames.includes(plan.name)).map((plan) => (
            <GlowFrame key={plan.id} className="h-full">
              <Card className={cn("h-full", liquidGlassCard)}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{plan.summary}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div>
                    <span className="text-3xl font-semibold">${plan.monthlyUsd}</span>
                    <span className="text-sm text-muted-foreground"> / mo</span>
                    <div className="text-sm text-muted-foreground">INR {plan.monthlyInr.toLocaleString("en-IN")} / mo</div>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div>{formatLimit(plan.workflowRunLimit)} workflow runs</div>
                    <div>{formatLimit(plan.metricSampleLimit)} metric samples</div>
                    <div>{formatLimit(plan.reportShareLimit)} client reports</div>
                    <div>{plan.retentionDays} day retention</div>
                  </div>
                  <a
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full border-border bg-secondary/80 text-secondary-foreground shadow-black/20 transition hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_28px_color-mix(in_oklch,var(--primary),transparent_45%)]",
                    )}
                    href="#start"
                  >
                    Choose {plan.name}
                  </a>
                </CardContent>
              </Card>
            </GlowFrame>
          ))}
        </div>
      </section>

      <section id="start" className="relative z-10 border-t border-border py-20">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 lg:grid-cols-[0.618fr_1fr]">
          <div className="grid gap-5">
            <Badge className={badgeClass} variant="outline">
              Sign in / register
            </Badge>
            <h2 className={cn("text-3xl font-semibold tracking-tight md:text-5xl", headingClass)}>Open Meridian and start with the graph.</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              New accounts get guided setup for the first node, telemetry signal, run verification, and client proof report. Returning users go straight to the dashboard.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md">
            <GlowFrame>
              <AuthEntryPanel title="Start Meridian" description="" footerCopy="" />
            </GlowFrame>
          </div>
        </div>
      </section>
    </main>
  )
}

function HeroGlassPanel() {
  return (
    <div className={cn("rounded-[2rem] p-5", liquidGlassCard)}>
      <div className={cn("overflow-hidden rounded-[1.5rem] border", softPanel)}>
        <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]">
          <div className="flex items-center gap-2">
            <Network className="size-4 text-primary" />
            Automation Map
          </div>
          <Badge className={badgeClass} variant="outline">
            Live evidence
          </Badge>
        </div>
        <div className="grid gap-3 p-4">
          {[
            ["Support Triage", "99.2% success", "Healthy"],
            ["REST Metric", "1.8s avg latency", "Fresh"],
            ["Client Proof", "30d report ready", "Shared"],
          ].map(([title, metric, status]) => (
            <div key={title} className="rounded-2xl border border-border bg-card/85 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-card-foreground">{title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{metric}</div>
                </div>
                <Badge className={badgeClass} variant="outline">
                  {status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
