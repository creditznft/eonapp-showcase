# W624I — Genuine Agent Theatre

Date: 2026-07-11  
Status: source-complete; real Local and Direct BYOK end-to-end proof pending

## Result

W624I adds a receipt-backed Agent Theatre inside the existing Command Room. It does not create a second job system or animate simulated workers.

The Theatre projects:

- sanitized W435 local job-fabric receipts;
- explicit bounded Local receipts from native product surfaces;
- explicit bounded Direct BYOK receipts only after user approval;
- the exact lifecycle `queued · preparing · waiting-for-user · running · paused · failed · cancelled · completed`;
- source surface, execution rail, receipt authority, bounded job identifier and created/updated timestamps;
- authoritative progress only when the native receipt explicitly supplies it;
- finite display-safe lifecycle logs;
- review-first native-surface actions for review, retry, pause, resume, cancel and result handoff only where supported.

## Truth and privacy boundaries

- Empty means no genuine receipt and renders a still empty state.
- W435 drafts/proposals never become a fabricated `running` state.
- `running`, `paused` and authoritative progress require a dedicated native bounded receipt.
- Direct BYOK receipt recording requires an explicit user action and explicit user approval.
- Candidate fields resembling prompts, outputs, files, credentials, tokens, accounts, payment records, referrals or rewards are rejected.
- City does not execute lifecycle actions. After review, a separate link opens the owning native surface.
- No provider request, network request, publication, automation execution, billing mutation, referral mutation or reward grant occurs in the Theatre.

## Compatibility

W624B runtime ownership and lifecycle remain unchanged. W624C paths/spawn/collision/Unstuck, W624D Wayfinder/camera, W624E Orbit, W624F NPC/LOD, W624G productive receipts and W624H Truthful Command Center remain present. The older W618E/W620 dormant lane foundation is retained for historical compatibility while W624I provides the current genuine receipt projection.

## Validation

- W624I contract: 34/34
- W624I focused tests: 6/6
- Maintained suite: 228 files / 844 assertions / 797 current passes / 47 explicit historical skips / 0 failures
- Current contract alignment: 17/17
- Historical archive integrity: 10/10
- Targeted ESLint: zero errors and zero warnings
- Production reachability: 355 files / 623 import edges / 0 quarantined
- Secret scan before final documentation: 3,577 text files / zero findings
- Production build and smoke: passed
- W623F post-build certification: 24/24
- Distribution: 463 files / 293 minified / 40.89% reduction
- Distribution SHA-256: `a7ab55d325af210ac4bbeff22fc280b82674ccb948a0f7cddd4b615e2c4eaf43`

## Browser and live evidence boundary

The loopback server started, but the managed environment has no Playwright Chromium executable. The W624I browser receipt is `BLOCKED`; no screenshot, physical-device, production-authentication, real Local execution, real Direct BYOK execution, provider request or owner visual approval is claimed.

Live certification remains pending until at least one real Local job and one real user-approved Direct BYOK job are observed end to end through their native surfaces and corresponding bounded receipts.

## Next wave

W624J — Sharing Center, social handoff and collaboration boundary.
