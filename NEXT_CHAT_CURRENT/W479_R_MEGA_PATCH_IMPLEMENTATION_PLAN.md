# W479-R — EON City Certification Remediation Mega Patch

## Owner decision

ChatGPT codes the patch. Codex only performs clean merge/rebase, validation, deployment, and live evidence capture. Codex must not make unapproved visual, performance, or test-threshold design decisions.

## Objective

Turn the current City `FIX REQUIRED` result into a genuinely supportable certification result without hiding warnings, relaxing performance thresholds, downgrading the City experience, or pretending that browser emulation equals physical device proof.

## Defects proved live

1. Repeated late-session hitches:
   - 256.975 ms at 64.275 s;
   - 236.475 ms at 75.136 s.
2. Repeated WebGL warnings:
   - `texImage2D: bad image data`;
   - zero-size mipmap generation failure.
3. Portrait companion status chips collapse into an unreadable string.
4. Some skyline geometry reads as pure black missing-looking slabs.
5. Physical Android, iPhone Safari, and tablet evidence is missing.

## R0 — Reconcile current main before code lands

- Codex provides the current-main diff/commit identity to the final handover.
- The W479-R output must be a patch or source archive that can apply cleanly to live main, preserving W228/W210 and E2E changes.
- Never overwrite main from an older source archive.

## R1 — Safe texture lifecycle and WebGL repair

### Required code work

- Inventory every City texture/image/SVG/canvas creation path.
- Create a shared safe texture factory with:
  - valid intrinsic dimensions before upload;
  - decode-ready state before material assignment;
  - fixed-size valid fallback canvas/material;
  - no zero-width or zero-height upload;
  - explicit mipmap policy;
  - cancellation and disposal support;
  - no texture attach after scene teardown.
- Disable mipmaps for UI/decal/vector label textures unless a dimension-valid world texture needs them.
- Ensure dynamic SVG/canvas art always has a valid `width`, `height`, and `viewBox` before rasterization.
- On failed optional art, degrade only that decoration safely; never create a missing black rectangle, console error, or full-scene failure.

### Required gates

- static asset dimensions gate;
- no unsafe raw texture construction paths remain;
- safe fallback gate;
- mipmap policy gate;
- resource disposal gate.

### Acceptance

- zero `texImage2D: bad image data` warnings;
- zero zero-size mipmap warnings;
- zero critical asset request failures;
- no art texture causes unbounded GPU object growth.

## R2 — Sustained frame pacing and scheduler repair

### Required code work

- Add a local-only runtime event ledger for texture decode, material attach, deferred art task start/end, quality change, long frame, and resource counts.
- Correlate long frames with stage work; do not collect user content.
- Replace bulk or late decorative activation with a budgeted queue that limits work per frame.
- Prewarm known core City work before the sustained 90-second witness, or defer nonessential decoration until there is idle budget.
- Never rebuild the full scene during a normal session.
- Cache mesh/material references; remove expensive scene search from render callbacks.
- Cap nonessential animation update cadence.
- Dispose timers, observers, textures, materials, meshes, and event listeners on exit.
- Make the quality governor reduce optional effects first, never remove core navigation or falsely retain a cinematic label after reduction.

### Acceptance

For the 90-second desktop live witness:

- median FPS >= 45;
- p95 frame time <= 33.3 ms;
- no repeating post-load hitch > 100 ms;
- no uncaught errors;
- no resource-count growth trend consistent with a leak.

## R3 — Desktop visual polish with a strict performance budget

### Required code work

- Recompose neon ribbons: one principal hero ribbon, secondary loops behind landmarks, reduced glare/bloom, no bright arc cutting through the main route/HUD.
- Turn pure-black skyline slabs into authored noir facades: controlled window grids, rim edges, roof profiles, panel breaks, and depth layers.
- Retain a noir cinematic look but prioritize the visible player route, meaningful landmark signs, then atmosphere, then distant decoration.
- Improve street depth with restrained reflections, curb/lane detail, and limited emissive accent; do not add expensive full-scene post-processing.
- Make Command Deck cards dark glass / City-native rather than plain white web-form blocks. Keep current review-then-open safety semantics.

### Acceptance

- no apparent missing geometry;
- City landmarks and route remain readable;
- no dominant neon loop overwhelms the frame;
- Command Deck looks integrated and accessible;
- visual improvement does not invalidate R2 performance thresholds.

## R4 — Portrait, landscape, tablet, and accessibility repair

### Required code work

- Fix portrait companion chip layout: independent pills, explicit gap, wrap, separator/readable label, safe-area padding.
- Ensure 390x844 portrait retains honest companion/fallback language and reachable actions.
- Ensure 844x390 landscape controls fit and stay reachable.
- Add tablet rules across 768–1024 widths.
- Preserve reduced effects, keyboard controls, focus indication, touch controls, and typed fallbacks.

### Acceptance

- no fused chip text;
- no clipping/overlap/dead zones;
- no false 3D-mobile claim in portrait fallback;
- landscape controls have safe tap targets.

## R5 — Test, evidence, and release discipline

### Source gates

- all vector art assets have dimensions;
- safe texture factory is used;
- no unsafe mipmap path;
- deferred work is frame-budgeted;
- governor behavior is deterministic;
- cleanup disposes all City resources;
- portrait chips structural layout test;
- Command Deck review safety test;
- current W221/W224/W228/W231/W232/W233 E2E contract remains meaningful.

### Live evidence after deployment

- run the exact W479-C/E browser/live witness on eonapp.ch;
- desktop cold/warm/90-second interactive run;
- City -> EONBOT -> return;
- City -> Creator -> return;
- desktop, portrait, landscape screenshots;
- raw console, request, page-error, and performance data;
- before/after visual triage;
- physical Android, iPhone Safari, and tablet plan must be either captured or remain explicit blockers.

## Strict prohibition

Never suppress warnings, delete performance probes, lower thresholds, fake device results, call browser emulation physical-device proof, hide a warning through console filtering, or call City certified on a screenshot alone.
