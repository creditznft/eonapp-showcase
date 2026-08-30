# EON City Execution Ledger — W364 to W372

## Product decision

EON City is a spatial work environment designed with the emotional quality, controls and visual care of a premium game. It is not marketed as a token game, shooter, metaverse clone or generic dashboard.

The public entry hierarchy is fixed:

| Route | Public name | Job |
|---|---|---|
| `/eoncity` | EON City Portal | Cinematic entry with one obvious action: **Enter EON City** |
| `/eoncity/play` | Immersive Work Mode | Babylon-based city movement, landmark interaction and reviewed handoff into real work surfaces |
| `/eoncity/tour` | Spatial Command Space | Three.js high-end command room and city presentation |
| `/eoncity/lite` | City Overview | Fast 2.5D map and all-device fallback |
| `/realm-studio` | My Realm Studio | Local-first realm identity, style and portable configuration |

The City, Chat, Workspace, App Deck, Automations and Realm Studio must always describe the same truthful local state. A decorative NPC, terminal, light or status marker may never claim that an AI task is running unless a local, reviewable receipt supports it.

## Non-negotiable boundaries

- Guest use remains available. Optional Google Login is for account recovery, purchases and later opt-in sync; it is never a backup of local work.
- Local chats, Vault content, provider keys, files, Realm configuration and City progress stay on-device unless the user explicitly exports or opts into a future sync product.
- Cloudflare will hold minimal account/session/entitlement metadata only. It must not become a silent workspace database.
- No wallet, token, referral reward, resale market, lootbox, trade execution, payment activation or background automation is introduced through City waves.
- AI work appears in City only as bounded, safe summaries: role, status, approval state and next decision. Never render prompts, private output, access tokens, project files or browser storage.
- Every high-impact action stays behind an explicit review and confirmation surface outside the renderer.

## Current delivery position

| Wave | Status | Locked result |
|---|---:|---|
| W359 | Complete locally | AI character director and truthful provider-role visualization rules |
| W360 | Complete locally | City Portal, City Overview, Tour and Immersive Work Mode route contract |
| W361 | Complete locally | Shared CityWorldState and safe mode/return contracts |
| W362 | Complete locally | EON App Deck and A-01 action taxonomy |
| W363 | Complete locally | Rich City Overview art, deterministic district profiles and quality modes |
| W364A | Complete locally | Google Login data-custody disclosure and manual backup truth |
| W364 | Complete locally | Babylon control foundation: analogue joystick, keyboard, click assist, optional gamepad, minimap and cleanup |
| W365 | Complete locally | Original-asset catalog, quality/triangle/texture budgets, provenance gate, PBR policy and Babylon/Three.js lifecycle adapters; no binary art shipped |
| W366 | Complete locally | Neon Command District vertical slice: Arrival Plaza, procedural Command Centre/Command Room, EONBOT, six truthful guide roles, local mission state and review-first native handoff; no binary art shipped |
| W367 | Complete locally | Three.js Spatial Command Space: bounded Command Board, controlled Arrival/Command Centre/Skyline cameras, procedural EONBOT guide, review-first Immersive Work Mode handoff and renderer lifecycle summary; no binary art shipped |

C-00 production deployment repair remains deliberately deferred by CEO decision. No production, identity, payment or automation claim may be upgraded before C-00 later proves the deployed build and direct routes.

## W364 completion standard — Babylon control foundation

### Delivered

- Real analogue touch joystick with pointer capture and release cleanup.
- Discrete direction-pad alternative with 56px targets.
- `WASD` / arrows for movement.
- `M` for minimap visibility, `E` / Space for a safe interaction-review request, `Escape` for pause.
- Click-to-move only after explicit user opt-in; it moves toward a local street-surface marker and never claims navmesh pathfinding.
- Optional gamepad movement; gamepad action can request the already-visible review only.
- Local minimap includes only public district landmarks, player location and optional movement target.
- Listener, pointer-capture, timer and scene cleanup paths.

### Not claimed yet

- No real-device certification.
- No full navigation mesh, collision-complete pathfinding, combat, quest rewards, multiplayer or public-world persistence.
- No automated gamepad compatibility certification.
- No production browser performance proof.

### W364 acceptance evidence required later

1. Android Chrome: joystick, safe area, pointer cancellation and landscape.
2. iPhone Safari: joystick, viewport behavior and orientation fallback.
3. Desktop: keyboard, click assist, map, pause, route-review request.
4. Wired and Bluetooth gamepads: movement and review-only interaction.
5. Background/return, WebGL loss and cleanup proof.

## Remaining City program

### W365 / C-06 — Asset Foundation and Provenance Ledger — Complete locally

**Delivered source foundation**

