# EONAPP W745 — Final EONCITY Quality Summit and CEO Decision Ledger

Date: 2026-07-29  
Branch: `w737-city-recovery-local`  
Parent authority: W744 commit `d4a05ded5f05ebb9483db0bdfb0ec1de17e3aad3`  
Deployment status: **not pushed, merged, previewed or deployed**

## CEO decision

W745 is the final pre-Codex source-polish wave. The Command Centre, physical 3D Nexus, ten station micro-locations, sharing, Creator Capture, contextual membership discovery, authored world assets and route contracts remain as frozen by W744. W745 does not reopen the architecture. It improves the two remaining presentation weaknesses:

1. EONBOT is no longer a stiff orbiting prop.
2. Pathfinder no longer repeats one idle presentation indefinitely.

The source candidate is approved for Codex build, headed-browser proof and preview preparation. Production is not approved until those execution gates pass and the owner gives a separate explicit GO.

## W745 implementation

### EONBOT companion director

EONBOT now uses one bounded local visual director with the following states:

- formation follow while Pathfinder moves;
- curious hover near Pathfinder;
- structure scouting;
- terminal inspection;
- station-host greeting;
- physical Nexus spiral;
- illuminated circuit scan;
- playful camera-safe loop;
- visual dock check;
- return to formation;
- reduced-motion hover.

The director may use only public scene targets. It cannot open a station, move Pathfinder, start AI work, read private data, record media, post/share, navigate automatically, dock automatically or create a network request. Scout distance is clamped to 8.4 world units from Pathfinder. Structure, terminal and NPC observation targets use collision-safe approach positions rather than geometry origins, so EONBOT does not intentionally fly through station buildings or terminals. Structure, terminal and NPC targets now use collision-safe approach points instead of object origins, so EONBOT does not fly through authored station geometry.

Visual presentation includes a scan halo, bounded scan beam, two orbiting sparks, heading-aware movement, playful tilt and state-specific speed. The old simple-orbit presentation is explicitly retired.

### Pathfinder living idle

Pathfinder now cycles through authored stationary presentations:

- primary idle;
- alternate idle;
- inspection gesture;
- confident pose;
- wave;
- safe return to idle after one-shot clips.

Walking and running remain reserved for real locomotion. Procedural fallback articulation is used only when the authored character is unavailable.

### Command Centre polish

- Nine animated circuit-data pulses now travel from the physical Nexus to station traces.
- A binary-integrity gate verifies every launch GLB variant against its manifest byte count and SHA-256, parses its GLB structure, requires meshes/materials, confirms the Pathfinder rig and exact clip list, and confirms EONBOT has no false skeletal-animation claim.
- A binary-integrity gate verifies every assigned launch GLB exists, matches its declared byte count and SHA-256, contains meshes/materials, and preserves the exact Pathfinder clip set.
- W745 runtime/manifest/service-worker provenance is unified as `eon-city-command-centre-w745-1`.
- Service-worker release authority is `w745-2026-07-29-final-city-polish-v1`.
- Existing W744 station, Nexus, Share, Creator Capture, Plans & Access, NPC, transport, maintenance, exterior-light and authored-asset contracts remain mandatory.

## Final source audit

### Command Centre and Nexus

- Exactly ten station blueprints remain.
- Every station remains a structure + terminal + interactable NPC triad.
- Command Status uses Orin Sentinel / Security Sentinel; the owner-rejected Architect coat model remains excluded.
- Every work-surface fallback route resolves to a real local page.
- The centre remains a physical 3D Nexus with Genesis Core, command terminal, command seat, Pathfinder, EONBOT and EONBOT dock.
- One Babylon engine, one scene and one render loop remain the only active City authority.

### Assets and environment

- Every active `READY` W649 world asset remains assigned to a purposeful launch role.
- A dependency-free binary integrity gate verifies all 42 assigned launch entries and all 84 primary/fallback GLB variants: file presence, declared size, SHA-256, GLB headers, mesh/material presence, Pathfinder rigs and exact 11-clip names.
- Unsafe inactive static candidates remain excluded.
- Authored structures, independent terminals, role NPCs, Transit Capsule, Maintenance Worker and street-lamp network remain assigned.
- The circuit-board floor, station traces, portals/thresholds, beacons, bounded point lights, fog, exposure and contrast remain active.

### Product and safety

- Share Command Center remains permanent in the City HUD and featured in City Menu.
- Creator Capture remains inside the review-first sharing flow.
- Signed referral-ready links are prepared for review; nothing posts automatically.
- Plans & Access remains contextual membership discovery and is explicitly not advertising.
- Checkout cannot begin without explicit review/confirmation.
- NPCs and EONBOT do not imply task execution that did not occur.

## Red-team closure

Closed in source:

1. Stiff EONBOT orbit with no environmental curiosity.
2. EONBOT visual travel without a player-distance boundary.
3. Companion behavior that could be mistaken for autonomous work.
4. Pathfinder repeating one idle forever.
5. One-shot hero clips not returning safely to idle.
6. Dead-looking circuit-floor traces.
7. W744 cache authority surviving after W745 runtime changes.
8. Older W743/W744 browser contracts expecting stale provenance.
9. EONBOT structure targets placed at geometry origins, which could cause visual clipping.
10. Asset readiness proven only by manifest declarations rather than the actual GLB binaries.

Still requires Codex execution evidence:

1. Production build with locked dependencies.
2. W743, W744 and W745 Playwright suites.
3. Visual inspection of every EONBOT state on real GPU.
4. Pathfinder idle/gesture transitions without root drift or mesh deformation.
5. All ten station structure/terminal/NPC clicks.
6. All NPC idle, locomotion and terminal-use clips.
7. Transit, Maintenance Worker and street-light rendering.
8. Creator Capture permission, preview, save and native-share behavior.
9. Signed invite review and no automatic posting.
10. Plans entitlement/checkout confirmation behavior.
11. Lite, balanced and cinematic performance.
12. Headed Chrome, Edge and Firefox evidence.
13. Preview deployment, owner acceptance and separate production GO.

## Source score

W745 final source-readiness score: **9.5/10**.

Binary asset evidence at final freeze: 42 manifest entries, 84 GLB variants and 81,099,884 bytes verified.

This score covers architecture, contracts, asset assignment, route safety, animation-state logic, product safeguards, cache authority and maintained static tests. It is not a visual-production score. The missing 0.5 is reserved for real build, GPU/browser, preview and owner evidence.
