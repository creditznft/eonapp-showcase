# EONAPP / EONCITY FINAL LAUNCH 9.5 ROADMAP

**Date:** 2026-08-10
**Purpose:** Institutional-grade final launch plan based on owner gameplay review, four Edge recordings, live Opera inspection, console evidence, current source inspection, and the existing Signal Frontier interaction repair checkpoint.
**This document is a plan, not a deployment receipt. No production change is authorized by this document.**

---

## 0. Executive decision

EONAPP is not in a “start over” state. The Command Center/Command Hub already demonstrates the visual language, information density, station discoverability, and sense of place that the rest of EONCITY should inherit. The correct strategy is therefore **preserve the Command Center as the gold master and raise the rest of the product to it**, rather than redesigning the Babylon City again.

The launch blockers are concentrated in five areas:

1. **Interaction reliability:** keyboard `E`, pointer click, touch Use, objective advancement, EONBOT mission continuity, and camera look must behave as one coherent gameplay system.
2. **EONBOT continuity:** City currently exposes multiple EONBOT concepts and at least one in-game workspace can remain on “Preparing EONBOT…” for an unacceptable duration. The product must feel like one EONBOT, one conversation/work context, available in one click while playing.
3. **Mobile composition:** the main ChatGPT-style shell and EONCITY both have too many independent fixed/floating controls competing for small screens. The current mobile experience is a launch blocker even though individual controls are functional.
4. **Open-world quality and access:** Signal Frontier has good authored moments, but primitive/blockout-looking architecture dominates too many views. My Frontier and Storm Sector must be owner-reviewable, visually certified, and ultimately available from the beginning instead of making story progression a mandatory doorway.
5. **Performance, residency and proof:** owner evidence now spans roughly 18–35 fps and hardware scaling from 1.2 to 1.6. Recording/DevTools/extension overhead may contribute, so this is not a final device verdict, but on the Ryzen 7 / 16 GB / RTX 3050 4 GB reference laptop it is too low to accept without a clean-profile root-cause trace. The release must also prove that unchanged City art is reused from browser storage instead of being transferred from Cloudflare on every entry, and that City + Local AI + background work share one workload-pressure authority.

### Final product decision

At public launch, the Open Worlds choice should be:

- **Signal Frontier — Story** — recommended first, never mandatory.
- **My Frontier — Build** — accessible immediately; progression may gate advanced structures/rewards, but not basic world entry.
- **Storm Sector — Explore** — accessible immediately **after its actual renderer/package is certified**; no Signal Frontier completion requirement.

The first-time experience must not have a single failure choke point. If a player becomes stuck on an objective, they can still build, explore, talk to EONBOT, or return to Command Center. Progression should reward continued play, not prevent the user from discovering the product.

---

# 1. Frozen authority and rollback rules

## 1.1 Production authority

- Live source authority before this review: `7a833c91203c5c1dc82e8529c83a619473d67261`
- Production deployment: `3e7785fc-4ca8-45f2-b148-d00364e83f02`
- Current live release family shown in the City UI: `68a350e64179… · 7a833c91`

## 1.2 Repair checkpoint that must not be lost

Signal Frontier input repair checkpoint:

- Branch: `chatgpt/signal-frontier-input-repair-20260809`
- Commit: `fb1e4a202a690ccc875bd4877d1861d6ec7aba3e`

The repair already addresses three coupled defects:

1. mismatch between presentation target ID and dispatch target ID for dormant EONBOT;
2. objective-marker overlap accidentally removing the nearest interaction target;
3. Expanse pointer picks falling back into Command Hub/Nexus semantics.

Relevant modified files in that checkpoint:

- `assets/js/city/w731/eon-city-w731-command-hub-runtime.js`
- `assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js`
- `assets/js/city/w766/eon-expanse-w767b-guidance-director.js`
- `tests/unit/w767c-expanse-proximity-interaction.test.mjs`
- `tests/unit/w767i-expanse-touch-interaction.test.mjs`

**Rule:** all final-launch work starts from `fb1e4a20`, or re-applies that exact patch with verification. Do not reset back to raw `7a833c91` and silently lose the repair.

## 1.3 Command Center protection rule

The Command Center is the gold master. Do not replace its current Babylon runtime, layout concept, authored buildings, station workflow, or overall visual language. Changes inside Command Center are limited to:

- shared input/camera fixes;
- EONBOT dock integration;
- mobile safe-zone/HUD integration;
- performance optimization that preserves appearance;
- bug fixes proven by regression tests.

No broad visual redesign is authorized.

---

# 2. Evidence reviewed

## 2.1 Owner recordings

### Recording A — main EONAPP desktop
`EONAPP — Ask. Make. Enter. - Personal - Microsoft Edge 2026-08-09 23-48-10.mp4`

Key conclusion: desktop shell is generally strong and the sidebar hover expansion is working in Edge. The earlier suspected hover regression is **closed** and becomes a preservation regression test, not a repair wave.

### Recording B — short Command Hub entry
`EON City Command Hub · EONAPP - Personal - Microsoft Edge 2026-08-09 23-48-39.mp4`

Key conclusion: Command Hub presentation remains the correct quality target.

### Recording C — long Signal Frontier gameplay
`EON City Command Hub · EONAPP - Personal - Microsoft Edge 2026-08-09 23-49-56.mp4`

Representative observations:

- around 49 s: large areas read as flat floor + lines + simple procedural objects;
- around 98 s: strong authored hero object/NPC presence exists, but surrounding purple/yellow boxes and connector primitives visually dominate;
- around 172 s: Mission Complete treatment is polished and game-like;
- around 221–245 s: the in-game EONBOT Conversation Workspace remains on **“Preparing EONBOT…”** for an extended period.

### Recording D — responsive/mobile review + console
`EON City Command Hub · EONAPP - Personal - Microsoft Edge 2026-08-10 00-00-32.mp4`

Representative observations:

- around 86 s: narrow City work panel compresses Minimize/Close into a poor right-edge layout;
- around 107 s: City touch/HUD layers occupy too much of a narrow portrait viewport;
- around 129 s: Open Worlds/Atlas content is functional but dense and competes with persistent controls;
- around 193–236 s: main EONAPP mobile layout shows the strongest launch blocker — floating help, Quick Command, composer, active-project block, EONBOT status/profile/share controls and fixed bottom UI fight for the same limited space.

## 2.2 Live Opera inspection

Live pages inspected through the connected browser:

- `eonapp.ch/`
- `eonapp.ch/eoncity?releaseCheck=7a833c`

The live accessibility tree confirms that the mobile collision is architectural rather than a single broken pixel value. The main shell independently exposes:

- context help `?`;
- Quick Command;
- fixed chat composer actions;
- Share/Profile/More chat actions;
- active-project continuation UI.

EONCITY independently exposes:

- Explore;
- Menu;
- Exit City;
- touch movement controls;
- Sprint;
- station markers;
- context help `?`;
- Quick Command;
- top shell actions.

This is too many independent screen owners on a phone. The fix is a **single responsive UI-layer authority**, not another stack of media-query exceptions.

## 2.3 2026-08-10 Chrome + physical-phone evidence addendum

New evidence added after the first roadmap freeze:

