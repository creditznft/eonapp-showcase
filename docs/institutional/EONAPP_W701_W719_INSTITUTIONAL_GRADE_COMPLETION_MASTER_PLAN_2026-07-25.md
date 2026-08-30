# EONAPP W701–W719 Institutional-Grade Completion Master Plan

**Date:** 25 July 2026  
**CEO authority:** Owner objective is a measured **9.5/10 or better** EONAPP flagship experience, with EON NEXUS, EONCITY, Projects, Atlas, the Command Centre and the Expanse operating as one coherent product.  
**Live baseline:** Cloudflare production at `https://eonapp.ch`, observed W700.9 source commit `afc74c0de5517b4e96891d6d8d6e9f529ef952a3`, candidate digest `c1a2c100726ff85adc0a7ae3cfd060cd81b8b50f861cd9139d68d922dba5055c`.  
**Change rule:** This document authorises planning only. It does not authorise an immediate production mutation or another GitHub Actions run.

---

## 1. CEO executive decision

W700.9 is accepted as a valuable live baseline, but **not as the final 9.5/10 product**. The Core has a credible visual identity, yet the flagship experience remains fragmented: NEXUS looks partly like a rotating 2D interface, Atlas is weak without an active project, Projects repeats continuation state, the Expanse is difficult to enter and does not present itself as the flagship open world, the City feels sparse at macro scale, the camera can expose the world underside, and the Command Centre is not yet the all-in-one operating room.

The CEO decision is therefore:

1. **Freeze broad feature expansion.** No new disconnected modules, pages, economies or speculative systems until the current product becomes coherent and reliable.
2. **Do not rewrite EONAPP from scratch.** Preserve the Cloudflare static + Pages Functions architecture, current local-first data model, existing Babylon engine and existing assets. Incrementally establish canonical authorities and retire duplicated presentation/runtime paths.
3. **Make one product, not three adjacent products.** Chat/EONBOT, Projects/Atlas/NEXUS and EONCITY must share the same project, task, approval, result, route and assistant state.
4. **Make NEXUS the cross-product operating layer.** NEXUS is not decoration, not a second chat and not merely a page overlay. It becomes the responsive visual command field that follows the user across the app and exists physically inside EONCITY.
5. **Make Projects the work authority.** Projects is the canonical place for outcomes, tasks and ordinary work artefacts. Atlas visualises that real state; it never invents activity and never appears dead.
6. **Make the Command Centre the master room.** It must show the live NEXUS, project status, tasks, approvals, outcomes, provider state, Atlas, district status, transport and EONBOT dock in one usable spatial environment.
7. **Make the Core authored and the Expanse bounded-procedural.** The nine Core districts remain curated. The Expanse is streamed, deterministic, diverse and safe to return from. It must not become a giant initial download or an unbounded promise.
8. **Quality is proven in a browser, not inferred from source gates.** A 9.5 score requires owner-device recordings, headed browser proof, performance measurements, accessibility proof and exact live provenance.
9. **No GitHub Actions dependency for this programme.** Work, tests and builds happen locally first. Cloudflare Preview and production promotion use one frozen candidate only after owner acceptance.
10. **No fake or automatic actions.** No automatic approvals, provider calls, posting, payment, navigation, microphone, camera, project completion, population claims or work execution.

---

## 2. Deep audit evidence

### 2.1 Owner-video findings

The three owner recordings were re-extracted in this session and reviewed at regular timestamps.

#### EONCITY recording

The Core visual language is clearly improved: neon architecture, a readable central apparatus, NPCs, EONBOT, terminals, district panels and a functional HUD are visible. The video also confirms the main weakness: most productive actions appear as conventional modal panels placed over the world. The Command Menu, City Nexus Continuity, terminal interaction and review-route panels interrupt the spatial experience rather than feeling like parts of one master operating environment.

The recording does not demonstrate a discoverable, successful Expanse entry. Wide views show large unused areas and disconnected-looking structures. The later overhead views expose the macro-composition problem: the central scene is interesting, but the surrounding city does not yet read as a complete metropolis.

#### Projects and NEXUS recordings

The Projects page repeats project continuation and active-context information. When NEXUS opens, the central visual has motion and visual depth cues, but the interaction remains a flat DOM composition with rotate/zoom controls rather than a convincingly manipulable 3D workspace. The fixed right panel and central graphic do not recompose strongly enough across the recorded dimensions.

