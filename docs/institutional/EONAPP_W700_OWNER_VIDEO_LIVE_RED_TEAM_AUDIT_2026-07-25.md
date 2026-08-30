# EONAPP W700 Owner-Video + Live Production Red-Team Audit

**Date:** 25 July 2026  
**Production:** `https://eonapp.ch`  
**Observed live source commit:** `afc74c0de5517b4e96891d6d8d6e9f529ef952a3` (`W700.9`)  
**Observed candidate digest:** `c1a2c100726ff85adc0a7ae3cfd060cd81b8b50f861cd9139d68d922dba5055c`  
**Remote action rule:** No more GitHub Actions runs. No deployment or production mutation during this audit.

## Evidence boundary

The prior owner-video findings were recovered from the previous chat and cross-checked against the live Cloudflare production surface and the verified W700 source. The MP4 binaries themselves were not present in the current attachment filesystem at the time this report was written, so no claim is made that the same frames were freshly re-extracted in this chat.

## Executive verdict

W700.9 is a meaningful improvement and the Connected Core is visually credible, but EONCITY and EON NEXUS are not yet at the requested 9.5/10 experience level. The principal problem is not absence of source features; it is that the intended flagship systems are fragmented, over-gated, visually subordinate, or exposed as separate panels rather than one coherent world-first product.

### Current provisional UX scores

- Connected Core visual identity: **7.4/10**
- EONCITY navigation and camera safety: **5.8/10**
- Expanse discoverability and entry: **4.5/10**
- Expanse open-world presentation: **5.0/10**
- EON NEXUS spatial experience: **5.2/10**
- Project Atlas onboarding and continuity: **4.8/10**
- Projects workspace clarity: **5.5/10**
- Overall flagship coherence: **5.4/10**

No 9.5/10 acceptance is claimed.

## Confirmed defects and root causes

### 1. EON NEXUS still reads as a 2D rotating interface

The visible Nexus graph rotates through CSS variables and DOM transforms. A real Babylon Living Core exists, but it is a secondary background layer and is explicitly excluded from EONCITY. This creates the owner-observed result: controls turn a flat composition, while the product does not feel like a true manipulable three-dimensional command field.

**Required repair:** one primary Babylon spatial scene for compact, split, and full-screen modes; real depth, object picking, camera orbit, focus transitions, and responsive composition. Preserve the same EONBOT state and do not create a second assistant or state store.

### 2. Project Atlas appears broken when no project is selected

Atlas intentionally returns an empty state and only offers “Select a project.” It does not provide a meaningful create/choose/recent-project onboarding path inside Atlas, so a valid empty state feels like a failed click.

**Required repair:** Atlas must always open visibly. Empty state should present Create Project, Choose Recent Project, and Explore City Map. Selected-project state should show real work objects, relationships, outcomes, approvals, and the City handoff.

### 3. Projects page repeats the same continuation state

The live page displays a top continuation banner, a second Continue card, and an Active Project banner before the main workspace. This consumes space and makes the page look assembled rather than intentionally designed.

**Required repair:** one compact Resume strip, one project workspace, and one central command-center view. Remove duplicated continuation surfaces.

### 4. Expanse exists in source but does not feel operational

The current flow requires Atlas guidance, approach, inspect, move closer, then a separate Enter confirmation. The final entry radius is small and the interaction state is buried among multiple HUD surfaces. The result is functionally truthful but experientially indistinguishable from “nothing happened.”

**Required repair:** make the Expanse a permanent visible world objective; physically extend streets to the border; display a clear gateway state; use one inspection step followed by a prominent explicit Enter action; enlarge the forgiving interaction area; show transition feedback and immediate safe return.

### 5. The map reads as isolated districts with empty space

The district belts and circular grounds are individually designed, but the macro composition lacks enough continuous city fabric. From zoomed-out views, negative space dominates and the world reads as disconnected islands rather than a metropolis.

**Required repair:** continuous terrain and street plate, infill blocks, plazas, utility buildings, parks, vertical skyline layers, transit lines, edge districts, and dense authored transitions. The Core must remain handcrafted; deterministic infill should support it rather than replace it.

### 6. Camera can visually break below the surface

The camera has angle and radius limits, but there is no explicit per-frame world-height floor for the camera target and restored camera poses can reapply arbitrary target height. Streamed terrain edges and one-sided ground geometry can expose the underside/void.

**Required repair:** hard camera target-height clamp, camera world-Y safety floor, terrain-edge occluder/void mask, safe restored-pose sanitation, and tests proving no below-ground view across Core, gateway, Expanse, and Realm returns.

### 7. The City lacks a convincing all-in-one command center

The City has tools, terminals, Nexus stations, EONBOT, Atlas, and district panels, but they remain distributed as separate controls. The requested central master room is not yet a coherent operating environment.

**Required repair:** transform Command Centre into the master room: live Nexus core, project status, approvals, tasks, results, providers, transport, district monitoring, Atlas wall, EONBOT dock, and direct review-first work entry points. It must summarize all districts without replacing their specialist functions.

## Locked W701 repair programme

### W701A — Camera and world-boundary safety
- Enforce above-ground camera and target constraints.
- Sanitize restored and transition camera poses.
- Add void masking and edge occlusion.
- Add regression tests for Core, Expanse, Realms, and returns.

### W701B — Continuous Core metropolis
- Add city-fabric ground, block hierarchy, street infill, plazas, skyline, and border continuity.
- Preserve nine distinctive authored districts.
- Prevent empty zoomed-out composition.

### W701C — Flagship Expanse entry and continuity
- Make Expanse visibly present from normal play.
- Turn map-border streets into physical approach corridors.
- Simplify and clarify reviewed entry.
- Add unmistakable transition, region identity, population, discoveries, and safe return.

### W701D — Real 3D EON NEXUS
- Promote Babylon Living Core to the primary interaction surface.
- Support compact, split, half-window, and full-screen responsive modes.
- Add real spatial object manipulation and selected-object continuity.
- Mount a genuine in-world Nexus in EONCITY using the same state contract.

### W701E — Atlas and Projects recovery
- Useful Atlas with or without a selected project.
- Remove duplicate Projects continuation UI.
- Build the central smart project command workspace.
- Keep all work review-first, local/private by default, and truthful.

### W701F — Owner acceptance and release
- Local focused tests and complete maintained suite first.
- Headed browser proof and owner recording matrix.
- No GitHub Actions runs.
- Only after approval: controlled Cloudflare Preview and exact-candidate production update with rollback proof.

## Non-negotiable architecture

- One EONBOT intelligence and one shared state contract.
- No second assistant, second chat history, second project store, or hidden execution path.
- No automatic AI work, approvals, microphone, camera, posting, payment, or navigation.
- No fake project activity, milestones, rewards, population, or completion.
- Core remains authored; Expanse remains deterministic and bounded/streamed rather than an enormous download.
- Immediate safe return from Expanse and every Realm.
