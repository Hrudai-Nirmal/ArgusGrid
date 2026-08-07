# Private-Beta QA Checklist

Use this checklist for production validation on `https://meridian.hrudainirmal.in`. Create only disposable test projects, test reports, test webhooks, and test Slack destinations.

## Setup

- Use an owner/admin account for full coverage.
- Keep a signed-out/private browser window ready for report-link checks.
- Prepare a temporary generic webhook receiver, such as webhook.site.
- Prepare a disposable Slack incoming webhook URL for Slack checks.
- Use a safe test recipient for email checks.

## Sign-In And Onboarding

- Fresh signed-out browser lands on the Meridian sign-in screen with GitHub, Google, and email/password options.
- New-user onboarding can create a blank project.
- New-user onboarding can create the demo project.
- Returning users land in the dashboard without repeated onboarding.
- Control Room shows the pilot setup checklist with project, node, integration, real signal, alert rule, and client proof steps.
- Confirm the checklist does not mark `First real signal received` complete until a persisted workflow run or metric sample exists.
- Click `Copy setup packet` and confirm it copies project/node setup details and SDK install guidance without raw tokens, webhook URLs, Slack URLs, signing secrets, encrypted payloads, or env values.
- Confirm the dashboard header does not show `Sign out`.
- Open `Account`, confirm signed-in identity, organization, current project, Team/Settings shortcuts, and the only visible `Sign out` action.
- `/api/health` returns safe readiness JSON without raw secret values.
- `/api/health` includes safe version, commit, build time, and environment metadata.
- `/api/health` includes runtime metadata for Production/Preview/Local, deployment URL, side-effect policy, background-job policy, cron policy, and safe warnings.
- A database outage disables sign-in, shows a safe incident ID, and emits a matching structured runtime log without connection strings or credentials.

## Projects

- Create a disposable project.
- Rename the project and confirm the new name persists after refresh.
- Switch between projects from the Projects section.
- Archive only the disposable project and confirm it leaves the active list.

## Global Search

- Click the header search and confirm the command palette opens.
- Press `Cmd/Ctrl+K` and confirm it opens from any main dashboard section.
- Press `/` outside an input field and confirm it opens without typing into the page.
- Search for a node name, alert title, run external id, report title, integration provider, and notification job status.
- Confirm selecting results navigates to the right section, selects the node/alert where applicable, and can open Logs filtered to failed jobs.
- Confirm result rows never show raw ingestion tokens, webhook URLs, Slack URLs, signing secrets, encrypted payloads, env values, or private credential bodies.

## Billing And Account Management

