This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# W263/W264/W281/W285 Source Hardening Freeze — Start Here

## What this freeze is

A source-only continuation freeze built from the verified W271–W280 hardening baseline. It adds four constrained source baselines:

- **W263-A0:** EONBOT finite internal capability registry, explicit-tap execution, approval-first guarded proposals, exact local receipt validation, and no remote effects.
- **W264-A0:** user-triggered local ordinary-work project handoff that excludes automation, Vault, key, identity, payment, value, and publication state.
- **W281-A0:** finite HTTPS/BYOK provider lifecycle/review contract with user-initiated verification and no URL-only hotfix policy.
- **W285-A0:** conservative Local AI/device support guidance for heat, battery, storage, and responsiveness without device telemetry or automatic model installation.

It does **not** make EONAPP launch-ready, externally audited, beta-ready, chain-ready, referral-ready, or Cloudflare-ready. W260 remains **NO-GO**.

## Read first

1. `PACKAGE_VALIDATION_W263_W264_W281_W285_SOURCE_HARDENING_2026-06-25.md`
2. `CHANGELOG_W263_W264_W281_W285_SOURCE_HARDENING_2026-06-25.md`
3. `docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md`
4. `docs/W263_EONBOT_CAPABILITY_EXECUTION_EVIDENCE_PLAN_2026-06-25.md`
5. `docs/W264_CREATOR_BUILD_HANDOFF_EVIDENCE_PLAN_2026-06-25.md`
6. `docs/W281_AI_PROVIDER_LIFECYCLE_EVIDENCE_PLAN_2026-06-25.md`
7. `docs/W285_LOCAL_AI_DEVICE_SUPPORT_EVIDENCE_PLAN_2026-06-25.md`
8. `release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json`

## Reproduce

```bash
npm ci
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run qa:w263-eonbot-capability-execution
npm run qa:w264-creator-build-handoff
npm run qa:w281-ai-provider-lifecycle
npm run qa:w285-local-ai-device-support
npm run qa:w260-release-board
npm run qa:current-static-certification:tail
```

## Latest local receipts

- 256/256 approved current-product unit tests pass.
- ESLint has zero warnings.
- Production build emits 194 files.
- W263/W264/W281/W285 and all retained source hardening gates pass.
- Static smoke/site/PWA/launch-invariant gates pass.
- Workspace secret scan is clean.
- `npm audit --omit=dev` reports zero known production vulnerabilities.

## Lighthouse rule

Do **not** use this sandbox for Lighthouse scoring. Its managed Chromium process reaches the local server but then returns `chrome-error://chromewebdata/` and `NO_NAVSTART`. No route has a valid score. Use a normal browser-capable desktop/mobile environment for W282 and preserve raw reports outside source control.

## Stop conditions

Do not enable referral/milestone behavior, mutate Cloudflare/D1, deploy a deferred backend/migration, add browser chain/wallet/signing runtime, add hidden EONBOT tools, claim a provider is active, start beta, or claim launch readiness from this freeze.
