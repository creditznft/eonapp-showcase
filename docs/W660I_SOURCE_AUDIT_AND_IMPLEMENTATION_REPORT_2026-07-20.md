# W660I source audit and implementation report

**Prepared:** 2026-07-20  
**Baseline authority:** deployed W660H commit `f13bf91e3fb60eff1757e34aab7c98eb6d38a7c8`  
**Verified source archive SHA-256:** `24299bd4b711e96360b1d4fa15fdfec427963ecd2fcd9d2f59e5914e3be02a9a`  
**Production action:** none  
**Release state:** source/build candidate only; immutable Preview and headed acceptance remain required.

## 1. Verified authority and workspace

The takeover ZIP hash matched the handover exactly and was extracted into a clean workspace. The source archive identifies the deployed W660H authority. No `.git`, `.env*`, credentials, installed dependencies, browser profiles, or untracked local artifacts were used as source authority.

The W660I work is a focused repair wave on top of that baseline. It does not broadly rewrite unrelated EONAPP routes and does not deploy to Cloudflare.

## 2. Runtime architecture map

### Babylon/WebGL owner

- `assets/js/city/eon-city-play-core.js`
  - creates the single Babylon `Engine`;
  - owns the single City canvas and render loop;
  - owns the main scene, camera and player lifecycle;
  - passes existing scene/camera/player references into the productive layer.

### City entry surfaces and input

- `assets/js/eon-city-play-station.js`
- `assets/js/city/eon-city-access-station.js`
- `assets/js/city/eon-city-input-contract.js`

Both entry surfaces now use one shared directional-input contract.

### District truth, streaming and composition

- `assets/js/city/w660i/eon-city-w660i-district-config.js`
  - canonical nine-district labels, centers, arrivals, cameras, palettes, landmarks, active asset groups, terminals and skyline identities.
- `assets/js/city/w660i/eon-city-w660i-district-composition.js`
  - district-specific procedural composition fallback inside the existing Babylon scene;
  - owns no engine, canvas or render loop;
  - disposes the previous district root before activating the next.
- `assets/js/city/w649/eon-city-w649-district-runtime.js`
  - existing asset residency/streaming authority, extended for the procedural Command Centre composition.
- `assets/js/city/w659n/eon-city-w659n-product-layer.js`
  - review-first travel, district switching, arrival receipts, proximity interactions and UI identity.
- `assets/js/city/w659f/eon-city-w659f-transport-runtime.js`
  - review/confirm/cancel travel contract and canonical destinations.

### Productive terminals

- `assets/js/city/w660i/eon-city-w660i-terminal-registry.js`
  - 24 visible, review-first product terminals;
  - minimum two per district;
  - routes to existing EONAPP workflows rather than inventing duplicate stores.

### City Nexus

- `assets/js/city/w660/eon-city-w660-nexus-stations.js`
  - exactly nine visible station definitions;
  - exactly one station per playable district;
  - proximity and review-first action truth.

### Global EON NEXUS

- `assets/js/nexus/eon-nexus-pulse.js`
- `assets/js/nexus/eon-nexus-app-shell.js`
- `assets/js/nexus/eon-nexus-chat-pulse.js`
- `assets/js/chat-page-deferred.js`
- `assets/css/eon-nexus-pulse.css`

These modules expose one visible accessible Nexus open control, route-specific surface truth, minimize/expand/full-screen behavior and immediate post-shell installation.

## 3. Exact source-authority counts

The W660 completion matrix validates:

- playable districts: **9**;
- City Nexus stations: **9**;
- effective City assets: **34**;
- functional replacement assets: **6**;
- effective/product-bound character assets: **14**;
- W660I productive district terminals: **24**, with at least two per district.

These are source and emitted-build counts. Physical visibility, scale, clipping, animation and lighting still require headed Preview inspection.

## 4. Root-cause findings

### P1 — touch Move right exited EONCITY

The visual D-pad emitted `up` and `down`, while the runtime movement contract consumed `forward` and `backward`. The touch controls also lacked one hardened shared boundary for button type, default navigation, shell propagation, pointer hold and cancellation. In a shell/form/navigation context, the default action could escape `/eoncity`.

Repair:

- normalize `up/down` to `forward/backward`;
- force `type="button"`;
- prevent default navigation and stop shell propagation;
- unify pointer/touch/keyboard activation;
- implement press-and-hold plus release on pointer up/cancel/lost capture, blur and document hiding;
- use the same contract at both City entry surfaces.

### P1 — Command Centre still looked like Orientation Hall

