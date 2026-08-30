# W426 verified source checkpoint — 2026-06-29

## Scope

This checkpoint continues the W422 source handover with the W423–W426 foundation work:

- guest-first shell and compact Google sign-in card;
- safe OAuth retry/callback wording and account chooser request;
- shell menu/overflow cleanup and lower-left account/settings structure;
- one direct public Babylon City route;
- production output checks that reject parallel old City documents;
- Vault Reveals as non-financial visual collection UI;
- animated original local SVG texture surfaces in Babylon;
- original NPC/building art briefs and preview-only City visual progression;
- Service Worker cache version `v52` for the W423 changed shell/City cache family.

## Verified locally

| Check | Result |
|---|---|
| `npm run lint -- --max-warnings=0` | Passed |
| `npm run test:unit` | Passed — 398/398 |
| `npm run build` | Passed — 289 output files |
| `npm run smoke:build` | Passed — 21 required production files; retired City documents intentionally excluded |
| `npm run audit:site` | Passed — 43 HTML files, 3 tools, 1 game; sitemap/precache verified |
| `npm run launch:readiness` | Passed — no blockers/warnings |
| `npm run qa:w419-city-original-vector-art` | Passed |
| `npm run qa:w422-city-deep-art` | Passed |
| `npm run qa:w426-city-motion-progression` | Passed |

## Lighthouse status

`npm run lighthouse:direct` was attempted after the production build. Its Chromium run reached `chrome-error://chromewebdata` and returned `chrome-error-final-url` before navigation timing was available. The helper reported `environmentBlocked: true` after one planned route.

There is **no valid Lighthouse score in this checkpoint**. Run the packaged Lighthouse helper from a normal Windows/CI browser runner before making performance claims. Do not treat the blocked result as a pass or fail of the site itself.

## Still requires live/manual proof

- Cloudflare production deployment of this checkpoint.
- Guest Home/Chat card opens once on fresh signed-out session, closes correctly, and reopens after logout.
- Pressing Continue with Google opens the real chooser; account selection returns to the original route; cancellation/retry works.
- Service worker update adoption on an existing browser profile.
- `/eoncity` Babylon start on desktop, Android/iPhone, lower-GPU laptop, reduced-motion and low-detail recovery path.
- Human visual review of actual premium GLB/GLTF asset work once it exists.
- Multi-device Sync, Vault E2EE, notification delivery, referral/reward/payment/market execution — not released by this source.

## Packaging policy

The handover archive must exclude `node_modules`, `dist`, `artifacts`, `.wrangler`, caches, test reports, environment files and secret-bearing local configuration. The package contains code, documentation, scripts, config and tests needed to install, build and verify from a clean checkout.
