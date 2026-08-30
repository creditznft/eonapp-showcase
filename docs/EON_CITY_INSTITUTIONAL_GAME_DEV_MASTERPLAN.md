# EON City institutional game-development master plan

## Product thesis

**EON City is a spatial AI work environment designed with the emotional clarity, visual craft, controls, atmosphere and curiosity loop of a premium game.** It is not a casual game pretending to be a work tool, not a token economy, not a fake “agent swarm,” and not a dashboard wrapped in WebGL.

The user’s city journey must remain truthful:

```text
ENTER EON CITY
  → choose Immersive Work Mode, Spatial Command Space, or City Overview
  → meet a contextual EONBOT/agent representation
  → inspect a prepared, bounded work option
  → choose a real native EONAPP surface
  → return with a small status-only local outcome receipt
```

No City renderer may display credentials, raw prompts, private Chat/Vault content, unredacted provider output, hidden provider execution, automatic publishing, wallet actions, reward creation or background work.

## Locked mode architecture

| Mode | Engine | Job | Non-negotiable boundary |
|---|---|---|---|
| **EON City Portal** `/eoncity` | light Canvas/DOM | beautiful first arrival, clear mode selection | not a map; no heavy engine; no auto-start |
| **Immersive Work Mode** `/eoncity/play` | Babylon | walkable original Neon Command District, work missions, character presence | no fake task completion; native actions require review |
| **Spatial Command Space** `/eoncity/tour` | Three.js | premium command room, district overview, visual status management | not a dashboard shell; no raw AI data |
| **City Overview** `/eoncity/lite` | 2.5D Canvas/DOM | fast all-device navigation and map | beautiful fallback, same state, not second-class |
| **My Realm Studio** `/realm-studio` | DOM/local data | portable personal identity and visual preference | no false global username, property, marketplace, or payout claims |

`/eoncity/3d` remains a temporary compatibility path to the Spatial Command Space while external links migrate.

## Institutional production principles

1. **One polished district before many weak districts.** Neon Command District is the quality bar.
2. **Authored first, procedural second.** Code supplies layout, simulation limits, variation and performance; art assets supply visual identity, anatomy, material quality and animation.
3. **Truth is part of art direction.** Beautiful animated provider roles cannot imply a live model call, paid provider relationship or hidden work.
4. **Dual-engine parity.** Babylon and Three.js consume the same safe `CityWorldState` and the same landmark registry. They never fork progress or invent separate economies.
5. **Device dignity.** Weak devices receive a high-quality City Overview, not a broken miniature of a desktop scene.
6. **Performance is authored.** LOD, texture budgets, animation budgets, culling, disposal, quality tiers and time-to-interaction are planned before asset intake.
7. **Accessibility is a production feature.** Captions, reduced motion, sensory controls, safe areas, keyboard, controller and touch are core acceptance criteria.
8. **Asset provenance is mandatory.** Every shipped mesh, texture, sound, animation, shader snippet or generated starting concept has a source/rights record.

## Art bible: original “Neo-noir operational sanctuary”

The City must look premium, detailed and alive without copying the submitted reference games’ UI, character designs, signs, map layout, assets, story or game systems.

### Visual language

- **Base materials:** dark basalt, brushed alloy, smoked glass, ceramic panels, rain-slick paving, soft fabric, constrained emissive surfaces.
- **Colour system:** deep navy/steel base; cyan for help/AI guidance; violet for creation; amber for review; green for verified return states. Never make every object neon.
- **Silhouette system:** tall landmark forms, layered balconies, elevated transit, compact street furniture, distant towers and a readable central command beacon.
- **Scale system:** foreground human detail; mid-ground active architecture; distant skyline with atmospheric perspective.
- **Motion system:** low-frequency rain, traffic, signage, door mechanisms, delivery drones, EONBOT hover behaviour, pedestrian idles. Motion must be opt-in/low under reduced-motion settings.

### Command District minimum art set

| Family | Minimum shipped bar before calling the district polished |
|---|---|
| Hero avatar | one original high-quality operator, 5+ body/appearance variants, skeleton, walk/idle/turn/interact animations |
| EONBOT | one original companion model, expressive emissive ring, hover/arrive/inspect/idle states, captions-first voice cues |
| Role NPCs | Builder, Archivist, Cartographer, Realm Keeper, Reviewer, plus crowd variants; hero roles get close-detail animation |
| Architecture | Command Centre exterior/interior, Build Workshop, Archive façade, Realm Relay, Local AI Observatory, streetscape kit |
| Props | terminals, doors, light fixtures, transit, planters, benches, vending/café-like social props, maintenance robots, signage with original typography |
| Materials | PBR master set, trim-sheet strategy, atlas plan, controlled emissive map, weathered decal strategy |
| Effects | rain, volumetric-like light approximation, fog, low-cost particles, hover trails, interaction ripple; reduced-motion alternatives |
| Audio | ambient stems, point sounds, UI cues, original EONBOT cues, captions and mixer controls |