- Twelve planned original-art entries: Operator, EONBOT, four role guides, Command Centre, Command Room, street furniture, safe-status terminals, delivery drone and crowd variation kit.
- Every entry is locked to a local `/assets/city/` release path before it can be shipped and requires a SHA-256, human art review, provenance document, no third-party derivative declaration, target surfaces, quality tiers, triangle/material/draw-call/texture budgets and a procedural fallback.
- Lite, Balanced and Cinematic quality budgets keep asset count, triangle count, texture dimension, material count and draw calls bounded.
- Engine-neutral loader adapters accept only a reviewed `shipped` entry. They carry an abort signal, local progress callback and cache key, then dispose Babylon or Three.js GPU resources on exit.
- A PBR material policy now locks command steel, wet pavement, command glass, review signal, verified signal and operator fabric. It prevents remote textures, user data, excessive emissive intensity and misuse of review/verified colours.
- Babylon Immersive Work Mode and Three.js Spatial Command Space now expose the same asset-pipeline/material-policy summary. Existing procedural art remains the visible fallback.

**Intentionally not included**

- No GLB/GLTF, texture, animation, audio, AI-generated mesh, stock pack, remote CDN, marketplace asset or copied game asset.
- No final character quality claim, art approval, device benchmark, browser proof or production loading claim.
- No decoding/compression library is activated yet. A reviewed asset handoff must declare its compression choice and physical-device evidence before it is released.

**Binary-art release gate for W366**

A future asset may change from `planned` to `shipped` only when it has:

1. Local path under `/assets/city/`, exact SHA-256 and provenance document under `docs/`.
2. Human rights/originality and visual review.
3. Lite/Balanced/Cinematic budget fit, fallback and declared LOD tier.
4. A no-remote, no-user-data material setup.
5. Scene attach/disposal evidence plus desktop and mobile visual proof.

### W366 / C-07 — Neon Command District Vertical Slice — Complete locally

**Delivered source vertical slice**

- Arrival Plaza, recognisable Command Centre exterior, and a navigable procedural Command Room interior.
- Build Workshop, Knowledge Archive, Realm Relay and Local AI Observatory route beacons use the same canonical City landmark identities.
- A hero Operator, EONBOT and six distinct guide-role silhouettes: Builder Guide, Archivist, Realm Keeper, Local AI Observer and Review Steward, plus EONBOT.
- Local-only mission progression: arrive → meet EONBOT → choose a work route → request a review → confirm a native-surface handoff → return to City.
- The district stores only safe stage, landmark and local transition receipt metadata; it rejects prompts, raw AI output, provider data, Vault data, account data and unrecognised landmark/event values.
- Route handoffs remain review-first. No landmark opens or confirms an external action by itself.

**Intentionally not claimed yet**

- No shipped GLB/GLTF, textures, animation, audio, crowds, final PBR asset pack, navmesh, combat, multiplayer, persistence service or AAA-quality claim.
- No browser/device performance proof, real-device touch proof or Cloudflare deployment.
- The Command Room is a designed procedural vertical slice, not a finished production interior asset pass.

**W366 source acceptance**

The local contract, source gate and unit tests must prove one safe City story, canonical landmark alignment, truthful guide roles and review-first handoff. W367 must now give this same city state a premium Three.js command-space presentation rather than duplicating it.

### W367 / C-08 — Three.js Spatial Command Space — Complete locally

**Delivered source presentation**

- A bounded local Command Board: Neon Command District mission stage, City mode/return reference, discovery count, and only sanitised local AI-cue count.
- Three controlled visual views: **Arrival vista**, **Command Centre**, and **City skyline**. Camera changes remain local presentation preferences.
- A distinct original procedural EONBOT guide in the Three.js scene. It is a City guide and explicitly does not claim that a provider or background task is running.
- Review-first user handoff from Spatial Command Space to Babylon Immersive Work Mode. The first click prepares only a local mode receipt; a second visible user click navigates.
- Existing frame governor, context-loss fallback, GPU disposal, asset-runtime summary and City Overview exit remain in place.

**Intentionally not claimed yet**

- No final command-room binary art, project database, provider-readiness console, cloud task queue, private task mirror, remote asset delivery, scene benchmark or human visual certification.
- No raw project, Chat, file, Vault, account, payment, provider or model information reaches the board or renderer.
- No browser, device, GPU or production-route proof has been produced by this source-only wave.

**W367 source acceptance**

The command projection, contract, source gate and unit tests must prove that camera state and work lanes are finite; native handoff is visibly reviewed; agent cues are sanitised; EONBOT is a guide rather than a fake worker; and renderer lifecycle is exposed for later device validation.

### W368 / C-09 — EONBOT City Work Loop

**Purpose:** turn City into a useful wrapper around AI work, not visual decoration.

