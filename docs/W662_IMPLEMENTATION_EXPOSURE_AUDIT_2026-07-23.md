# W662 Implementation and Exposure Audit

**Date:** 23 July 2026  
**Repository:** `creditznft/EONAPP`  
**Production source:** `063552ccc72b21cb1b8c73512039d29d4dff58cf`  
**Production deployment:** `57758b16-f1a9-476c-855b-5d3de8f1444c`  
**Working branch:** `agent/w662-nexus-city-reconciliation`  
**Draft PR:** #42 — must remain draft and unmerged  
**Historical PR:** #39 — remains draft, unmerged and untouched

## Executive conclusion

The W660/W661 programme is **substantially present in source**, but source presence is not equivalent to owner-visible completion. This audit records 31 components across six independent evidence fields.

- **2 complete:** the W661E short-tap/release lifecycle and the current release provenance.
- **1 wired-broken:** camera-relative controls. The active first-frame City core resolves W/A/S/D, arrows and analogue input against fixed world X/Z axes.
- **1 present-hidden:** Core/Expanse/My Realm/Realm destinations exist in the active Babylon runtime but are exposed primarily through secondary technical UI.
- **8 present-shallow:** major systems exist but the visible result does not match the accepted design, including Live Nexus, Project Atlas, morphing continuity, HUD hierarchy and Forge visualization.
- **2 planned-only:** the approved spatial Atlas renderer and an unmistakable physical Living Nexus gateway.
- **17 human-proof-required:** source and automated evidence exist, but authenticated owner-visible acceptance is incomplete.

Broad visual rewriting is **not yet authorized**. The ledger does authorize the narrow W662B repair: introduce one canonical camera-relative ground-vector resolver while preserving the W661E short-tap lifecycle.

## Confirmed contradictions

1. **Movement semantics:** `assets/js/city/eon-city-play-core.js` derives direction from fixed X/Z input values. Camera rotation and destination-specific camera poses can therefore invert perceived controls.
2. **Atlas mismatch:** `assets/js/nexus/eon-nexus-project-atlas.js` truthfully projects selected-project data, but its primary renderer is metrics plus lists rather than the accepted centre/rings/Needs Attention map.
3. **Live Nexus mismatch:** the active W660C renderer exists and supports up to five nodes, split/fullscreen modes and Project Atlas, but the owner-visible composition remains underfilled and visually shallow.
4. **World discovery mismatch:** deterministic Expanse streaming, encounters, Atlas returns and curated Realms exist in the canonical Babylon scene, but the first-time world journey is hidden behind secondary UI and technical language.
5. **Completion-matrix ambiguity:** the previous W660 completion matrix proves source inventory and internal contracts, while its own browser-proof fields remain pending. It cannot certify owner-visible completion by itself.
6. **Cast and fallback ambiguity:** progressive detailed assets exist, but the current evidence does not authenticate every model, fallback replacement, animation clip, role, terminal link, schedule and EONBOT docking behavior.

## Evidence model

| Field | Meaning |
|---|---|
| SP | Source is present in the governed production tree. |
| RI | The active production runtime imports or mounts it. |
| FE | A normal user can see a trigger or discover it. |
| FI | The interaction has functional evidence. |
| AT | Deterministic automated proof exists. |
| HP | Authenticated owner-visible human proof is accepted. |

A component may be `complete` only when all six fields are true and no contradiction remains.

## Component ledger