### Art-source acceptance

- No scraped/copyrighted assets, ripped character packs, copied game UI, copied audio or unlicensed “free” files.
- AI-generated concepts may be used only as a starting exploration tool. The shipped asset must have a rights/provenance record and a human art-direction review.
- Store large GLBs, textures, audio and source art in a separate asset package/repository. Never place them in the ≤20 MB code snapshot.
- Each asset record must include: ID, source/creator, licence, modification notes, poly/texture/audio budget, LOD count, supported engines, accessibility notes and approval status.

## Dynamic AI/provider character system

Provider brands must never become inaccurate “workers.” A character represents a **safe local status category**, not a sentient account or guaranteed execution.

### Visual language

| Safe City role | Optional provider identity only after local opt-in | What can appear | What never appears |
|---|---|---|---|
| Velocity Relay | Groq | fast-route courier/console glow after an actual recorded local request receipt | raw prompts, raw outputs, API key, undisclosed model, fake busy loop |
| Prism Relay | Gemini | research/light-analysis attendant after a recorded receipt | Google affiliation claim, private content, background work |
| Route Relay | OpenRouter | routing cartographer after an actual receipt | vendor/provider account state, hidden fallback chain |
| Local Forge | Ollama | local-device artisan when local runtime is detected/used | model download claim, invisible runner, device file scan |
| Atlas Relay | other approved provider | bounded visual role after the provider is registered and used | arbitrary third-party brand avatar or fake performance claim |

### State machine

```text
hidden
  → available (provider category only; no identity by default)
  → selected (user chose a provider or local mode)
  → working (only while a local verified action receipt says foreground work is active)
  → review-ready (status-only, no content)
  → returned (user chose a native surface and came back)
  → idle
```

The character must not “walk around working” from a timer. On page refresh, it becomes idle unless a current safe local receipt proves active foreground work. Provider name display is a local preference and defaults off.

## AI interaction design

### Babylon

- EONBOT is a proximity companion with a small intent panel.
- “Ask EONBOT” opens a limited safe intent choice or a short text prefill.
- For complex work, City opens Chat/Workspace only after a clear review card.
- Landmarks do not execute actions. They prepare a route and explain what will happen.

### Three.js

- The Command Space shows project capsules, approved work cards, provider category readiness, local task receipts and district navigation.
- Visual data is bounded: task label, user-chosen category, lifecycle stage, review state, local timestamp, opaque receipt ID.
- Full prompts/output remain in Chat/Workspace, not a 3D panel.

### City Overview

- Map presents current objective, prepared action markers, Realm appearance and safe activity summaries.
- It remains fully useful under WebGL failure, memory pressure, reduced motion, or portrait mobile use.

## Programme phases and exit gates

### Foundation and production truth

| Phase | Scope | Exit gate |
|---|---|---|
| **C-00** | production truth repair | `/automations` and all City routes have Preview and production probe evidence; no stale build mismatch |
| **C-01** | route architecture | Portal/Overview/Tour/Immersive labels and compatibility paths work in the final build |
| **C-02** | shared state contract | same safe City state, landmark IDs and status receipts across all modes; migration and rollback test |
| **C-03** | Portal rebuild | first impression review: no map-first confusion; one obvious Enter CTA; no heavy auto-load |

### Gameplay-quality foundation

| Phase | Scope | Exit gate |
|---|---|---|
| **C-04** | City Overview art rebuild | polished 2.5D map, high-DPI stability, tap routing, district state parity, reduced-motion proof |
| **C-05** | Babylon controller overhaul | keyboard/mouse/click-to-move/controller/analogue touch joystick, pause, safe fullscreen and landscape opt-in proof |
| **C-06** | asset pipeline | asset registry, licence/provenance template, GLB validation, LOD/texture/audio budget gates, disposal checks |
| **C-07** | Neon Command District vertical slice | one real exterior/interior, hero avatar, EONBOT, role NPCs, authored props/materials, one excellent work loop |

### Spatial work and atmosphere