- Chrome City run reached `W766IR2H_FPS_PROTECTION` at a sustained **35 fps**, escalating hardware scaling from `1.0` to `1.2` while the selected profile remained cinematic. This is a real optimization signal; the fix is not to raise the FPS threshold and hide it.
- Physical-phone proof confirms the composer/Send region can be obstructed by Quick Command and that top EONBOT actions/project continuity consume too much narrow-screen space.
- Mobile City overlays require an always-visible, thumb-reachable Close path. A user must never need to scroll a sheet just to escape it.
- The PWA console line about `beforeinstallpromptevent.preventDefault()` is consistent with EONAPP's explicit custom-install flow: the event is intentionally captured and later prompted from product UI. It is a certification item, not by itself a first-party runtime failure.
- Source inspection confirms an existing **release-stable City asset cache** (`eonapp-city-assets-v1`), immutable content-addressed City URLs produced during the production build, year-long immutable HTTP caching, and service-worker cache-first reuse. Therefore the correct launch work is **warm-load residency proof + gap repair**, not a second competing cache design.
- Source inspection also confirms the existing **W555A universal workload governor**. It already models City rendering, Local/Hosted AI and background/heavy-media work, but renderer-specific FPS adaptation and universal workload pressure must be explicitly separated so two governors do not independently degrade graphics for the same low-FPS sample.

## 2.3 Source inspection

Important current source facts:

### Sidebar hover is already correct
`assets/js/eon-app-shell.js` contains `bindHoverExpandSidebar()` and opens a collapsed desktop sidebar on `pointerenter`/`focusin`. This must be preserved and tested.

### City has a useful overlay authority
`assets/js/city/eon-city-overlay-coordinator.js` already provides the right concepts: one modal authority, focus management, Esc close and restoration. It should be extended into the common responsive overlay contract instead of bypassed.

### EONBOT is currently conceptually fragmented
`assets/js/city/eon-city-eonbot-quick-work.js` explicitly describes its conversation as **memory-only** and links the player to “Open full EONBOT Chat”. This conflicts with the desired product model: one canonical EONBOT conversation/work context that follows the user into the City.

### My Frontier access is still progression-gated
`assets/js/city/r07/eon-city-r07-open-world-availability.js` makes My Frontier available only after first restoration/Beacon One.
`assets/js/city/r08/eon-city-r08-my-frontier-access.js` derives an unlock receipt from `repair-beacon-one`.

This should be changed: world entry becomes open; progression receipts continue to gate only advanced build/reward capabilities that genuinely need progression.

### Storm Sector is not simply a hidden completed map
Current activation state deliberately distinguishes gateway activation from actual rendering and uses `regionRendered: false`. Therefore an owner/test bypass may expose inspection surfaces, but public launch must not claim Storm is available until the actual region renderer is visually and functionally certified.

### Signal Frontier’s art contract and rendered composition disagree
`w771a-five-zone-cinematic-art-contract.js` states:

- finished hero primitives are not allowed;
- primitives are for small environment connectors only;
- zones should be visually distinct without labels.

Yet `w771c-zone-environment-kit-presenter.js` uses many Babylon `CreateBox`, `CreateCylinder`, `CreateTorus`, and `CreatePolyhedron` meshes. These can be legitimate connector geometry, but current gameplay footage shows them occupying too much of the visual field. The issue is therefore not “no authored assets”; it is **authored asset dominance and composition**.

### Camera vertical range is narrow and must be calibrated
`eon-city-third-person-controller.js` converts `movementY` into pitch.
`eon-city-play-babylon.js` clamps ArcRotate beta to roughly `0.84–1.2`. The owner reports that looking down works but looking up does not feel correct. The final root cause must be proved with a direction/range test before changing signs or limits.

---

# 3. Console evidence classification

## 3.1 Likely browser-extension noise, not EONAPP product errors

The following messages originate from `contentscript.js` / multiplex streams and strongly resemble injected extension content-script behavior:

- `MaxListenersExceededWarning`
- `ObjectMultiplex - orphaned data for stream "app-init-liveness"`
- `ObjectMultiplex - orphaned data for stream "background-liveness"`

Do not spend a product coding wave “fixing” these until they reproduce in a clean browser profile with extensions disabled.

## 3.2 PWA install informational message

`beforeinstallpromptevent.preventDefault()` can be intentional if EONAPP owns a custom install action. The launch requirement is not “remove the warning”; it is:

- custom Install UI appears when installable;
- its click calls the saved prompt;
- accepted/dismissed states are handled correctly;
- no dead install button exists.

## 3.3 Performance signal that must be treated seriously

Observed FPS protection events during the recorded session:

- sustained ~18 fps → scaler level 1 / hardware scale 1.2;
- sustained ~23 fps → level 2 / scale 1.4;
- sustained ~22 fps → level 3 / scale 1.6.

Because video capture, DevTools and extensions can materially affect a browser benchmark, this is not yet a fair final hardware score. However, it is sufficient evidence to make **performance certification a release gate**, not optional polish.

---

# 4. Current experience scorecard

These are evidence ranges, not marketing scores.

| Area | Current evidence | Launch status | 9.5 target |
|---|---:|---|---|
| Command Center visual/world feel | ~8.5–9.0 | Preserve / benchmark | ≥9.5 after shared polish |
| Command Center desktop usability | strong | near-pass | zero input/workspace dead ends |
| Signal Frontier mission UI | strong | preserve | match Command Center polish |
| Signal Frontier world composition | ~6.5–7.0 | fail | authored, layered, zone-distinct |
| Signal Frontier interaction | blocked in current production | fail | E/click/touch identical and reliable |
| EONBOT in City | fragmented / can hang preparing | fail | one-click canonical chat/work continuity |
| Desktop EONAPP shell | strong | pass-with-preservation | minimal, clear, fast |
| Main EONAPP mobile | ~5.5–6.0 | **launch blocker** | composer never obscured; no control collisions |
| EONCITY mobile | ~5.0–6.0 | **launch blocker** | game-first HUD and flawless panels |
| My Frontier | not visually certified in current review | not certifiable yet | full Build-world quality pass |
| Storm Sector | renderer not certified/rendered by current activation contract | not certifiable yet | full Explore-world quality pass |
| Reference-session performance | 18–23 fps observed with capture/DevTools | needs clean retest | stable launch budgets below |

**The product should not be called 9.5/10 until every red row is converted into a measured pass.**

---

# 5. Non-negotiable product decisions

## 5.1 One EONBOT everywhere

The user must not need to understand “City quick EONBOT”, “full EONBOT Chat”, “Conversation Workspace”, and separate memory-only threads.

There is one EONBOT identity and one active work context.

From EONCITY, one tap/click opens the same EONBOT conversation/work context the user had on the main page. When the City dock closes, the same thread remains available on the main page.

## 5.2 Open Worlds are choices, not progression locks

Signal Frontier remains recommended because it introduces the world and companion. It is not a mandatory unlock tunnel.

Basic entry to My Frontier and Storm Sector must not depend on finishing Signal Frontier.

Progression may still gate:

- mission rewards;
- XP/cosmetics;
- Vault Reveals;
- advanced building families;
- special automation/build capabilities;
- story states.

Progression must **not** gate the user’s ability to see whether the Build and Explore worlds are interesting.

