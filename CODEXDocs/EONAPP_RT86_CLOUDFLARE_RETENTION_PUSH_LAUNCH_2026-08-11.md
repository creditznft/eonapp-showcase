# EONAPP RT86 — Cloudflare retention Web Push launch runbook

Date authority: 2026-08-11. This runbook is deployment guidance for Codex/owner-machine certification. It does **not** authorize production promotion by itself.

## 1. Release decision

Keep standards-based browser Web Push. RT86 changes the delivery path from direct 15-minute Cron fan-out to:

`indexed D1 due-reminder authority -> 1-minute Cron lease -> Cloudflare Queue -> bounded Queue consumer -> Web Push`

The source release ceiling is 5,000 due reminders/minute (7.2M/day theoretical release capacity), Queue consumer batches are 50, Queue autoscale is capped at 10 consumer invocations to protect the shared identity D1, and each consumer processes only four reminders concurrently. New terminal reminder rows are deleted immediately.

Current product consent is **service notifications + explicit one-time return reminders only**. It is not an automatic marketing/re-engagement campaign system. Do not reinterpret notification permission as marketing consent.

## 2. Cloudflare resource authority

Pages project: `eonapp-ch`

Preview D1:
- name: `eonapp-identity-preview`
- id: `83b32cf2-67f1-4bbf-8c1d-b1d1517cf9fa`

Production D1:
- name: `eonapp-identity-prod`
- id: `947300be-0e59-4fee-9587-27f11389d318`

Preview Queue / DLQ:
- `eonapp-retention-notifications-preview`
- `eonapp-retention-notifications-preview-dlq`

Production Queue / DLQ:
- `eonapp-retention-notifications-production`
- `eonapp-retention-notifications-production-dlq`

Worker config: `workers/eon-retention-notifications/wrangler.jsonc`

Rollout source state shipped to Codex:
- Pages local/default: `EON_PUSH_ROLLOUT=disabled`
- Pages Preview: `EON_PUSH_ROLLOUT=testing`
- Pages Production: `EON_PUSH_ROLLOUT=disabled`
- Worker local/default: `disabled`
- Worker Preview: `testing`
- Worker Production: `disabled`
- Worker Preview Cron: `* * * * *` (one minute)
- Worker Production Cron: `[]` (**disabled**)

Production therefore cannot become live just because secrets or resources exist. Its rollout and Cron scheduler are both source-disabled.

## 3. Secrets — critical shared-key rule

For each Cloudflare environment, generate one keyset and install the **same four values** into both:

1. Pages Functions (`eonapp-ch`), and
2. the matching retention Worker environment.

Required values:
- `EON_PUSH_VAPID_PUBLIC_KEY`
- `EON_PUSH_VAPID_PRIVATE_KEY`
- `EON_PUSH_VAPID_SUBJECT`
- `EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY`

Preview and Production should use different keysets. Within one environment, Pages and Worker must match exactly because Pages encrypts/stores the subscription and the Worker decrypts/sends it.

Generate a keyset without writing it to source:

```bash
npm run push:generate-secrets -- --subject https://eonapp.ch
```

Store the output in an approved password/secret manager. Do not commit it, paste it into handover documents, or put it into `wrangler.jsonc`.

## 4. Preview provisioning — do this first

### 4.1 Clean install and source gates

```bash
npm ci
npm run qa:rt86-retention-scale
npm run qa:institutional-ai-v2
npm run qa:launch95-final
npm run build
```

`qa:launch95-final` must pass from the real Git checkout. Do not substitute a ZIP-only source receipt for this step.

### 4.2 Inspect and apply Preview identity migrations

RT86 depends on identity migrations `0003`, `0004`, and new `0005_notification_scale_indexes.sql`. Let Wrangler apply only migrations not already recorded.

```bash
npx wrangler d1 migrations list eonapp-identity-preview --remote --env preview --config wrangler.jsonc
npx wrangler d1 migrations apply eonapp-identity-preview --remote --env preview --config wrangler.jsonc
npx wrangler d1 info eonapp-identity-preview --json
```

Save the migration output and database-size receipt in the Codex proof folder.

### 4.3 Create Preview Queue resources

```bash
npx wrangler queues create eonapp-retention-notifications-preview
npx wrangler queues create eonapp-retention-notifications-preview-dlq
```

If either already exists, verify it rather than creating a differently named replacement.

### 4.4 Bootstrap the Preview Worker safely

The first deploy is safe even before push secrets exist because `getEonWebPushConfig()` fails closed when the keyset is incomplete.

```bash
npx wrangler deploy --config workers/eon-retention-notifications/wrangler.jsonc --env preview
```

### 4.5 Install the Preview keyset in BOTH surfaces

Use the exact same generated Preview values in every command below. Prefer the interactive secret prompt so values are not stored in shell history.

Pages Preview:

```bash
npx wrangler pages secret put EON_PUSH_VAPID_PUBLIC_KEY --project-name=eonapp-ch --env preview
npx wrangler pages secret put EON_PUSH_VAPID_PRIVATE_KEY --project-name=eonapp-ch --env preview
npx wrangler pages secret put EON_PUSH_VAPID_SUBJECT --project-name=eonapp-ch --env preview
npx wrangler pages secret put EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY --project-name=eonapp-ch --env preview
```

Worker Preview:

```bash
npx wrangler secret put EON_PUSH_VAPID_PUBLIC_KEY --config workers/eon-retention-notifications/wrangler.jsonc --env preview
npx wrangler secret put EON_PUSH_VAPID_PRIVATE_KEY --config workers/eon-retention-notifications/wrangler.jsonc --env preview
npx wrangler secret put EON_PUSH_VAPID_SUBJECT --config workers/eon-retention-notifications/wrangler.jsonc --env preview
npx wrangler secret put EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY --config workers/eon-retention-notifications/wrangler.jsonc --env preview
```

Verify names are present; never print secret values into evidence:

```bash
npx wrangler secret list --config workers/eon-retention-notifications/wrangler.jsonc --env preview
```

### 4.6 Deploy the actual Preview candidate

Use a non-production Pages branch. `main` must not be used for the preview proof.

```bash
npm run build
npx wrangler pages deploy dist --project-name=eonapp-ch --branch=chatgpt/launch95
npx wrangler deploy --config workers/eon-retention-notifications/wrangler.jsonc --env preview
```

Record the Pages deployment URL/ID and Worker version.

## 5. Preview browser proof — closed-tab delivery

Use a signed-in owner test account in real Chrome first, then Edge. Do not automate away the browser permission prompt.

### Proof A — subscription + direct self-test

1. Open the Preview deployment.
2. Confirm `GET /api/notifications/config` returns `available:true` and a non-empty `applicationServerKey`.
3. Open Settings / Activity Center.
4. Click **Enable device alerts** yourself; grant browser notification permission.
5. Confirm the server registration succeeds and Background Push shows enabled.
6. Click **Send test** once.
7. Close the EONAPP tab before the push arrives.
8. Confirm the OS/browser notification appears with no EONAPP tab open.
9. Click the notification and confirm it reopens only a safe same-origin EONAPP route.
10. Repeat in Edge.

If the whole browser process is explicitly force-quit, delivery behavior can depend on browser/OS background-push policy. The certification requirement is page/tab closed; also record whether the owner device delivers with browser windows closed.

### Proof B — real Cron -> Queue -> Worker -> Web Push

The public UI intentionally exposes only 1h / tomorrow / 3d presets. For certification only, an authenticated owner can schedule the API's minimum five-minute reminder from the Preview browser console:

```js
await fetch('/api/notifications/reminder', {
  method: 'POST',
  credentials: 'same-origin',
  headers: { 'content-type': 'application/json', accept: 'application/json' },
  body: JSON.stringify({
    dueAt: Date.now() + 5 * 60 * 1000,
    route: '/',
    consent: 'service-return-reminder-v1'
  })
}).then(r => r.json())
```

Then close the EONAPP tab. Expected result within the Cron/Queue delivery window:
- one notification arrives;
- no duplicate push;
- reminder row is deleted after at least one push endpoint accepts delivery;
- active subscription remains enabled;
- Preview Queue backlog returns toward zero;
- Preview DLQ remains empty;
- no first-party Worker exception or D1 overload error appears.

This proof is mandatory because `/api/notifications/self-test` proves Web Push custody/delivery but does not prove the RT86 Cron -> Queue path.

## 6. Cost/scale acceptance

Cloudflare pricing/limits must be rechecked on deployment day. Snapshot used for RT86 decision on 2026-08-11:

- Queue throughput: 5,000 messages/sec per queue; max consumer batch 100; up to 250 concurrent consumer invocations. EONAPP deliberately uses batch 50 and max concurrency 10.
- Queues Paid: first 1M operations/month included, then $0.40/million; a normal compact delivered message is commonly ~3 operations (write/read/delete); no Queue egress charge.
- Workers Paid: $5/month minimum account charge, 10M requests/month included then $0.30/million, 30M CPU-ms/month included then $0.02/million CPU-ms; outbound Worker subrequests are not billed as Worker requests.
- D1 Paid: first 25B rows-read/month included; first 50M rows-written/month included then $1/million; first 5GB stored included then $0.75/GB-month.
- D1 hard limit: 10GB per database. One D1 database is single-threaded and should be scaled horizontally when it becomes a throughput/storage hotspot.

Queue-only estimate for compact successful reminder messages:

| Delivered reminders/day | Approx queue ops/month | Approx Queue overage |
|---:|---:|---:|
| 10,000 | 0.9M | $0 |
| 50,000 | 4.5M | $1.40 |
| 100,000 | 9M | $3.20 |
| 500,000 | 45M | $17.60 |
| 1,000,000 | 90M | $35.60 |