| Phase | Scope | Exit gate |
|---|---|---|
| **C-08** | Three.js Command Space | premium command room, visual task cards, safe AI handoff, scene disposal/memory proof |
| **C-09** | EONBOT and agent director | proximity/intent system, truthful provider visual state machine, local opt-in identity, no fake work test |
| **C-10** | adaptive soundscape | original audio catalogue, user-tap audio start, music/ambience/UI/voice mixer, captions and reduced-sensory proof |

### Identity, performance and certification

| Phase | Scope | Exit gate |
|---|---|---|
| **C-11** | My Realm visual upgrade | local cryptographic identity, handle-as-alias, style/landmark selection, portable backup and no-registry proof |
| **C-12** | performance laboratory | desktop GPU, integrated GPU, Android, iPhone/Safari and low-tier fallback evidence; budgets pass or feature scopes shrink |
| **C-13** | visual certification | recorded movement, input matrix, mobile orientation, accessibility, no leaked private state, route and production screenshot approval |

## Team model for institutional quality

Even with a small team, work should use these explicit review hats:

- **Executive producer:** scope, sequencing, user value, no feature inflation.
- **Technical director:** engine boundary, architecture, lifetime/memory, device tiering.
- **Art director:** visual bible, style consistency, asset acceptance.
- **Technical artist:** materials, GLB/LOD/lighting/performance constraints.
- **Gameplay/interaction designer:** movement, camera, mission clarity, input feel, cognitive load.
- **Narrative/UX designer:** EONBOT voice, landmark dialogue, work handoff clarity, no fake agency.
- **Audio designer:** score stems, interaction sound, loudness and sensory controls.
- **QA lead:** device matrix, regression/repro discipline, screenshot/video acceptance packs.
- **Privacy/trust reviewer:** data minimisation, provider identity claim checks, local-first integrity.

One person can hold several hats, but no stage should skip the acceptance criteria owned by that hat.

## Core performance budgets

Initial target budgets must be measured against real asset builds, not promised from code alone:

| Category | Target |
|---|---|
| Portal | immediate readable entry; no Babylon/Three bundle before a mode choice |
| City Overview | responsive map interaction on 4 GB-class Android baseline |
| Immersive Work Mode | 30 FPS low tier, 45–60 FPS mid/high tier, adaptive quality without hidden state loss |
| Spatial Command Space | 30 FPS supported-device floor with quality tiers; dispose GPU/scene resources on navigation |
| Hero mesh | one close-detail hero only near camera; LOD/crowd instancing for distant actors |
| Textures | compressed/atlas plan, no unbounded 4K texture intake |
| Audio | user-tap start, stem streaming/looping plan, no surprise loudness |
| Route proof | all City routes resolve cleanly; no redirect loop or stale copy |

## Self-critique and corrections

### Flaw: “AAA” language creates a false promise

A browser project with code-only geometry will not become AAA merely by adding shaders. **Correction:** define success as “premium web vertical slice,” make asset quality visible, and do not call it AAA until authored assets, devices and real evidence prove it.

### Flaw: two engines can create duplicate work and inconsistent City state

**Correction:** one landmark registry, one safe City state, one visual status contract, and explicit ownership: Babylon = embodied work journey; Three.js = composed command space.

### Flaw: provider avatars can mislead users

**Correction:** provider identity is opt-in, visual work state is receipt-bound, and wording says “local recorded work state,” not “AI is working for you.”

### Flaw: art-heavy scenes can destroy mobile usability

**Correction:** asset budgets and quality tiers are blockers at intake. City Overview receives equal craft, not a leftover fallback.

### Flaw: gamification can make real work feel childish or manipulative

**Correction:** use exploration, clarity, atmosphere and agency—not streaks, loot boxes, artificial scarcity, rewards, currencies, forced quests or fake urgency.

### Flaw: no fixed cutline means endless city scope

**Correction:** lock Neon Command District as the first shippable vertical slice. A second district cannot begin before C-07 acceptance is signed.

### Flaw: a source gate can be mistaken for live evidence

**Correction:** status labels must distinguish source verification, Preview proof, device proof and production proof. No green production statement without an actual probe and visual run.

## Definition of a genuinely impressive first City release

- New users see the Portal first and understand City modes in five seconds.
- The Babylon district has authored visual identity, stable controls, a real companion, a readable map, a detailed room, social atmosphere and one useful work journey.
- Three.js feels like a premium headquarters, not a WebGL dashboard.
- City Overview is fast, beautiful and complete on low-end devices.
- Provider/agent characters are dynamic only when a safe, local, foreground action state supports the visual. No fictional productivity theatre.
- Original art/audio provenance is auditable.
- Mobile, desktop, accessibility and production routes are visually and technically certified.
- No wallet, token, payout, referral, reward, market or commerce mechanics are introduced into the City.
