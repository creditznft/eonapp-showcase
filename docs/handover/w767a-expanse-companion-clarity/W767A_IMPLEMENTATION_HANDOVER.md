# W767A — Expanse Companion Clarity and Asset Truth

## Authority

- Base source: `a6cf226d39073701b3d3b04c1f8d4582aec495a3`
- Working branch: `chatgpt/w767-expanse-companion-clarity`
- Runtime boundary: one Babylon engine, one scene, one player identity, one EONBOT identity, one mission ledger and one persistence authority
- Deployment: none
- Production certification: not claimed

## Delivered scope

### 1. Companion in the Static prologue

The Signal Restoration campaign now contains seven ordered missions. The new first mission is `companion-in-the-static`:

1. Review the expedition.
2. Enter Expanse.
3. Detect the companion signal.
4. Scan dormant EONBOT.
5. Recover the signal core.
6. Restore the companion link.

The existing `beyond-the-gate` mission now begins with Pathfinder, map activation and Gateway Overlook survey after EONBOT is restored.

### 2. One canonical EONBOT across all world states

The maintained `w737-eonbot-anchor` remains the only EONBOT identity. W767A projects that identity into:

- bounded entry loading;
- dormant rescue presentation;
- bonded formation follow;
- Regional Transit formation;
- safe return to the Command Hub.

No second companion model, engine, scene, mission authority or persistence owner was introduced.

### 3. Physical rescue interaction

Gateway Overlook now contains a damaged signal relay, a scan target and a recoverable signal core. Ordered physical interactions emit canonical mission signals. Restoring the link explicitly starts `beyond-the-gate` only after the rescue mission finishes.

### 4. First-arrival clarity

A compact arrival presentation now states:

- `SIGNAL FRONTIER`
- `Regional network: 8% online`
- `Companion signal detected`

The Expanse overlay also exposes companion phase status and keeps the explicit Return to Command Hub control available whenever Expanse is active.

### 5. Legacy-save migration

Old W766 ledgers are migrated before objective sanitization:

- review-only users continue at Expanse entry;
- users who had already entered are treated as having restored EONBOT;
- existing Beyond the Gate progress is preserved;
- existing XP is preserved;
- no retroactive XP is fabricated.

### 6. Authored-asset truth gate

Hero GLB loading is no longer considered successful merely because `LoadAssetContainerAsync` resolved. Each primary and fallback attempt now records and validates:

- requested local path and variant;
- load status and failure detail;
- mesh, renderable mesh and visible mesh counts;
- material and animation-group counts;
- source dimensions and final world bounds;
- target height and applied scale;
- final position and ground offset;
- expected-zone distance and grounding delta;
- LOD state and estimated draw-call contribution.

A procedural fallback proxy is suppressed only after the authored asset passes visible-presentation validation. Invalid primary assets are disposed and the registered fallback is attempted.

### 7. W766IR2K CSS recovery preservation

The uploaded source had the W766IR2K service-worker CSS recovery in root `sw.js`, while `public/sw.js` was stale. The public mirror now matches the root authority exactly, preserving network-only handling and cache cleanup for the versioned City surface CSS family.

## Validation completed

### Focused W766/W767A regression

Evidence: `W767A_FOCUSED_REGRESSION_147_PASS.log`

- Tests: 147
- Pass: 147
- Fail: 0
- Skipped: 0

The dependency-backed built-artifact test is intentionally excluded from this evidence because the sandbox could not install the locked dependency tree.

### Command Hub runtime/source regression

Evidence: `W767A_RUNTIME_SOURCE_REGRESSION_291_PASS.log`

- Tests: 291
- Pass: 291
- Fail: 0
- Skipped: 0

### Additional checks

- JavaScript syntax checks: pass for every changed runtime module.
- Git whitespace/diff check: pass.
- Root/public service-worker identity: pass.
- Canonical EONBOT source contract: pass.
- Legacy persistence migration: pass.
- Seven-mission physical campaign order: pass.
- Asset-truth rejection and acceptance cases: pass.

## Environment limitations

`npm ci --ignore-scripts` could not complete because the configured private package mirror did not provide locked package `ws@7.5.11`. Consequently:

- the production bundle was not rebuilt;
- the `postcss`-dependent built-artifact gate could not run;
- Babylon browser rendering could not be executed here;
- foreground FPS, spatial diagnostics and authenticated Preview were not re-certified;
- no Cloudflare Preview or production deployment occurred.

An attempted all-history unit sweep contains 771 test files and exceeded the sandbox execution window. It is not represented as certification.

## Existing release blockers retained

The source handover already classified production as not certified. These gates remain mandatory:

- foreground gameplay performance evidence;
- W747 spatial diagnostics remediation;
- authenticated headed browser campaign playthrough;
- Hub ↔ Expanse disposal/memory soak;
- built output and service-worker validation after a successful locked install;
- owner visual review before production.

## Next bounded coding wave

W767B should continue Programme A without beginning My Frontier:

1. isolate Expanse HUD from all Command Hub station labels;
2. implement proximity/occlusion label arbitration;
3. strengthen first-objective ground circuit guidance and map route state;
4. add EONBOT `Guide me` behavior;
5. run the live primary/fallback asset ledger in authenticated Preview and repair each rejected landmark;
6. complete the first manual five-minute arrival-and-rescue proof.