## 5.3 Command Center is the visual benchmark

Do not homogenize all worlds into Command Center styling. Each world needs its own identity, but the quality bar must match Command Center in:

- authored landmark density;
- environmental layering;
- signage/wayfinding;
- interaction confidence;
- NPC activity;
- materials/lighting;
- UI clarity;
- performance discipline.

## 5.4 Mobile is a primary launch platform

Desktop responsiveness is not sufficient proof. Mobile must have its own layout contract, real-device testing, virtual-keyboard testing, touch camera/input testing, and performance gate.

## 5.5 No silent failure

Every interaction attempt must end in one of three states:

1. action succeeds and produces a receipt/state transition;
2. action is unavailable and the user is told why;
3. action fails and a recovery path is shown.

No repeated `E` presses with no visible explanation. No indefinite “Preparing…”. No modal with an unreachable Close button.

---

# 6. Target experience architecture

## 6.1 The simplified shell

### Desktop

Keep the current ChatGPT-style shell and working hover-expand sidebar.

Top-level destinations remain few and obvious:

- EONBOT
- Create
- Projects
- Library
- EON City

Utilities can remain under the sidebar / profile / More structure rather than multiplying persistent screen buttons.

### Mobile

The main page becomes:

1. compact top bar: Menu | EONBOT | New chat/profile;
2. exactly one compact active-project continuity surface; never render a second floating Continue card for the same project;
3. canonical conversation body;
4. one bottom composer whose Send action owns a protected no-overlap zone;
5. Quick Command remains available, but must register with the shell safe-zone allocator; on narrow/mobile layouts it moves above the composer or into the composer/tools slot instead of covering Send.

Remove the independent floating `?` from the mobile chat surface and from normal desktop chat gameplay. Help remains available from menu/profile, Quick Command Advanced, and contextual error/recovery flows.

The active-project continuity surface must never overlap Share/Profile/More or EONBOT status. If an active-project strip exists, the generic Continue retention card is suppressed.

“Ready to help” becomes a compact semantic status, not an extra row fighting Share/Profile controls.

## 6.2 City HUD ownership model

Create a single `CityUILayoutCoordinator` (name can differ) that is the authoritative allocator of screen zones.

### Reserved zones

**Top:** world name, compact objective state, Menu, EONBOT.
**Bottom-left:** movement.
**Bottom-right:** Use / primary action.
**Bottom-center:** contextual objective prompt / optional compact card.
**Center:** world view — no permanent UI except temporary reticle/context hint.

No other module gets to create an unconstrained fixed control without registering with the coordinator.

### Mobile rules

- maximum one primary floating action per side;
- no fixed help bubble over gameplay;
- no global Quick star competing with Use;
- Sprint groups with movement, not on the opposite side of the screen;
- release/provenance badge is hidden from ordinary player HUD and available in diagnostics/menu;
- station marker buttons become contextual/atlas UI rather than a dense permanent overlay;
- all sheets obey safe-area and virtual keyboard insets.

## 6.3 Canonical City EONBOT Dock

### Desktop

A non-destructive right-side dock, 360–460 px wide depending on viewport.

- world remains visible;
- player movement is suspended while a text field has focus;
- camera/game input resumes immediately when focus leaves the dock;
- dock can minimize to an EONBOT companion pill;
- close does not lose conversation state.

### Mobile

A single bottom sheet/full-height chat panel (roughly 80–100dvh depending on keyboard state), not a narrow desktop modal squeezed into portrait.

- fixed 48 px+ header controls;
- close/minimize always visible;
- composer follows `visualViewport` when keyboard opens;
- gameplay input is suspended while the sheet is active;
- returning closes sheet to the exact world pose.

### Loading contract

The UI shell must appear immediately. Model/provider readiness is a separate status.

- UI shell visible: ≤500 ms target;
- conversation history/context visible from local store: ≤1.5 s target;
- if AI provider is still loading at 3 s: show actionable status + Retry / Continue offline or without generation;
- never show indefinite “Preparing EONBOT…”.

---

# 7. Open-world visual quality contract

## 7.1 Signal Frontier

Each of the five zones must be recognizable in a screenshot with labels removed.

Each zone needs:

1. one hero landmark;
2. 2–4 authored secondary architectural elements;
3. one distinct ground/material language;
4. one distinct atmosphere/sky/fog/light treatment;
5. a consistent prop family;
6. visible environmental storytelling;
7. at least one NPC/robot/activity loop where appropriate;
8. a clear interaction cluster;
9. a distinct ambient/audio layer;
10. pre-restoration and/or post-restoration visual state where story supports it.

### Primitive rule

Babylon primitives are allowed for:

- collision;
- rails;
- invisible interaction helpers;
- tiny connectors;
- distant ultra-low-cost LOD silhouettes that are visually styled.

They must not read as unfinished hero buildings.

**Golden screenshot gate:** in every canonical 16:9 route screenshot, large anonymous cuboids/cylinders may not visually dominate the foreground/midground. If the first impression is “blockout,” the zone fails regardless of internal contract labels.

### Outside-plot rule

No more endless flat dark floor with isolated primitives.

Build visual depth with:

- layered skyline silhouettes;
- terrain/ground variation;
- roads/circuit paths that lead somewhere;
- distant infrastructure;
- fog/atmospheric depth;
- low-cost instanced props;
- lighting anchors;
- moving background activity where performance permits.

## 7.2 My Frontier — Build world

The player should understand “I can build my place here” within ten seconds.

Required visual/readability elements:

- authored starter district;
- 3–5 visibly different starter plots;
- roads/paths/utilities connecting plots;
- starter buildings already demonstrating the quality ceiling;
- construction hologram/ghost preview;
- clearly authored build pads instead of generic flat circles/boxes;
- residents/robots/utility props;
- vegetation/terrain or equivalent world-specific environmental identity;
- one landmark visible from spawn;
- EONBOT one-click build assistance;
- Build action available immediately, even if advanced items remain progression-gated.

The existing primitive foundation can remain internally, but authored architecture must visually dominate.

## 7.3 Storm Sector — Explore world

The existing authored package already describes valuable ingredients such as a command spire, atmospheric stabilizer, charged transit gate, storms/rain/fog/signal-pylon families and local audio. The launch work is to turn those contracts into a fully rendered, navigable and certified world.

Required gate before public “open from start”:

- `regionRendered` truth must be real, not simply bypassed;
- spawn and return path work;
- hero GLBs render reliably;
- weather does not destroy visibility/performance;
- interactions work through the same resolver as the other worlds;
- EONBOT persists into the region;
- mobile quality tier is usable;
- no uncertified future-region placeholders leak into public UI.

---

# 8. Interaction and progression contract

## 8.1 One resolver for E, click and touch

Keyboard `E`, mouse click/pointer pick, gamepad action if later enabled, and mobile Use must resolve the same canonical interaction target ID and feed the same dispatcher.

No input path may invent a second semantic target name.

The resolved receipt should include at minimum:

- world mode;
- canonical target ID;
- action ID;
- player-target distance;
- input modality;
- objective before/after;
- success/failure reason.

These are diagnostic/test receipts, not analytics tracking.

## 8.2 Objective safety

An objective cannot advance only because a UI element was clicked. It advances after the authoritative interaction receipt confirms the correct action.

