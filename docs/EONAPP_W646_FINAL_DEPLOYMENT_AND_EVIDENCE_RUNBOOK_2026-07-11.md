# EONAPP W646 final deployment and evidence runbook

## Release rule

No command in this runbook turns a source PASS into a public PASS. Production GO exists only after the exact candidate, Preview, genuine evidence, protected owner authorization, production promotion and live verification all agree on one candidate digest.

Never upload or commit `.env.local`. Codex may read it locally to run approved tests. Evidence must contain no keys, cookies, OAuth state, full email addresses, raw Dodo customer/payment identifiers or absolute device paths.

## Phase 1 — prepare exact source

1. Extract the authoritative W646 source into a clean directory.
2. Confirm `git status --short` is clean.
3. Run:

```bash
npm ci --include=dev --no-audit --no-fund
npm run verify:codex-predeploy
```

Required result: **81/81**. Preserve `reports/w624d-codex-predeploy/receipt.json` and the maintained-suite receipt.

4. Commit intentionally, push a dedicated branch, open a draft PR, review the W639→W646 delta, then merge only through the protected `main` path.

## Phase 2 — immutable candidate

The successful `main` CI run builds exactly one candidate artifact. Record:

- CI run ID;
- commit SHA;
- source fingerprint;
- candidate digest;
- distribution payload digest;
- W638 index digest;
- W639 freeze digest.

Download the candidate and run `npm run release:candidate:verify -- <candidate-root> <candidate-digest>`. Do not rebuild it.

## Phase 3 — exact Preview

Run **Preview Exact Candidate** with the CI run ID, candidate digest and a unique branch label. Confirm the served `/release/candidate-provenance.json` matches the candidate. Save the Preview run ID, deployment ID, URL and receipt.

Do not bind Preview to the live customer D1 databases unless the owner explicitly approves that architecture. Prefer isolated rehearsal databases and designated test accounts.

## Phase 4 — owner/device proof

### Local Creator

On the owner RTX 3050-class 4 GB device:

- run a real ComfyUI 512×512 batch-1 image;
- save, reopen, add to Library and continue into a project;
- prove invalid-input and runtime-recovery behavior;
- prove local video remains blocked before queue/model download/cloud fallback;
- capture truthful supported-device guidance.

Real video remains gated unless a separate reviewed device with at least 8 GB usable VRAM, 16 GB RAM and 35 GB free storage produces, saves, reopens, plays, cancels/retries and recovers a real video.

### EON City Preview

The owner signs in manually with Google in Chrome/Edge. Start that same profile with a loopback DevTools endpoint. Set the exact Preview URL and candidate build provenance, then run:

```bash
npm run evidence:w644-city-owner
```

Capture desktop 1440×900, mobile portrait 390×844, mobile landscape 844×390, reduced motion, refresh recovery, Command Room, EONBOT useful-work path, controls, performance, console/network diagnostics and a screen recording. The visible release identity must match the candidate.

Owner scoring: overall **≥9.5**, every category **≥9.0**. Any access bypass, page error, console error, first-party HTTP error, unexplained request failure, account-identity leak or broken control is NO-GO.

## Phase 5 — commerce, persistence, security and recovery evidence

Build genuine W638 records for all required launch-scope requirements. Billing is mandatory. Referral, Direct BYOK and companion may remain publicly gated with truthful owner-reviewed copy. Local Creator may launch image-first with video gated.

Cancellation, reactivation, refund, dispute and tier-change evidence require written owner approval before each action and designated test accounts. Never mutate a real customer merely to obtain proof.

Verify:

- Dodo checkout, provider-signed webhook, D1 ledger and entitlement;
- duplicate, out-of-order and forged-event handling;
- portal, receipts/tax links and cross-session refresh;
- EONKEY/referral active lifecycle or a closed truthful public gate;
- Google sign-in/sign-out/session boundaries;
- local/browser persistence through update and rollback;
- Drive/Capsule backup and restore preview where enabled;
- WAF/security headers/rate limits/request limits/redaction;
- incident, kill-switch and rollback rehearsals without D1 reset or destructive migration down.

Commit only redacted evidence to a temporary private evidence ref. Run **Validate Exact-Candidate Production Evidence**. Required output is the protected `eonapp-w646-production-evidence-*` artifact with all 11 domains PASS.

## Phase 6 — protected owner GO

Before authorization, confirm GitHub environments exist and are protected:

- `preview`;
- `production-evidence`;
- `launch-authorization`;
- `production`.

Production and launch authorization require at least one reviewer; production secrets are scoped only to the appropriate environments; branch policy is verified.

Find and record the current successful production Cloudflare deployment ID. Run **Authorize Production Candidate** with candidate, Preview and evidence run IDs. Owner GO expires quickly and must match the exact candidate.

## Phase 7 — exact production promotion

Run **Promote Exact Candidate to Production**. It must download the candidate and authorization artifacts, verify them without rebuilding, confirm the rollback target is still the current production deployment, then deploy the exact candidate `dist`.

The workflow verifies live candidate identity and critical routes and emits `production-deployment-receipt.json`.

## Phase 8 — immediate live verification

Against `https://eonapp.ch`, repeat:

- critical route/status/header/service-worker checks;
- billing and referral public truth;
- guest City renderer gate;
- signed-in Google EON City owner proof using the already logged-in browser;
- desktop/mobile/reduced-motion/refresh/console/network screenshots;
- persistence and entitlement refresh checks that are safe after promotion.

Create `w646-live-smoke-receipt.json` and a live W644 City receipt linked to the production deployment ID. Run:

```bash
npm run release:w646-postdeploy-verify -- \
  <candidate-root> \
  <production-deployment-receipt.json> \
  <w646-live-smoke-receipt.json> \
  <w644-live-city-owner-receipt.json>
```

Only a PASS result is public certification. If it fails after deployment, declare NO-GO immediately, stop customer-changing tests, preserve evidence, and obtain owner approval to roll back to the recorded prior production deployment. Do not reset D1 and do not run destructive down migrations.

## Codex return package

Return one ZIP containing all redacted receipts, screenshots, screen recording, console/network exports, Cloudflare deployment metadata, GitHub run URLs/IDs, candidate/freeze/evidence digests, final certification JSON and a concise issue list. Return no secrets or direct customer identifiers.