- Open `Billing` from the main sidebar and confirm it is separate from `Account`, `Settings`, and `Testing`.
- Confirm Plans show Free Sandbox, Solo Beta, Agency Beta, and Enterprise Pilot with USD and INR monthly rates.
- Confirm Credit pool shows 500, 2,000, and 10,000 credit packs with USD and INR rates.
- In Paddle sandbox, create monthly prices for Solo Beta, Agency Beta, and Enterprise Pilot plus one-time prices for 500, 2,000, and 10,000 credit packs. Add the Paddle client-side token, matching `NEXT_PUBLIC_PADDLE_PRICE_*` values, server-side sandbox API key, `PADDLE_ENVIRONMENT=sandbox`, and `PADDLE_NOTIFICATION_WEBHOOK_SECRET` to Vercel Production, then redeploy.
- Confirm the Paddle notification destination points at `https://meridian.hrudainirmal.in/api/paddle/webhook` and subscribes to customer, subscription, and transaction lifecycle events.
- Click a paid plan or credit-pack checkout button and confirm the Paddle overlay opens. In Paddle sandbox, use card `4242 4242 4242 4242`, any name, any future expiry, and security code `100`.
- Confirm completed Paddle checkout says Meridian is waiting for the verified Paddle webhook.
- Confirm failed payment and modal dismiss states show clear non-secret messages.
- Click `Refresh status` after the webhook arrives and confirm Subscription management shows the mirrored plan/customer state and Billing history shows the transaction.
- Confirm Subscription management shows `Billing sync health`, including checkout readiness, signed confirmation readiness, account portal readiness, latest signed confirmation timestamp/type/status, and failed confirmation count.
- Temporarily test a missing/invalid notification-secret setup in a safe environment and confirm `Billing sync health` shows a setup warning without exposing provider secrets, webhook URLs, raw provider payloads, payment credentials, or env values.
- Confirm `Billing alerts` shows low-credit, credits-exhausted, Plan limit approaching, payment-attention, grace-ending, and rate-limit warning states when the underlying safe entitlement evidence is present.
- Trigger a disposable workflow ingestion `402` or `429` and confirm a durable billing email notification job is queued for eligible email-notification recipients without consuming customer credits.
- Click `Download invoice` for a billed/completed transaction and confirm the PDF download opens only for a user with access to the current project.
- As an owner/admin, click `Manage subscription` and confirm the billing portal opens. Confirm viewers cannot mint a portal session.
- Confirm Billing shows entitlement source, current period, usage rows, credits used, `Credits remaining`, and recent credit ledger entries.
- If a plan payment transaction appears before its subscription webhook, confirm Billing shows provisional paid access rather than blocking the user as Free Sandbox.
- Cancel a test subscription and confirm paid access remains during the one-week grace period from the last known billing period end, then falls back when grace ends.
- Force a disposable project over a free/small limit and confirm workflow ingestion, metric sample persistence, notification jobs, or report share creation consume credits or return a safe `402` with plan/limit/credit context. Confirm Billing shows low-credit/rate-limit warnings without exposing provider credentials.
- Confirm Usage graphs load live bounded 30-day snapshots for nodes, workflow runs, metric samples, notification jobs, report links, and active telemetry tokens.
- Refresh usage and confirm counts remain secret-safe: no raw tokens, webhook URLs, Slack URLs, signing secrets, encrypted payloads, env values, or credential bodies.
- Click `Know more` in Operations Policy and confirm the explainer says policies are project-specific and enforced for polling cadence, manual retention cleanup, and spend behavior.

## Login QA

- Confirm signed-out users can continue with GitHub when GitHub OAuth is configured.
- Configure Google OAuth with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then confirm `Continue with Google` reaches Google and returns to Meridian.
- Create an email/password account with a 12+ character password and confirm it enters the normal onboarding/workspace flow.
- Confirm duplicate email registration returns a safe error and no raw password appears in logs, UI, network responses, or database-facing output.
- As an owner/admin, change Operations Policy values for mode, polling frequency, notification reliability, retention, and spend protection; save and confirm the success message.
- As a viewer/member where possible, confirm Operations Policy save controls are unavailable or rejected.
- Open `Account` and confirm signed-in identity, organization, current project, Team/Settings shortcuts, and the only visible `Sign out` action.

## Interactive Tutorial

- Clear `meridian-tutorial:first-workflow:v1` from localStorage and open a no-telemetry disposable project; confirm the tutorial auto-starts.
- Confirm the page is not dimmed and the underlying app remains clickable while the tutorial is active.
- Confirm the widget starts bottom-center, can be dragged to snap to an edge/corner, and can hide/show through the compact `Show tutorial ^` tab.
- Confirm `Open the automation map` and `Open integration templates` mark complete after those steps are visited.
- Confirm tutorial steps highlight actual REST metric setup components across Automation Map, Integrations, Testing, and Reports.
- Confirm the evidence progress bar starts from the tutorial-start baseline, ignores sample fallback rows, and advances after a node exists, a real metric sample arrives, and a report link is created.
- Click `Check progress` and confirm it refreshes evidence without exposing secrets.
- Confirm `Back`, `Next`, `Skip`, and `Finish` work.
- Confirm Skip/Finish prevents auto-start after refresh.
- Click `Start tutorial` in Control Room and confirm the tutorial restarts from the evidence-appropriate step.
- Confirm missing targets show fallback copy instead of breaking the dashboard.
- Confirm tutorial copy never exposes raw tokens, webhook URLs, Slack URLs, signing secrets, encrypted payloads, env values, or credential bodies.

