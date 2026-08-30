# AAA Graphics Implementation Plan (Code-First)

Date: 2026-04-22
Objective: Achieve AAA-class visual quality in browser-native games without losing performance on mid-tier devices

---

## Definition: AAA-Class (For This Platform)

AAA-class in this context means:
- coherent art direction + cinematic lighting
- fluid motion and responsive controls
- high readability under effects
- stable frame pacing on target hardware

Not required:
- film-grade ray tracing
- massive downloadable assets

---

## Engine Strategy

### Primary stack

- Runtime: WebGL2 + Three.js renderer layer
- Gameplay systems: existing JS/TS architecture (modular game logic)
- Asset packaging: glTF 2.0 + KTX2 textures + compressed audio

### Optional stack by title

- Phaser 3 for 2D-heavy action loops
- Three.js for 3D/hybrid worlds
- Godot export (Web) only for isolated flagship projects where editor tooling beats custom pipeline

Rule:
- do not hard-switch whole platform at once
- migrate one flagship game first, then template the pipeline

---

## Rendering Architecture

### Layer model

1. Gameplay layer
- deterministic simulation tick
- strict separation from render tick

2. Scene layer
- camera rig, lighting rig, post FX graph

3. Effects layer
- particles, trails, damage flashes, screen shake

4. UI layer
- HTML/CSS HUD for readability
- optional shader-backed background panels

### Frame model

- fixed simulation tick (for consistency and replay integrity)
- interpolated rendering for smooth visuals
- dynamic quality scaler adjusts effects based on frame budget

---

## Asset Pipeline

### Modeling and texturing

- source: Blender + Substance-compatible PBR maps
- export: glTF + Draco compression
- textures: Basis Universal (KTX2)

### Build pipeline

- script: optimize meshes, bake atlases, generate LODs
- script: audio normalization and format conversion
- script: manifest generation with content hashes

### Runtime loading

- prioritized streaming: gameplay-critical assets first
- background lazy loading for cosmetic packs
- cache versioning tied to manifest hash

---

## Performance Budgets

Target classes:

1. Mid laptop iGPU
- 1080p at 60 FPS target
- fallback 900p dynamic resolution

2. Modern desktop dGPU
- 1440p at 60 FPS target
- enhanced post FX preset

3. Mobile flagship
- 720p-1080p adaptive at 45-60 FPS

Per-frame budget at 60 FPS:
- total frame: 16.67 ms
- simulation: <= 4.0 ms
- render submission: <= 4.5 ms
- post-processing: <= 3.0 ms
- UI/composition: <= 2.0 ms
- spare: >= 3.0 ms safety headroom

---

## Visual Features by Milestone

### Milestone 1 (2-3 weeks): Immediate uplift

- HDR-like tone mapping
- color grading LUT
- emissive bloom (controlled)
- improved particles and impact decals
- camera shake envelope tuning

Deliverable:
- one existing game upgraded (recommended: neon-conquest)

### Milestone 2 (3-4 weeks): Depth and atmosphere

- volumetric fog approximation
- screen-space ambient occlusion (quality-tiered)
- shadow cascades tuned for gameplay readability
- temporal anti-aliasing fallback matrix

Deliverable:
- visual profile presets (low/med/high/ultra)

### Milestone 3 (4-6 weeks): Signature identity

- custom shader pack (holographic UI, neon reflections, shield refraction)
- cinematic event camera for boss phases
- replay camera interpolation for highlight clips

Deliverable:
- flagship visual demo suitable for launch trailer

---

## AAA Game Candidate: Quantum Drift GP

Why this title:
- speed + lighting + reflections show quality fast
- scalable track complexity
- natural replay and leaderboard loops

Core tech decisions:
- Three.js with custom shaders for road, trails, speed tunnel
- deterministic ghost replay format
- quality auto-scaler based on frame-time telemetry

Minimal vertical slice:
- 1 track
- 4 vehicles
- ghost replay
- online leaderboard snapshot API

---

## Team Roles and Workstreams

1. Graphics engineer
- render graph, shaders, performance tuning

2. Gameplay engineer
- deterministic simulation and control feel

3. Technical artist
- material standards, post FX calibration, LOD policy

4. Tools engineer
- asset optimization scripts and CI validation

5. QA/performance analyst
- frame-time capture and regression tracking

---

## CI and Guardrails (No Browser Test Requirement Preserved)

Static gates (already available):
- launch:check
- launch:readiness
- launch:page-gate

Add graphics build guards:
- asset budget lint (texture size, poly count, animation count)
- shader compile validation script
- manifest integrity verification

No mandatory browser e2e runs required for this phase.

---

## Risk Register

1. Over-designed visuals harming clarity
- mitigation: readability checkpoint for every VFX pass

2. Performance collapse on mid-tier devices
- mitigation: dynamic scaler + strict budget gates

3. Asset bloat and long load times
- mitigation: KTX2, Draco, streaming manifests

4. Toolchain fragmentation
- mitigation: one canonical pipeline doc and template repo folder

---

## First 14-Day Action Plan

1. Select flagship target: neon-conquest or new quantum-drift prototype
2. Create render-profile config (low/med/high)
3. Integrate tone mapping + bloom + color LUT
4. Add frame-time telemetry logger
5. Implement dynamic resolution scaler
6. Produce before/after benchmark captures
7. Freeze style guide (lighting, palette, contrast rules)
8. Ship internal visual alpha for iteration

---

## Success Criteria

- >= 60 FPS median on target desktop profile
- >= 45 FPS median on target mobile profile
- <= 2.5 s first interactive load on warm cache
- >= 20% uplift in average session duration on upgraded title
- positive readability score in internal playtest rubric
