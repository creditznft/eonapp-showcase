# EONAPP W731–W734 Command Hub Validation Receipt

**Validation date:** 2026-07-28 (Asia/Kolkata)  
**Base authority:** W730 commit `789a77665905197d283ce184f3161a6946323241`  
**Base tree:** `735a0ae0572babe4cb271fe0dab2b7fc35d874b1`  
**Branch:** `local/w731-w734-command-hub`  
**Deployment:** none

## Implemented scope

### W731 — consolidated City runtime

- One active Command Hub runtime owner.
- One Babylon Engine, one Scene and one render loop.
- Old Expanse, district-belt, duplicate Nexus and product-layer owners removed from the launch import graph.
- Progressive local content-hashed GLB loading begins only after the first playable frame.
- Procedural fallbacks preserve movement and station access if any GLB fails.

### W732 — compact complete Command Atrium

- Open Orientation Core and bounded inner/outer station rings.
- Ten purposeful stations within one compact hub.
- Wide paths, low complete boundary treatment, outside skyline and three closed future gateways.
- Screen-space labels; no mirrored readable text on meshes.
- No reachable unfinished or empty launch area.
- Non-interactive underside safety occluder.

### W733 — functional stations

- EONBOT Nexus, Create Forge, Project Atlas, Library Vault and Share & Capture Studio.
- Command Console, Automation Theatre, Local AI Lab, My Realm Portal and Plans & access.
- Every visible station dispatches one maintained shared full-screen work surface.
- Click, touch, `E`, City Menu guidance and local Resume Location paths.
- Creator Capture and checkout remain explicit, reviewed and non-automatic.
- Duplicate-open guard prevents repeated clicks from opening multiple work surfaces.

### W734 — characters and device polish

- Every station has a name, role, greeting and one truthful useful action.
- Pathfinder and EONBOT are core progressive assets; role characters are quality-budgeted.
- EONBOT follows locally and returns toward its dock.
- Character animation uses measured post-clamp displacement; blocked movement returns to idle.
- Keyboard, touch, reduced motion, forced colors, narrow mobile and landscape behavior are represented in source contracts.
- Shared keyboard fallback handles browsers that omit `KeyboardEvent.code`.

## Test and gate results

- W731–W734 focused Command Hub gate: **20/20 passed**.
- Maintained certifying manifest: **386 files**.
- Dependency-free maintained execution: **368 files**.
- Dependency-free TAP result: **1,412 passed / 1,459 declared**, **47 explicit skips**, **0 failures**.
- Maintained exact-dependency files deferred: **18**.
- Complete independent exact-dependency contract: **24 files**; six are outside the current maintained runner but remain preserved in the broader certification contract.
- W721 product-reset gate: **8/8 passed**.
- W624D archive gate: **10/10 passed**; **36 preserved files / 47 superseded assertions**.
- W633 route audit: **11/11 passed**; **36 public routes**, **131 one-hop redirects**, **308 reachable modules**.
- W634 responsive/accessibility/input: **13/13 passed**.
- W635 performance/cache/update safety: **17/17 passed**.
- W636 security/privacy/abuse: **21/21 passed**.
- W637 persistence/migration/recovery: **18/18 passed**.
- Active-surface import fence: **308 reachable modules passed**.
- Site audit: **49 HTML files passed**.
- Launch identity surface: **0 blockers, 0 warnings**.
- App-surface quality: **0 blockers, 0 warnings**.
- Launch page invariants: **0 blockers; 2 pre-existing keyword warnings in About/Privacy**.
- Secret scan: **4,548 text files scanned; no potential secrets detected**.
- Byte-level trailing-space scan: **0 actual defects**.

## Dependency, build and browser limitation

`node_modules` is absent. A bounded 20-second `npm ping` to the configured package gateway timed out with exit code `124`. The exact certification command failed closed with:

```text
Exact Babylon dependencies are unavailable. Run npm ci from the unchanged lockfile in a healthy registry environment.
```

Therefore this receipt does **not** claim:

- the 18 maintained Babylon-dependent files passed;
- production build success;
- Playwright or headed-browser success;
- physical desktop/mobile frame-rate or memory proof;
- Cloudflare Preview or production deployment.

No dependency was weakened, vendored around the lockfile or falsely counted as passed.

## Red-team corrections included

- Blocked boundary movement no longer keeps the avatar in a walking animation.
- World underside is visually sealed and non-interactive.
- Restore/focus/unstuck coordinates pass through the W731 safety clamp.
- City Menu and full-screen work surfaces clear input and prevent background movement.
- Missing `KeyboardEvent.code` no longer breaks W/A/S/D or arrow controls.
- Canvas pointer interaction restores keyboard focus.
- Rapid repeated station activation cannot open duplicate panels.
- GLB failure cannot block the first playable frame, movement or station access.
- City promotion is user-opened; no automatic checkout, recording, upload or posting path was introduced.

## Reproduction commands

```bash
npm run qa:w731-w734-command-hub
node scripts/w718-run-fast-maintained-suite.mjs
node scripts/w721-product-reset-gate.mjs
node scripts/w624d-test-archive-gate.mjs
node scripts/w633-every-route-audit-gate.mjs
node scripts/w634-responsive-accessibility-input-gate.mjs
node scripts/w635-performance-cache-update-safety-gate.mjs
node scripts/w636-security-privacy-abuse-gate.mjs
node scripts/w637-persistence-migration-recovery-gate.mjs
node scripts/active-surface-import-fence.mjs
node scripts/site-audit.mjs
node scripts/launch-page-invariants.mjs
node scripts/launch-identity-surface-gate.mjs
node scripts/app-surface-quality-gate.mjs
node scripts/secret-scan.mjs
```

When the registry is healthy:

```bash
npm ci
node scripts/w718-run-exact-certification.mjs
npm run build
npm run qa:w731-w734-command-hub
```

## Next authority

W735 is next: whole-app reconciliation, exact dependency closure, emitted-output audit, browser/device evidence and immutable release-candidate creation. No deployment is authorized by this receipt.
