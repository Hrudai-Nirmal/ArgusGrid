/**
 * Signed-out Meridian homepage with dark liquid glass styling.
 */

import Image from "next/image"
import { Activity, ArrowRight, BarChart3, BellRing, FileCheck2, LockKeyhole, Network, ShieldCheck } from "lucide-react"

import { AuthEntryPanel } from "@/components/auth/auth-entry-panel"
import { IntegrationBeamDemo } from "@/components/marketing/integration-beam-demo"
import { InteractiveAutomationMap } from "@/components/marketing/interactive-automation-map"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MERIDIAN_PRICING_PLANS } from "@/lib/billing-plans.mjs"
import { cn } from "@/lib/utils"

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

const trustItems = [
  "RBAC",
  "secret-safe logs",
  "signed webhooks",
  "durable notifications",
  "billing safety",
]

const pricingPreviewNames = ["Free Sandbox", "Solo Beta", "Agency Beta", "Enterprise Pilot"]
const liquidGlassCard = "border-white/15 bg-white/[0.075] shadow-2xl shadow-black/30 backdrop-blur-2xl"

function formatLimit(value: number | null) {
  return value === null ? "Custom" : value.toLocaleString("en-US")
}

/**
 * Renders the public signed-out Meridian landing page.
 */
export function LandingPage() {
  return (
    <main className="dark min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(99,102,241,0.24),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.14),transparent_22%),linear-gradient(180deg,#020617_0%,#0f172a_46%,#020617_100%)]" />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white shadow-lg shadow-cyan-950/30 backdrop-blur-xl">
              <Network className="size-5" />
            </span>
            Meridian
          </a>
          <nav className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
            <a className="transition hover:text-white" href="#product">
              Product
            </a>
            <a className="transition hover:text-white" href="#integrations">
              Integrations
            </a>
            <a className="transition hover:text-white" href="#pricing">
              Pricing
            </a>
            <a className="transition hover:text-white" href="#start">
              Sign in
            </a>
          </nav>
          <a className={cn(buttonVariants(), "border border-white/20 bg-white text-slate-950 hover:bg-cyan-50")} href="#start">
            Start private beta
            <ArrowRight data-icon="inline-end" />
          </a>
        </div>
      </header>

      <section id="top" className="relative z-10 min-h-[calc(100vh-73px)] overflow-hidden">
        <Image
          src="/meridian-automation-map-screenshot.svg"
          alt="Blurred screenshot of the Meridian Automation Map"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover opacity-30 blur-[5px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/72 to-slate-950" />
        <div className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-7">
            <Badge className="w-fit border-white/15 bg-white/10 text-cyan-100 backdrop-blur-xl" variant="outline">
              AI automation control room for agencies and operators
            </Badge>
            <div className="grid gap-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                Meridian
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-slate-200">
                Monitor AI automations, catch failures, control cost and tokens, and prove client ROI from one graph-first workspace.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a className={cn(buttonVariants({ size: "lg" }), "border border-white/20 bg-white text-slate-950 hover:bg-cyan-50")} href="#start">
                Sign in or register
                <ArrowRight data-icon="inline-end" />
              </a>
              <a className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/20 bg-white/10 text-white backdrop-blur-xl hover:bg-white/15")} href="#product">
                Try the demo map
              </a>
            </div>
            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              {[
                ["Zero-idle defaults", "Manual refresh and polling until a pilot needs background work."],
                ["Client proof", "Reports, CSV exports, periods, comparisons, and print-ready links."],
                ["Ops evidence", "Runs, alerts, logs, delivery status, billing history, and usage."],
              ].map(([title, body]) => (
                <div key={title} className={cn("rounded-2xl p-4", liquidGlassCard)}>
                  <div className="font-semibold text-white">{title}</div>
                  <div className="mt-1">{body}</div>
                </div>
              ))}
            </div>
          </div>

          <HeroGlassPanel />
        </div>
      </section>

      <section id="product" className="relative z-10 border-y border-white/10 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5">
          <div className="grid max-w-3xl gap-3">
            <Badge className="w-fit border-white/15 bg-white/10 text-cyan-100 backdrop-blur-xl" variant="outline">Automation Map first</Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">A demo graph visitors can touch.</h2>
            <p className="text-lg leading-8 text-slate-300">
              This public demo is intentionally simple: drag nodes to swap their positions. The real Meridian graph stays inside the authenticated dashboard.
            </p>
          </div>
          <InteractiveAutomationMap />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {valueCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title} className={cn("text-white", liquidGlassCard)}>
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-cyan-100">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-slate-300">{card.body}</CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section id="integrations" className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-20">
        <div className="grid max-w-3xl gap-3">
          <Badge className="w-fit border-white/15 bg-white/10 text-cyan-100 backdrop-blur-xl" variant="outline">Integration paths</Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Watch data flow into Meridian.</h2>
          <p className="text-lg leading-8 text-slate-300">
            Dify, n8n, GitHub Actions, REST metrics, and SDK/API telemetry all become one operational evidence stream for runs, metrics, alerts, and client proof.
          </p>
        </div>
        <IntegrationBeamDemo />
      </section>

      <section className="relative z-10 border-y border-white/10 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge className="border-white/15 bg-white/10 text-cyan-100 backdrop-blur-xl" variant="outline">Security and reliability</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Built for evidence, not secret sprawl.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item} className={cn("flex items-center gap-3 rounded-2xl p-4 text-sm text-slate-200", liquidGlassCard)}>
                <ShieldCheck className="size-5 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
            <div className={cn("flex items-center gap-3 rounded-2xl p-4 text-sm text-slate-200", liquidGlassCard)}>
              <LockKeyhole className="size-5 text-indigo-200" />
              Signed-out reports stay read-only and token-scoped.
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-20">
        <div className="grid max-w-3xl gap-3">
          <Badge className="w-fit border-white/15 bg-white/10 text-cyan-100 backdrop-blur-xl" variant="outline">Private beta pricing</Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Start conservatively, scale with credits.</h2>
          <p className="text-lg leading-8 text-slate-300">
            Plans include monthly usage, with prepaid credits available inside Billing after sign-in. Public pricing buttons lead to account creation, not checkout.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {MERIDIAN_PRICING_PLANS.filter((plan) => pricingPreviewNames.includes(plan.name)).map((plan) => (
            <Card key={plan.id} className={cn("text-white", liquidGlassCard)}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-slate-300">{plan.summary}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <span className="text-3xl font-semibold">${plan.monthlyUsd}</span>
                  <span className="text-sm text-slate-400"> / mo</span>
                  <div className="text-sm text-slate-400">INR {plan.monthlyInr.toLocaleString("en-IN")} / mo</div>
                </div>
                <div className="grid gap-2 text-sm text-slate-300">
                  <div>{formatLimit(plan.workflowRunLimit)} workflow runs</div>
                  <div>{formatLimit(plan.metricSampleLimit)} metric samples</div>
                  <div>{formatLimit(plan.reportShareLimit)} client reports</div>
                  <div>{plan.retentionDays} day retention</div>
                </div>
                <a className={cn(buttonVariants({ variant: plan.id === "agency_beta" ? "default" : "outline" }), "w-full border-white/20", plan.id === "agency_beta" ? "bg-white text-slate-950 hover:bg-cyan-50" : "bg-white/10 text-white hover:bg-white/15")} href="#start">
                  Choose {plan.name}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="start" className="relative z-10 border-t border-white/10 py-20">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-5">
            <Badge className="w-fit border-white/15 bg-white/10 text-cyan-100 backdrop-blur-xl" variant="outline">Sign in / register</Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Open Meridian and start with the graph.</h2>
            <p className="text-lg leading-8 text-slate-300">
              New accounts get guided setup for the first node, telemetry signal, run verification, and client proof report. Returning users go straight to the dashboard.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md">
            <AuthEntryPanel
              title="Start Meridian"
              description="Use GitHub, Google, or email/password. The callback returns to / so signed-in users land in the dashboard."
              footerCopy="No public page exposes tokens, webhook URLs, Paddle keys, environment values, or private project/member data."
            />
          </div>
        </div>
      </section>
    </main>
  )
}

function HeroGlassPanel() {
  return (
    <div className={cn("rounded-[2rem] p-5", liquidGlassCard)}>
      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Network className="size-4 text-cyan-200" />
            Automation Map
          </div>
          <Badge className="border-emerald-300/20 bg-emerald-400/10 text-emerald-200" variant="outline">Live evidence</Badge>
        </div>
        <div className="grid gap-3 p-4">
          {[
            ["Support Triage", "99.2% success", "Healthy"],
            ["REST Metric", "1.8s avg latency", "Fresh"],
            ["Client Proof", "30d report ready", "Shared"],
          ].map(([title, metric, status]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{title}</div>
                  <div className="mt-1 text-sm text-slate-400">{metric}</div>
                </div>
                <Badge className="border-cyan-200/20 bg-cyan-300/10 text-cyan-100" variant="outline">{status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