These are **Queue-only** estimates. D1 and CPU must be measured from Cloudflare metrics. Registered-user count is not the direct cost driver; actual reminders delivered is.

At 1M registered users, this architecture is comfortable for normal opt-in reminder usage. At sustained volumes approaching hundreds of thousands to one million reminders/day, D1 throughput/write metrics become the primary scaling signal, not Queue price.

Internal EONAPP guardrails:
- keep Queue `max_concurrency=10` until metrics prove higher is useful;
- alert on D1 overload errors, abnormal query latency, Queue retry growth, non-zero DLQ, or backlog that remains >10 minutes;
- start a dedicated push-D1 isolation plan around 6GB shared identity D1 size;
- complete that migration before 8GB; never plan to operate at the 10GB hard ceiling;
- use Cloudflare D1 `meta.rows_read` / `meta.rows_written` and dashboard Row Metrics for real billing projections rather than estimating index write amplification indefinitely.

## 7. Production promotion — only after all launch proofs pass

Do **not** set production rollout in the dashboard as an untracked override. `wrangler.jsonc` is the source authority.

After Preview closed-tab, five-minute Queue proof, Chrome/Edge/mobile Launch95 proof, performance proof, and owner acceptance are all green:

1. Generate a **new Production keyset**; never reuse Preview secrets.
2. Create production Queue + DLQ if absent.
3. Inspect/apply production identity migrations.
4. Install the same Production keyset in Pages Production and Worker Production.
5. Change exactly these three source values:
   - `wrangler.jsonc` -> `env.production.vars.EON_PUSH_ROLLOUT`: `disabled` -> `production`
   - `workers/eon-retention-notifications/wrangler.jsonc` -> `env.production.vars.EON_PUSH_ROLLOUT`: `disabled` -> `production`
   - `workers/eon-retention-notifications/wrangler.jsonc` -> `env.production.triggers.crons`: `[]` -> `["* * * * *"]`
6. Rerun `npm run qa:launch95-final`, `npm run qa:rt86-retention-scale`, full maintained tests, build, secret scan and owner-machine browser proofs.
7. Deploy the production Pages build and production retention Worker.
8. Run one owner-device production self-test and one five-minute production Queue proof before general launch.

Production resource commands:

```bash
npx wrangler queues create eonapp-retention-notifications-production
npx wrangler queues create eonapp-retention-notifications-production-dlq
npx wrangler d1 migrations list eonapp-identity-prod --remote --env production --config wrangler.jsonc
npx wrangler d1 migrations apply eonapp-identity-prod --remote --env production --config wrangler.jsonc
```

Deploy only after the two rollout values **and Production Cron** are intentionally changed and committed:

```bash
npm run build
npx wrangler pages deploy dist --project-name=eonapp-ch --branch=main
npx wrangler deploy --config workers/eon-retention-notifications/wrangler.jsonc --env production
```

## 8. Emergency rollback

Push must never block EONAPP core functionality.

Fast rollback authority:
1. set Production rollout back to `disabled` in **both** source configs and set Worker Production `triggers.crons=[]`;
2. rerun the RT86/source gate;
3. deploy Pages Production and Worker Production;
4. if bad Queue messages exist, pause Queue delivery and purge only after recording evidence;
5. leave user subscriptions encrypted in D1 unless a custody/security reason requires deletion; disabled rollout simply stops delivery;
6. investigate before re-enabling.

A broken retention Worker is a notification incident, not a reason to roll back the entire City/AI application if the rest of the release is healthy.

## 9. Evidence Codex must return to the owner

Do not claim RT86 production-ready without:
- exact Git SHA / clean tree receipt;
- `qa:launch95-final` PASS;
- `qa:rt86-retention-scale` PASS;
- maintained-suite receipt;
- build receipt;
- Preview D1 migration list/apply receipt;
- Preview Queue + DLQ existence;
- secret **names** present on Pages + Worker (values redacted/not printed);
- `/api/notifications/config` available=true;
- Chrome closed-tab self-test PASS;
- Edge closed-tab self-test PASS;
- five-minute Cron -> Queue -> Worker -> push PASS;
- Queue backlog returns to zero/normal and DLQ zero;
- D1 reminder terminal row deleted after accepted delivery;
- no D1 overload / first-party Worker errors;
- production rollout still `disabled` until the separate promotion decision;
- Production Cron still `disabled` (`crons=[]`) until that same promotion decision.

## 10. Official Cloudflare references checked for RT86

Re-verify before deployment because limits/pricing can change:
- Cloudflare Queues limits and pricing
- Cloudflare Workers pricing and limits
- Cloudflare D1 limits/pricing
- Wrangler Pages secrets
- Wrangler Worker secrets
- Wrangler Queue creation
- D1 migrations commands
- Pages Wrangler configuration/environment overrides
