# W613 — EON City Final Source-Side Red-Team Audit

**Date:** 4 July 2026  
**Baseline:** W612 provenance-hardened sanitized source snapshot  
**Scope:** final source-side critique and polish for the Command Horizon pilot before Codex merge/deploy work.  
**Truth status:** source/test/build evidence only. This is **not** a production, authenticated-browser, physical-device, art-licence, KTX2, or owner-visual approval.

## Executive conclusion

The City now has a coherent, intentionally constrained flagship loop: enter a protected signed-in Play surface, see named landmarks, approach without being auto-routed, explicitly review a destination, and leave through a native product route or return to the stable City. That direction is strong enough to protect during final merge work.

It is **not** honest to call the City finished in the release sense. The decisive unknowns are still live: the authenticated production pointer stack, actual Babylon wall readability, controller/touch behavior, mobile Lite legibility, long-session performance, and human visual approval of the candidate architecture/NPCs.

### Source-only readiness scorecard

| Area | Source audit score | What is now defensible | What remains unproven |
|---|---:|---|---|
| Agency and navigation | 9/10 | Named direct HUD, explicit Review/Guide, no invisible auto-navigation | Actual click/tap/controller behavior in a deployed canvas |
| Camera and wall legibility | 8/10 | W613 fades an eligible local architectural occluder along the camera-to-operator sightline and restores it safely | Real wall scenes, no flicker, no visual leakage, no hit-target regression |
| Landmark architecture | 7/10 | Distinct procedural Command Horizon landmarks; Project District visual profiles avoid copy-paste silhouettes | Approved/licensed art, KTX2/Basis, LOD/collision acceptance, visual director approval |
| NPC/readability | 6/10 | Source-controlled Navigator/EONBOT paths and local direct companion model exist | Natural-motion, face/readability, frame pacing and human quality review |
| Private project districts | 8/10 | Local/sanitized project cards, visual profiles and Command Deck entry; no private content enters world signage | User journey proof, capacity/migration/resume behavior, mobile interaction evidence |
| Voice and Chat | 8/10 | Voice is explicit/captions-first; Chat is named and visible | Browser permission, mic consent, dictation/voice adapter behavior on real devices |
| Sharing | 7/10 | Explicit signed City invite from secondary Menu surface; no tracker, reward, referral or auto-post | Native share/clipboard behavior and user-facing wording on real platforms |
| Accessibility and performance | 6/10 | Source controls for reduced motion/Lite/pause and a calm direct HUD | Keyboard, controller, touch, reduced-motion and Lite captures; performance observations |
| Production readiness | 0/10 | W612 can bind a live proof to an exact build candidate | W600A normal signed-in production run and deployed hash parity remain open |

**Source-side design readiness:** 7.5/10.  
**External proof readiness:** open — do not convert this score into a launch score.

## Red-team findings and decisions

### 1. Wall occlusion was a genuine usability risk — fixed in W613 source

**Finding:** static collision prevented the operator passing through walls but did not prevent a foreground wall from hiding the operator/camera relationship. That can make a polished architecture feel like a control failure.

**W613 decision:** add `eon-city-camera-occlusion.js`, a local visual-only sightline controller. It ray-tests between the active camera and the operator eye point, fades at most three explicitly eligible architecture meshes to a controlled visibility value, and restores every mesh when the view clears, pauses, or destroys.

**Hard guardrails:**

- does not change collision, movement, input axes, routes, landmarks, data, storage or network;
- never fades the operator, Navigator, EONBOT, direct hit volumes, rings, beacons or other intentional interaction signals;
- eligible architecture is opted-in by source metadata, not inferred from user content;
- real renderer evidence is still mandatory because source tests cannot prove material behavior, flicker, wall selection or performance.

### 2. The HUD had historical drift — reconciled rather than adding more buttons

**Finding:** the visual Play surface already used six direct actions, while an older quality-plan test still described a four-button HUD and generic `Interact` language remained in historical planning copy.

**W613 decision:** lock the current direct entry HUD to exactly:

1. **EONBOT**
2. **Voice**
3. **Chat**
4. **Districts**
5. **Command Deck**
6. **Menu**

There is no generic `Interact` action. High-frequency orientation/action choices remain direct; secondary work paths, project portals, route notes and sharing remain in Menu/Command Deck so the screen is not turned into a toolbar.

### 3. Project districts needed distinct architectural language, not wider raw-data exposure

