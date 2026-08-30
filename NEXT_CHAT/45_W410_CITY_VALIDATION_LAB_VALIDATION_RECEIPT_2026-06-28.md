# W410 Validation Receipt — EON City Validation Lab

**Date:** 2026-06-28  
**Scope:** source/build validation for W410 only. This receipt is not live deployment, real-device, visual-quality, OAuth or Sync proof.

## Passed checks

- `npm run lint -- --max-warnings=0`
- `npm run qa:w410-city-validation-lab` — W410 source gate **12/12** and **4/4** unit tests.
- `npm run qa:w371-performance-lab` — manual local Device Lab contract and **3/3** unit tests.
- `npm run qa:w372-visual-certification-readiness` — visual evidence board remains pending external proof and **3/3** unit tests.
- `npm run qa:w394-city-mobile-hud` — **9/9** City mobile/HUD gate and **4/4** unit tests.
- `npm run qa:w405-live-ux-city-rescue` — **15/15** source gate and **3/3** unit tests.
- `npm run qa:w406b-city-art-intake` — **16/16** source gate and **5/5** unit tests.
- `npm run qa:w407-arrival-district` — **13/13** source gate and **4/4** unit tests.
- `npm run qa:w408-creator-forge-district` — **14/14** source gate and **5/5** unit tests.
- `npm run qa:w409-living-city-systems` — **15/15** source gate and **5/5** unit tests.
- `npm run qa:share2-completed-output` — **10/10** source gate and **4/4** unit tests.
- `npm run qa:w411-sync-basic-foundation` — **11/11** source gate and **4/4** unit tests.
- `npm run qa:w394c-language-matrix` — **11/11** source gate and **3/3** unit tests.
- `npm run security:secret-scan -- --allow-no-history` — PASS; 2,241 text files scanned, 18 generated/binary/large files skipped, no potential secrets found.
- `npm run test:unit` — **357/357** unit tests passed.
- `npm run build` — PASS; 223 dist files; minifier reduced 7,552,111 bytes to 4,114,715 bytes (45.52% saved).
- `npm run smoke:build` — PASS; 24 required files present.
- `npm run audit:site` — PASS; 43 HTML files, 3 tools, 1 games; sitemap and precache verified.
- `npm run launch:readiness` — PASS; no blockers, no warnings; commercial handlers remain disabled and signed invite context remains local/no-tracking/no-reward/no-auto-posting.

## Known evidence limits

- This is static/source/build validation only.
- No live OAuth, browser UI/video, production deployment, desktop GPU profile, Android/iOS touch proof, performance recording, user-content data, Sync endpoint or cloud merge was exercised.
- A user-completed Validation Lab is still manual local evidence awaiting independent review; it does not certify a launch.
