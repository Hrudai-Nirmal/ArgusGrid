# Changelog

## Unreleased

- Renamed the product, canonical domain, application surfaces, notifications, integrations, SDK previews, and operational tooling from ArgusGrid to Meridian.
- Added compatibility aliases for existing ingestion clients, signed webhook consumers, SDK callers, cron authentication, CSV metadata, and build metadata.
- Added Postgres-backed durable notification jobs with Inngest retries/recovery, queue diagnostics, job-status Logs filters, and owner/admin retry/cancel controls.
- Added SDK package publish-readiness checks, package-level READMEs, npm/Python metadata, JavaScript pack dry-run verification, and Python wheel verification.
- Published the JavaScript SDK as `@meridian-workflows/sdk` and added in-app node-specific SDK onboarding snippets in Integrations.
- Added a reusable live workflow demo that sends success, degraded, and failed Support Triage Agent runs through the published JavaScript SDK.
- Added a Dify support-triage workflow recipe for posting Dify workflow runs into Meridian with secret-safe setup docs and tests.
- Updated node summary cards to derive success rate, average latency, daily cost, and eval score from persisted workflow runs before falling back to seeded demo metrics.
- Improved API setup with contextual right-panel field guidance, conditional required auth fields, user-named auth headers, and functional custom-header endpoint polling.
- Added an evidence-backed Integrations setup wizard with provider steps, Dify Code/HTTP guidance, create-token/send-test/check-connection actions, and metric polling handoff.
- Smoothed live-update stream rollover so planned SSE reconnects do not flicker the badge from Live to Reconnecting unless the stream becomes stale.
- Added a dedicated Billing section with conservative USD/INR beta plan modeling, prepaid credit packs, bounded usage graphs, and owner/admin project operations policy controls.
- Clarified Billing usage as live bounded snapshots and added Operations Policy explainers for project scope and current advisory enforcement status.
- Added Razorpay Standard Checkout order creation, frontend modal launch from Billing, and server-side payment signature verification for test purchases.
- Made Billing checkout actions explicit with a visible Razorpay helper panel, `Upgrade to ...` plan buttons, and `Buy ... credits` credit-pack buttons.
- Made Billing checkout resilient when `NEXT_PUBLIC_RAZORPAY_KEY_ID` is missing by returning the public checkout key id from the authenticated order API.
- Added a dedicated `Test INR 1 payment` button in Billing for low-risk Razorpay checkout validation.

## 0.1.0

- Private-beta Meridian control room with project maps, telemetry ingestion, metric polling, alerts, reports, Logs, Testing, generic webhooks, Slack destinations, SDK previews, and production smoke checks.
- Enterprise foundation begins with CI, manual production smoke workflow, safe build metadata, and release discipline.
