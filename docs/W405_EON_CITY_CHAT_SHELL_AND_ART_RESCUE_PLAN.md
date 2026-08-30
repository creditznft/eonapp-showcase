# W405 — Live Chat Shell and EON City Rescue Decision

**Status:** approved rescue architecture; source foundations included; visual certification not yet earned.

## Executive decision

EONAPP will have **one canonical public City: Babylon at `/eoncity`**.

The old Realm/Three.js-style world is not a second product. It remains an unlinked temporary visual reference while its usable ideas — dramatic mood, landmarks, NPC placement, journey and room language — are moved into Babylon. Stale Realm route/cache paths redirect to `/eoncity`. No future City feature may require a user to choose between engines.

EON City is a **productive playable arrival world**, not a duplicate chat app, a full IDE, a video editor, or a dashboard made of floating labels.

## The live defects W405 addresses

1. The collapsed Chat sidebar clips labels and has a second unexplained button next to the logo.
2. Search/More/Profile surfaces are visually detached from the controls that open them, and utility links are duplicated.
3. Guest sign-in is not discoverable enough in the chat header.
4. Stale `/realm` cache paths can show an old Three.js-style City, creating two conflicting products.
5. Babylon movement can lose keyboard input after a HUD click; the first City view exposes too much diagnostic text.
6. The current procedural district is a **vertical slice**, not an authored flagship art world. It must not be marketed as AAA.

## W405 source repairs

- Collapsed rail: icon hover/focus labels, and the collapsed brand becomes **Open sidebar**.
- Sidebar: one source of utility links; compact anchored Profile, Search and More popovers.
- Header: visible **Sign in** for guests; acknowledgement before Google continuation; no automatic OAuth and no cloud-backup claim.
- Service worker: version bump and hard redirect for legacy Realm/old 3D navigation so an updated client reaches `/eoncity`.
- City input: keyboard listener follows the City document, ignores text fields, refocuses canvas after pointer input, and exposes **Reset view**.
- Direct City HUD: only the important first-frame information remains visible; diagnostics stay in controls.

## Product standard for the rebuilt City

### The recommended art model: authored core + procedural variation

This is the recommended path. Pure primitives are fast but will always read as a prototype; a giant generic game-kit import is heavy, incoherent and hard to own. Build a small custom kit and vary it procedurally.

**Authored core assets (GLB/GLTF, licensed or made for EONAPP):**

1. Arrival Gate — an iconic EON halo gateway and transit pad.
2. Command Deck — strong geometric command tower with interior silhouette, screens and recognizable roofline.
3. Creator Atrium — media/creation landmark with studio windows, light rig and motion signage.
4. Forge Bay — engineering landmark with bridge, fabrication forms and code-light language.
5. Signal Tower — vertical skyline focal point with rooftop beacon and weather array.
6. Street kit — road pieces, sidewalk, rails, lamps, kiosks, planters, signs, barriers, benches and terminals.
7. NPC kit — one human creator, one robotic operator, one EONBOT companion, all with readable face/visor silhouettes and idle animation.
8. Skyline kit — 6–10 varied towers using shared materials, LODs and window-emission maps.

**Procedural variation may handle:** window states, emissive colors, light traffic, rain, particles, foliage distribution, crowd spacing, billboard copy and noninteractive background towers. It must not be responsible for all hero architecture.

### Art direction

Use a premium **midnight neon atelier** look: dark navy/graphite architecture; violet/cyan/mint accents; real material contrast between metal, glass, stone, wet pavement and vegetation; restrained bloom; readable signs; a skyline with depth and atmospheric fog. Avoid candy-coloured raw cubes, giant floating labels, and unbounded post-processing.

### Productive gameplay loop

1. **Arrive** at the City in a controlled camera view.
2. **Choose one mission**: create, build, plan, learn, continue project, or explore.
3. **Walk/drive a short route** with responsive keyboard, touch or controller movement.
4. **Approach a real landmark**; its state becomes readable through a small in-world marker.
5. **Interact** opens a concise route review.
6. **Use** opens the native EONBOT, Creator, Forge, Projects or Library surface only after explicit confirmation.
7. **Return** to the same City state with an optional local completion receipt.

No forced quest, loot, reward, pop-up barrage, or hidden work action.

### City modes

- **Desktop rich:** full authored arrival district, shadows, selective reflections, rain, atmosphere, character animation, 60 FPS target on supported GPUs.
- **Desktop standard:** same composition, reduced crowd/particles/reflections, 45–60 FPS target.
- **Mobile arrival:** authored microdistrict and simple routes, joystick + tap interact, 30 FPS target, no giant world streaming.
- **City Map fallback:** all core work routes remain available without 3D.

The 3D City must never gate work.

## Wave sequence

### W405 — rescue foundation (this source pass)

Canonical route/cache quarantine, chat shell repair, sign-in visibility, input and reset rescue, direct HUD calm, art decision document.

### W406A — City interaction proof

Real browser/device proof for keyboard, mouse, joystick, touch, controls sheet, Reset view, Interact, native route review and return. Remove any control that cannot be demonstrated.

### W406B — authored art intake

Add an asset manifest with license/provenance, LOD budget, texture budget, semantic landmark mapping and fallback rules. Do not ship unknown binary assets.

### W407 — Arrival District art rebuild

Ship the Arrival Gate, Command Deck exterior, two hero landmarks, streets, rain/skyline and one readable NPC/companion. Replace raw procedural facade blocks in the first camera view.

### W408 — Creator and Forge district expansion

Add Creator Atrium and Forge Bay authored environments; connect only to visible native actions.

### W409 — NPC, weather and city life

NPC idle/movement, day/night palette, rain/fog variants, ambient pedestrians/traffic under quality governor, captions-first proximity cues.

### W410 — City validation lab

Desktop/mid-range/mobile screenshot and video evidence; performance budgets; no collision traps; no unreadable labels; all controls/touch routes tested.

## Acceptance gates

A City release cannot be described as flagship until all are true:

- One City route only; legacy Realm cannot reappear from cache.
- The first camera frame contains authored architecture, street depth, readable landmark, skyline and a person/companion; no raw placeholder box dominates it.
- Keyboard, mouse, touch, joystick, controller and Reset view are demonstrated on target devices.
- Every HUD control has one purpose, opens beside/within its context, and can be dismissed.
- A user can begin useful work in two interactions or fewer without learning a game.
- Mobile opens a stable arrival scene or City Map fallback; no broken 3D control claim.
- Every asset has provenance, optimized LOD/texture budget and a fallback.
- Real screenshots/video are reviewed before claims such as premium, cinematic or AAA.

## Explicit non-goals

- Promoting the temporary legacy visual preview as a second City product.
- Making City a full code editor or video editor.
- Adding automated actions, social posting, reward granting, referrals, payments or hidden telemetry to City.
- Calling a raw procedural block scene an AAA world.