Atlas can be opened when a project exists, but the flow is not self-explanatory and the no-project case is effectively a dead end. The follow-up recording shows the handoff from NEXUS to Chat and then EONCITY, but it does not preserve a clearly visible work object through a continuous spatial journey.

### 2.2 Live-production findings

- The live City is serving the W700 release and identifies the current commit/candidate in its shell.
- The separate candidate-provenance file still describes its schema/wave as W641 even though it contains the W700.9 commit. This is operationally confusing and must be corrected in the next release.
- Projects contains three competing continuation/context surfaces before the main work area.
- Atlas deliberately renders a calm empty universe when no project is selected, but gives only a route back to Projects instead of offering create/select/recent-project actions in context.
- Expanse entry currently requires guidance, approach, inspection, closer movement and a separate enter action. This is truthful but too difficult to discover and complete.
- Camera radius and beta are bounded, but restored camera targets are applied without a hard target-Y/world-Y sanitation step. This supports the reported below-surface failure.

### 2.3 Codebase and operational audit

The W700 source has strong evidence discipline but has accumulated institutional maintenance risk:

- Approximately **750 JavaScript files** under `assets/js`, about **189,800 lines**.
- Approximately **721 scripts** and **725 tests** in their respective directories.
- `package.json` exposes approximately **715 npm commands**, creating a high risk of stale or contradictory certification paths.
- The current certifying unit manifest lists **376 current test files**, **47 archived exact assertions** and **12 excluded evidence diagnostics**.
- Large runtime authorities include `eon-city-play-station.js` at roughly 265 KB, `eon-city-play-babylon.js` at roughly 235 KB, the Living Nexus Babylon runtime at roughly 92 KB and `eon-nexus-live.js` at roughly 61 KB.
- The source tree contains **112 GLB files / about 87.2 MB** under both `assets` and `public`, which duplicates the binary payload in the source package. The deployed candidate must prove that only one required copy is shipped.
- Multiple generations of City, NEXUS and evidence modules coexist. Historical evidence is valuable, but current runtime and certification authority must become obvious to a new engineer.

This is not a reason for a rewrite. It is a reason for a controlled canonicalisation phase before adding more surface area.

---

## 3. Final product definition

### 3.1 EONBOT / Home

Home remains the guest-first ChatGPT-like entry. EONBOT is the single assistant identity across Chat, Create, Projects, NEXUS and EONCITY. It can prepare and explain actions, but cannot silently approve or execute them.

### 3.2 Projects

Projects stores one outcome, ordinary tasks, normal notes/outputs and links to local automation drafts. The page becomes a true working surface, not a set of repeated cards. It is the canonical source for Atlas and City project context.

### 3.3 Project Atlas

Atlas is a visual model of real project state. With no project selected, it is an onboarding universe with Create, Recent, Choose and Explore City options. With a project selected, it shows real tasks, results, approvals, conversations and City placements. It never creates fake milestones.

### 3.4 EON NEXUS

NEXUS is one responsive spatial command field with four modes:

- **Pulse:** compact persistent status/action control.
- **Split:** half-window working mode beside the current page.
- **Full:** complete spatial workspace.
- **In-world:** the same state and objects rendered physically inside EONCITY.

The Babylon scene is the primary spatial renderer in Split, Full and In-world modes. A semantic DOM/list projection remains available for accessibility and low-power fallback, but it no longer pretends to be the 3D experience.

### 3.5 EONCITY Core

The Core is a compact authored metropolis containing nine visually and functionally distinct districts. Streets, infill blocks, plazas, transit, skyline and civic infrastructure connect them into one city. The player cannot see below the world or leave valid movement bounds.

### 3.6 Command Centre

The Command Centre is the master room. It contains:

- Live NEXUS core
- Active project and task board
- Approval and review queue
- Verified results/output wall
- Project Atlas wall
- Provider/local-AI status
- EONBOT dock and assistant station
- Transit and district monitoring
- City map and Expanse gateway status
- Reviewed links to specialist districts/tools

It summarises and coordinates; it does not duplicate specialist data stores.

### 3.7 Expanse

The Expanse begins at the physical borders of the Core. Streets and transit corridors visibly continue into it. One clear inspection step reveals a prominent Enter action. The world is deterministic, streamed in bounded cells, regionally diverse, populated by clearly presentational NPC activity, and always provides an immediate safe return.

### 3.8 Realms and My Realm

Realms remain curated experiences connected to the same City scene and state model. My Realm reflects verified outcomes and explicitly chosen transformations, never fake progress.

---

## 4. Institutional 9.5/10 score model

