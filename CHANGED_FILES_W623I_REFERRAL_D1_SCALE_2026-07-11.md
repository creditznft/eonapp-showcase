# W623I — Dedicated Referral D1 Scale Architecture And Cloudflare Activation Kit

Date: 2026-07-11  
Status: source-complete; live Cloudflare and physical-device evidence pending  
Source revision: `409177a04061e9fe275889147cd205d54c39ad22`

## CEO decision

Use the already-existing Cloudflare database `EONAPP_REFERRALS_DB` as the dedicated referral/reward authority, bound to Pages Functions as `EON_REFERRALS_DB`. Keep `eonapp-billing` as `EON_BILLING_DB` for Dodo and subscription entitlement truth. Do not reset, delete or recreate any database.

## What changed

- Added dedicated referral-database selection with a visible temporary billing fallback.
- Added an eight-table, eleven-plus-index non-destructive migration and privacy-safe counts view.
- Added minimal paid-state mirroring so the referral database does not query billing tables.
- Repaired split-database webhook delivery on duplicate Dodo replay.
- Added optional account/action rate limiting before D1 mutation.
- Updated EONKEY rollout copy and public status with database binding/mode truth.
- Added 7 GB review and 8 GB shard-preparation thresholds.
- Added the exact non-destructive Cloudflare AI prompt and migration/rollback runbook.
- Added the cumulative post-W640 Codex live-certification backlog.
- Preserved subscriptions-only monetisation and zero click/impression/social-post/media tracking.

## Validation

- W623I gate: 16/16
- W623I split-D1 tests: 4/4
- W623H compatibility gate: 20/20
- W623H lifecycle tests: 3/3
- W623C commercial truth: 64/64
- W623D reachability tests: 5/5
- Production reachability: 344 files / 593 edges / zero quarantined modules
- W623F certification v2: 24/24; release remains NO-GO
- Targeted ESLint: zero errors and zero warnings
- Secret scan: 3,393 text files; zero potential secrets
- Production build: passed
- Distribution files: 452
- Minified files: 290
- Size reduction: 41.14%
- Distribution SHA-256: `17df8091bb1f02bce43252af1a3bbda9835d108c8bcab0b75408845594b011b6`

## Evidence boundary

No Cloudflare binding, remote D1 migration, rollout variable, production deployment, two-account referral lifecycle, Dodo-origin retained referral, native media Share, or eleven-language physical-device test was performed in this environment. These remain explicit final Codex/owner proof items.

## Changed files

- `M` `EONAPP_MASTER_LAUNCH_LEDGER_W623_W640_2026-07-11.json`
- `M` `EONAPP_MASTER_LAUNCH_ROADMAP_W623_W640_2026-07-11.md`
- `M` `assets/js/billing/eon-dodo-live-runtime.js`
- `M` `assets/js/referrals/eon-keys-page.js`
- `M` `assets/js/referrals/eon-referral-server-runtime.js`
- `M` `config/product-evidence-registry.mjs`
- `M` `config/w623h-minimal-referral-ledger-contract.mjs`
- `A` `config/w623i-referral-scale-contract.mjs`
- `M` `functions/api/billing/referral-status.js`
- `M` `functions/api/referrals.js`
- `M` `migrations/0002_minimal_referral_eonkeys.sql`
- `A` `migrations/referrals/0001_referral_authority.sql`
- `A` `migrations/referrals/0002_referral_operational_views.sql`
- `M` `package.json`
- `A` `program/EONAPP_POST_W640_CODEX_LIVE_CERTIFICATION_BACKLOG_2026-07-11.md`
- `M` `program/EONAPP_W623H_CLOUDFLARE_REFERRAL_ACTIVATION_RUNBOOK_2026-07-11.md`
- `M` `program/EONAPP_W623H_REFERRAL_ARCHITECTURE_CEO_DECISIONS_2026-07-11.md`
- `A` `program/EONAPP_W623I_CLOUDFLARE_SCALE_AND_ACTIVATION_RUNBOOK_2026-07-11.md`
- `A` `program/EONAPP_W623I_EXACT_CLOUDFLARE_AI_PROMPT_2026-07-11.md`
- `M` `scripts/w623h-minimal-referral-ledger-gate.mjs`
- `A` `scripts/w623i-referral-scale-gate.mjs`
- `M` `tests/unit/w623h-minimal-referral-ledger.test.mjs`
- `A` `tests/unit/w623i-referral-scale.test.mjs`
