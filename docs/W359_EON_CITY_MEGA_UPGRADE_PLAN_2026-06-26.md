# EON City Mega Upgrade Program — CEO Lock

**Status:** W359 source foundation started. This document is the controlled build plan, not a claim that the visual city is complete.

## Product sentence

**EON City is a spatial AI work environment with the emotional quality, art direction and interaction polish of a premium isometric game.**

The public action is **Enter EON City**. “Play” remains an internal route name only while migration is in progress.

## Locked mode architecture

| URL | Public name | Job |
|---|---|---|
| `/eoncity` | EON City Portal | cinematic first impression and device-aware entry |
| `/eoncity/immersive` (compatibility: `/eoncity/play`) | Immersive Work Mode | Babylon walking/interaction district |
| `/eoncity/command` (compatibility: `/eoncity/tour`, `/eoncity/3d`) | Spatial Command Space | Three.js premium command room and city overlook |
| `/eoncity/overview` (compatibility: `/eoncity/lite`, current map links) | City Overview | fast 2.5D navigation for every device |
| `/realm-studio` | My Realm Studio | portable local identity and district styling |

One local `CityWorldState` is shared across all modes. It contains only safe world state, selected district, cosmetic preference, bounded mission state and status-only work presence. It must never contain prompts, raw model output, API keys, endpoints, files, account data or payment data.

## What is already implemented in W359

1. **Original provider-aware agent direction.** City can convert existing redacted foreground task cues into different original visual archetypes for coordinator, researcher, builder, reviewer, local runner and guide.
2. **Truthful provider visibility.** Groq, Gemini, OpenRouter, Ollama and other known provider names are hidden by default. A user must locally choose the third detail level before the bounded selected-provider name is shown. No logo, official mascot, model name, endpoint, credential, prompt or output is shown.
3. **Actual foreground Chat lifecycle wiring.** Chat begins its City cue with the selected provider and updates it with the provider that actually produced a reply when the runtime reports one. This does not introduce a provider proxy, background job or City-controlled request.
4. **Shared styling hooks.** Both Babylon and Three.js now ask the same Agent Director for role, motion, original relay motif, palette and safe display text.
5. **Code-only snapshot policy.** Each wave emits a changed-files ZIP under 20 MB, with a manifest and SHA-256. Source snapshots never contain `.env*`, dependencies, build output, tests results, screenshots, generated binaries or logs.

## Premium art program

Code geometry remains a scaffold. It will not be advertised as the final art standard.

### Asset Pack A — authored city foundation

- 1 hero Operator with customisable jacket, bag, accent panel and idle/walk/turn/interact animation.
- EONBOT flying companion with four states: idle, guide, focus, review.
- 6 named role characters: Builder, Archivist, Cartographer, Realm Keeper, Reviewer, Local Sentinel.
- 10 crowd silhouettes with two LOD levels and short idle/walk loops.
- 5 landmark exterior kits: Command Centre, Build Workshop, Knowledge Archive, Realm Relay, Local AI Observatory.
- 1 command-room interior kit: walls, windows, consoles, screens, furniture, door, city-view glass.
- 60 small street props: lamps, rails, planters, transit signs, maintenance pods, kiosks, seating, terminals, doors, vending/utility machines and drones.
- 18 PBR material families: wet asphalt, steel, glass, brushed metal, painted concrete, hologram, emission panels, foliage, fabric and signage.

### Asset Pack B — art-quality pipeline

Every shipped model requires:

- Original source or verified commercial/open licence recorded in an asset provenance ledger.
- GLB with mesh and texture budgets appropriate to its LOD tier.
- KTX2/Basis compressed textures where supported; no huge uncompressed texture uploads.
- Naming, material and animation conventions shared by Babylon and Three.js.
- A fallback procedural silhouette when an asset fails to load.
- No copied characters, UI, signs, meshes, maps or textures from reference games.

### Art quality bar

The City must use depth: façade recesses, overhangs, window variation, ambient wear, cables, light pools, street clutter, layered skyline, weather response, indoor/outdoor transitions and believable scale. Neon is an accent system, not a replacement for composition.

## AI character model

A provider is not a person or autonomous employee. The City visualises a **local foreground work cue** through original EON characters.

| Work fact | What the City may show | What it may never claim/show |
|---|---|---|
| User starts a foreground request | A role character enters a focus animation | “The AI is working in the background” |
| Direct selected provider returns a response | Result beacon and review cue | Provider transcript, prompt, key, model, endpoint or account |
| User has selected provider identity visibility | Small label such as “Groq connection” beside original EON relay art | Provider’s logo, official character, endorsement or ownership claim |
| User closes Chat / task ends | Cue changes to complete/failed or disappears | Persistent hidden work, fake crew activity or autonomous collaboration |

The first production visual cast is role-led, not vendor-led. The identity of the selected connection is optional supporting context only.

## Wave plan

### W359 — Agent Director and small-source snapshot policy
**Current.** Redacted provider-aware visual direction, foreground lifecycle handoff, Three.js/Babylon shared character grammar, source gate and compact delta packaging.

### W360 — Portal and route migration
- Make `/eoncity` the cinematic EON City Portal.
- Move the present 2D map to `/eoncity/overview` with backward-safe aliases.
- Add one huge **Enter EON City** action; capability result chooses immersive entry or City Overview without hiding the fallback.
- Replace “Play” wording in public UI with “Immersive Work Mode.”

