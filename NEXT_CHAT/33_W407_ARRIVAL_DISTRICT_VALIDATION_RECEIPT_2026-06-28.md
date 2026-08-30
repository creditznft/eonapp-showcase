# W407 Arrival District — Validation Receipt

**Date:** 2026-06-28  
**Scope:** W405 baseline through W406B plus W407 source changes.

## Commands run and actual results

| Command | Result |
|---|---|
| `npm run lint -- --max-warnings=0` | PASS |
| `npm run qa:w407-arrival-district` | PASS (13/13 source checks; 4/4 subtests) |
| `npm run qa:w406b-city-art-intake` | PASS (16/16 source checks; 5/5 subtests) |
| `npm run qa:w405-live-ux-city-rescue` | PASS (15/15 source checks; 3/3 subtests) |
| `npm run qa:w365-city-asset-foundation` | PASS (17 planned entries, 0 shipped binary assets; 5/5 subtests) |
| `npm run qa:share2-completed-output` | PASS (10/10 source checks; 4/4 subtests) |
| `npm run qa:w411-sync-basic-foundation` | PASS (11/11 source checks; 4/4 subtests) |
| `npm run qa:w394c-language-matrix` | PASS (11/11 source checks; 3/3 subtests) |
| `npm run test:unit` | PASS (343/343) |
| `npm run build` | PASS (223 output files; minified 7,520,578 → 4,093,197 bytes) |
| `npm run smoke:build` | PASS (24 required files and required assets) |
| `npm run audit:site` | PASS (43 HTML files; 3 tools; 1 games; sitemap and precache verified) |
| `npm run launch:readiness` | PASS (no blockers; no warnings) |

## Evidence limitation

This receipt proves source/build compatibility. It does not prove rendered
visual quality, a person can see/read the first frame on a real device, touch
controls, keyboard/mouse controls, actual rain/frame performance, service-worker
cache adoption, art provenance, human art review, Google OAuth/session behavior
or cross-device Sync.

The local Chromium UI runner is still environment-blocked by administrator
policy. No blocked browser run is reported as a City visual or device pass.
