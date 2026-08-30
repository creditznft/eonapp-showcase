# EONAPP retention notifications worker

Source-ready, deployment-disabled companion Worker for explicit one-time return reminders.

## RT86 architecture

The production-scale path is deliberately split into two stages:

1. In **Preview**, a one-minute Cron Trigger reads only due reminder metadata from the indexed identity D1 table, atomically leases up to 5,000 due reminders, and publishes compact IDs to a Cloudflare Queue.
2. The same Worker consumes queue batches (50 messages per invocation), loads only the leased reminder + the server-entitled active encrypted device subscriptions (Free/Trial 1; paid ceiling 5), and sends standards-based Web Push.

This keeps long-delay scheduling in D1 (reminders can be up to 30 days away) while using Queues only for short-lived fan-out/backpressure. The worker has no public `fetch()` route, no marketing campaign path, no user-authored push body, and no automatic enrollment.

Cost/scale controls in source:

- server-authoritative device allowance: Free/Trial 1, Plus 2, Studio 3, Power 4, Max 5;
- one pending return reminder per account;
- due-time partial D1 index and terminal-row cleanup indexes; superseded broad reminder/subscription indexes are dropped to reduce D1 write amplification;
- 5,000-reminder/minute release ceiling (7.2M/day theoretical release capacity before downstream limits);
- queue consumer batches of 50 with a 10-invocation concurrency ceiling to protect the single identity D1 and upstream Web Push endpoints;
- no D1 `last_success_at` write for every accepted retention push;
- permanent 404/410 push endpoints disabled;
- new delivered/cancelled reminders deleted immediately; legacy terminal reminders and disabled subscriptions pruned after 7 days;
- Worker CPU limit declared in Wrangler;
- local/default and Production keep `EON_PUSH_ROLLOUT=disabled`; Preview is `testing` so Codex can run closed-tab certification before any production promotion.
- local/default and Production also ship with `triggers.crons=[]`; Preview alone owns the one-minute Cron. Production promotion must explicitly enable the Cron in source, and rollback must remove it again.


## One-million-user operating guardrails

The launch topology intentionally keeps push custody in the existing `EON_IDENTITY_DB`. Cloudflare bills D1 by rows read/written and storage across the account, so splitting push into another D1 database is a capacity/isolation tool, not a way to make the same queries free. Avoid a pre-launch cross-database migration unless metrics show it is needed.

Operational thresholds for EONAPP (internal safety policy, not Cloudflare product limits):

- watch D1 `databaseSizeBytes`, rows written, query latency/overload errors, Queue backlog/retries and DLQ depth;
- start the dedicated push-D1 migration plan if the shared identity database is consistently around **6 GB**;
- complete that migration before the shared database reaches **8 GB**; never operate against Cloudflare's 10 GB per-database hard ceiling as a normal capacity target;
- keep Queue `max_concurrency` at 10 until measured D1/upstream latency proves a higher value is useful;
- keep reminder messages compact (<64 KB) so a normal successful Queue delivery remains approximately three Queue operations (write/read/delete);
- do not turn service-notification permission into marketing permission. Any future weekly/monthly re-engagement campaign must have separate explicit consent, frequency caps and a bulk-campaign scheduler that does not create one scheduled D1 reminder row per user per day.

At current Cloudflare Queues pricing, approximate Queue-only charges for compact messages on Workers Paid are:

- 10,000 delivered reminders/day: about 0.9M Queue operations/month, within the 1M included Queue operations;
- 50,000/day: about 4.5M operations/month, roughly **$1.40/month** Queue overage;
- 100,000/day: about 9M operations/month, roughly **$3.20/month** Queue overage;
- 500,000/day: about 45M operations/month, roughly **$17.60/month** Queue overage;
- 1,000,000/day: about 90M operations/month, roughly **$35.60/month** Queue overage.

Those figures exclude Workers CPU and D1 usage. D1 write amplification and the rest of the identity workload must be measured from Cloudflare's real `rows_written`/storage metrics before projecting a total bill. For one million registered users, the important variable is the **number of reminders actually sent per day**, not the registered-user count itself.

## Cloudflare resources Codex must provision before live proof

Create separate Preview and Production queues, then deploy the matching Wrangler environment:

- `eonapp-retention-notifications-preview`
- `eonapp-retention-notifications-production`

The configured dead-letter queues are:

- `eonapp-retention-notifications-preview-dlq`
- `eonapp-retention-notifications-production-dlq`

Bindings are non-inheritable in Wrangler, so Preview and Production queue/D1 bindings are declared independently in `wrangler.jsonc`. Cron triggers are also declared explicitly per environment for safety: Preview has `* * * * *`, while Production ships with `crons=[]`.

Before Codex/live certification, set these Worker secrets/vars through Cloudflare rather than Git:

- Preview uses source-controlled `EON_PUSH_ROLLOUT=testing`; Production remains source-controlled `disabled` until promotion.
- `EON_PUSH_VAPID_PUBLIC_KEY`
- `EON_PUSH_VAPID_PRIVATE_KEY`
- `EON_PUSH_VAPID_SUBJECT`
- `EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY`

Apply identity migrations through the existing controlled migration process before enabling the Worker. RT86 adds `0005_notification_scale_indexes.sql`.

Do not claim automatic retention marketing: the current server path is explicit service reminders only. A future re-engagement/marketing category would require a separate explicit consent and frequency policy rather than reusing service-notification consent.
