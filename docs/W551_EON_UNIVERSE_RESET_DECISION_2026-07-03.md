# W551 — EON Universe reset decision

## Decision

Freeze the currently shipped procedural **Neon Command District** as a technical prototype. It is retained only as a test/control baseline while EON City is rebuilt as an authored, useful, playable EON Universe vertical slice.

This is not a Three.js rewrite. Babylon remains the sole public City engine. The defect is not the renderer: it is that the public scene is still source-controlled procedural/vector geometry, 13m world bounds, ArcRotate orbit camera control, HUD-led interaction, and developer evidence UI in the normal player experience.

## User-visible defects confirmed from source and owner screenshots

1. `ArcRotateCamera` is still the active camera. It is not a third-person character controller.
2. City bounds are `MAX_WORLD = 13`, so the apparent city is a tiny contained scene rather than an open district.
3. Current landmark meshes intentionally use `interactiveViaHud: true`; world assets are not a real click/aim interaction layer.
4. Command Deck focus moves player/camera to `(0, 0, -10.72)` and mutates camera alpha/beta/radius. Before W551, closing only hid the panel; it did not restore the exploration pose.
5. The normal route exposed `local-only frame evidence` and `Save local frame note`, which are validation tools, not player-facing UI.
6. Existing procedural/vector art is useful as original fallback/provenance evidence, but it cannot represent a final high-detail character, street, architecture or world-art release.
7. W483 historical executive gate previously referenced `assets/js/utils/iot-control-hub.js`, which W519 quarantined. W551 updates that check to prove the quarantine remains intact rather than reading or reviving retired IoT code.

## W551 implemented foundation

- Command Deck now captures the exact local exploration pose before its cinematic focus transition.
- Closing Command Deck restores player position, heading, camera alpha/beta/radius and target.
- Frame-evidence status and “Save local frame note” are visible only in explicit preview-evidence mode.
- A pure, tested, engine-agnostic exploration pose contract was added so future menus, interiors, fast-travel, missions and route reviews cannot overwrite return state silently.
- The historical W483 audit now verifies that retired IoT code remains quarantined; it does not reintroduce it or imply any device-control feature is active.

## EON Universe north star

A living cyber-noir productivity RPG and multiverse gateway:

- open plazas, wet streets, rain gardens, elevated transit and skyline depth;
- a memorable EONBOT guide with readable face, silhouette, motion and relationship states;
- a Command Dock that opens serious EONAPP functions instantly from anywhere;
- physical landmarks whose **Enter**, **Quick Open** and **Inspect** actions map to real EONAPP value;
- optional, transparent, earned visual progression and Vault Reveal moments;
- curated pocket worlds and expeditions rather than fake infinite random streets;
- no gambling-like rewards, no paid chance, no fake worker feeds and no unproven multiplayer claims.

## Delivery order

### W552 — art bible and world grammar

Lock a 384m × 384m Horizon Commons / Command District vertical slice:
- scale, sightlines, street hierarchy and landmark silhouettes;
- graphite/navy base, cyan interactive language, violet anomaly language, amber human/social zones;
- character anatomy, EONBOT skin families, architecture modules, material rules, soundscape and VFX restraint;
- explicit “no grain/no giant neon rings/no generic box towers/no developer UI” rejection rules.

### W553 — gameplay controller and interaction core

Replace the ArcRotate public controller with a third-person follow controller:
- camera-relative WASD;
- pointer-lock look on desktop;
- aim/hover/touch focus outline;
- `E` / Interact opens a contextual action wheel only at a valid interaction volume;
- menu, interior, quick-open and fast-travel transitions preserve exact return state;
- all diagnostics isolated behind developer/evidence mode.

### W554 — production art pipeline

Before model work begins, create asset registry and budget:
- custom or licensed-and-transformed GLB assets only;
- KTX2/Basis textures, LOD0/1/2, collision and interaction metadata;
- source/license record for every non-original ingredient;
- 2K hero texture ceiling, 1K world texture ceiling, 512px prop texture ceiling unless a written exception exists;
- no unreviewed marketplace pack collage.

### W555 — Command Horizon vertical slice

Release one open 384m × 384m district with:
- Horizon Commons arrival plaza and rain garden;
- Command Centre exterior plus playable interior;
- Forge Court and Creator Avenue exterior lanes;
- Vault Gardens;
- Transit Gate;
- 4 landmark buildings, 1 interior, 20 core interactions, 5 useful missions, 6 real EONAPP bridges;
- 1 premium EONBOT guide, 4 NPC archetypes, 24 animated ambient character variants.

### W556 — useful game loop

Player intent is selected in under 60 seconds: Create, Build, Organize, Explore or Learn.

Missions can prepare and then require explicit user confirmation for real actions such as starting a project, opening Build OS, making a Capsule, visiting Creator Studio or checking Local AI setup. Nothing launches, pays, publishes or connects an account from a world interaction.

### W557 — EONBOT, progression and Vault Reveals

EONBOT receives only original skins and character states (guide, collaborator, sentinel, archivist) tied to verified app progress. Vault Reveals are transparent achievement/reveal cards, never a paid chance mechanic. A reward has source, criteria, cosmetic/utility scope, expiration and restore behavior documented.

### W558 — living city and expeditions

Add seeded weather, day/night variations, safe ambient traffic, NPC schedules, changing street dressing and finite authored signal expeditions. The fixed home city stays learnable; variety lives in events and pocket worlds.

### W559 — district expansion only after quality pass

Automation Railworks, Archive Gardens, Device Lab Docks, Trade Dome and Market Exchange expand only after W555 satisfies visual, interaction and performance gates.

### W560 — institutional release evidence

No “AAA” or launch claims without:
- asset-source/license ledger;
- visual acceptance pack at 1080p and 1440p;
- real Android, iPhone, tablet and standard laptop capture;
- controls after all menu/interior/fast-travel returns;
- error, WebGL context-loss, long-session and memory observations;
- accessibility, reduced-motion, keyboard, mouse, touch and controller proof;
- release/deployment SHA parity;
- owner visual approval.

## Performance and scale budgets

### W555 vertical slice budgets

| Item | Target |
|---|---:|
| World | 384m × 384m, 3×3 streamed 128m cells |
| Active high-detail cells | 1–3 |
| Landmark buildings | 4 |
| Full interiors | 1 |
| Architecture modules | 24–32 |
| Street props | 120–160 |
| Hero character | 1 EONBOT + 4 NPC archetypes |
| Animations | 25–35 clips |
| Core interactions | 20 |
| Useful missions | 5 |
| Desktop target | stable 60-FPS-class pacing on high profile |
| Mobile target | intentional Lite mode, stable 30-FPS-class pacing |

These are production targets, not achieved claims.

## What is explicitly not in W551–W560

- public unmoderated multiplayer;
- automatic social posting;
- wallet or payment activation;
- gambling-like lootboxes;
- hidden tracking or remote player telemetry;
- automatic cross-device City sync;
- unproven local image/video generation;
- action combat that would distract from EONAPP’s productivity purpose.

Action and animation may be added later as light, non-violent traversal/expedition play: parkour lanes, drone routing, signal puzzles, transit chases, environmental hazards and cinematic EONBOT abilities. They must not create violence, gambling or deceptive reward systems.