## Automation Map

- Open Automation Map and confirm there is no React Flow attribution watermark.
- Confirm minimap, zoom controls, dot grid, status badges, and node inspector remain visible.
- In view mode, verify node handles are visible but cannot create new links.
- Enable Edit mode, drag a node, wait for autosave, refresh, and confirm position persists.
- Drag an output handle to another node's input handle and confirm a visual link appears.
- Click a link, edit the label, wait for autosave, refresh, and confirm the label persists.
- Try a self-link and an exact duplicate link; confirm neither is created.
- Export PNG and confirm the downloaded/current map image is readable.
- Upload a small PNG/SVG custom icon to a disposable node and confirm validation feedback.

## Runs And Telemetry

- Create or reuse a disposable ingestion token.
- Confirm the raw token is shown once and later lists only safe prefix metadata.
- Revoke a disposable token and confirm future ingestion with it is rejected.
- Post a valid `/api/ingest/runs` payload for a selected node.
- Send repeated disposable telemetry quickly enough to hit the per-token limit; confirm over-limit requests return `429` and include a `Retry-After` header.
- In Integrations, confirm telemetry templates show the `npm install @meridian-workflows/sdk` onboarding block with the selected node id and no real token value.
- Run the JavaScript or Python SDK example script from `docs/sdk.md` against a disposable token.
- Run `examples/live-workflow` in success, degraded, and failed modes against a disposable token.
- Build the Dify workflow from `examples/dify-support-triage`, run it in success, degraded, and failed modes, and confirm each run appears in Meridian.
- Confirm the example output does not print the ingestion token.
- Run `npm run sdk:verify` locally or in CI before handing SDK instructions to a beta user.
- Confirm Runs updates with status, timestamps, cost/tokens when supplied, and step details.
- Confirm the selected node's summary cards switch from seeded defaults to run-derived success rate, average latency, daily cost, and eval score after telemetry arrives.
- Confirm live indicator updates or manual refresh brings the new run into view.
- Background the dashboard tab, return to it, and confirm the live indicator reconnects without a page reload.

## Polling, Metrics, And Alerts

- Configure a node with the demo metric shortcut.
- Set a cadence above one minute and confirm scheduled polls do not create a sample on every scheduler tick.
- Run manual poll from Testing.
- Confirm the selected node shows the deterministic `95 score` sample and trend/freshness details.
- Confirm a matching threshold alert opens once and does not duplicate while unresolved.
- Set Repeat suppression to `1`, trigger the same breach twice inside a minute, and confirm the existing incident shows a higher occurrence count and newer last-seen time instead of a duplicate row.
- Trigger the same breach after the suppression window and confirm Meridian still keeps one grouped incident while allowing a repeat notification/job.
- In the selected node Alert Rule dialog, apply a metric threshold template and confirm the mapping, threshold, severity, and enabled state are prefilled.
- Apply metric anomaly templates for high, low, and both directions; confirm sample-history preview still shows baseline/wait-state details.
- Apply a workflow-run template such as failed/degraded run, run duration, cost, tokens, failure rate, or average latency.
- Send matching Dify/SDK/API run telemetry and confirm run-source rules open alerts after ingestion.
- Confirm metric polling does not evaluate run-source rules, and workflow-run ingestion does not evaluate metric-source rules.
- Resolve/ignore the alert and confirm alert detail, node status, Logs, and notifications update.
- Confirm anomaly alert preview explains sample count, baseline, standard deviation, and wait state when history is insufficient.

## Reports

