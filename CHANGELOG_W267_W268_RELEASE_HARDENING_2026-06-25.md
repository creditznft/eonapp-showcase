# Changelog — W267/W268 release hardening

## W267 — Red-team trust/privacy/action/chain audit

Added a fail-closed red-team board and source gate covering:

- EONBOT secret-request and live-financial-execution denials.
- Guarded, approval-first, navigation-only local action proposals and receipts.
- Local-only diagnostic redaction with no sender primitive in the telemetry helper.
- Existing commercial, browser-chain, referral and access-milestone no-go boundaries.
- Honest independent-review requirements that cannot be self-closed by the implementation author.

## W268 — Operations readiness

Added a source-controlled operations board, non-destructive runbook and gate for:

- Incident triage/support routing.
- Browser-local export/restore study.
- PWA update and rollback.
- Cloudflare Preview/live rollback procedure with read-only owner inspection.
- BYOK provider-change response.
- Security disclosure and secret-rotation boundaries.

## W216 gate drift repair

- Repaired two stale W216 finalization assertions so the legacy certification checks the current `Optional WebGL Visual Tour` and shared `Realm Relay` registry contract rather than retired UI wording.
- Added `qa:current-static-certification`, a current no-Lighthouse certification chain that carries W267/W268 and the active release boundaries without reusing browser-score tasks.

## Preserved

- W260 remains **NO-GO**.
- W258 C0-I remains offline-only and browser chain runtime remains disabled.
- Referral rewards, access milestones, D1 migrations and Cloudflare backend activation remain inactive and unauthorised.
- W261 remains blocked. W269–W290 remain planned/not started.
- W282 retains whole-site Lighthouse/Web Vitals collection; no Lighthouse work was run in W267/W268.

## Evidence limit

A W267 or W268 pass is source/runbook evidence only. Neither pass is an independent red-team, browser, deployment, Cloudflare, PWA, restore, legal, security, support or release approval.

## Final non-Lighthouse certification and handoff

- Added resumable `qa:current-static-certification:core` and `qa:current-static-certification:tail` commands so managed five-minute command ceilings do not obscure individual gate results.
- Repaired the W216 local-finalization gate to test the current `Optional WebGL Visual Tour` wording, City Lite fallback and shared `Realm Relay` landmark registry rather than retired copy strings.
- Verified 226/226 current-product tests, lint, 193-file build, W267/W268 gates, W260 NO-GO fence, inactive referral/Cloudflare proof and tail static certification.
- Deliberately did not run Lighthouse. W282 retains score collection and performance remediation.