A launch score is awarded only after evidence. The weighted score must be **9.5 or higher**, every category must be **9.0 or higher**, and there must be zero unresolved P0 or P1 defects.

| Quality pillar | Weight | 9.5 acceptance requirement |
|---|---:|---|
| Product clarity and first-run journey | 10% | A new user understands Chat, Projects, NEXUS and City without documentation; one clear primary action per state. |
| Projects and Atlas task success | 10% | Create/select/resume a project and reach a useful Atlas in no more than three obvious actions. |
| NEXUS spatial quality | 12% | Real camera depth, object picking, focus, manipulation and consistent compact/split/full/in-world continuity. |
| EONCITY Core art and navigation | 12% | Continuous metropolis, nine distinct districts, no empty-island appearance, clear wayfinding. |
| Command Centre productivity | 8% | One master room provides usable overview and reviewed entry to all key work systems. |
| Expanse flagship experience | 10% | Discoverable entry, 100% successful transition in repeated tests, diverse regions, safe return. |
| Performance and device adaptation | 10% | Stable target frame rates, bounded memory, quick first playable frame and honest low mode. |
| Accessibility and input | 7% | Keyboard, mouse, touch, screen-reader alternative, reduced motion and 48 px controls. |
| Reliability and persistence | 7% | Projects, settings, receipts and return points survive refresh/update; no state divergence. |
| Security, privacy and truth | 6% | No secret leakage, bypass, fake activity or hidden execution; explicit consent for sensitive actions. |
| Visual and interaction consistency | 5% | Shared typography, spacing, panel hierarchy, responsive rules and one-modal policy. |
| Release and operations | 3% | Exact immutable candidate, correct provenance, rollback, live verification and incident runbook. |

### Mandatory quantitative gates

- No camera or target below the allowed world floor in automated sweeps and owner testing.
- Expanse entry and return succeed in 20/20 repeated desktop attempts and the defined touch matrix.
- No duplicate Projects continuation surface.
- No selected project is required merely to make Atlas visibly useful.
- NEXUS object selection, inspection and primary action can be completed by keyboard, mouse and touch.
- City first playable frame targets: owner laptop under 8 seconds on a normal warm connection; honest low mode under 12 seconds on the selected lower device profile.
- Owner laptop balanced mode target: sustained 50+ FPS in the Core and 45+ FPS in the Expanse during the agreed 10-minute route; low mode must remain at least 30 FPS on the selected weak-device test.
- No unbounded memory growth during a 30-minute Core → Expanse → Realm → Core loop.
- Initial critical City transfer budget target: 10 MB or less compressed on desktop high mode and 4 MB or less for low-mode first play; optional district assets stream afterward.
- Every interactive control has a visible focus state and at least a 48 × 48 CSS pixel touch target where practical.
- Live release metadata shows the exact final wave, commit, candidate digest, build time and rollback authority.

These are programme targets, not current claims.

---

## 5. W701–W719 completion programme

## Phase 0 — W701: Institutional authority, evidence and scope freeze

**Purpose:** Prevent another cycle of coding against the wrong authority or certifying stale expectations.

### Work

- Freeze W700.9 production as the comparison baseline.
- Create a local W701 institutional branch from the exact live source authority.
- Generate exact source, lockfile, asset and route manifests.
- Create a timestamped owner-video issue ledger and screenshot baseline.
- Establish one defect register with P0/P1/P2/P3 severity, owner, status and proof requirement.
- Record canonical runtime authorities for App Shell, EONBOT state, Projects state, NEXUS, City, persistence, billing and release identity.
- Mark superseded exact-copy tests and obsolete runtime variants as non-certifying; do not delete history.
- Freeze new feature proposals until W718 acceptance.

### Exit gate

Every planned edit maps to a verified defect or acceptance requirement. A new engineer can identify the current runtime, tests and release command without reading hundreds of historical wave files.

---

## Phase 1 — W702–W703: Canonical architecture and world safety

### W702 — Canonical state and runtime boundaries

- Define one typed/JSDoc state contract for conversation, project, task, approval, result, provider route, City location and selected work object.
- Make adapters project this state into Pulse, NEXUS, Atlas and City.
- Prohibit duplicate stores and implicit cross-page state reconstruction.
- Add a single reviewed Action Gateway for navigation and work actions.
- Split the largest City/NEXUS authorities by responsibility without changing observable behavior.
- Expose a concise current certification command set while retaining historical scripts as non-certifying evidence.

### W703 — Camera, collision and world-boundary safety