| Component | Priority | Status | SP | RI | FE | FI | AT | HP | Next action |
|---|---:|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `eon-pulse` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Retain the truthful state surface and prove visual/state continuity into Live Nexus and City. |
| `expanded-live-nexus` | P1 | **present-shallow** | Y | Y | Y | Y | Y | N | Recover the approved 55–65% command field, readable side panel, stable nodes, split mode and mobile sheet. |
| `live-nexus-split-fullscreen` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Add real-browser desktop/split/mobile acceptance and focus restoration proof. |
| `live-nexus-node-field` | P1 | **present-shallow** | Y | Y | Y | Y | Y | N | Recompose the active renderer without changing truthful adapter ownership. |
| `project-atlas-adapter` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Keep the adapter and add spatial rendering plus selected-project change proof. |
| `project-atlas-current-renderer` | P1 | **present-shallow** | Y | Y | Y | Y | Y | N | Demote this renderer to the accessible list alternative after adding a spatial primary map. |
| `project-atlas-spatial-renderer` | P1 | **planned-only** | N | N | N | N | N | N | Implement the spatial primary map while preserving the current truthful adapter and readable list. |
| `pulse-to-live-morph` | P0 | **present-shallow** | Y | Y | Y | Y | Y | N | Create one continuity state and visual transition contract, including reduced motion. |
| `live-to-city-continuity` | P0 | **present-shallow** | Y | Y | Y | Y | Y | N | Add shared continuity state, recognizable EONBOT identity and round-trip proof. |
| `living-nexus-physical-core-gateway` | P0 | **planned-only** | N | N | N | N | N | N | Create a visible Core landmark, one-time EONBOT introduction and direct world entry. |
| `living-nexus-destinations` | P0 | **present-hidden** | Y | Y | N | Y | Y | N | Expose the destinations through physical world interaction and keep diagnostics optional. |
| `expanse-deterministic-streaming` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Improve visible cell identity and capture continuous real-browser proof. |
| `realm-portals` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Make portal signals legible and prove inspect → prepare → confirm → enter → return. |
| `six-realm-entry-exit` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Prioritize two Realms for first human proof, then certify all six. |
| `atlas-discoveries-return-points` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Integrate discovery into world interaction and record exact return proof. |
| `living-nexus-transformations-encounters` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Make opportunities readable in-world and prove review-first behavior without fabricated execution. |
| `district-travel` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | Y | Keep travel logic; repair movement semantics and certify distinct destination identity. |
| `camera-relative-controls` | P0 | **wired-broken** | Y | Y | Y | N | N | N | W662B: introduce one camera-relative ground-vector resolver for every input path and transition. |
| `short-tap-release-lifecycle` | P0 | **complete** | Y | Y | Y | Y | Y | Y | Preserve unchanged while W662B changes directional vector resolution. |
| `keyboard-focus-overlays` | P1 | **human-proof-required** | Y | Y | Y | N | Y | N | Add deterministic overlay focus tests and keyboard-only real-browser proof. |
| `mobile-touch-controller-parity` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Route every input method through the W662B resolver and certify a parity matrix. |
| `hero-detailed-model` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Create a machine-readable cast roster and prove exact asset, fallback disable and animation state. |
| `eonbot-companion` | P1 | **present-shallow** | Y | Y | Y | Y | Y | N | Certify the full companion lifecycle and make docking visibly understandable. |
| `functional-npc-roster` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Create the W662G cast roster and collect per-asset visible proof. |
| `character-animation-director` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Add animation state receipts and continuous owner proof. |
| `docks-terminals-transit-schedules` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Prove at least three functional NPC/terminal interactions and all transit safety states. |
| `city-hud-hierarchy` | P1 | **present-shallow** | Y | Y | Y | Y | Y | N | Establish one contextual HUD hierarchy and keep the world as the primary visual surface. |
| `forge-nexus-visualization` | P1 | **present-shallow** | Y | Y | Y | Y | Y | N | Render the truthful Forge stage path as part of the recovered Live Nexus. |
| `city-audio` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Run a dedicated audio acceptance matrix before final release. |
| `progressive-fallback-truth` | P1 | **human-proof-required** | Y | Y | Y | Y | Y | N | Expose a restrained loading/degraded state and prove fallback disable for every certified asset. |
| `release-provenance` | P0 | **complete** | Y | Y | Y | Y | Y | Y | Preserve production until W662I creates a new independently certified immutable Preview. |

## Superseded or misleading completion surfaces

- `assets/js/city/w660/eon-city-w660-completion-matrix.js` remains useful as a source inventory, but it must not be treated as owner-visible product certification.
- The current Project Atlas metrics/list renderer becomes the accessible list alternative after the spatial primary map is implemented.
- Any old/basic Nexus surface that does not mount through the active Pulse/App Shell/Live Nexus path must be catalogued and retired or explicitly marked superseded in later W662 work.
- Technical Living Nexus panels remain diagnostics/management surfaces; they must not remain the primary world-entry experience.

## Authorized next wave

W662B may proceed narrowly because the ledger identifies a concrete P0 defect with a bounded repair:

1. derive camera-forward and camera-right vectors projected onto the ground plane;
2. normalize safely;
3. resolve keyboard, arrows, D-pad, touch/analogue, controller and guided movement through one function;
4. preserve collisions, world bounds, W661E short-tap frame consumption and release drift guarantees;
5. clear movement before district, Expanse and Realm transitions;
6. add deterministic 0°, 90°, 180° and 270° camera tests;
7. add browser proof before any Preview or production action.

## Release boundary

Production remains unchanged. PR #42 stays draft. No merge or deployment is authorized until a coherent immutable Preview independently passes the W662 acceptance matrix and the owner provides explicit per-PR approval.
