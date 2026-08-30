# UX-1 Validation Receipt — 2026-06-28

## Baseline integrity

- The supplied W405 continuation ZIP SHA-256 matched its companion checksum.
- The supplied docs ZIP SHA-256 matched its companion checksum.
- `npm ci --offline --no-audit --no-fund` completed successfully.
- Initial `test:unit` exposed two absent static design-contract files from the archive. After their inactive restoration, the full current suite passed.

## Commands run and actual results

| Command | Result |
|---|---|
| `node scripts/w373-identity-account-operations-gate.mjs` | PASS |
| `npm run qa:w374-google-oauth-pages-functions` | PASS (5/5 subtests) |
| `npm run qa:w395-google-identity-d1-readiness` | PASS (38/38 gate checks; 2/2 subtests) |
| `npm run qa:w400c-google-identity-entry` | PASS (9/9 gate checks; 2/2 subtests) |
| `npm run qa:w405-live-ux-city-rescue` | PASS (15/15 gate checks; 3/3 subtests) |
| `npm run test:unit` | PASS (334/334) |
| `npm run lint -- --max-warnings=0` | PASS |
| `npm run qa:w394-city-mobile-hud` | PASS (9/9 gate checks; 4/4 subtests) |
| `npm run build` | PASS: 222 output files; minified 7,462,279 → 4,051,761 bytes |
| `npm run smoke:build` | PASS: 24 required files plus assets |
| `npm run audit:site` | PASS: 43 HTML files, sitemap and precache verified |
| `npm run launch:readiness` | PASS: no blockers, no warnings |

## Important validation limitations

`npm run verify:w405-live-rescue-source` was started and its lint, W394, W400C, W405, and complete 334/334 unit segment all passed. The external execution wrapper expired while that combined command was still running, so build/smoke/audit/readiness were run immediately afterward as the individual commands above and all passed. This receipt therefore does **not** represent an invented single-command all-green receipt; it records the actual individual evidence.

A headless local Chromium navigation attempt failed before rendering because this runtime blocks navigation by administrator policy. No successful browser or live proof is claimed.