Conversely, if the correct interaction succeeds, the objective must not remain stale.

Regression scenarios:

- `E` on target;
- click on target;
- touch Use on target;
- repeated action;
- target moving in/out of range;
- objective marker occupying same mesh/position;
- overlay opened before interaction;
- overlay closed then interaction;
- world switched and returned;
- low FPS / long frame;
- browser loses and regains focus.

## 8.3 Anti-frustration assist

Do not solve unreliability by making the interaction radius enormous. Instead:

- provide a modest hysteresis window so the target does not flicker at the edge of range;
- after repeated failed attempts near the correct objective, surface a clear “Use E / Tap Use / Click object” hint;
- if the object is unavailable, show the actual reason;
- provide “Reset current objective position” only when a verified recovery need exists, without granting rewards.

---

# 9. Camera and movement contract

The owner’s report — “can look down, not up correctly” — is a launch blocker because it makes a 3D world feel immediately unfinished.

## Required calibration

1. instrument input direction in a development proof build;
2. confirm `movementY` sign and ArcRotate `beta` direction;
3. test natural mouse direction in both locked and drag-camera modes;
4. expand the vertical envelope enough to inspect skyline/upper architecture while preventing camera flips;
5. confirm collision and near-wall camera behavior;
6. ensure restoring from a modal/workspace does not reset into a bad pitch;
7. test touch-look separately from touch-move.

### Acceptance behavior

- full 360° yaw;
- comfortably look above horizon to upper building/sky area;
- comfortably inspect ground/player vicinity;
- no sudden pitch jump when entering/exiting pointer lock;
- no inversion difference between Command Center and Open Worlds;
- no camera ownership conflict when EONBOT dock opens/closes.

Do not change the sign blindly. First prove the input trace and beta response.

---

# 10. Mobile launch contract

## 10.1 Required viewport matrix

Automated responsive screenshots at minimum:

### Phones portrait
- 320 × 568
- 360 × 640
- 375 × 667
- 390 × 844
- 412 × 915
- 430 × 932

### Phones landscape
- 568 × 320
- 667 × 375
- 844 × 390
- 915 × 412

### Tablets
- 768 × 1024
- 820 × 1180
- 1024 × 768

### Desktop
- 1280 × 720
- 1366 × 768
- 1440 × 900
- 1920 × 1080
- 2560 × 1440

## 10.2 Required physical-device proof

Emulation is iteration proof, not final proof. Final gate requires at least:

- one current Android Chrome phone;
- one lower/mid-range Android phone if available;
- one iPhone/Safari class device if available;
- owner’s Windows laptop in Chrome and Edge.

## 10.3 Main EONAPP mobile acceptance criteria

- no `?` bubble floating over chat/composer;
- no Quick star floating over Send/composer;
- active-project continuation is compact and dismissible;
- EONBOT header/status does not wrap into broken fragments;
- Share/Profile/More fit without collision or move behind a single menu;
- composer always remains fully visible above safe-area and virtual keyboard;
- latest message/hero content has bottom padding equal to composer height + safe-area;
- no horizontal scroll;
- no clipped primary CTA;
- keyboard open/close does not strand controls;
- orientation change reflows without reload.

## 10.4 EONCITY mobile acceptance criteria

- a player can see the world, not mostly HUD;
- Menu and EONBOT are always reachable;
- movement and Use never overlap;
- Sprint does not collide with Use/Quick;
- contextual objective never hides movement;
- modal Close/Minimize never wrap vertically into an unusable strip;
- all modal headers remain sticky and reachable;
- opening keyboard for EONBOT does not cover composer;
- closing a sheet restores correct camera/input ownership;
- landscape is intentionally designed, not merely rotated portrait CSS.

---


## 10.5 Critical-control collision invariant

The screenshots from the owner review expose a launch-blocking class of defect: independently fixed UI can cover the chat Send control or overlap another persistent command surface. This becomes a machine-tested invariant, not a one-off CSS repair.

For every supported viewport and zoom state:

- the EONBOT Send button bounding rectangle must have zero intersection with Quick Command, Help, project continuity, Share/Profile/More, or any other fixed overlay;
- the active-project surface must not intersect the chat header action region;
- only one project-continuity surface may be visible for the same project;
- bottom safe-zone height must react to `visualViewport`, safe-area inset and composer resize;
- a floating launcher that cannot find a collision-free slot must fall back into an inline/menu slot rather than covering content;
- automated screenshot/geometry tests run at 320×568, 360×800, 390×844, 412×915, 768×1024, 820×1180, 1024×768, 1280×720, 1366×768, 1440×900 and a square 820×820 window.

Exit criterion: zero critical-control intersections in the entire matrix.

# 11. Performance quality budget

The visual upgrade cannot be paid for with a collapse in frame rate. Art and optimization must ship together.

## 11.1 Clean test protocol first

Before measuring:

- clean browser profile / Incognito where practical;
- extensions disabled;
- DevTools closed for baseline FPS capture unless tracing is required;
- no screen recording for the baseline;
- warm second load and cold first load measured separately;
- same route and camera script each run.

Then separately record a trace/video for proof.

## 11.2 Gameplay targets

### Owner reference Windows laptop, 1080p — Ryzen 7 / 16 GB / RTX 3050 4 GB

**Balanced mode owner-quality gate:**

- target the **60 fps class** on the canonical Command Center route in a clean browser profile;
- median ≥55 fps is the acceptance target after optimization;
- Signal Frontier canonical route target median ≥50 fps while retaining authored visual quality;
- sustained floor must not remain below 40 fps outside bounded loading/world-transition moments;
- ordinary traversal must not repeatedly invoke hardware-scaling protection.

This is an owner-reference quality target, not a promise that every device runs 60 fps. Lower-tier devices use explicit adaptive quality profiles.

**Cinematic mode:**

- target 60 fps where the reference route permits;
- median ≥45 fps on the owner reference laptop after optimization;
- launch floor ≥30 fps with stable frame pacing;
- quality downgrade must be graceful, not obvious resolution collapse.

### Mobile Balanced

- target stable 30 fps minimum on the defined physical reference device;
- no multi-second input stalls;
- quality tier cuts expensive effects before making the game unreadably blurry.

## 11.3 Optimization order

1. verify no duplicate render loops / leaked observers;
2. sector/zone culling and streaming;
3. freeze/static active meshes where safe;
4. instancing/thin instances for repeated props;
5. LOD for distant architecture;
6. cap real-time shadow casters;
7. limit dynamic lights;
8. particle/weather caps per tier;
9. optimize GLB meshes/material count;
10. texture compression/size policy;
11. audio source activation by zone;
12. NPC update LOD;
13. DOM HUD update throttling;
14. only then tune hardware scaling thresholds.

Hardware scaling is a safety net, not the primary optimization strategy.

---

# 12. Accessibility and input-quality bar

Target **WCAG 2.2 AA** for the shell and game UI wherever applicable, while retaining the project’s stronger 48 px touch target policy for important City controls.

Required checks:

