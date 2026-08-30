# W479 — City/Realm Start-Here Source Foundation Quality Gate

**Status:** SOURCE PASS — external/browser/device evidence remains open  
**Baseline:** W478 accessibility / identity / device / creator bridge source package  
**Purpose:** make EON City a truthful, simple first-entry visual workspace without confusing a new user, starting hidden work, or overstating City, media, voice or publishing capability.

## What changed

- Added `assets/js/city/eon-city-first-run.js`.
- Added exactly three local, user-chosen City routes:
  1. `/?new=1` — Plan a project with EONBOT;
  2. `/workspace#creator-engine` — prepare creator work;
  3. `/local-ai#creator-media` — begin the device-aware Local AI guide.
- Added a non-blocking City **Start here** panel and a direct-entry HUD action.
- Reused normal anchor navigation for every first-run route. City code never programmatically routes a person away, starts a job, submits content, opens an account connection, or triggers an external action.
- Added a source contract and a dedicated W479 source gate covering six required City/Realm surfaces.
- Recorded the separate W479-V voice/dictation programme and W481 social connector programme. Neither programme is claimed live.

## Verified source results

| Gate | Result |
|---|---|
| `npm run lint -- --max-warnings=0` | PASS |
| `npm run qa:w479-city-realm-playable` | PASS — 6 required surfaces; 3 dedicated tests |
| `npm run qa:w479m-creator-distribution-bridge` | PASS — 13 manual/export-first platform handoffs; 3 dedicated tests |
| `npm run test:unit` | PASS — 541/541 current runnable-product tests |
| `npm run build` | PASS — 286 dist files; serial minifier saved 41.49% |
| `npm run smoke:build` | PASS — 21 required build files |
| `npm run audit:site` | PASS — 43 HTML documents, sitemap and precache verified |
| `npm run launch:readiness` | PASS — source readiness only |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `npm audit` | PASS — 0 vulnerabilities |
| `npm run security:secret-scan` | PASS — 2,810 text files scanned; no potential secrets detected |

## Truth boundary

This is not a visual-performance, browser, device, accessibility, Local AI media, voice, social-publishing, payment, marketplace, wallet or public-release certificate.

The City currently offers a local visual work shell, local review/mission surfaces and user-clicked native work handoffs. It does **not** make a verified AAA quality claim, create an external post, connect an account, upload media, invoke a local image/video runtime, invoke a voice runtime, move funds, sell an asset or grant a reward.

## Evidence still required

- W476-B deployed preview/live browser headers, CSP report and Function matrix;
- W477 real route/redirect/canonical/sitemap/cache proof before legacy tightening;
- W478 real accessibility, language/RTL, OAuth, PWA/recovery and Android/iOS evidence;
- W479 desktop/mobile City entry, controls, keyboard/touch/controller, fallback, sustained performance, device visual and human review evidence;
- W479-V per-adapter Dictate / Use Voice evidence;
- W479-M local image/video adapter generation, cancel, output, CSP/CORS/PNA and device evidence;
- W481 per-platform connector access, OAuth, token custody, review/cancel, upload/job/receipt/revoke and real-account proof.

## Next source sequence

1. **W479-V0/V1:** evidence-gated voice capability registry and Dictate-first implementation.
2. **W479-M0/M1:** creator Local AI device chooser and real runtime-install/test bridge.
3. **W479.5:** final non-payment certification after actual browser/device evidence is complete.
4. **W480:** Dodo only after W479.5 owner GO.
5. **W481:** direct social connectors progress serially; they do not block core or Dodo eligibility.
