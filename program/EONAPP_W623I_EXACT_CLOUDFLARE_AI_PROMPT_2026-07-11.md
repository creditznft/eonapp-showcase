# Exact Cloudflare AI prompt — W623I referral database activation

Paste the complete prompt below into Cloudflare AI while signed into the Cloudflare account that owns the `eonapp-ch` Pages project.

```text
Act as a cautious Cloudflare deployment engineer for my existing production Pages project `eonapp-ch`.

NON-DESTRUCTIVE RULES — THESE ARE MANDATORY:
- DO NOT delete, reset, rename, recreate, empty, restore, or replace any D1 database, Worker, Pages project, binding, environment variable, route, domain, identity table, billing table, or existing row.
- DO NOT create a new D1 database. I already have the required database.
- DO NOT touch `eonapp-identity-prod` (UUID 947300be-0e59-4fee-9587-27f11389d318) or `eonapp-identity-preview` (UUID 83b32cf2-67f1-4bbf-8c1d-b1d1517cf9fa).
- Keep the existing billing database `eonapp-billing` (UUID d1ed9744-bbe2-433a-aef1-ceecf212efdb) bound as `EON_BILLING_DB`.
- Do not add Workers AI, R2, KV, Queues, Durable Objects, cron triggers, click tracking, impression tracking, social-post tracking, or media storage.
- Do not enable a paid Cloudflare add-on or change the account plan without asking me first.
- Stop and report instead of guessing if the project name, database UUID, or binding target does not match exactly.

GOAL:
Use my existing empty/referral database `EONAPP_REFERRALS_DB` (UUID b90e38ad-8eaa-47e1-ba40-2d71b0c06d75) as the dedicated server authority for EONAPP signed referral attribution, EONKEY grants/reversals, feature/cosmetic unlocks, and small digital reward receipts. EONAPP monetises only through subscriptions. There are no in-app ads, rewarded ads, watch-to-unlock mechanics, cash rewards, subscription discounts, wallets, tokens, provider credits, or click rewards.

PERFORM THESE STEPS IN ORDER:
1. Inspect the `eonapp-ch` Pages project and report its current Production and Preview D1 bindings and variables. Redact all secret values.
2. Confirm D1 Time Travel is available for `EONAPP_REFERRALS_DB`, and capture/report the current bookmark before any schema change. Do not restore anything.
3. Add a Production D1 binding with variable name `EON_REFERRALS_DB` pointing to database UUID `b90e38ad-8eaa-47e1-ba40-2d71b0c06d75`.
4. Add the same Preview D1 binding only if Preview is intended to use this exact reviewed database; otherwise stop and tell me that a separate preview referral database is safer. Do not bind Preview to Production silently.
5. Keep `EON_BILLING_DB` unchanged and verify that it still points to `eonapp-billing` UUID `d1ed9744-bbe2-433a-aef1-ceecf212efdb`.
6. Apply the reviewed W623I referral schema to `EONAPP_REFERRALS_DB`. Create only these eight tables if they do not already exist:
   - eon_referral_bind_challenges
   - eon_referral_identities
   - eon_invite_accounts
   - eon_invite_events
   - eon_key_grants
   - eon_key_unlocks
   - eon_digital_rewards
   - eon_referral_billing_state
   Also create the reviewed indexes and the read-only view `eon_referral_operational_counts`. Use CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS / CREATE VIEW IF NOT EXISTS only. Never use DROP, TRUNCATE, DELETE, or destructive ALTER statements.
7. If you cannot access the reviewed SQL migration from the deployed source, stop and ask me to paste these files from the W623I source package instead of inventing SQL:
   - migrations/referrals/0001_referral_authority.sql
   - migrations/referrals/0002_referral_operational_views.sql
8. Verify the schema by returning table, index, and view names only. Do not display raw account IDs, emails, tokens, signatures, payment IDs, or row contents.
9. Add the normal text variable `EON_REFERRAL_ROLLOUT=testing` to Production. Do not set it to production yet.
10. Do not add any new secret. Do not alter Dodo webhook secrets or product IDs.
11. Review whether an account/path rate-limit feature is already included in my current Cloudflare plan. Do not enable a paid feature. If an included option exists, propose (but do not apply without my confirmation) a limit for POST `/api/referrals` around 30 mutations per signed-in account per 60 seconds or a conservative equivalent. GET status must remain usable. The application also supports an optional binding named `EON_REFERRAL_RATE_LIMITER`.
12. Redeploy only after the binding, migration, and testing variable are confirmed. Do not change custom domains or build commands.
13. After deployment, perform only safe public checks:
   - GET https://eonapp.ch/api/referrals
   - GET https://eonapp.ch/api/billing/referral-status
   Confirm `active: true`, `rollout: testing`, `databaseBinding: EON_REFERRALS_DB`, `databaseMode: dedicated`, `monetization: subscriptions-only`, `paidAdsInApp: false`, and `adViewRewards: false`.
14. Do not manufacture referral rewards, fake a Dodo webhook, shorten the 14-day retention period, or expose private rows. Two-account lifecycle proof will be run separately by Codex/owner.
15. Preserve a redacted evidence package for the final post-W640 Codex live certification. Codex must re-check all bindings, migrations, live routes, rollout/rollback behavior, D1 metrics, and two-account referral evidence before final GO/NO-GO.
16. Return a final change report with:
   - what was inspected;
   - exact binding changes;
   - migration result;
   - table/index/view counts;
   - Time Travel bookmark captured before migration;
   - rollout variable state;
   - deployment ID;
   - public endpoint results;
   - anything you could not do;
   - exact rollback steps (unset `EON_REFERRAL_ROLLOUT`; keep databases and rows intact).

Before executing, summarize the plan and explicitly confirm that you will not reset or delete anything. Then proceed only with the exact non-destructive steps above.
```