- focus never obscured by sticky composer/sheet;
- keyboard access to every non-spatial UI action;
- `E` interaction has an equivalent clickable/touch action;
- no essential function requires precise dragging where a tap alternative is possible;
- 48 px preferred important controls and generous separation;
- reduced-motion mode removes non-essential pulsing/camera animation;
- high-contrast text over changing 3D backgrounds uses backed panels/outlines;
- screen reader labels for Menu, EONBOT, Use, Close, Minimize, world selector;
- focus returns to the invoking control after modal close;
- no hidden modal remains focusable;
- voice/dictation controls have clear listening/review states.

---

# 13. Coding roadmap — 21 controlled waves

The waves below are intentionally ordered so experience foundations are fixed before large visual work, and large visual work is then performance-certified before release.

---

## L95-W00 — Authority freeze + evidence harness

### Purpose
Create the non-negotiable baseline before more code moves.

### Work

- branch from `fb1e4a20`;
- verify tree includes exact Signal repair patch;
- capture production/candidate digests;
- create golden-route script for Command Center → Signal Frontier → return;
- preserve sidebar hover test;
- add screenshot viewport matrix harness;
- create app-console classifier that separates first-party errors from known extension noise;
- add diagnostics switch for input target/objective/camera without exposing it to ordinary users.

### Exit gate

- clean tree;
- repair tests green;
- baseline screenshots/video archived;
- rollback tag/bundle produced.

---

## L95-W01 — Owner World Review Mode

### Purpose
Let the owner inspect My Frontier and Storm Sector immediately without corrupting real player progression.

### Work

Create a **preview/review-only authority**, not a public localStorage hack.

- owner-review build flag/verified preview authority;
- unlock world entry only;
- do not grant XP, campaign completion, construction permits or rewards;
- clear “OWNER REVIEW” indicator in diagnostics/menu;
- return to production behavior when the review flag is absent;
- if Storm renderer is genuinely absent, expose the certifiable renderer path rather than falsely marking it complete.

### Exit gate

Owner can open all available/renderable world surfaces in preview and inspect them without playing the story.

---

## L95-W02 — Carry forward and browser-prove Signal input repair

### Purpose
Turn `fb1e4a20` from source-level checkpoint into owner-machine proof.

### Work

- Chrome headed: enter Signal Frontier, approach dormant EONBOT, press `E`;
- Edge headed: same;
- click physical target;
- touch/Use emulation;
- verify correct objective receipt;
- verify no stale target rejection;
- verify no Command Hub fallback action;
- verify active input lock owners clean after overlays.

### Exit gate

`E`, click and Use produce the same canonical action in both Chrome and Edge.

---

## L95-W03 — Camera freedom and pointer-look calibration

### Purpose
Fix upward/downward look and normalize camera behavior.

### Work

- add automated direction/range tests around `movementX/Y`;
- instrument beta before/after in test build;
- calibrate lower/upper beta limits;
- validate pointer lock, unlocked drag and touch look;
- test all three worlds and Command Center;
- test modal open/close and world return.

### Exit gate

Owner can naturally look up and down throughout the useful world envelope with no inversion surprise.

---

## L95-W04 — One interaction authority + objective deadlock elimination

### Purpose
Make gameplay unstickable under normal interaction.

### Work

- formalize canonical interaction resolver shared by E/click/touch;
- formalize objective transition receipt;
- add hysteresis near target range;
- remove silent failure branches;
- add user-facing reason when unavailable;
- prove repeated input/idempotency;
- prove objective marker and interaction target can coexist;
- add recovery action for verified stuck state without granting progression.

### Exit gate

50 scripted first-mission traversals with zero objective deadlocks and zero divergent input semantics.

---

## L95-W05 — Canonical EONBOT Chat Dock

### Purpose
Deliver the user’s central product promise: work with EONBOT without leaving the game.

### Work

- define one active `conversationId` / project context authority;
- mount canonical thread into City dock;
- retire memory-only Quick Work as the default conversation experience;
- keep a scratch mode only if explicitly named/selected;
- immediately render chat shell/history;
- provider readiness is a status, not a blocking blank screen;
- 3-second preparing timeout with actionable recovery;
- desktop side dock + mobile bottom sheet;
- preserve pose and world state;
- suspend gameplay input only when appropriate;
- one-click EONBOT from companion/Menu/top HUD;
- closing City preserves conversation for main page.

### Exit gate

Start a conversation on `/`, enter City, continue the same thread, leave City, continue the same thread again. No duplicate conversation and no indefinite Preparing state.

---

## L95-W06 — Main shell simplification

### Purpose
Make EONAPP feel more like one coherent ChatGPT-style product and less like a page collection.

### Work

- preserve desktop hover sidebar;
- audit duplicate links/actions;
- compact active-project UI and enforce one continuity owner: Active Project OR generic Continue, never both for the same work;
- simplify EONBOT header actions and reserve their screen region so project continuity cannot overlap Share/Profile/More;
- move secondary utilities behind More/profile where appropriate;
- remove redundant floating help from root chat;
- retain Quick Command but make it collision-aware: it may float only when it does not intersect the composer, Send, keyboard safe area, or other primary controls; otherwise it moves to a registered safe slot/composer tools;
- protect Send as a non-overlappable critical action across desktop, square, tablet and phone aspect ratios;
- keep Create/Projects/Library/City as clear destinations.

### Exit gate

A new user can identify chat, create, projects, library and City immediately; no duplicate persistent utility competes with Send.

---

## L95-W07 — Main EONAPP mobile shell rebuild

### Purpose
Remove the visible mobile launch blocker.

### Work

- use `100dvh`/safe-area-aware layout;
- composer owns bottom safe region;
- `visualViewport` keyboard handling;
- remove fixed `?` on mobile;
- keep Quick Command only through a collision-safe slot above/in the composer tools; never place it over Send;
- responsive header consolidation;
- active project as one compact chip/card and suppress duplicate Continue retention UI;
- correct message/body bottom padding;
- eliminate broken Ready-to-help/Profile/Share wrapping;
- portrait + landscape rules;
- no destructive hiding of core actions.

### Exit gate

All required phone/tablet viewports produce clean screenshots with no overlaps and all essential controls reachable.

---

## L95-W08 — City HUD Safe-Zone Coordinator

### Purpose
Stop independent City modules from fighting for the same pixels.

### Work

- implement/register screen zones;
- migrate Menu, EONBOT, objective, movement, Sprint, Use, contextual prompts;
- remove global help bubble from gameplay;
- retain Quick Command only through City Menu/EONBOT/context UI or a HUD-registered safe slot; it must never compete with Use, movement, objective or EONBOT;
- remove release badge from normal gameplay HUD;
- station markers become contextual instead of permanent clutter;
- responsive event updates on orientation/viewport change.

### Exit gate

At 320px portrait through desktop, every persistent control has a defined owned zone and collision test passes.

---

## L95-W09 — Unified responsive overlays and workspaces

### Purpose
Fix windows that cannot be closed or have unusable controls on mobile.

### Work

Extend the existing overlay coordinator:

- one active modal/sheet authority;
- desktop centered/docked panels;
- mobile bottom/full sheets;
- sticky header with Close/Minimize;
- 48px+ controls;
- **Close remains visible without scrolling at every certified mobile height**;
- safe-area/keyboard awareness;
- max height with internal scroll below the sticky dismissal header;
- focus trap and return;
- Esc/back handling plus an explicit tap target that never depends on gesture discovery;
- opening the virtual keyboard must not push Close outside the visual viewport;
- explicit pointer-lock restoration path;
- prevent stale invisible overlays from retaining input leases.