- Open Reports and fill title, client name, subtitle, prepared by, executive note, and expiry.
- Save the current report defaults as a preset, reload presets, apply it, and delete it.
- Create reports with 7d, 30d, 90d, all-data, and custom start/end periods.
- Confirm previous-period comparison can be enabled for bounded periods and is disabled for all-data reports.
- Upload a small PNG/SVG brand image and confirm the in-app preview shows it in the report header.
- Try an oversized or unsafe SVG brand image and confirm it is rejected without creating a link.
- Attach the current map and confirm the in-app preview includes the map and summary metrics.
- Create a report link and open it in a signed-out/private browser.
- Confirm the public report header shows the uploaded brand image when present.
- Confirm the public report shows the period label, comparison notes when enabled, and an active/resolved incident timeline.
- Confirm repeated incidents show occurrence count and last-seen evidence in public report incident timelines.
- Confirm comparison badges clearly show direction and tone for runs, success rate, score, spend, and tokens.
- Click `Copy client summary` and confirm the copied text is readable, client-safe, and contains no secrets.
- Filter the public incident timeline by All, Active only, and Resolved only.
- Confirm the public report is read-only and does not expose secrets, tokens, credentials, or private team data.
- Use Print / Save PDF and confirm print layout is clean.
- Revoke the report link and confirm the public page, brand image, and map image no longer open.
- Download CSV exports for runs, metrics, and alerts as an owner/admin; confirm they are bounded, open cleanly, and contain no secrets.

## Integrations

- In Integrations, create a disposable telemetry token from the selected provider setup.
- Confirm setup snippets include placeholders or the one-time token only where expected.
- Confirm Dify, n8n, GitHub Actions, and JavaScript SDK templates show provider-specific step badges, setup copy, status badges, and a provider first-signal card that reaches the real-run-received state without exposing the token.
- In the Dify wizard, confirm Code-node and HTTP Request-node guidance includes the selected node id, uses `<ingestion-token>` placeholders, and never exposes a real token unless one was just created for one-time copy.
- Create a generic webhook destination with a temporary HTTPS receiver.
- Confirm the signing secret is shown once and never returned after refresh.
- Test the webhook and confirm receiver headers and payload are safe.
- Create a Slack destination with a disposable Slack incoming webhook URL.
- Confirm the Slack destination list never shows the URL.
- Test Slack from Integrations and confirm Slack receives the Block Kit message.
- Disable webhook/Slack destinations and confirm disabled destinations do not receive events.
- Create a remediation action with a temporary HTTPS receiver, `Manual approval`, `Critical only`, and a short cooldown.
- Confirm the remediation signing secret is shown once and never returned after refresh.
- Test the remediation action from Integrations and confirm the receiver sees `remediation.test`, `dryRun: true`, and HMAC headers.
- Trigger a disposable alert, open alert detail, click `Run action`, and confirm latest remediation action status appears without exposing the action URL or signing secret.
- Switch a disposable action to `Automatic on alert`, trigger a new matching incident, and confirm exactly one action attempt appears while grouped repeats respect cooldown/no-duplicate behavior.

## Testing

- Confirm readiness cards show database connectivity, database schema, auth, encryption, cron, email, Inngest jobs, and poll status.
- Confirm runtime safety shows Production on `https://meridian.hrudainirmal.in` with external side effects, background jobs, and cron enabled.
- Confirm any Preview/local runtime clearly shows non-production status and does not send email, Slack, webhooks, or endpoint polling unless explicitly opted in.
- In `Idle posture`, confirm Inngest recovery, retention cleanup, scheduled polling, and live refresh are manual/off by default.
- Confirm `Idle posture` shows effective project policy rows with `Enforced` status.
- Confirm `Recover queued jobs now`, `Run retention cleanup now`, and `Poll project now` are owner/admin-only and write safe Logs evidence.
- Confirm the dashboard header starts in Manual mode, does not open live SSE on load, and only switches to live checks after clicking `Go live`.
- In `Production observability`, click Refresh overview and confirm Ready/Warning/Blocked cards render for dependencies, runtime safety, polling, notification jobs, and usage guardrails.
- Confirm `Production observability` evidence and runbook labels are secret-safe and that non-owner/admin roles cannot load the overview route.
- Queue email, webhook, and Slack tests; confirm the UI follows each job from queued to a terminal result.
- In `Notification jobs`, verify counts, refresh, failed-job retry, queued/retrying cancellation, and owner/admin enforcement.
- In `Project usage`, click Refresh usage and confirm 30-day counts, active ingestion token count, ingestion rate limits, and retention policy rows render without exposing secrets.
- Use a failing disposable webhook and confirm retry progress before the job becomes failed.
- Confirm Deployment readiness shows safe version, commit, build time, environment metadata, and `Database schema current`.
- Run manual poll and confirm latest poll metadata updates.
- For REST metric onboarding, save API setup on a selected node, use the node inspector's `REST metric first signal` card to run the first poll, and confirm `Real sample received` shows a real persisted metric value and timestamp.
- Send test email and confirm success/failure feedback does not expose provider secrets.
- Send generic webhook, Slack, and remediation action tests from Testing.
- Run integration readiness/test-run shortcuts for the selected node.
- Confirm endpoint/API setup shortcuts route back to the selected node workflow.
- In API setup, confirm selecting an auth type reveals required auth header and secret fields, custom headers send the secret in the named header, and the right-side help panel updates as each field is focused.

