# GPT-5.5 Review Bundle — 2026-06-03

## Status

The local app is green on the core validation stack:

- `npm install`
- `npm run build`
- `npm run smoke:build`
- `npm run site-audit`
- `npm run launch:readiness`
- `npm run test:unit`
- `npx tsc -p tsconfig.strict.json --noEmit --pretty false`
- `npm run lint` passes with legacy warnings only
- `npm run lighthouse` passes across the tracked surfaces

## Final Lighthouse Snapshot

Latest LHCI run passed all assertions. Current scores from the newest reports:

- `marketplace`: `perf=1.00`, `cls=0.013`
- `workbench`: `perf=0.96`, `cls=0.010`
- `chat`: `perf=0.97`, `cls=0.092`
- `creator-studio`: `perf=0.94`, `cls=0.010`
- `trade`: `perf=0.82`, `cls=0.016`

## What Changed In This Pass

- `assets/js/signal-page.js`
  - deferred the Trade ops professional layer off the critical path
  - reduced the initial Trade strategy render to a compact preview
  - kept the full template library available on demand
- `assets/css/signal.css`
  - reserved space for Trade ops cards, widgets, and strategy preview
  - added layout stability for the expanded/compact strategy block
- `assets/js/workbench-page.js`
  - deferred local provider status detection
- `assets/css/workbench.css`
  - expanded the onboarding banner reserve height so it no longer pushes the hero around

## What GPT-5.5 Should Validate First

- Confirm marketplace initial load does not request `nft-visuals`, `lootbox`, `wallet-runtime`, or `xp-runtime`.
- Confirm Trade LCP now lands on the hero subtitle instead of the strategy grid.
- Confirm Workbench CLS stays low with the onboarding banner reserved.
- Review `.lighthouseci/assertion-results.json` and the newest `.lighthouseci/lhr-*.html/json` pairs.

## Important Note

The repo is locally deployable, but live-money production is still proof-gated by design. The remaining external proofs are still expected later:

- NOWPayments live proof
- direct-EVM split proof
- Cloudflare deploy proof
- service-worker/offline proof

## Bundle Contents

Included:

- all root HTML files
- `assets/css/**`
- `assets/js/**`
- `functions/**`
- `public/**`
- `scripts/**`
- `tests/**`
- `CodexDocs/**`
- `.lighthouseci/**`
- `package.json`
- `package-lock.json`
- `vite.config.mjs`
- `eslint.config.mjs`
- `tsconfig*.json`
- `.lighthouserc.cjs`
- `sw.js`
- `public/sw.js`
- the latest logs at repo root

Excluded:

- `node_modules/`
- `.git/`
- `dist/`
- `.wrangler/`
- `.env`
- private keys, secrets, API keys, wallet private keys, and local credentials