### Exit gate

Every City panel can be opened and closed in portrait/landscape with one obvious action; no vertical button strip and no trapped player.

---

## L95-W10 — Open Worlds access model

### Purpose
Remove story completion as a map-discovery gate.

### Work

- Signal Frontier: available, “Recommended · Story”;
- My Frontier: available immediately, “Build”;
- move Beacon One receipt from world-entry authority to capability/progression authority;
- Storm Sector: available from first session once W14 certification says region is actually rendered;
- world selector explains play style, not locks;
- keep rewards/build tiers honest;
- migrate old player states safely.

### Exit gate

Fresh account can select all three certified worlds with no mandatory Signal completion, while advanced progression remains intact.

---

## L95-W11 — Signal Frontier authored-zone uplift

### Purpose
Make the five core zones read as intentional game environments, not procedural blockout.

### Work

For each zone:

- define hero shot and spawn-to-objective camera route;
- reuse approved existing GLB assets first;
- recompose/replace oversized primitive connectors;
- authored secondary architecture;
- ground material detail;
- lighting/fog/atmosphere;
- prop clusters;
- NPC/robot activity;
- visual wayfinding;
- interaction lighting/signage;
- zone-specific ambient audio;
- restoration state changes.

### Exit gate

Five label-free golden screenshots are visually distinct and none reads as greybox/blockout.

---

## L95-W12 — Signal Frontier outer-world continuity

### Purpose
Fix the owner’s specific “inside zone okay, outside plain and boring” observation.

### Work

- layered distant skyline;
- terrain variation and road/circuit continuity;
- authored silhouettes at world edge;
- low-cost infrastructure clusters;
- LOD/instancing;
- fog depth;
- moving ambience sparingly;
- transitions between zones that feel connected;
- remove/retire visible development proxy geometry in release.

### Exit gate

A 360° camera sweep from every canonical zone never exposes a large unfinished-looking void or obvious blockout horizon.

---

## L95-W13 — My Frontier 9.5 Build World

### Purpose
Turn My Frontier into a reason to return, not simply an unlocked empty map.

### Work

- immediate owner walkthrough first;
- classify every visible object as authored / styled procedural / proxy;
- landmark spawn;
- starter neighbourhood;
- authored plot frames and building examples;
- clear Build interaction;
- construction preview/ghost;
- utilities/roads/props;
- residents/robots;
- EONBOT Build dock action with current project context;
- saved placement state and safe reload;
- mobile construction controls;
- performance LOD.

### Exit gate

Within 60 seconds a fresh user can enter, understand where to build, place or preview a permitted starter object, and see a world that visually meets the Command Center quality bar.

---

## L95-W14 — Storm Sector render + 9.5 Explore World

### Purpose
Convert the authored future-region package into a genuine launchable world.

### Work

- implement/certify actual region rendering truth;
- hero assets: spire/stabilizer/transit gate;
- weather identity: storm/rain/fog with quality tiers;
- environmental prop/pylon family;
- navigation loop;
- interaction nodes/mission hooks;
- EONBOT continuity;
- safe spawn/return;
- mobile visibility controls;
- performance cap for weather/particles/lights;
- owner review screenshots/video.

### Exit gate

`regionRendered` becomes truthful only after real browser proof. Then and only then make Storm a first-session public choice.

---

## L95-W15 — Cross-world companion and work continuity

### Purpose
Make EONBOT feel like a companion, not a page/window unrelated to the game.

### Work

- one EONBOT identity across Command Center, Signal, My Frontier, Storm;
- follow/explore/dock/look-at behaviors;
- context-sensitive but non-blocking prompts;
- EONBOT can surface current objective/project context;
- interacting with physical EONBOT opens canonical chat dock;
- companion cannot disappear because a world module forgot to mount it;
- companion animations respect performance tier;
- chat and physical companion state remain separate enough that a failed animation never blocks chat.

### Exit gate

World switch 20 times; EONBOT remains present/usable and canonical chat context never forks.

---

## L95-W16 — Performance, asset residency and workload summit

### Purpose
Recover frame budget, prove unchanged City media stays local after first retrieval, and make City + AI + background work cooperate without duelling governors.

### L95-W16A — Renderer root-cost audit

- clean-profile CPU/GPU/frame trace with recording and DevTools excluded from the baseline;
- duplicate listener/observer/render-loop audit;
- one live Babylon Engine/Scene/render-loop assertion;
- mesh/material/draw-call/light/shadow count per world;
- per-frame subsystem timing for Command Center, Signal Frontier, My Frontier and Storm;
- identify DOM/HUD work that is unnecessarily executed every frame;
- NPC, companion, weather and off-screen simulation update-frequency audit;
- do not raise FPS thresholds to make evidence disappear.

### L95-W16B — Immutable asset residency certification

Preserve the existing production architecture:

- production build rewrites City binaries to content-addressed immutable URLs;
- stable service-worker cache `eonapp-city-assets-v1`;
- cache-first reuse for unchanged hashed art;
- app/service-worker update must preserve unchanged hashed assets;
- changed asset bytes produce a new URL while unchanged bytes keep the same URL.

Add proof rather than assumptions:

1. cold first City/world entry records requests, transferred bytes, cache status and service-worker controller;
2. close/re-enter the same world in the same tab;
3. reload/re-enter with the service worker controlling;
4. verify unchanged GLB/GLTF/BIN/texture assets transfer **0 network body bytes** on warm reuse (browser memory/disk/SW cache is acceptable);
5. deploy a candidate with one deliberately changed test asset and prove only changed hashes require retrieval;
6. expose truthful diagnostics if browser storage has been evicted—never promise persistence the browser cannot guarantee.

If same-session world switching is still slow despite zero network transfer, add a bounded **decoded AssetContainer/scene-resource pool** with reference counting and memory-pressure eviction so we do not repeatedly parse the same large GLB unnecessarily. Network caching and decoded-object reuse remain separate layers.

### L95-W16C — Universal workload governor 2.0

- W555A remains the single browser-session workload-pressure authority for City, Local AI, Hosted AI, exports, agents and sync;
- renderer-specific controller remains the single owner of automatic City visual/FPS tier changes;
- feed W731 measured FPS/frame time/hardware scale into W555A as **observation**, without allowing the same sample to trigger a second renderer degradation path;
- under City pressure, reduce Local AI context/output budgets before sacrificing game responsiveness;
- defer non-user-initiated background work at critical pressure;
- never silently start heavy GPU generation/export over active City—require an explicit user choice to pause City;
- add recovery hysteresis so one good/bad sample does not oscillate quality or AI budgets;
- hidden-tab policy reduces/pause presentation work while preserving state;
- browser-local only: no prompts, credentials, model weights or private media inspected by the governor.

### L95-W16D — Visual optimization pass

- instancing/thin instances for repeated props;
- LOD and sector/zone culling;
- static mesh/material freezing where safe;
- shadow-caster and dynamic-light budgets;
- NPC/companion update LOD;
- weather/particle tiering;
- HUD DOM update throttling;
- texture/material/GLB optimization;
- audio activation by nearby zone;
- hardware scaler retune **only after** root optimizations.