**Flow**

1. User approaches EONBOT or a public terminal.
2. User selects a short intent or types a short request.
3. EONBOT creates a bounded action proposal through the existing AI Kernel.
4. User reviews the proposal outside the renderer.
5. User opens Chat, Workspace, Apps or Automations deliberately.
6. Native surface completes/blocks/cancels work.
7. Return receipt updates the corresponding City landmark truthfully.

**Safety**

- City never launches a hidden provider request.
- All provider/model selection remains governed by existing Kernel policies.
- City animations are decorative unless backed by a fresh local work receipt.

### W369 / C-10 — Adaptive Soundscape

**Purpose:** deliver premium emotion without intrusive sound or unlicensed generated audio.

**Layers**

- Original ambient music stems: arrival, exploration, focus, review, completion.
- Procedural but bounded atmosphere: rain, transformer hum, city transit, interior machinery, distant life.
- Short original interaction SFX for UI, doors, EONBOT and verified outcomes.
- Optional captioned EONBOT voice, never auto-speaking before user opt-in.
- Separate Music/Ambience/UI/Voice toggles and reduced-sensory mode.

**Acceptance gate**

Audio starts only after a user gesture, respects mute/reduced-sensory settings, does not imply untrue work activity, and cleans up on exit.

### W370 / C-11 — My Realm Visual Upgrade

**Purpose:** let users own an expressive local work identity without falsely claiming global decentralised hosting.

**Scope**

- Local cryptographic Realm identity; public-key fingerprint is the durable identifier.
- Optional human-readable handle is an alias, not guaranteed global uniqueness.
- Theme, landmark, companion shell, atmosphere and project-display preferences are portable local configuration.
- Encrypted export/import and visible backup reminders.
- Public publishing/discovery, marketplace, wallet and revenue routing remain separate later governance decisions.

**Acceptance gate**

A Realm export restores accurately on a second local session without silently uploading private data.

### W371 / C-12 — Performance Laboratory

**Purpose:** establish evidence before claiming high-end quality.

**Test matrix**

- Desktop discrete GPU.
- Desktop integrated graphics.
- Mid-range Android Chrome.
- Low-memory Android Chrome.
- iPhone Safari.
- Reduced-motion and data-saver variants.

**Evidence**

- Frame-time samples and adaptive-quality changes.
- Memory/disposal lifecycle checks after route changes.
- Texture/model budget reports.
- WebGL context-loss recovery evidence.
- City Lite fallback proof when Immersive Work Mode is unsuitable.

**Acceptance gate**

No “AAA” claim. The product can claim only tested device profiles and graceful fallback behavior supported by recorded evidence.

### W372 / C-13 — Visual and Interaction Certification

**Purpose:** final internal release evidence for City work.

**Required proof**

- First-entry Portal UX.
- City Overview route and fallback.
- Three.js command space lifecycle.
- Babylon controls on desktop and mobile.
- Command District interaction loop and return receipts.
- EONBOT handoff no-auto-route safety.
- Accessibility, reduced motion, safe areas and keyboard-only route.
- Screenshot/video proof, console checks and route integrity.
- Asset provenance and privacy boundary review.

Only after this evidence exists should C-00 production deployment repair be run, followed by Preview and production probes.

## Apps and Automation cross-track

The City program does not wait for a giant integration marketplace. It surfaces useful preparation first.

| Automation wave | Relationship to City |
|---|---|
| A-01 complete | Actions are classified: read, draft, write, publish, spend, delete, admin |
| A-02 Connection broker | Connections appear as explicit City Relays only after scoped consent exists |
| A-03 Local runner/cloud scheduler boundary | City identifies local versus cloud work without obscuring the boundary |
| A-04 verified integrations | Only approved connectors receive native terminals/relays |
| A-05 action policies | City may show “waiting for approval,” never silently execute |
| A-06 reliability receipts | City status derives from actual job receipts, retries and cancellation states |
| A-07 app/city handoff | Blueprints and Workrooms gain real reviewed workflows |
| A-08 limited beta | Read/draft actions first; high-impact execution remains blocked |

## Identity and commerce staging

- W373: Google identity contract, D1 schema and migration plan after City controls and asset foundation are stable.
- W374: actual Google OAuth and session implementation only after Google Cloud configuration and Cloudflare Secrets are available.
- W375: identity/backup UX and security proof.
- W376–W377: hosted payment provider and verified entitlement flow only after merchant approval and C-00 production truth repair.

No card data is ever handled by EONAPP frontend or stored in D1.

## What happens next

Next coding wave is W368: connect EONBOT’s bounded City intent cards to the existing AI Kernel and native work surfaces, preserving review-first routing and truthful return receipts.