**Finding:** private project districts existed as a local/sanitized model, but their 3D form risked looking interchangeable and too hidden.

**W613 decision:** bind only allowlisted visual profiles to existing safe district palettes:

- Signal Spire — open signal crown and radial deck
- Forge Buttress — structural buttresses and split panels
- Archive Canopy — archive canopy/ring language
- Garden Pavilion — curved garden arcs

The Command Deck now shows an explicit **Private project districts** strip and routes to the existing Project Portals surface. Only reviewed City-safe labels/cards may appear near a 3D portal. Raw project descriptions, prompts, files, keys, private notes and task details remain in the foreground local workspace.

### 4. Sharing should be deliberate, useful and non-extractive

**Finding:** a direct “share/referral” action in the active HUD would create pressure, clutter and an implied incentive system that is not active or release-approved.

**W613 decision:** expose **Share City invite** only in Menu and use the existing signed `city` share target. The action is deliberate, user-initiated and secondary. It does not enable referral tracking, rewards, auto-posting, payment, subscription, wallet or social connection flows.

### 5. Art and NPC ambition must not be overclaimed

**Finding:** the procedural candidates, original silhouettes, lighting and NPC rigs are a good source foundation, but source text cannot establish final art quality, IP clearance, KTX2/Basis packaging, animation naturalness, GPU behavior or “AAA” approval.

**W613 decision:** preserve the candidate source art as a well-scoped pilot, do not add a mass of unvalidated districts/assets in this wave, and require the W608 art pipeline only after the Command Horizon loop is proven playable.

## What W613 changes

- Camera sightline fade/restoration for explicit architectural occluders.
- Safely pickable architecture metadata used only by the camera controller; direct landmark hit volumes remain the interaction mechanism.
- Distinct Project District visual profiles with only sanitised allowlisted profile identifiers.
- Project District Command Deck strip, with its data-safety boundary visible in product UI.
- Secondary signed City invite entry in Menu, with no referral/reward/auto-post activation.
- Updated quality-plan test contract from stale four-action wording to the current named six-action HUD.
- W613 source gate and focused unit test covering the above boundaries.
- Secret-scanner fixture hygiene repair, so the clean handover does not carry a credential-shaped test literal.

## What W613 deliberately does **not** change

- No production deployment or Cloudflare configuration.
- No signed-in session, cookie, browser storage, DevTools or authentication bypass.
- No payment, subscription, wallet, referral, reward, ad, social posting, data relay or analytics activation.
- No new public project world, raw project content rendering, hidden private data transfer or external project sync.
- No final asset approval, KTX2/Basis conversion, final LOD package, live voice conversation, multiplayer or background agents.
- No claim that source tests prove a high-end desktop or low-end mobile visual result.

## Required red-team evidence after deployment

1. **W600A exact build/auth gate:** normal signed-in browser + loopback CDP only; verify provenance/hash parity and Start Here pointer ownership.
2. **Wall pass:** place the camera behind/alongside Command Centre and other eligible architecture; confirm only blocker walls fade, the operator stays readable, collision remains intact, target volumes remain clickable and walls restore cleanly.
3. **HUD pass:** desktop and mobile screenshots confirm the exact named HUD and no generic `Interact`.
4. **Project portal pass:** create/select an existing reviewed local project card, inspect visual profile distinction, open/close the portal surface, refresh/resume, and prove no raw task/private content appears in the world.
5. **Share pass:** invoke Menu → Share City invite; prove explicit user action, safe signed link behavior, no automatic post, no tracking/reward/referral state, and graceful clipboard/native-share fallback.
6. **Control and recovery pass:** keyboard/mouse, controller, touch landscape, mobile Lite, reduced motion, collision/status, Voice/Chat explicit actions, native route enter/return and refresh/resume.
7. **Performance notes:** record observed quality tier and browser/device notes rather than manufacturing a benchmark from source code.

## Remaining release blockers

- W600A authenticated production runner outcome `AUTHENTICATED_CITY_AND_GATE_PROVEN`.
- W607 browser/device gameplay evidence for controls, direct landmark action, camera/collision, Voice/Chat, portal/return and recovery.
- W607 AI owner-authorized real output evaluation.
- W608 approved/licensed City art, KTX2/Basis/LOD and human visual acceptance.
- Mandatory independent product tracks: persistence, commercial/legal/support, privacy/identity, accessibility/mobile, security and final release board.