- Hard clamp camera target Y, camera world Y, radius and beta every frame.
- Sanitize restored camera states and all City/Realm/Expanse transition poses.
- Add ground underside/void occlusion and terrain-edge shielding.
- Enforce player and click-move bounds across the complete Core and streamed worlds.
- Add reliable unstuck/recovery without teleporting users unexpectedly.
- Add regression tests and recorded sweeps for Core, gateway, Expanse, Realm and return paths.

### Exit gate

No below-ground/void view, no invalid restored pose, no state divergence and no second work/assistant store.

---

## Phase 2 — W704–W705: Projects and Atlas become a real work system

### W704 — Projects command workspace

- Replace the three continuation surfaces with one compact Resume strip.
- Create one selected-project workspace with outcome, tasks, artefacts, automations, activity and safe export.
- Use progressive disclosure for boundary/legal explanations so the work surface stays primary.
- Add clear empty-state creation and first-task guidance.
- Make layout responsive from narrow mobile through ultrawide desktop.
- Preserve local/private truth and encrypted-backup separation.

### W705 — Project Atlas onboarding and continuity

- Atlas always opens visibly.
- No-project mode: Create Project, Choose Recent, Browse Projects, Explore City Map.
- Selected-project mode: real objects, relationships, approvals, results and City placements.
- Preserve the selected work object across NEXUS → Atlas → City → specialist → result → return.
- Add a semantic list/table projection for accessibility.
- Eliminate no-op buttons and unclear clicks.

### Exit gate

A first-time user can create a project, add a task, open Atlas, select that task and review its City handoff without leaving the guided flow or encountering an empty dead end.

---

## Phase 3 — W706–W708: Professional three-dimensional EON NEXUS

### W706 — Babylon spatial command engine

- Promote Babylon Living Core to the primary NEXUS renderer for Split, Full and In-world modes.
- Render real work objects with depth, stable layout, edges, selection, focus and status.
- Add camera orbit, zoom, pan/focus and object picking with safe limits.
- Retain a lightweight semantic/fallback renderer for low devices and accessibility.
- Do not create a second engine/render loop when mounted inside EONCITY.

### W707 — Responsive modes and multimodal control

- Create formal compact, split, full and in-world layout contracts.
- Auto-fit based on viewport and content, not fixed percentages.
- Simplify the visible command set to three primary actions plus contextual More.
- Support mouse, keyboard and touch equally.
- Voice is press-to-start and gestures are optional local controls with explicit camera consent.
- Add undo/redo for object manipulation and an obvious Reset View.

### W708 — NEXUS/EONBOT continuity

- One EONBOT identity and status across all surfaces.
- Selected project/work object remains visible when moving between modes and routes.
- In-world NEXUS uses the same state, not a decorative duplicate.
- Add truthful active/ready/waiting/failed/offline presentation.
- Ensure a small NEXUS panel remains useful rather than becoming a compressed version of the full screen.

### Exit gate

Independent reviewers describe NEXUS as a real responsive 3D command environment, not a rotating 2D diagram. All modes share exact state and provide equivalent core actions.

---

## Phase 4 — W709–W712: Command Centre, complete metropolis and flagship Expanse

### W709 — Master Command Centre

- Build a spatial master room around the live NEXUS.
- Add project/task/approval/result boards, Atlas wall, provider/local-AI status, district monitor, transit control and EONBOT dock.
- Use existing premium assets such as the command seat, terminals, hologram navigator and docking station.
- Make all work entry review-first and keep only one active work surface at a time.
- Provide a calm overview state and deeper inspect state.

### W710 — Continuous Core metropolis

- Replace disconnected-island macro composition with one continuous city ground and street hierarchy.
- Add deterministic infill blocks, alleys, plazas, parks, utility structures, transit infrastructure and three skyline depth layers.
- Fill visual gaps without covering important paths or exhausting the draw-call budget.
- Keep the nine district belts visibly distinct through architecture, lighting, signage, NPC role and ambient activity.
- Improve building silhouettes with the existing asset library before commissioning any new model.

### W711 — District usefulness and living systems

- Give every district one obvious purpose, one signature interaction and one specialist operator.
- Make NPC idle/guide/console/walk behavior credible; Pathfinder never appears lifeless for long.
- Make EONBOT curious and nearby without obstructing the player.
- Add bounded transport, weather and ambient systems with reduced-motion alternatives.
- Make terminals look and behave like physical City devices rather than generic modals.

### W712 — Expanse gateway and open-world completion

