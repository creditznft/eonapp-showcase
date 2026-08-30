# EONAPP Wave 10C — EON City + RealmWorld End-to-End Static Metaverse Pass

Date: 2026-06-02  
Mode: pure coding/static audit only; no Vite build, no deployment, no live-site assumptions.

## Executive decision

RealmWorld now has two world modes:

1. **EON City / Official EON Team Realm** — default bundled world shipped inside the app. It is the fixed official meeting point, Genesis collection showroom, product city, portal hub, and EON Team realm. It is not Arweave-dependent and does not require a Cloudflare Worker game-state backend.
2. **My Realm** — the user's generated local-first realm. It remains deterministic, localStorage-backed, exportable to JSON/Arweave bundle later, and safe for future P2P ghost visits.

This matches the product direction: EONAPP ships with one strong in-house metaverse world while still letting users generate/export their own realms later.

## What was added

### Official EON City world

New module:

- `assets/js/utils/eon-city-realm.js`

It defines:

- `OFFICIAL_EON_CITY_ID = eon-city`
- `OFFICIAL_EON_CITY_VERSION = 2026.06.02-w10c`
- bundled official city seed
- fixed EON City districts
- fixed EON City NPCs
- fixed EON City portals
- official Genesis NFT monuments
- official EON Team product cards
- admin app-update patch export

EON City properties:

- shipped with the app bundle
- default world mode
- app-update-only change rail
- public meeting point
- product showroom
- Genesis collection showroom
- no Arweave requirement for the official world
- no central game server
- no Cloudflare Worker game-state dependency

### RealmWorld page wiring

Changed:

- `realmworld.html`
- `assets/js/realmworld-page.js`
- `assets/css/realmworld.css`

New UI behavior:

- EON City / My Realm mode buttons
- EON City loads by default
- My Realm preserves generated local realm behavior
- EON City product cards in the side panel
- EONBOT preset guide cards
- land metadata preview
- export storage bundle
- export land metadata
- export QA checklist
- admin-only EON City release controls

### Admin-only city controls

Admin controls are local-preview only. They are intentionally not live server mutation.

Admin controls allow:

- season label preview
- city notice preview
- featured product ID order preview
- app-update patch JSON export
- clear local preview

Important security rule:

> Local admin draft changes do not affect visitors or production. Codex must commit the exported patch into bundled source and redeploy EONAPP so every device receives the same official EON City.

### Arweave/export rail stubs

New module:

- `assets/js/utils/realmworld-arweave.js`

It provides:

- public snapshot safety validation
- storage bundle builder
- export checklist builder

No automatic upload is performed. No fetch/backend call is added.

### Land/NFT metadata rail stubs

New module:

- `assets/js/utils/realmworld-land-contracts.js`

It provides:

- realm object to land trait mapping
- land metadata builder
- land parcel preview builder

This gives Codex and future smart-contract work a clear static metadata bridge without adding a live chain dependency inside RealmWorld.

### Service worker update

Changed:

- `sw.js`
- `public/sw.js`

Version bumped to `v37` and new RealmWorld utility modules added to precache.

### Tests added

New tests:

- `tests/unit/eon-city-realm.test.mjs`
- `tests/unit/realmworld-export-rails.test.mjs`

Updated:

- `tests/unit/realmworld-route-safety.test.mjs`

The safety test now includes the new EON City, Arweave, and land metadata modules.

## Validation run

Commands run:

```bash
node --check assets/js/utils/eon-city-realm.js
node --check assets/js/utils/realmworld-arweave.js
node --check assets/js/utils/realmworld-land-contracts.js
node --check assets/js/realmworld-page.js
node --check sw.js
node --check public/sw.js
node --test tests/unit/eon-city-realm.test.mjs tests/unit/realmworld-export-rails.test.mjs tests/unit/realmworld-generator.test.mjs tests/unit/realmworld-lootbox-economy.test.mjs tests/unit/realmworld-p2p.test.mjs tests/unit/realmworld-renderer.test.mjs tests/unit/realmworld-route-safety.test.mjs
node scripts/site-audit.mjs
node scripts/launch-page-invariants.mjs
node scripts/launch-readiness.mjs
```

Results:

| Check | Result |
|---|---|
| New syntax checks | Pass |
| Focused RealmWorld tests | Pass — 21/21 |
| Site audit | Pass |
| Page invariants | Pass — 0 blockers, 0 warnings |
| Launch readiness | Pass — 0 blockers, 0 warnings |

## Not run by design

The user explicitly requested pure coding only in this ChatGPT environment.

Not run:

```bash
npm ci
npm run build
npm run smoke:build
npm run test:unit
npm run dev
```

Codex/local machine should run these later after extraction.

## Remaining RealmWorld work before true flagship marketing

RealmWorld is now much stronger, but visual/browser QA is still required before calling it production-finished:

1. Run Vite build locally.
2. Open `realmworld.html` on desktop and mobile.
3. Verify EON City loads by default.
4. Verify My Realm mode still works.
5. Verify canvas mode, ghost 3D mode, minimap, and portal transitions.
6. Verify admin panel only appears for canonical admin wallet profiles.
7. Verify export buttons download JSON files.
8. Verify Market links resolve after routing/build.
9. Verify service worker update does not stale-cache old RealmWorld assets.
10. Check low-end Android performance and tap targets.

## CEO status

RealmWorld should now be treated as:

> **Beta flagship metaverse surface with an official bundled EON City default world.**

It is good enough for internal browser QA and Codex build testing. It should not yet be marketed as a finished MMO, VR world, or live multiplayer platform.