The confirmed travel path updated travel/station state and teleported the player, but it did not command a district composition authority to unload the prior world, activate a target asset group, change landmark, lighting, camera and skyline, then wait for residency before declaring arrival.

Repair:

- introduce one canonical district configuration authority;
- activate the target procedural composition inside the existing Babylon scene;
- dispose the previous district root;
- await district asset residency;
- move player and camera;
- change lighting, fog, palette, signature landmark, paths, terminals and skyline;
- expose active district/landmark/asset-group runtime datasets;
- issue arrival only after the target world transition has completed.

### P1 — homepage Nexus was not visibly actionable

The Nexus region existed semantically, but the shell installation was deferred to idle time and the visual trigger did not expose a sufficiently explicit labeled action/z-order contract across shell layouts.

Repair:

- mount the dynamic Nexus surface immediately after shell boot;
- expose one labeled accessible button with a stable `data-eon-nexus-open-control` contract;
- position it above ordinary composer/sidebar layers but below open Nexus/modal layers;
- hide the pulse while the live surface is open;
- retain open, minimize, expand, explicit full-screen, desktop double-click, mobile swipe-up and reduced-motion behavior.

## 5. Nine-district completion authority

1. Orientation Hall — onboarding, device guidance, missions and EONBOT introduction.
2. Transit Network — routes, travel review and district navigation.
3. Agent Theatre — agents, proposals, receipts and review-first operations.
4. Creator Atrium — projects, creator capture and sharing review.
5. Forge Basilica — coding, builds, debugging and Forge workflows.
6. Command Centre — operations, system state and automations.
7. Archive Canopy — Library, research and saved knowledge.
8. Vault Station — local custody, backup/recovery boundaries and Vault functions.
9. Trade Dome — membership, referrals and EONKEYS.

Each canonical district now has a unique signature landmark, active asset group, arrival pose, camera, palette/lighting, skyline, visible Nexus station and at least two real product terminals.

## 6. Architecture, privacy and product boundaries preserved

- one Babylon engine owner;
- one City canvas;
- one City render loop;
- no second chat store;
- no second project store;
- no automatic proximity travel;
- travel remains review/confirm/cancel;
- no automatic AI execution;
- no automatic voice/camera capture;
- no automatic media upload or social sharing;
- no real checkout completion in tests;
- EONKEYS remain product rewards/unlocks, not cryptocurrency;
- Google login remains the full-City identity boundary;
- Cloudflare Pages/Functions compatibility is preserved.

## 7. Changed-file scope

The focused wave changes:

- City touch/input boundaries;
- City core-to-product-layer integration;
- district configuration, composition and residency activation;
- transport destination truth;
- productive terminal registry and proximity interactions;
- City Nexus station mapping;
- global Nexus discoverability and shell installation;
- compact City shell presentation;
- source, unit and emitted-build gates;
- certification receipts.

It does not modify payment execution, customer data, authentication providers, production deployment configuration or unrelated application workflows.

## 8. Certification completed locally

Completed and passing:

- W660I source gate: **28/28**;
- W660I unit tests: **7/7**;
- W660F City Nexus gate/tests;
- W660G and W660H source/tests;
- W659N Productive City source chain/tests;
- complete W660 release source chain;
- ESLint with zero warnings;
- workspace secret scan;
- production build;
- build smoke;
- all **68** emitted City asset variants;
- emitted W660I district, terminal, touch and visible-Nexus markers.

## 9. Browser-proof status

A local real-WebGL proof was attempted and is **BLOCKED**, not passed. The available system Chromium is governed by an administrator `URLBlocklist` that rejects the localhost fixture with `ERR_BLOCKED_BY_ADMINISTRATOR`. Playwright's bundled browser was absent, and this isolated runtime could not download it because external DNS/network access was unavailable.

The report is retained at:

`reports/w659n-productive-city/browser-proof/W660_PRODUCTIVE_CITY_LOCAL_BROWSER_PROOF.json`

It contains zero physical checkpoints and makes no headed, device, permission, recording, checkout, sharing, Preview or production claim.

## 10. Required next execution boundary

Codex should not write source code. After receiving the exact packaged W660I commit, it should only:

1. verify commit and archive checksum;
2. run the named maintained gates;
3. deploy one immutable Cloudflare Preview;
4. perform headed desktop/mobile acceptance;
5. traverse all nine districts and inspect all nine Nexus stations;
6. test touch route retention and actual player movement;
7. inspect the 14 character assets and 34 effective assets for visibility/scale/clipping/animation;
8. capture screenshots/video/performance/network evidence;
9. return an issue register;
10. make no production change until explicit approval.
