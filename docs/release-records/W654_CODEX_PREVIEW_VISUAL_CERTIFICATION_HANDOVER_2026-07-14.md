# W654 — Codex Cloudflare Preview Visual Certification Handover

## Mission

Certify the exact W652–W654 candidate in a real headed Chromium session with the real EONAPP Google identity flow. Do not redesign, rebuild or silently patch the candidate before evidence collection. Deploy the provided `dist/` unchanged to Cloudflare Preview and verify its digest first.

Production remains blocked until the owner reviews the evidence and explicitly says GO.

## Required environment

- Windows Codex machine with headed Chromium/Playwright available.
- Existing authorized Google account session controlled by the owner.
- Cloudflare Preview deployment access.
- Desktop viewport, mobile portrait, and mobile landscape.
- DevTools network, console and performance capture.
- No fake auth fixture for the final proof lane.

## Phase 0 — package and provenance

1. Verify every outer ZIP SHA-256.
2. Extract the exact source and exact deployable `dist/` packages.
3. Verify the internal SHA-256 manifest.
4. Record source commit, build provenance and `dist` digest.
5. Deploy the provided `dist/` unchanged to a new Cloudflare Preview URL.
6. Confirm Preview response headers:
   - `/eoncity` and `/eoncity.html`: `no-cache, no-store, must-revalidate`.
   - `/assets/*`: revalidation.
   - `/assets/city/w649/*`: one-year immutable.
7. Do not deploy production.

## Phase 1 — signed-out first impression

Use a clean browser context without an EONAPP session.

Evidence:

- Full desktop screenshot.
- Mobile portrait screenshot.
- Mobile landscape screenshot.
- Network HAR.
- Console export.

Required assertions:

- Headline: “Your work becomes a place.”
- Productive Nocturne art appears premium and legible.
- Four benefits are visible: Command Room, Living districts, Agent Theater, 3D Explore.
- Google CTA and Back to EONBOT are usable.
- Inspect the Google CTA href and prove it remains the same-origin `/api/auth/google/start?returnTo=%2Feoncity` route.
- Trust strip is readable without dominating the hero.
- Zero Babylon, GLB, City-audio, Meshopt or heavy runtime requests before sign-in.
- No layout clipping, accidental horizontal scroll, unreadable text or blocked controls.

Score the signed-out first impression from 0–10 for hierarchy, clarity, premium quality, trust, responsiveness and desire to enter. Any score below 9.5 requires a screenshot-anchored defect list.

## Phase 2 — real Google-authenticated entry

1. Complete the real Google identity flow.
2. Return to `/eoncity` on Preview.
3. Capture loading from access check through first playable state.
4. Record all network requests and their transfer sizes.

Required assertions:

- Heavy runtime starts only after authorization.
- Loading text never claims ready before renderer first frame plus starter assets.
- Pathfinder, EONBOT and Orientation Hall become ready without blank frames.
- No repeated boot loop, stale chunk error, unhandled rejection or cross-origin asset request.
- First-time starter transfer is consistent with the local 4.60 MiB primary target plus normal shell/runtime overhead.

## Phase 3 — Command Room control-workspace matrix

Desktop first, then mobile landscape.

Required visible structure:

- Seven primary work screens: EONBOT, Projects, Create, Forge, Library, Research, Automations.
- Four systems screens: Workspace, Local AI, Vault, Realm Studio.
- Hero actions: Enter 3D Explore, District Map, Show interactives, Share.
- Living Dashboard and proof-bound Agent Theater.

For every native route screen:

1. Click once.
2. Prove the URL did not change.
3. Capture the review panel.
4. Use the second visible action.
5. Prove the canonical EONAPP route opens.
6. Return to City and repeat.

For EONBOT:

- First click renders an in-City review.
- Second click opens EONBOT inside City.
- No route exit is required.

For keyboard shortcuts:

- C/P/N/F/B/I/A/W/L/V/R select or reopen the expected control.
- Shortcut selection must not silently navigate.
- Escape enters 3D Explore.
- Restart or retry City three times, then prove one shortcut produces exactly one review transition—not duplicated handlers.

For Show interactives:

- Interactive controls become visibly discoverable.
- Reduced-motion mode does not pulse or animate excessively.

## Phase 4 — 3D city and asset visual review

Capture stills and short video for every district:

- Orientation Hall.
- Command Centre.
- Creator Atrium.
- Forge Bay.
- Archive/Vault.
- Device Lab.
- Observatory.
- Automation/Share/Realm destinations exposed by the current map.

For every active character and major prop verify:

- Scale and floor contact.
- Rotation and facing direction.
- Material quality, texture resolution and lighting response.
- Skeleton deformation, hands, face, shoulders and knees.
- Idle, walk, run and available gesture transitions.
- No horizontal launch, foot sliding, clipping, duplicate mesh or T-pose.
- Pathfinder Prime versus Pathfinder A side-by-side decision.
- EONBOT model versus procedural fallback behavior.
- Security Sentinel, Device Lab Specialist, Citizen Variant and nine-clip X1 Worker.

Record every defect with district, asset ID, screenshot, clip/state and severity.

## Phase 5 — district residency and update/cache proof

### Residency

- Orientation loads after the controllable core.
- Enter another district and prove the previous district container is disposed.
- Resident district count never exceeds one.
- Lite mode removes optional crowd assets.
- Vault never loads both steward variants simultaneously.

### Normal app update

1. Load several districts once and record cached City asset URLs.
2. Reload the same Preview deployment and prove unchanged GLBs are cache hits or 304/reused responses.
3. Deploy a shell-only Preview update without changing GLB bytes.
4. Prove the City shell updates while unchanged GLB URLs and cached bytes are reused.
5. Change one test model in a non-production branch so its content hash changes.
6. Prove only the new hashed model URL downloads when its district is opened.
7. Clear site data and repeat to document the honest full-cache-loss behavior.

## Phase 6 — performance and resilience

Test at minimum:

- Desktop balanced.
- Desktop cinematic.
- Mobile landscape lite.
- Reduced motion.
- Network throttling.
- Cache cold and cache warm.
- WebGL context loss/recovery where supported.

Collect:

- FPS and frame-time percentiles.
- Main-thread long tasks.
- JS heap and GPU-context observations.
- First City usable time.
- Starter transfer bytes.
- District transition time.
- Cache-hit percentage on warm return.
- Console warnings/errors.
- Device heat/battery notes for a 10-minute mobile session.

No performance claim is certified without raw evidence.

## Phase 7 — final scoring and owner review

Create one evidence folder containing:

- `CODEX_W654_EXECUTION_RECEIPT.json`
- `CODEX_W654_SCORECARD.md`
- screenshots by phase
- videos by phase
- HAR files
- console logs
- performance traces
- route matrix CSV
- asset visual audit CSV
- cache/update receipt JSON
- Preview URL and deployment ID
- exact `dist` digest

Score these dimensions:

1. Entry/first impression.
2. Command Room usability.
3. EONAPP route coverage.
4. Productivity/entertainment balance.
5. 3D art and animation.
6. Mobile usability.
7. Performance and cache behavior.
8. Safety/truthfulness.
9. Recovery and accessibility.
10. Overall flagship readiness.

Passing policy:

- No critical defect.
- No fake completion, hidden action or security regression.
- Every category at least 9.0/10.
- Overall at least 9.5/10.
- Owner explicitly approves Pathfinder choice and production GO.

If any condition fails, keep production blocked and return a prioritized patch list. Never reinterpret missing browser evidence as a pass.