## Logs

- Filter Logs by 24h, 7d, 30d, and All.
- Filter by Activity, Alerts, Polling, Deliveries, Runs, Reports, Webhooks, Actions, Team, and Map.
- Filter notification jobs by queued, running, retrying, sent, failed, skipped, and cancelled status.
- Search for a known report, webhook, Slack destination, remediation action, token, or alert action.
- Confirm log rows show timestamp, type, title/action, entity, status, context, and safe metadata.
- Confirm Logs shows returned/limit/truncation metadata for the current filter.
- Confirm Logs never expose raw tokens, webhook secrets, Slack URLs, encrypted payloads, env values, or private credential bodies.
- Confirm notification job rows expose attempts and safe summaries, never provider URLs, keys, or message payloads.

## Team Access

- Confirm Team shows `Project Access Review` and `Role Capability Matrix`.
- Confirm viewer copy says viewers can inspect safe dashboards/logs/reports but cannot mutate configuration or export data.
- Invite a disposable email as Viewer, then invite it again and confirm Meridian reports the existing pending invite instead of creating a duplicate row.
- Cancel the pending invite and confirm Logs shows safe team audit evidence.
- Confirm owner/admin users can change non-owner roles and remove non-owner members.
- Confirm members/viewers cannot create generic webhook destinations, Slack destinations, telemetry tokens, report links, report presets, CSV exports, project edits, or team invites.
- Confirm members can still edit map/nodes/API metric setup and alert rules where the matrix says allowed.

## Security Hardening

- Confirm `/` and `/api/health` include browser security headers: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-Frame-Options`.
- Confirm the global `Permissions-Policy` still denies camera, microphone, geolocation, payment, accelerometer, gyroscope, USB, and browser topics.
- Confirm public report pages and report image routes are no-store, revoked/expired links return 404, and report pages never show private team data.
- Confirm owner/admin-only routes reject member/viewer access for telemetry tokens, webhooks, Slack destinations, remediation actions, report shares, report presets, CSV exports, manual polling, notification-job retry/cancel, and production observability.
- Confirm logs, reports, exports, observability, and onboarding snippets do not expose raw tokens, webhook URLs, Slack URLs, signing secrets, encrypted payloads, database URLs, OAuth secrets, cron secrets, email provider keys, or env values.

## Settings

- Confirm Settings is configuration-only.
- Save notification preferences and confirm a visible success result.
- Confirm telemetry/environment configuration remains secret-safe.
- Confirm diagnostic actions live in Testing, not Settings.

## Final Pass

- Test desktop at 1440px wide and a smaller laptop/tablet width.
- Toggle light/dark mode and confirm readable text, borders, controls, graph dots, and report surfaces.
- Run `SMOKE_BASE_URL="https://meridian.hrudainirmal.in" npm run test:smoke`.
- After Vercel deploys `main`, run `npm run prisma:deploy`, then `npm run release:check`, then manually dispatch the GitHub Actions `Production smoke` workflow.
- Record failures as separate fix tasks with reproduction steps and screenshots when useful.
