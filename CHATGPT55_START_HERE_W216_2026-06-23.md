This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# ChatGPT 5.5 Start Here - W216

This bundle is the latest merged W180-W216 source-only baseline from the local worktree at `C:\Users\credi\WORKSPACE\EONAPP.CH__w216_merge`.

## What this bundle is for

Use this bundle in ChatGPT GPT-5.5 to:

- inspect the current source tree
- run Vite/local build checks
- run the current W216 release-candidate gates
- inspect preview screenshots and live-state notes
- continue targeted audits without depending on stale old chat context

## Important truth first

- the newer W216 shell is now live on `https://eonapp.ch`
- production was promoted on 2026-06-23 and re-checked through a real browser session
- `chat` and `market` on the custom domain now match the newer W216 direction instead of the earlier old shell

See `CHATGPT55_LIVE_STATE_DIFF_PRODUCTION_VS_PREVIEW_2026-06-23.md`.

## Current local status

- merged branch: `codex/w216-final-polish-merge`
- main fast local release lane: green
- preview visual pass: captured under `output/playwright/w216-liveqa-2`
- live production confirmation screenshots: captured under `output/playwright/live-prod-check`
- broad historical `npm run test:unit` suite: still contains legacy stale failures from retired pre-W180 systems and should not be treated as the release truth gate

## Recommended commands

Install:

```bash
npm ci
```

Primary fast verification:

```bash
npm run qa:w216-release-candidate
```

Useful targeted commands:

```bash
npm run build
npm run audit:site
npm run launch:readiness
npm run qa:w213-calm-city-trade
npm run qa:w214-security-trust
npm run qa:w215-monetization-decision
npm run qa:w216-local-finalization
```

Optional targeted GPT-5.5-era audits already present:

```bash
npm run gpt55:static-launch-audit
npm run gpt55:market-nft-lootbox-visual-gate
npm run gpt55:route-truth-device-audit
npm run gpt55:cloudflare-prod-readiness
```

Preview the app locally if needed:

```bash
npm run dev
```

## Evidence to inspect

- preview screenshot set: `output/playwright/w216-liveqa-2`
- evidence matrix: `EONAPP_W216_EVIDENCE_MATRIX_2026-06-23.md`
- local release audit: `W216_LOCAL_RELEASE_AUDIT_2026-06-23.md`
- legacy diagnostic: `TEST_BASELINE_AND_LEGACY_DIAGNOSTIC_W216_2026-06-23.md`
- recommendations: `CHATGPT55_RECOMMENDATIONS_AND_AUDIT_TARGETS_W216_2026-06-23.md`

## Most likely next work

1. Audit Market expectations versus current implementation and tests.
2. Fix small responsive/cosmetic issues in the new shell.
3. Re-run live production and preview checks after any visual or routing patch.
4. Run Lighthouse and update/PWA regression checks against the now-live shell.
