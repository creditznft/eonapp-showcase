# W623H — Minimal Referral/EONKEY Ledger Changed Files and Validation

Date: 2026-07-11  
Baseline: W623G full source snapshot  
Status: source-complete; Cloudflare rollout and real-device proof pending

## CEO correction frozen

EONAPP is subscription-only. It has no in-app ads, rewarded ads or watch-an-ad unlocks. Independent external sharing or promotion is not an EONAPP advertising product and earns nothing by itself.

## Architecture delivered

- Existing `EON_BILLING_DB` reused; no second database.
- No new secret, cron, queue, link registry, click tracker, impression tracker or social-post tracker.
- Fresh ten-minute P-256 proof binds an inviter identity to a signed-in account.
- One-level inviter/invitee association with self-referral and duplicate rejection.
- Signal Key plus digital reward after a useful activation milestone, capped at five per inviter/month.
- No reward for click, copy, share, impression, post or trial start.
- Fourteen-day retained-paid progression: Builder, Builder, Power; maximum three/year.
- Refund/dispute/cancellation/expiry/failure/revocation reverses grants, unlocks and digital rewards.
- One key redeems one allowlisted individual feature, workflow, limit, preset, template or cosmetic.
- Privacy-safe progress uses qualified ledger aggregates only.

## Changed-file inventory

Added: **17**  
Modified: **21**  
Deleted: **0**

### Added

- `CHANGED_FILES_W623H_MINIMAL_REFERRAL_EONKEY_LEDGER_2026-07-11.md`
- `EONAPP_W623H_NEXT_CHAT_PROMPT_2026-07-11.md`
- `EONAPP_W623H_NEXT_CHAT_START_HERE_2026-07-11.md`
- `EONAPP_W623H_VALIDATION_RECEIPT_2026-07-11.json`
- `assets/js/referrals/eon-referral-server-client.js`
- `assets/js/referrals/eon-referral-server-runtime.js`
- `config/w623h-minimal-referral-ledger-contract.mjs`
- `functions/api/referrals.js`
- `migrations/0002_minimal_referral_eonkeys.sql`
- `program/EONAPP_W623H_CLOUDFLARE_REFERRAL_ACTIVATION_RUNBOOK_2026-07-11.md`
- `program/EONAPP_W623H_REFERRAL_ARCHITECTURE_CEO_DECISIONS_2026-07-11.md`
- `program/EONAPP_W623I_SHARE_VOICE_REFERRAL_REAL_DEVICE_PROOF_RUNBOOK_2026-07-11.md`
- `reports/w623h-minimal-referral-ledger/changed-files.json`
- `reports/w623h-minimal-referral-ledger/launch-board.json`
- `reports/w623h-minimal-referral-ledger/source-manifest.json`
- `scripts/w623h-minimal-referral-ledger-gate.mjs`
- `tests/unit/w623h-minimal-referral-ledger.test.mjs`

### Modified

- `EONAPP_MASTER_LAUNCH_LEDGER_W623_W640_2026-07-11.json`
- `EONAPP_MASTER_LAUNCH_ROADMAP_W623_W640_2026-07-11.md`
- `assets/js/billing/eon-dodo-live-runtime.js`
- `assets/js/commerce/eon-commercial-catalog.js`
- `assets/js/eon-app-shell.js`
- `assets/js/referrals/eon-keys-catalog.js`
- `assets/js/referrals/eon-keys-page.js`
- `assets/js/share/eon-viral-share-kit.js`
- `assets/js/utils/eon-share-sheet.js`
- `assets/js/utils/eon-workspace-store.js`
- `assets/js/utils/share-attribution.js`
- `config/product-evidence-registry.mjs`
- `config/w623d-production-reachability-contract.mjs`
- `eon-keys.html`
- `functions/api/billing/referral-status.js`
- `package.json`
- `reports/w623d-production-reachability/graph.json`
- `reports/w623f-certification-v2/launch-board.json`
- `reports/w623g-share-voice-growth/launch-board.json`
- `scripts/w623c-canonical-commercial-truth-gate.mjs`
- `scripts/w623g-share-voice-growth-gate.mjs`

### Deleted

- None

## Validation

- W623H source gate: **20/20**
- W623H SQL lifecycle tests: **3/3**
- Focused W623C–W623H unit tests: **31/31**
- W623C commercial truth: **64/64**
- W623D reachability: **344 files / 593 edges / 0 quarantined reachable**
- W623E information architecture: **5/5**
- W623F certification v2: **24/24**
- W623G Share/voice gate: **22/22**
- Targeted ESLint: **zero errors and zero warnings**
- Secret scan: **3,385 text files; zero potential secrets**
- Production build: **passed**
- Distribution files: **452**
- Minified files: **290**
- Size reduction: **41.14%**
- Distribution SHA-256: `0b076a814353528688e005bcda16d80d8712b14bf1f40cf26597ad127d664d03`
- Source manifest: **3467 files** / `447a8f8ec2e5176e049c3efac42dbd25383403850d19d1f5bea309ee17287f3c`

## Evidence boundary

W623H does not claim that Cloudflare rollout is active, that a real account has received an EONKEY, that a genuine paid referral has completed 14-day retention, that a live refund/dispute reversal has occurred, or that native Share and eleven-language voice have passed on real devices. Those are W623I.
