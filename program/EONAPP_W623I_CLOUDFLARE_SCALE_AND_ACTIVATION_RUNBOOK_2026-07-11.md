# W623I — Cloudflare scale and referral activation runbook

Date: 2026-07-11  
Live mutation status: not executed in this source environment

## CEO database decision

Keep all four existing databases. Do not reset Cloudflare.

| Database | Role | Decision |
|---|---|---|
| `eonapp-billing` | Dodo events and subscription entitlement truth | Keep; bind as `EON_BILLING_DB` |
| `EONAPP_REFERRALS_DB` | Referral identity, qualification, EONKEYS, reversals and digital reward receipts | Keep; bind as `EON_REFERRALS_DB` |
| `eonapp-identity-prod` | Production identity/account state | Keep untouched |
| `eonapp-identity-preview` | Preview identity state | Keep untouched |

The dedicated referral database is already present, so this wave creates no database. Separation is preferred because referral growth can scale independently from billing while preserving small, indexed, account-scoped queries.

## Why not reset

A reset would destroy evidence, increase deployment risk and solve no scaling problem. D1 is designed to scale horizontally across smaller databases. The operational trigger is database size and query efficiency, not the current tiny database size.

## Binding

Production Pages binding:

```text
Variable name: EON_REFERRALS_DB
D1 database: EONAPP_REFERRALS_DB
Database UUID: b90e38ad-8eaa-47e1-ba40-2d71b0c06d75
```

Keep:

```text
EON_BILLING_DB -> eonapp-billing
```

## Migration commands for Codex/owner terminal

Capture a non-destructive Time Travel bookmark first:

```bash
npx wrangler d1 time-travel info EONAPP_REFERRALS_DB
```

Apply the schema:

```bash
npx wrangler d1 execute EONAPP_REFERRALS_DB --remote --file=migrations/referrals/0001_referral_authority.sql
npx wrangler d1 execute EONAPP_REFERRALS_DB --remote --file=migrations/referrals/0002_referral_operational_views.sql
```

Verify names only:

```bash
npx wrangler d1 execute EONAPP_REFERRALS_DB --remote --command="
SELECT type, name FROM sqlite_schema
WHERE name LIKE 'eon_%' OR name LIKE 'idx_eon_%'
ORDER BY type, name;"
```

Set:

```text
EON_REFERRAL_ROLLOUT=testing
```

Then redeploy.

## Scaling rules

- Review schema and query metrics at 7 GB.
- Prepare deterministic sharding before 8 GB.
- Never allow one referral database to approach the 10 GB per-database ceiling without a tested shard migration.
- Proposed future shard key: stable hash prefix of account ID, never email or raw identity data.
- Do not store clicks, impressions, social posts, prompts, media, chat history, large JSON or analytics events in referral D1.
- Keep queries indexed and account-scoped.
- No read replication is required at launch; consider D1 Sessions/read replication only when measured global read latency or throughput justifies it.

## Rate limiting

The source supports an optional `EON_REFERRAL_RATE_LIMITER` binding. Without it, the route remains protected by sign-in, same-origin mutation enforcement, 12 KiB request limits, proof-of-possession, idempotency and reward caps. When configured, the application rejects excess mutation attempts with HTTP 429 before a D1 write.

Recommended starting policy: 30 POST mutations per signed-in account plus action per 60 seconds. This is abuse protection, not accounting.

## Cross-database reliability

Dodo writes billing truth to `EON_BILLING_DB`. Referral qualification writes to `EON_REFERRALS_DB`. If the referral write fails after billing succeeds, Dodo receives a retryable failure. A duplicate webhook replay re-runs the idempotent referral delivery even though the billing event already exists.

The referral database mirrors only:

- current paid/free/revoked state;
- tier ID;
- paid-since timestamp;
- source event reference;
- subscription reference required for reversal correlation.

It does not duplicate the full Dodo payload or billing ledger.

## Rollback

Unset `EON_REFERRAL_ROLLOUT` and redeploy. Do not delete tables or rows. Sharing and subscriptions continue; new grants/redemptions stop. The existing records remain auditable.

## Post-W640 Codex live verification

The final Codex handover must inspect all Pages/Worker routes and bindings live, confirm no unnecessary Worker intercepts static assets, record Worker request/CPU and D1 row metrics, run query-plan checks for all referral lookups, exercise testing and production kill switches, complete two-account referral proof, validate Dodo replay/reversal, and save redacted evidence.
