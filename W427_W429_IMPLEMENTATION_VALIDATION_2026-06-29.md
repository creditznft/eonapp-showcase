# EONAPP W427–W429 — Canonical City Tranche Validation

**Date:** 29 June 2026  
**Baseline:** W426 verified source handover (`2650c0242fb28c579cc463dcf9819376e940e04f4b8c91707e384f6e7d6a244d`)  
**Scope:** Source-only implementation checkpoint. This document is not a production deployment, device-performance, Google OAuth, or Lighthouse certification.

## Delivered

### W427 — Babylon direct boot and safe recovery

- Added bounded, session-local City boot diagnostics for import, WebGL availability, canvas mount, engine creation, asset-load, first-frame timeout, first-frame ready, and context-loss states.
- Diagnostics store only safe marker codes and timestamps. They do not retain prompts, source code, files, credentials, account tokens, or raw browser errors.
- The canonical `/eoncity` station now runs the same-route retry and low-detail recovery choices. Recovery does not route a user into a secondary City product.
- Added a W427 source contract, static gate, and unit coverage.

### W428 — one public Babylon City

- Canonicalized active City mode resolution, EONBOT command routing, context registry metadata, legacy cache navigation handling, and future Lighthouse route targeting to `/eoncity`.
- Legacy City URLs remain redirect aliases during the compatibility window, but active navigation and command surfaces no longer offer Lite, Tour, alternate 3D, or Play as separate public destinations.
- Versioned the service-worker cache boundary to `v53` so stale City navigation can be redirected after activation.
- Updated historical compatibility tests to assert the current canonical City contract rather than a retired alternate route.

### W429 — functional Command Deck

- Replaced painted-only Command Deck behavior with seven bounded stations:
  - EONBOT
  - Forge
  - Projects
  - Library
  - Vault & Collection
  - Mission Board
  - Settings
- In-world panels are local and review-first. Native surfaces require a second explicit confirmation before navigation.
- No Command Deck action sends, publishes, deploys, syncs, spends, rewards, uses a provider key, or executes an external connector.
- Updated the Command Deck contract, static gate, and unit coverage.

## Validation completed

| Check | Result |
|---|---|
| `npm run lint -- --max-warnings=0` | Pass |
| W423 direct City entry gate | Pass (14/14) |
| W423 live UX/City rescue gate | Pass (17/17) |
| W426 City motion/progression gate | Pass (8/8) |
| W427 direct boot gate | Pass (9/9) |
| W428 one-public-City gate | Pass (10/10) |
| W429 functional Command Deck gate | Pass (14/14) |
| `npm run test:unit` | **402/402 pass** |
| Production build | Pass — 289 dist files; 166 JS files minified |
| Build smoke check | Pass — 21 required files |
| Site audit | Pass — 43 HTML files, 3 tools, 1 game; sitemap and precache verified |
| Launch readiness | Pass — no reported blockers/warnings |
| `npm audit --omit=dev` | 0 production dependency vulnerabilities reported in this environment |
| Workspace secret scan | Pass — 2,485 text files scanned; no potential secrets detected |

## Truth boundaries

- No deployment was performed.
- No live Google OAuth, Cloudflare routing, service-worker activation, or browser-cache migration was exercised.
- No desktop/Android/iOS Babylon first-frame or long-session proof was performed.
- No Lighthouse score is claimed. The earlier Chromium `chrome-error-final-url` condition remains environment-blocked rather than a performance result.
- Final GLB/GLTF City art, rights/provenance evidence, real-device budgets, Sync, notifications, rewards, referrals, payments, marketplace/trading, automatic publishing, and external action execution remain outside this tranche.
- `npm audit` including development tooling still reports **6** dependency findings (1 low, 1 moderate, 4 high), involving the build/deployment toolchain. This is not treated as a security-release certification.

## Recommended next tranche

Start **W430** only after this checkpoint is merged and deployed for manual review:

1. Build one authorised City art vertical slice: Arrival Gate, Command District, Creator Atrium, and Forge Bay.
2. Add asset-rights/provenance, LOD, texture-budget, and device-review manifests before final binary art is claimed.
3. Keep direct Babylon boot and W429 Command Deck as the only public City foundation.
4. Defer W431 long-session quality-governor proof and W432 valid Lighthouse/device certification until a real supported browser environment is available.

## Re-run after merge

```bash
npm ci
npm run lint -- --max-warnings=0
npm run qa:w392-direct-eoncity-entry
npm run qa:w405-live-ux-city-rescue
npm run qa:w426-city-motion-progression
npm run qa:w427-babylon-direct-boot
npm run qa:w428-one-public-city
npm run qa:w429-functional-command-deck
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
node scripts/secret-scan.mjs --mode=workspace --allow-no-history
```
