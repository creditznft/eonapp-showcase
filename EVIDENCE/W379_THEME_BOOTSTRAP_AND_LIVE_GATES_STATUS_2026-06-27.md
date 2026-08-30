# W379 Theme Bootstrap And Live Gates Status

Date: 2026-06-27

## Scope

This session kept the W379 production source baseline and applied one small safe UI normalization patch:

- Added early `eon-theme-bootstrap.js` to:
  - `index.html`
  - `rewards.html`
  - `about.html`
  - `billing.html`
  - `privacy.html`
  - `legal.html`
  - `support.html`
  - `terms.html`

No commerce, reward, referral, OAuth, D1, payment, or production-only feature activation was introduced.

## Deployment Status

Current git commit shipped in this session:

- `900489c6b45633f7a1fce781667eed70835a64f2`

Branch state after push:

- `origin/main` -> `900489c6b45633f7a1fce781667eed70835a64f2`
- `origin/codex/w379-smart-merge-20260626` -> `900489c6b45633f7a1fce781667eed70835a64f2`

Cloudflare production deployment confirmed:

- deployment id: `267798df-0261-48a8-befc-5bb74d48efbd`
- deployment URL: `https://267798df.eonapp-ch.pages.dev`
- environment: `production`
- source branch: `main`

Custom domain verification completed:

- `https://eonapp.ch/about` returned `200` and includes `/assets/js/eon-theme-bootstrap.js`
- `https://eonapp.ch/rewards` returned `200` and includes `/assets/js/eon-theme-bootstrap.js`
- `https://eonapp.ch/` returned `200` and includes `/assets/js/eon-theme-bootstrap.js`

## Local Validation Completed

All of the following passed on 2026-06-27 from the current workspace:

- `npm run build`
- `npm run smoke:build`
- `npm run audit:site`
- `npm run launch:readiness`
- `npm run lint -- --max-warnings=0`
- `npm run launch:page-gate`
- `npm run launch:identity-gate`
- `npm run launch:quality-gate`
- `npm run qa:w360-eon-city-portal-route`
- `npm run qa:w367-spatial-command-space`
- `npm run qa:r4-comm01-graphite-commerce`
- `npm run qa:w372-visual-certification-readiness`
- `npm run qa:w345-local-device-proof-kit`
- `npm run qa:w276-data-survival-reaudit`
- `npm run security:secret-scan`

## Visual And Route Evidence

Current local route audit and screenshots were refreshed after the final code state:

- `output/playwright/w379-local-theme-audit/route-audit.json`
- `output/playwright/w379-local-theme-audit/chat-desktop.png`
- `output/playwright/w379-local-theme-audit/chat-mobile.png`
- `output/playwright/w379-local-theme-audit/eoncity-desktop.png`
- `output/playwright/w379-local-theme-audit/eoncity-mobile.png`
- `output/playwright/w379-local-theme-audit/eoncity-tour-desktop.png`
- `output/playwright/w379-local-theme-audit/eoncity-tour-mobile.png`
- `output/playwright/w379-local-theme-audit/rewards-desktop.png`
- `output/playwright/w379-local-theme-audit/rewards-mobile.png`
- `output/playwright/w379-local-theme-audit/about-desktop.png`
- `output/playwright/w379-local-theme-audit/about-mobile.png`

Additional local visual proof capture passed:

- `artifacts/w266-visual-proof-lab/2026-06-26T21-09-19-619Z/visual-run.json`

## Live AI Verification

Hosted provider verification with local `.env.local` was executed with:

- `npm run qa:w358-live-ai -- --env .env.local --confirm-live --providers groq,openrouter,deepseek,cerebras,mistral,fireworks,nvidia,sambanova,together,huggingface,gemini,cohere`

Safe evidence output:

- `docs/qa/live-ai-v2/2026-06-26T21-11-35-665Z/results.json`

Observed provider outcome summary:

- Verified live response and kernel exact-pin/no-fallback receipt:
  - `groq`
  - `mistral`
  - `fireworks`
  - `nvidia`
  - `sambanova`
  - `gemini`
- Billing or quota limited:
  - `openrouter`
  - `together`
- Discovery or payload issues that still need operator review:
  - `deepseek` discovery `401`
  - `cerebras` returned empty-or-missing-token with HTTP `200`
  - `huggingface` returned empty-or-missing-token with HTTP `200`
  - `cohere` requires `EON_LIVE_AI_MODEL_COHERE`

No secrets, prompts, raw outputs, or key material were written into the evidence summary above.

## Honest Remaining Blockers

GitHub CI is still expected to fail `security:secret-scan:ci` until reachable history is remediated. Current workspace scanning is clean, but CI mode scans old reachable commits too.

Relevant runbook:

- `docs/W301_GIT_HISTORY_SECRET_REMEDIATION_RUNBOOK_2026-06-26.md`

Still external/manual and not completed here:

- Cloudflare D1 binding setup
- Google OAuth secret setup and live auth proof
- Production update/rollback/data-restoration proof board closure
- Final real-device certification pack
- Lighthouse run and external review sign-off

## Decision Record

An experiment to wrap `/eoncity` and `/eoncity/tour` in the dashboard shell was tested locally and then intentionally backed out.

Reason:

- `qa:w360-eon-city-portal-route` requires the City Portal and Spatial Command Space to remain outside the dashboard shell.
- The final retained patch is therefore the smaller, contract-safe theme bootstrap normalization only.