### L95-W16E — Endurance/device certification

- 30-minute traversal;
- switch worlds 20 times;
- open/close EONBOT 20 times;
- Local AI conversation while City is active;
- background agent/sync pressure;
- memory/heap trend and WebGL context stability;
- cold/warm cache evidence;
- physical low/mid/high device matrix.

### Exit gate

Meet Section 11 budgets, prove warm unchanged 3D assets do not require Cloudflare body transfer, prove workload coordination without visual-governor duplication, and finish with no first-party console errors or unbounded memory growth.

---

## L95-W17 — Accessibility + multi-input summit

### Purpose
Make the release robust across keyboard, mouse, touch and assistive navigation.

### Work

- WCAG 2.2 AA audit;
- 48px preferred City controls;
- focus-not-obscured testing against sticky composer/sheets;
- reduced motion;
- keyboard-only shell workflow;
- E/click/touch parity;
- touch camera/move/use separation;
- zoom/text reflow for shell UI;
- Voice/Dictate accessible states;
- contrast against changing game backgrounds.

### Exit gate

No critical/serious accessibility defects in the launch routes and all essential UI actions have non-spatial alternatives.

---

## L95-W18 — First 10 Minutes / retention red team

### Purpose
Test the product as an impatient new user, not as its developer.

### Scenario

Fresh account / empty local state:

1. lands on EONBOT;
2. sends one message;
3. enters City;
4. sees Command Center;
5. opens EONBOT in one click;
6. opens Open Worlds;
7. chooses any of Story / Build / Explore;
8. uses at least one interaction;
9. switches world without finishing a mission;
10. returns and continues prior EONBOT work.

### Red-team rules

Fail the build if the tester encounters:

- a mandatory unexplained lock;
- dead `E`;
- unreachable Close;
- indefinite loading;
- loss of conversation;
- confusing duplicate EONBOT surface;
- blank/greybox-quality first impression;
- no obvious next action;
- mobile control overlap.

### Exit gate

Five clean first-session runs per major browser/device class without assistance from a developer.

---

## L95-W19 — Cross-browser and physical-device certification

### Purpose
Turn emulator confidence into release confidence.

### Desktop

- Chrome current;
- Edge current;
- Opera/Chromium sanity;
- Firefox shell/UI sanity where compatible with intended City support.

### Mobile

- Android Chrome physical device;
- second Android/mid-tier if available;
- iOS Safari physical device if available;
- portrait + landscape;
- on-screen keyboard;
- background/foreground restore;
- install/PWA behavior.

### Proof bundle

- screenshots;
- short videos;
- console clean report;
- input matrix;
- accessibility report;
- FPS trace summaries;
- exact build digest.

### Exit gate

No unresolved P0/P1 defects, no viewport overlap, no world unavailable contrary to launch policy.

---

## L95-W20 — Exact candidate, rollback, production promotion

### Purpose
Ship exactly what was certified.

### Work

- freeze final Git commit/tree;
- full maintained test suite;
- secret scan;
- asset integrity;
- source provenance;
- exact Preview deployment;
- owner acceptance of Command Center + Signal + My Frontier + Storm + main mobile + City mobile;
- 24-hour candidate soak if schedule allows;
- prepare rollback to previous production deployment;
- promote exact candidate digest only;
- post-production headed browser smoke;
- verify public provenance endpoint and release badge;
- preserve final source ZIP + Git bundle + proof archive.

### Exit gate

Production digest equals owner-certified candidate digest and rollback artifact is independently usable.

---


# 13A. Launch retention and usefulness scorecard

The game is not certified by visual quality alone. The product must make useful work easier and must not trap a first-time user behind story progression. Instrumentation remains privacy-respecting and local-first unless a separately reviewed analytics path is explicitly enabled.

Primary launch metrics/targets for controlled owner/beta testing:

- **Time to first useful action:** median under 90 seconds from first EONAPP entry.
- **Time to first City interaction:** median under 60 seconds after entering City.
- **Interaction success:** ≥99% of eligible E/click/touch interactions produce the intended visible response on first attempt.
- **Objective deadlock:** 0% in scripted first-session certification; no unrecoverable objective state.
- **World choice:** a new user can enter Signal Frontier, My Frontier or Storm Sector without completing another world first.
- **EONBOT continuity:** ≥99% scripted continuity across Main Chat → City → another world → Main Chat with one thread identity and no lost messages within the documented session-only storage boundary.
- **First-10-minute productive conversion:** beta target ≥70% complete at least one useful action (ask EONBOT, create/save project, build/place in My Frontier, or review a prepared action) before leaving.
- **Frustration proxy:** no repeated failed interaction sequence of 3+ attempts without an automatic recovery hint.
- **Mobile critical-action visibility:** 100% of tested frames keep Send, Close, Use and Menu unobscured.
- **Return intent proxy:** the first session should surface a clear resumable project/world state rather than forcing story replay.

These are release targets, not claims about current production retention. Real user retention percentages must only be reported after genuine measured cohorts exist.

# 14. Red-team defect matrix

The final test team should actively attempt to break these conditions.

## Input

- spam `E` while crossing interaction radius;
- hold `E`;
- click before prompt appears;
- click as objective changes;
- switch world during prompt;
- open EONBOT while target is active;
- close EONBOT then immediately interact;
- alt-tab and return;
- lose pointer lock and re-enter;
- touch Use with another finger moving joystick.

## Camera

- look straight up/down to limits;
- rotate near wall;
- rotate while sprinting;
- open/close panel at extreme pitch;
- world switch at extreme pitch;
- portrait touch look;
- landscape touch look.

## EONBOT

- provider available;
- provider unavailable;
- slow provider;
- local AI unavailable;
- conversation already long;
- active project present;
- no project;
- offline shell;
- switch worlds while dock minimized;
- reload City then restore conversation.

## Mobile / responsive shell

- square desktop window reproducing the owner screenshot;
- Quick Command collision against Send at every composer height;
- Active Project + generic Continue duplicate injection;
- Share/Profile/More while project continuity is visible;
- verify no persistent floating `?` on root chat/City;
- smallest viewport;
- browser address bar expands/collapses;
- keyboard open;
- rotate with keyboard open;
- safe-area/notch;
- 200% text zoom where applicable;
- modal nested action;
- scroll long conversation;
- open active-project card;
- install prompt/status appears.

## Performance

- 30-minute traversal;
- switch worlds 20 times;
- open/close EONBOT 20 times;
- weather max intensity;
- many NPCs in view;
- background tab for 60 seconds and return;
- low power/mobile thermal condition if feasible.

---

# 15. Definition of “9.5/10” for this launch

A subjective “looks good” is not sufficient. EONAPP earns the 9.5 launch label only when all of the following are true.

## Experience

- no critical-control overlap at any certified viewport;
- no duplicate project-continuity card for one active project;
- Quick Command remains useful without covering Send/Use/Close;
- Help is reachable without a redundant persistent floating `?`;

- Command Center remains at least as good as today.
- Signal Frontier has no visible blockout-quality canonical route.
- My Frontier is a convincing Build world, not an empty unlock.
- Storm Sector is genuinely rendered and certifiably playable.
- fresh users may choose any certified world from the beginning.
- no required story choke point.

