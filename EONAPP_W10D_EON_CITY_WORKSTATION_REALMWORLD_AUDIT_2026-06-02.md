# EONAPP Wave 10D — EON City Workstation + RealmWorld Commerce/NPC Life Audit

Date: 2026-06-02  
Workspace base: W10C EON City + RealmWorld end-to-end static metaverse backup  
Mode: pure coding only; no Vite build, no npm install, no deploy, no live-site assumption

## Executive decision

EON City is now more than a public showroom. It is the default bundled metaverse workstation for every user.

Users do not need to own a personal realm to work inside the metaverse UI. Every visitor enters EON City and receives a private local workstation deck inside the city. That private deck exposes EONBOT, AI Chat, Workbench/Cockpit, Vault, Market, Mission Monitor, and Realm Builder rails.

Personal realms still exist for owners who want their own land/world. EON City is the official in-house world shipped with the app bundle and updated by normal app deployment.

## Product model after this pass

### EON City

- Official EON Team default realm.
- Bundled static world, not Arweave-required.
- Updated by app releases, not live game-state mutation.
- Shows Genesis NFT monuments and EON Team product districts.
- Includes offline animated NPC life so a fresh visitor sees activity immediately.
- Includes a private workstation deck for every user.
- Commerce routes to the EON Team treasury for official EON City products/loot intents.

### Private workstation inside EON City

Each user receives a local private workstation layer:

- AI Command Desk → `/chat.html`
- Agent Workbench → `/eon-browser.html`
- Vault Console → `/vault`
- Market Terminal → `/market`
- Realm Builder Pad → `/realmworld.html#my-realm`
- Mission Monitor → `/workbench.html`

This layer is private-device-only. It is not embedded into the official city public snapshot and is not synced to a central game server.

### NPC city life

NPCs now get an offline deterministic life layer:

- preset actions only
- simulated walking/patrol positions
- no public free-text chat
- no user uploads
- no server controller
- no Cloudflare Worker game-state dependency

This gives immediate metaverse feeling even before real P2P users exist.

### P2P/multiplayer decision

Real users should not be auto-public at launch. The safe path is:

1. NPCs create default life in EON City.
2. P2P ghost presence remains invite-first.
3. Public-listed mode stays owner-approved/static metadata only.
4. Max four peers.
5. Preset emotes only.
6. No public chat.
7. No uploads.

This avoids moderation-heavy MMO problems while preserving a cool future multiplayer rail.

### Owner-wallet commerce decision

Commerce is now explicitly realm-aware:

- In official EON City, product/loot purchase intents route to the EON Team treasury wallet.
- In user-owned realms/land, purchase intents route to the land owner wallet, not EON Team.
- User-owned realm commerce requires a valid owner wallet before live purchase is enabled.
- Lootbox purchase intents must remain utility/entertainment-only and must not promise resale value, profit, or investment returns.
- Commerce helpers do not create Cloudflare Worker game state.

## Files changed

### New files

- `assets/js/utils/realmworld-workstation.js`
- `assets/js/utils/realmworld-npc-life.js`
- `assets/js/utils/realmworld-commerce-routing.js`
- `tests/unit/realmworld-workstation-commerce.test.mjs`

### Updated files

- `realmworld.html`
- `assets/css/realmworld.css`
- `assets/js/realmworld-page.js`
- `assets/js/utils/eon-city-realm.js`
- `tests/unit/realmworld-route-safety.test.mjs`
- `sw.js`
- `public/sw.js`

## Key code changes

### 1. EON City private workstation

Added local workstation helpers that build a private device-only layer for every user inside EON City. The layer is not public snapshot data and does not require a user to own a personal realm.

### 2. Workstation map nodes and UI panels

RealmWorld now renders:

- private workstation hub node
- six private module nodes
- side-panel workstation cards
- exportable workstation session JSON

Double-click/tap on workstation module nodes opens the matching app surface without changing public city state.

### 3. Offline NPC city life

Added deterministic NPC life helpers that move/animate preset NPCs around the city. This is a local visual/simulation layer, not a server stream.

### 4. Realm-aware commerce routing

Added commerce helpers that resolve correct payment receiver:

- EON City → EON Team treasury
- user-owned realm → owner wallet

Added lootbox purchase intent export with no investment promise and no server game-state dependency.

### 5. EON City source data expanded

EON City now includes:

- Private Workstation Deck district
- My Private Workspace portal
- Workspace Concierge NPC
- official city flags for private workstation and NPC life
- renderer phase metadata including private-workstation and npc-life

### 6. Service worker cache update

Service worker versions bumped to v38 and new RealmWorld utility modules were added to precache.

## Validation run

No build was run. No npm install was run. No deploy was run.

Passed:

```bash
node --check assets/js/realmworld-page.js
node --check assets/js/utils/realmworld-workstation.js
node --check assets/js/utils/realmworld-npc-life.js
node --check assets/js/utils/realmworld-commerce-routing.js
node --check assets/js/utils/eon-city-realm.js
node --check sw.js
node --check public/sw.js
node --test tests/unit/eon-city-realm.test.mjs tests/unit/realmworld-workstation-commerce.test.mjs tests/unit/realmworld-export-rails.test.mjs tests/unit/realmworld-generator.test.mjs tests/unit/realmworld-lootbox-economy.test.mjs tests/unit/realmworld-p2p.test.mjs tests/unit/realmworld-renderer.test.mjs tests/unit/realmworld-route-safety.test.mjs
node scripts/site-audit.mjs
node scripts/launch-page-invariants.mjs
node scripts/launch-readiness.mjs
```

Results:

- Focused RealmWorld tests: 25/25 passed
- Site audit: passed
- Page invariants: 0 blockers, 0 warnings
- Launch readiness: 0 blockers, 0 warnings

Not run by design:

```bash
npm ci
npm run build
npm run smoke:build
npm run test:unit
npm run dev
```

## Current RealmWorld score

| Area | Score |
|---|---:|
| EON City default world concept | 9.0 / 10 |
| Private workstation concept | 8.6 / 10 |
| Static/local-first safety | 8.8 / 10 |
| NPC launch experience | 7.8 / 10 |
| Commerce routing architecture | 7.8 / 10 |
| Visual/renderer maturity without browser QA | 7.4 / 10 |
| Overall RealmWorld flagship beta readiness | 8.2 / 10 |

## Remaining RealmWorld work before calling it flagship-finished

1. Browser QA on desktop and mobile.
2. Tap/gesture polish on real phones.
3. Visual tuning after seeing the actual map render.
4. Confirm all module routes exist in deployed build.
5. Decide exact checkout rail for EON City products.
6. For user-owned realm commerce, require signed owner wallet verification before showing live purchase buttons.
7. Build real P2P signaling/invite UI later, still no public chat/uploads.
8. Add optional real WebGL/Three.js/Babylon mode later only if bundle size remains safe.

## CEO launch stance

RealmWorld can now be presented as:

> EON City — a bundled AI metaverse workstation where every user can work with EONBOT, access app tools, browse Genesis products, meet NPCs, and later create or publish their own local-first realm.

Do not market it as a full MMO yet. Market it as a local-first metaverse workstation and official EON Team city.