### W361 — City Overview 2.5D art rebuild
- Rebuild current Canvas map as a detailed miniature city: roads, transit paths, rooftops, landmarks, weather, district lights, animated but optional avatar marker and focused camera.
- Keep it fast enough for weak devices and offline/PWA contexts.
- Every district card gets a clear **Enter in 3D** action where the device is suitable.

### W362 — Spatial Command Space / Three.js rebuild
- Replace dashboard-like tour layout with a premium Command Room and city overlook.
- Add visual project pods, status-only task beams, district table, review portal and a small EONBOT intent dock.
- Keep full Chat and raw project work in native routes; 3D is a spatial control surface, not a giant chat transcript.
- Formalize Three.js resource ownership and dispose all geometries, materials, textures, render targets and listeners when exiting.

### W363 — Immersive Work Mode controller upgrade
- Replace four-button movement as the primary mobile control with a true analogue joystick plus contextual Interact button.
- Add WASD/arrows, click-to-move accessibility route, camera drag/zoom limits, controller left stick/D-pad, pause, compact minimap and safe-area layout.
- Portrait gets a graceful rotation/interstitial state; City Overview remains usable.

### W364 — Neon Command District art vertical slice
- Build authored arrival plaza, street, Command Centre exterior, Command Room interior, Build Workshop, Archive façade, Realm Relay and Local AI Observatory.
- Create believable boundaries, navmesh/collision, interaction points, PBR lighting, rain/wetness, distant city traffic and LOD skyline.
- Do not add more districts until this one passes visual review.

### W365 — Hero characters, crowd and companion system
- Load original GLB hero Operator, EONBOT and the six role NPCs.
- Add animation state machine, proxemic greeting, safe speech bubbles, crowd LOD/instancing and a strict on-screen character cap.
- Retire primitive final-character geometry after asset fallback is proven.

### W366 — Work missions and truthful return loop
- Create one polished first journey: Enter City → meet EONBOT → Command Centre → prepare a safe work choice → open native surface only after review → return with an outcome cue.
- Provide no fake progress, no rewards, no financial incentives and no automatic navigation.

### W367 — Adaptive music, atmosphere and accessibility
- Compose original stem-based score: arrival, focus, exploration, review, completion.
- Add opt-in sound after user gesture, spatial ambience, rain/traffic/terminal layers and captions.
- Separate music, ambience, UI and voice sliders; support reduced motion, reduced sensory mode, no surprise speech and lower visual intensity.

### W368 — My Realm visual identity
- Local key-backed Realm identity, display alias plus short fingerprint, chosen landmark, palette, companion shell and preview district composition.
- Portable signed share link remains private by default.
- No false claim of a global decentralised registry; no wallet or marketplace introduced.

### W369 — Performance / device laboratory
- Establish explicit budgets for download, GPU memory, draw calls, triangles, texture memory, CPU frame time and minimum frames per second.
- Quality tiers must remove expensive effects before sacrificing controls or usability.
- Test integrated GPU laptop, discrete desktop GPU, normal Android, low-memory Android and Safari/iPhone.

### W370 — Production route and visual certification
- Reconcile Cloudflare production commit and Preview artifact before promotion.
- Verify direct entry, back/forward, deep links, fallback, memory cleanup, input controls, audio permission, route reviews, private-data redaction and all screenshots on production.
- Freeze a small code delta snapshot after every wave; keep visual evidence separate from source snapshots.

## Self-critique and corrections

1. **Flaw: “game-grade” can turn into an unfinishable full MMORPG.**
   - Correction: ship a single authored district and one excellent work loop before multi-district expansion, multiplayer, combat, economy or user-generated world hosting.

2. **Flaw: code-only primitive art cannot reach the reference quality.**
   - Correction: use code for systems and original optimised art assets for characters/architecture. Treat generated primitives as fallback and development scaffolding.

3. **Flaw: named provider characters could mislead users.**
   - Correction: make them original EON relay visuals; selected-provider identity is a local opt-in text label, never an official mascot or claim of affiliation.

4. **Flaw: “live AI at work” can imply hidden background tasks.**
   - Correction: presence exists only for bounded recorded foreground task states and terminates/updates when the request ends. City never starts or continues AI work.

5. **Flaw: a dense 3D city can destroy mobile performance.**
   - Correction: City Overview is first-class, Three.js is controlled/cinematic, Babylon is device-gated with scalable quality, LOD, instancing, texture compression and real-device proof.

6. **Flaw: Three.js and Babylon can become three separate product implementations.**
   - Correction: shared CityWorldState, landmark registry, mission contracts, Agent Director, asset manifest and visual grammar; engines only own their renderer-specific code.

7. **Flaw: 20 MB source snapshots cannot preserve art binaries.**
   - Correction: compact snapshots are intentionally code-only. Art assets, evidence and full restoration archives are separate, explicit artifacts with their own manifests; none are silently hidden in a source snapshot.

## Stop conditions

Do not activate payment, marketplace, token, referral, wallet, reward, public realm discovery or social multiplayer work inside this program. Stop any wave that would require a cloud account database, opaque background agent, hidden provider fallback, copied game asset, unlicensed asset, unverified visual claim or production-only evidence fabrication.