## EONBOT

- one-click from City;
- same conversation/work context as main EONBOT;
- no default memory-only duplicate thread;
- no indefinite preparing screen;
- close/minimize works everywhere;
- same thread survives City entry/exit.

## Gameplay

- `E`, click and touch Use resolve the same target/action;
- no first-mission objective deadlock;
- camera look is natural vertically and horizontally;
- return paths work;
- menus never trap input.

## Mobile

- no overlapping primary controls;
- no floating help/Quick obstruction;
- composer never hides message/content;
- City panels are intentionally mobile, not squeezed desktop panels;
- portrait and landscape both pass;
- real-device proof exists.

## Performance

- reference desktop Balanced route meets the owner-quality target budget;
- warm re-entry proves unchanged hashed 3D assets reuse local browser cache without Cloudflare body transfer;
- City + Local AI + background work pass workload-coordination tests without duelling renderer degradations;
- mobile route holds the defined 30 fps class target;
- no repeated maximum scaler escalation on ordinary route;
- no first-party unhandled errors;
- no evidence of runaway listeners from EONAPP code.

## Release engineering

- exact candidate digest owner-approved;
- tests/provenance/secret/asset gates green;
- rollback ready;
- production post-promotion proof green.

---

# 16. What Codex must NOT do

1. **Do not redesign or replace the Babylon Command Center.**
2. **Do not reset to `7a833c91` and lose `fb1e4a20`.**
3. **Do not hide the Signal bug by only increasing interaction radius.**
4. **Do not create a third EONBOT conversation implementation.**
5. **Do not keep the memory-only City quick chat as the primary EONBOT experience.**
6. **Do not solve mobile overlap by hiding essential controls without a reachable replacement.**
7. **Do not add more independent `position: fixed` controls to City/mobile.**
8. **Do not remove progression/rewards; only decouple basic world entry.**
9. **Do not claim Storm Sector available while the actual region remains unrendered.**
10. **Do not replace authored world assets with more primitive geometry.**
11. **Do not treat extension console noise as a first-party failure without clean-profile reproduction.**
12. **Do not tune the hardware scaler first and call performance solved.**
13. **Do not deploy production before owner reviews all three worlds and both mobile shells.**
14. **Do not accept DevTools emulation as the only mobile proof.**
15. **Do not change the working desktop sidebar hover behavior.**

---

# 17. Recommended wave grouping for efficient coding sessions

The 21 waves are certification units, not necessarily 21 separate chats. They can be executed in longer coding sessions while still checkpointing each boundary.

### Coding Session A — Reliability foundation
`W00 → W04`

Result: exact source authority, owner access, input repair browser proof, camera fixed, objective deadlocks removed.

### Coding Session B — One EONBOT + shell/mobile foundation
`W05 → W09`

Result: canonical EONBOT dock, simplified shell, main mobile fixed, City HUD and overlays unified.

### Coding Session C — Access + world quality
`W10 → W14`

Result: open-from-start policy plus 9.5 visual/gameplay pass for Signal, My Frontier and Storm.

### Coding Session D — continuity/performance/accessibility
`W15 → W17`

Result: one companion across worlds, performant world, robust multi-input/accessibility.

### Certification Session E — owner red team and release
`W18 → W20`

Result: first-10-minute proof, real-device/browser proof, exact candidate promotion.

Every session ends with:

- commit hash;
- tree hash;
- focused tests;
- full relevant test group;
- changed-file list;
- screenshots/video where visual work changed;
- source ZIP;
- rollback note.

---

# 18. Owner review checklist after each world wave

For each of Command Center, Signal Frontier, My Frontier and Storm Sector, owner should answer only these questions:

### First impression
- Does this look like a finished game environment within five seconds?
- Is there an obvious landmark and direction?
- Is any large area visually empty or blockout-like?

### Control
- Can I look up/down/around naturally?
- Can I interact by `E` and click?
- On mobile, can I move, look and Use without controls colliding?

### EONBOT
- Is EONBOT visible/present?
- Can I open the real chat in one click?
- Does my earlier conversation/project appear?
- Can I close/minimize without losing the world?

### Purpose
- Do I understand what this world is for?
- Can I do something useful/interesting within one minute?
- If I do not want the current mission, can I switch world immediately?

### Polish
- Are windows readable and closable?
- Is the UI restrained enough to see the world?
- Does audio/lighting/environment support the identity?
- Does the world remain smooth enough to enjoy?

If any answer is “no,” the world does not receive owner 9.5 certification yet.

---

# 19. Institutional launch evidence pack

Final archive should contain:

1. exact source ZIP;
2. complete Git bundle;
3. final commit/tree/digest receipt;
4. production deployment ID;
5. rollback target;
6. maintained test report;
7. interaction matrix (`E`/click/touch);
8. camera calibration proof;
9. EONBOT continuity proof;
10. all-world owner screenshots;
11. mobile responsive screenshot grid;
12. physical-device videos;
13. clean-profile console report;
14. performance trace summaries;
15. accessibility report;
16. PWA install proof;
17. asset-integrity report;
18. secret scan;
19. candidate-vs-production provenance comparison;
20. explicit list of any accepted non-blocking P2/P3 debt.

---

# 20. External standards/research basis used for this roadmap

The plan is aligned to current primary technical guidance, specifically:

- **W3C WCAG 2.2** — including Focus Not Obscured, Dragging Movements, and Target Size Minimum; the EONCITY 48px important-control policy intentionally exceeds the 24px AA minimum and is closer to the 44px enhanced target.
- **W3C Pointer Lock 2.0 Working Draft (2026)** — pointer-locked 3D experiences depend on raw relative mouse movement through `movementX`/`movementY`; this supports explicit input-direction and pointer-lock regression testing rather than guess-based camera fixes.
- **Chrome DevTools Device Mode guidance** — responsive emulation is a first-order approximation and final confidence requires tests on physical mobile hardware.
- **Chrome/web.dev rendering guidance** — 60Hz rendering gives roughly a 16.7ms frame interval and actual application work must stay comfortably below that to avoid jank; stable frame pacing matters, not just a single FPS snapshot.
- **Babylon.js HardwareScalingOptimization** — resolution scaling is an intended performance safety mechanism, but it changes rendering resolution; therefore repeated scaling escalation is evidence to investigate scene cost rather than a substitute for optimization.

---

# 21. Final recommendation

Do not spend the next session adding miscellaneous features.

The shortest route to a launch-quality EONAPP is:

**reliability → one EONBOT → mobile architecture → open-world access → world art quality → performance → real-device certification → exact release.**

The strongest existing asset is the Command Center. Use it as the gold master. The strongest product differentiator is not the 3D world by itself; it is the combination of **a ChatGPT-simple EONBOT shell + a real game-like City where the same work and AI remain one click away**.

If that continuity is flawless, all three worlds are immediately discoverable, mobile stops fighting the user, and the non-Command-Center environments reach authored-game quality, EONAPP can legitimately feel distinctive rather than like a chat app with a separate game attached.

**Next action after owner accepts this plan:** give Codex `fb1e4a20` as the mandatory starting checkpoint and execute `L95-W00 → L95-W04` first. Do not begin the large world-art waves until input, camera and objective progression are browser-proven.
