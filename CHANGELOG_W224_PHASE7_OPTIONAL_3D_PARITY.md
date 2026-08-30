# W224 — Phase 7 Optional 3D Parity

**Date:** 24 June 2026  
**Status:** Source/release gates green; fresh browser interaction proof remains environment-blocked.

## Delivered

- Replaced the former CSS-only City station with an explicit, dynamically loaded WebGL renderer.
- Made `/eoncity/3d` an optional view of the same local `CityWorldState` used by the 2D City.
- Kept 2D canonical for progress, save state, low-power devices, reduced motion, Data Saver, and no-WebGL environments.
- Added a deterministic renderer-safe City scene projection, bounded quality settings, frame-time governor, context-loss handling, and safe 2D fallback.
- Added renderer-independent 3D model tests so Node verification remains free of browser/WebGL module warnings.
- Added 3D preference backup/restore coverage and normalized CityWorldState during encrypted portable backup export and restore to strip unknown/private fields.
- Updated legacy W213/W216 gates so they verify the actual WebGL/shared-state contract rather than retired CSS-station text.

## Safety boundary

The optional 3D view has no second inventory, economy, market action, NPC crowd, reward loop, payout, wallet surface, user store, multiplayer server, or background simulation. It gets only the public-safe City projection.

## Verification

Passed: W224 unit/parity suite, W213/W216 historical safety suites, source syntax, zero-warning lint, production build, smoke, site/PWA audits, full `qa:w216-release-candidate`, and production dependency audit (`0 vulnerabilities`).

Not passed or claimed: live/local Playwright interaction. Chromium launched from this environment, but navigation to local EONAPP was blocked by administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`).
