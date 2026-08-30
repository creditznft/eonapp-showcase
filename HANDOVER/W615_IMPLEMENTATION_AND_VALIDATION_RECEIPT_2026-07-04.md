# W615 Implementation and Validation Receipt

**Date:** 4 July 2026  
**Baseline:** W613 sanitized source snapshot  
**Result:** source repair and local validation complete. Live signed-in production render proof remains open.

## Observed defect

The attached production screenshot showed `/eoncity` entering recovery even though access/provenance work had progressed. The recovery page lacked the normal EONAPP shell, appeared scattered, lacked practical scrolling and made support look disabled.

## Root causes repaired in source

1. `eoncity.html` had no `data-eon-app-shell`, `eon-app-shell.css`, or `eon-app-shell.js`, unlike normal app routes.
2. `renderFallback()` inserted all recovery text and controls as direct children of a two-column CSS grid.
3. `body.eoncity-play-entry` and fallback layout locked overflow regardless of recovery state.
4. Recovery Lite mode could drop to generic safe entry instead of preserving the approved direct City model.
5. The authenticated runner had no bounded structured capture of recovery/render state.

## W615 delivered

- standard EONAPP shell + responsive continuity on protected City route;
- route-state-aware scrolling and immersive running mode;
- structured accessible recovery panel and visual panel;
- named recovery actions and visible support link;
- one Lite retry, redacted safe marker, and no auto-navigation;
- same named City HUD contract for recovered Lite mode;
- state markers: route/access/play/first-frame/recovery/quality;
- W615 loopback-only surface snapshot;
- W599 runner diagnostics for recovery/missing render surface;
- current shell/history gates reconciled to the W607 direct City contract.

## Local validation results

| Gate | Result |
|---|---|
| `npm ci` | passed; `npm audit` reported 0 vulnerabilities |
| `npm run lint -- --max-warnings=0` | passed |
| `npm run qa:w615-city-recovery-shell` | passed, 4/4 |
| `npm run qa:w600a-city-overlay-proof` | passed |
| `npm run qa:w607-city-gameplay-contract` | passed |
| W392, W405, W427 direct City gates | passed: 15/15, 17/17, 9/9 |
| W216 local-finalization gate | passed |
| `npm run test:unit` | passed, 741/741 |
| production build | passed earlier in the W615 local worktree; later direct Vite build after final source update completed in 9.91s |
| `npm run smoke:build` / site/security gates | passed in W615 local validation |

## Important qualification

A combined final command reached the build stage when the tool time limit expired; it did not print a build failure. Because the working folder is sanitized and has no real Git revision, Codex must rerun the full production build from the actual checkout with `EONAPP_SOURCE_REVISION` set to the true commit. This package does not claim deployment parity or browser/device success.

## Production status after W615

- **W600A authenticated City proof:** still open.
- **Live City renderer/root cause:** still open until the W615 snapshot captures the exact `CITY_*` marker and the cause-specific fix is deployed/proven.
- **W607 browser/device gameplay evidence:** still open.
- **Launch decision:** NO-GO while any of the above remains open.
