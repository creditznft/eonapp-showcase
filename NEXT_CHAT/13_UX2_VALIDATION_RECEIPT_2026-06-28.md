# UX-2 Validation Receipt — 2026-06-28

## Commands run and actual results

| Command | Result |
|---|---|
| `npm run lint -- --max-warnings=0` | PASS |
| `node scripts/w373-identity-account-operations-gate.mjs` | PASS |
| `npm run qa:w374-google-oauth-pages-functions` | PASS (5/5 subtests) |
| `npm run qa:w394-city-mobile-hud` | PASS (9/9 gate checks; 4/4 subtests) |
| `npm run qa:w395-google-identity-d1-readiness` | PASS (38/38 gate checks; 2/2 subtests) |
| `npm run qa:w400c-google-identity-entry` | PASS (9/9 gate checks; 2/2 subtests) |
| `npm run qa:w405-live-ux-city-rescue` | PASS (15/15 gate checks; 3/3 subtests) |
| `npm run qa:ux2-shell-modals` | PASS (22/22 gate checks; 2/2 subtests) |
| `npm run test:unit` | PASS (334/334) |
| `npm run build` | PASS (222 output files; minified 7,483,285 → 4,068,329 bytes) |
| `npm run smoke:build` | PASS (24 required files plus assets) |
| `npm run audit:site` | PASS (43 HTML files; sitemap and precache verified) |
| `npm run launch:readiness` | PASS (no blockers; no warnings) |

## Evidence boundary

These are source/build checks. They do not substitute for the agreed manual Google OAuth, production session, real-device City, or two-device Sync proof. The local Chromium environment remains unable to navigate because of an administrator policy; no browser visual pass is claimed from this machine.
