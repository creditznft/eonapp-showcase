This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP cumulative handover — W180 through W215

## Status
This archive is the complete cumulative source baseline for **W180–W215**. It contains the real source implementation, targeted gates, documentation, and merge instructions for these waves.

Do **not** stack historical W181/W183/W187/W190/W196/W204/W210/W211/W212 ZIPs over it. Those are historical full trees, not additive overlays. Extract this package into a clean Git branch or clean worktree and merge it as one reviewed baseline.

## Included scope
- W180–W210 existing chat-first, persistence, PWA/EON Lite, privacy and release-source work.
- W211 Projects, Library, Workspace, approval-first Automations.
- W212 simplified Market, stateless signed referral and Realm links, QR/share contract, no short-link registry.
- W213 calm default 2D EON City, optional device-gated 3D station, Trade manual/reference/paper-only lock.
- W214 CSP, redacted telemetry, browser hardening, legal/privacy/trust copy.
- W215 intentionally disabled monetization decision gate at UI/runtime/API boundaries.

## Current factual state
- Targeted W180–W215 source validation: PASS.
- Lint: PASS with zero warnings.
- Production build and build smoke: PASS.
- Static site audit: PASS.
- Launch readiness: PASS.
- `npm audit --omit=dev`: 0 production vulnerabilities.
- Full dependency audit still reports 6 development-toolchain advisories (1 low, 1 moderate, 4 high). They were not silently treated as production-safe; investigate separately before a long-lived release branch.

## What this does not prove
- Cloudflare Preview response behavior.
- Live custom-domain routing.
- Rendered Playwright screenshots.
- Physical Android/iPhone/desktop behavior.
- PWA install/update across a deployed release.
- QR camera scanning and actual social share apps.
- Production headers/network requests or any external provider behavior.

Those are W216 evidence requirements, not source-only claims.

## Monetization decision
No offerwall, ads, referral reward, revenue share, payout, provider callback, subscription unlock, redemption, or value-bearing campaign is active. Keep it disabled.

## Entry points
1. `CODEX_START_HERE_W215.md`
2. `EONAPP_STATELESS_REFERRAL_REALM_LINK_CONTRACT_W212_W215_2026-06-23.md`
3. wave handovers W211–W215
4. `CODEX_W216_PREVIEW_DEPLOY_PROMPT_2026-06-23.md`
5. `EONAPP_W216_EVIDENCE_MATRIX_2026-06-23.md`
