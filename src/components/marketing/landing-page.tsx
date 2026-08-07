/**
 * Signed-out Meridian homepage with product positioning and reusable auth entry.
 */

import { Activity, ArrowRight, BarChart3, BellRing, FileCheck2, GitBranch, LockKeyhole, Network, ShieldCheck, Zap } from "lucide-react"

import { AuthEntryPanel } from "@/components/auth/auth-entry-panel"
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

const integrationCards = [
  ["Dify", "Send run telemetry from chatbot and agent workflows."],
  ["n8n", "Post workflow execution outcomes and operational signals."],
  ["GitHub Actions", "Report deployment, test, and automation job health."],
  ["REST metrics", "Poll customer-owned API endpoints only when enabled."],
  ["SDK/API telemetry", "Use Meridian packages or direct ingestion for custom apps."],
]

const trustItems = [
  "RBAC",
  "secret-safe logs",
  "signed webhooks",
  "durable notifications",
  "billing safety",
]

const pricingPreviewNames = ["Free Sandbox", "Solo Beta", "Agency Beta", "Enterprise Pilot"]

function formatLimit(value: number | null) {
  return value === null ? "Custom" : value.toLocaleString("en-US")
}

/**
 * Renders the public signed-out Meridian landing page.
 */
export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f8f7ff] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Network className="size-5" />
            </span>
            Meridian
          </a>
          <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
            <a className="transition hover:text-slate-950" href="#product">
              Product
            </a>
            <a className="transition hover:text-slate-950" href="#integrations">
              Integrations
            </a>
            <a className="transition hover:text-slate-950" href="#pricing">
              Pricing
            </a>
            <a className="transition hover:text-slate-950" href="#start">
              Sign in
            </a>
          </nav>
          <a className={buttonVariants()} href="#start">
            Start private beta
            <ArrowRight data-icon="inline-end" />
          </a>
        </div>
      </header>

      <section id="top" className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-7">
          <Badge className="w-fit border-primary/20 bg-white text-primary" variant="outline">
            AI automation control room for agencies and operators
          </Badge>
          <div className="grid gap-5">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 md:text-7xl">
              Meridian
            </h1>
            <p className="max-w-2xl text-xl leading-8 text-slate-700">
              Monitor AI automations, catch failures, control cost and tokens, and prove client ROI from one graph-first workspace.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a className={buttonVariants({ size: "lg" })} href="#start">
              Sign in or register
              <ArrowRight data-icon="inline-end" />
            </a>
            <a className={buttonVariants({ size: "lg", variant: "outline" })} href="#product">
              View Automation Map
            </a>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div>
              <div className="font-semibold text-slate-950">Zero-idle defaults</div>
              Manual refresh and polling until a pilot needs background work.
            </div>
            <div>
              <div className="font-semibold text-slate-950">Client proof</div>
              Reports, CSV exports, periods, comparisons, and print-ready links.
            </div>
            <div>
              <div className="font-semibold text-slate-950">Ops evidence</div>
              Runs, alerts, logs, delivery status, billing history, and usage.
            </div>
          </div>
        </div>

        <ProductVisual />
      </section>

      <section id="product" className="border-y border-white/80 bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5">
          <div className="grid max-w-3xl gap-3">
            <Badge className="w-fit" variant="secondary">Automation Map first</Badge>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">A live map for the workflows clients depend on.</h2>
            <p className="text-lg leading-8 text-slate-600">
              Meridian starts with the graph because that is how agencies explain automation health: what runs, what it depends on, what broke, and what proof exists.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {valueCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title} className="bg-slate-50/70">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-slate-600">{card.body}</CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section id="integrations" className="mx-auto grid max-w-7xl gap-8 px-5 py-20">
        <div className="grid max-w-3xl gap-3">
          <Badge className="w-fit border-primary/20 bg-white text-primary" variant="outline">Integration paths</Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Meet teams where their automation already lives.</h2>
          <p className="text-lg leading-8 text-slate-700">
            Start with a guided REST metric setup, direct workflow telemetry, or reusable provider templates. Meridian keeps setup instructional without exposing secrets.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {integrationCards.map(([title, body]) => (
            <Card key={title} className="bg-white/80">
              <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge className="border-white/20 bg-white/10 text-white" variant="outline">Security and reliability</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Built for evidence, not secret sprawl.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <ShieldCheck className="size-5 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <LockKeyhole className="size-5 text-indigo-200" />
              Signed-out reports stay read-only and token-scoped.
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto grid max-w-7xl gap-8 px-5 py-20">
        <div className="grid max-w-3xl gap-3">
          <Badge className="w-fit border-primary/20 bg-white text-primary" variant="outline">Private beta pricing</Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Start conservatively, scale with credits.</h2>
          <p className="text-lg leading-8 text-slate-700">
            Plans include monthly usage, with prepaid credits available inside Billing after sign-in. Public pricing buttons lead to account creation, not checkout.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {MERIDIAN_PRICING_PLANS.filter((plan) => pricingPreviewNames.includes(plan.name)).map((plan) => (
            <Card key={plan.id} className="bg-white/85">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.summary}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <span className="text-3xl font-semibold">${plan.monthlyUsd}</span>
                  <span className="text-sm text-slate-500"> / mo</span>
                  <div className="text-sm text-slate-500">INR {plan.monthlyInr.toLocaleString("en-IN")} / mo</div>
                </div>
                <div className="grid gap-2 text-sm text-slate-600">
                  <div>{formatLimit(plan.workflowRunLimit)} workflow runs</div>
                  <div>{formatLimit(plan.metricSampleLimit)} metric samples</div>
                  <div>{formatLimit(plan.reportShareLimit)} client reports</div>
                  <div>{plan.retentionDays} day retention</div>
                </div>
                <a className={cn(buttonVariants({ variant: plan.id === "agency_beta" ? "default" : "outline" }), "w-full")} href="#start">
                  Choose {plan.name}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="start" className="border-t border-white/80 bg-white py-20">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-5">
            <Badge className="w-fit" variant="secondary">Sign in / register</Badge>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Open Meridian and start with the graph.</h2>
            <p className="text-lg leading-8 text-slate-600">
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

function ProductVisual() {
  return (
    <div className="relative rounded-3xl border border-white/80 bg-slate-950 p-4 shadow-2xl shadow-primary/20">
      <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.28),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.18),transparent_24%)]" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Network className="size-4 text-indigo-300" />
            Automation Map
          </div>
          <Badge className="border-emerald-300/20 bg-emerald-400/10 text-emerald-200" variant="outline">Live evidence</Badge>
        </div>
        <div className="grid gap-5 p-5">
          <div className="grid grid-cols-[1fr_38px_1fr_38px_1fr] items-center gap-3">
            <MapNode title="Dify chatbot" status="Healthy" metric="1.8s avg" />
            <MapEdge />
            <MapNode title="REST metric" status="Polling off" metric="$0 idle" />
            <MapEdge />
            <MapNode title="Client Proof" status="Ready" metric="30d report" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-slate-400">Success rate</div>
              <div className="mt-1 text-2xl font-semibold text-white">99.2%</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-slate-400">Tokens today</div>
              <div className="mt-1 text-2xl font-semibold text-white">42.8k</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-slate-400">Open incidents</div>
              <div className="mt-1 text-2xl font-semibold text-white">0</div>
            </div>
          </div>
          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-white">Client report preview</div>
                <div className="text-sm text-slate-400">Uptime, runs, cost, tokens, incidents, map image, and comparison badges.</div>
              </div>
              <FileCheck2 className="size-5 text-emerald-300" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniStat label="Runs" value="1,248" />
              <MiniStat label="Cost" value="$18.42" />
              <MiniStat label="Alerts" value="2 resolved" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MapNode({ title, status, metric }: { title: string; status: string; metric: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <Zap className="size-4 text-indigo-300" />
        {title}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-300">
        <span>{status}</span>
        <span>{metric}</span>
      </div>
    </div>
  )
}

function MapEdge() {
  return (
    <div className="flex items-center justify-center text-indigo-200">
      <GitBranch className="size-5" />
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  )
}