- Show the Expanse as a permanent visible objective from normal Core play.
- Extend border roads and transit routes physically through the gateway.
- Use one inspect/review step, then a large unmistakable Enter action within a forgiving radius.
- Add transition feedback, arrival framing and immediate safe return.
- Improve macro-region identity, architecture, skyline, road hierarchy, discoveries, population and activity.
- Add a useful map showing current cell, Core, return point, discovered cells and visible horizon.
- Keep streaming deterministic and bounded; no enormous initial payload.

### Exit gate

A user can understand the City from a wide view, identify the Command Centre and Expanse, enter the Expanse reliably and return without confusion or visual breakage.

---

## Phase 5 — W713–W714: Whole-EONAPP integration and trust

### W713 — Cross-route product coherence

Audit and unify Home, Create, Projects, Library, Vault, Automations, Local AI, Billing, Support and City:

- Shared shell hierarchy, typography, spacing, responsive rules and NEXUS behavior.
- One selected project and one EONBOT state across routes.
- No repeated banners, competing floating controls or dead actions.
- Clear placement of ordinary work, reusable content and sensitive Vault data.
- Creator outputs can be intentionally attached to Projects/Library without hidden publishing.
- Local AI/provider setup uses clear saved/verified/error states and does not lose keys during account transitions.

### W714 — Identity, billing, referral and operational truth

- Verify Google sign-in/session/logout/account deletion surfaces.
- Verify Dodo checkout/trial/plan-change/webhook/portal boundaries without altering live products or secrets during development.
- Preserve server-side entitlement authority.
- Keep EONKEY/referral claims limited to certified feature unlocks.
- Remove any confusing legacy marketplace/earnings/NFT language from active routes.
- Verify Support, privacy, terms and data-custody copy against actual behavior.

### Exit gate

EONAPP feels like one product from guest Chat through authenticated City. Commercial and identity claims match real server behavior.

---

## Phase 6 — W715–W717: Performance, accessibility, security and maintainability

### W715 — Performance and asset engineering

- Measure real critical-route transfer, parse, render, frame time and memory.
- Lazy-load district/NPC assets according to visible residency.
- Establish one canonical binary asset store and build-copy process; prove duplicates are not shipped.
- Enforce per-asset, first-playable and session-stream budgets.
- Add high/balanced/low quality profiles and automatic safe degradation.
- Test service-worker update, stale-cache recovery and offline fallback.

### W716 — Accessibility, internationalisation and input

- Keyboard-only flow across every key journey.
- Screen-reader semantic alternatives for NEXUS, Atlas and City controls.
- 48 px touch controls, focus visibility, contrast, reduced motion and captions/text equivalents.
- Validate supported languages for clipping, direction, overflow and voice availability truth.
- Test desktop, tablet and mobile landscape/portrait layouts.

### W717 — Security, privacy and certification simplification

- Secret scan, dependency audit, CSP/headers, OAuth/session, Pages Functions and D1 access review.
- Threat-model project handoffs, Vault, provider keys, referrals and payment callbacks.
- Reduce current top-level certification to a small explicit suite: source authority, current unit, integration, build/smoke, browser, security and release.
- Keep historical tests in an explicit non-certifying archive with manifest and reason.
- Add current architecture, runbook and incident-response documentation.

### Exit gate

No high-severity security finding, no uncontrolled asset/performance regression, complete accessibility matrix and a certification system an external engineer can operate.

---

## Phase 7 — W718: Independent certification and owner acceptance

### Required proof

1. Clean local install using Node 22 and exact lockfile.
2. Current certifying unit/contract suite.
3. Production build, full Pages root, Functions routing and smoke tests.
4. Headed Chromium, Firefox and Edge journeys.
5. Owner Windows laptop recording matrix.
6. Mobile/tablet proof for shell, Projects, NEXUS and City fallback/control layout.
7. 30-minute performance/memory route.
8. Accessibility and reduced-motion proof.
9. Security and secret-scan receipts.
10. Independent scorecard with evidence for every 9.5 pillar.

### Owner acceptance videos

- Guest Chat → sign-in → City
- Create/resume project → Atlas → select work object
- NEXUS compact → split → full → in-world continuity
- Command Centre complete tour and reviewed action
- Core wide map, all nine districts and transit
- Expanse discover → inspect → enter → discovery → return
- Realm → My Realm → Core return
- Projects persistence after refresh and app update
- Low-mode/reduced-motion recovery

### Exit gate

Owner approves the candidate and every score pillar is at least 9.0, weighted score at least 9.5, zero P0/P1 defects and all evidence is stored locally in the release package.

---

## Phase 8 — W719: Immutable Cloudflare release and stabilisation

### Release procedure

- Freeze one exact source commit and one exact `dist` + Pages Functions root.
- Record SHA-256 for source, lockfile, output tree and candidate.
- Upload the source to the private release branch with CI-skipping controls; do not run GitHub Actions.
- Deploy the frozen root to a Cloudflare Preview.
- Verify Preview identity, OAuth, Functions, Projects, NEXUS, City, Expanse, Billing read paths and cache update.
- Promote the **identical frozen root** to production.
- Verify `eonapp.ch`, release provenance, API reachability and service-worker activation.
- Preserve the immediate rollback deployment and rehearse rollback.
- Keep the PR draft/unmerged until live owner acceptance is complete.

### Stabilisation

- 24-hour and seven-day live observation.
- Record client-visible failures without collecting private project or prompt content.
- Fix only P0/P1 regressions in the stabilisation window; defer new features.
- Produce final source ZIP, Git history bundle, evidence package, checksums, deployment IDs, rollback runbook and owner handover.

---

## 6. Execution sessions

The programme is intentionally bundled to remain efficient while retaining institutional controls.

| Session | Waves | Primary outcome |
|---|---|---|
| Planning session | This document | Final CEO scope, score model and programme authority. |
| Session 1 | W701–W703 | Exact authority, canonical state/runtime and camera/world safety. |
| Session 2 | W704–W705 | Professional Projects workspace and always-useful Atlas. |
| Session 3 | W706–W708 | Real responsive 3D NEXUS with one EONBOT/state contract. |
| Session 4 | W709–W711 | Master Command Centre, continuous Core and useful districts. |
| Session 5 | W712 | Complete flagship Expanse entry, streamed world and return. |
| Session 6 | W713–W714 | Whole-app cohesion, identity/commercial truth and provider UX. |
| Session 7 | W715–W717 | Performance, accessibility, security and maintainable certification. |
| Session 8 | W718 | Full local/browser/device/owner certification and final score. |
| Session 9 | W719 | Exact Cloudflare Preview/production release and stabilisation. |

A session may contain multiple local commits, but each session produces one coherent source package, manifest, changed-file report and test receipt. No session is considered complete merely because code compiles.

---

## 7. Critical user journeys to certify

### Journey A — New user value

Home → ask EONBOT → save/create project → add first task → open NEXUS → see the task → open Atlas → enter City with reviewed context.

### Journey B — Productive City

Orientation Hall → EONBOT guidance → Command Centre → inspect project/task → review specialist route → perform the native app action → return with verified outcome visible.

### Journey C — Expanse flagship

See Expanse objective → follow physical road → inspect gateway → explicit Enter → discover region/landmark → record private Atlas point → explicit safe return to Core.

### Journey D — Cross-surface continuity

Select a real work object in Projects → NEXUS Split → NEXUS Full → Atlas → In-world NEXUS → specialist district → return to Projects with the same object and no duplicate state.

### Journey E — Recovery and trust

Refresh/update/offline/reconnect → project/settings/receipts remain intact → no secret/provider key appears in ordinary exports → user can recover via Vault without fake cloud-sync claims.

### Journey F — Commercial truth

Review plan/trial → Dodo checkout route → entitlement status → upgrade/downgrade/cancel portal → no client override and no misleading EONKEY value claim.

---

## 8. Definition of done

EONAPP is complete for this institutional launch when:

- The product identity is obvious within the first minute.
- Projects, Atlas, NEXUS and City are one stateful journey.
- NEXUS is genuinely spatial and responsive.
- Command Centre is a useful all-in-one master room.
- The Core reads as a complete metropolis, not disconnected islands.
- The Expanse is discoverable, functional, diverse and safe.
- No camera/world underside glitch is reproducible.
- Every visible action works or clearly explains why it is unavailable.
- The owner-device evidence matrix passes.
- Performance, accessibility, security, persistence and release evidence pass.
- The live origin reports exact current provenance and has a proven rollback.
- The independent weighted score is at least 9.5/10 with no category below 9.0.

Until all of these are true, the source can be described as progressing or candidate-ready, but not institution-grade complete.

---

## 9. Immediate next action

The next coding session begins with **W701–W703 only**: reconstruct the exact live W700.9 source authority locally, establish the defect/evidence ledger and canonical runtime map, then repair camera/world safety and state boundaries. No visual expansion, Cloudflare mutation or GitHub Actions run should occur before those foundations pass.
