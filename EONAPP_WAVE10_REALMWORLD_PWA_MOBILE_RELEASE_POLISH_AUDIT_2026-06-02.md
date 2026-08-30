# EONAPP Wave 10 — RealmWorld, PWA, Mobile, Performance + Release Polish Audit

Date: 2026-06-02  
Workspace base: `EONAPP_W09_REALMWORLD_LEAN.zip`  
Mode: code patch + local validation, no live deploy

## Executive decision

EONAPP should keep **one active game surface only: EON RealmWorld**.

Do not add more mini-games. Legacy game shells may remain as archived/noindexed historical files, but the live navigation, app catalog, PWA shortcuts, sitemap, and game entry routes should point users toward RealmWorld.

## Product direction locked in this wave

RealmWorld should be:

- local-first
- deterministic
- mobile-safe
- exportable as JSON
- Arweave-snapshot ready
- safe by design: no public chat, no uploads, ghost visitors only, preset emotes only
- free of Cloudflare Worker / central game-state dependency for the metaverse loop

Cloudflare Pages can still host the static website. Payments and other existing app backend surfaces can continue to use their own functions/workers where already required. The RealmWorld game state itself should not depend on Cloudflare Workers.

## Code changes made

### 1. One-game strategy

Updated:

- `assets/js/app-data.js`
- `games.html`
- `_redirects`
- `robots.txt`
- `sitemap.xml`

Changes:

- Added `EON RealmWorld` as the only `GAMES` catalog entry.
- Rebuilt `games.html` as a RealmWorld-only landing page.
- Redirected `/game` and `/games` toward RealmWorld.
- Redirected old `/games/cyber-rogue` and `/games/realm-wars-lite` routes to archive.
- Kept old game shells noindexed/archived.
- Added `games.html` to sitemap while keeping old game folders out of robots.

### 2. Navigation polish

Updated:

- `assets/js/utils/site-shell.js`

Changes:

- Added RealmWorld to the shared top navigation so site-shell no longer overwrites it away.
- Added Plans to shared navigation.
- Updated mobile bottom navigation to include World.
- Normalized `/realmworld`, `/realmworld.html`, `/game`, and `/games` as RealmWorld route aliases.
- Added RealmWorld to normalized footer links.

### 3. PWA and service worker cache safety

Updated:

- `manifest.webmanifest`
- `sw.js`
- `scripts/smoke-check-build.cjs`

Changes:

- Bumped service worker cache version to `v35`.
- Added RealmWorld page/assets/helpers to precache.
- Added `games.html` to precache.
- Added RealmWorld shortcut to the PWA manifest.
- Added `games` category to manifest.
- Added network-only navigation bypass for sensitive routes such as admin, subscription, billing, reward-access, API, NOWPayments, and functions paths.
- Kept `/api/` traffic uncached.
- Updated post-build smoke checks to require `realmworld.html`, `games.html`, and a RealmWorld bundle.

### 4. RealmWorld mobile/performance polish

Updated:

- `realmworld.html`
- `assets/css/realmworld.css`
- `assets/js/realmworld-page.js`

Changes:

- Added SEO/Twitter/VideoGame JSON-LD metadata.
- Added a no-worker/decentralized architecture section.
- Clarified that game state is generated on-device and should later publish static snapshots to Arweave.
- Added accessible map role/labels.
- Added active presence-mode button state.
- Added focus-visible styling and reduced-motion handling.
- Improved mobile button/touch layouts.
- Added performance note for low-end/mobile devices.
- Replaced top-level NFT visual engine import with idle-time dynamic import and lightweight fallback SVG cards. This reduces initial RealmWorld route weight and avoids parsing the heavy NFT renderer before the page is usable.

### 5. No-worker P2P policy guard

Added:

- `assets/js/utils/realmworld-p2p.js`
- `tests/unit/realmworld-p2p.test.mjs`
- `tests/unit/realmworld-route-safety.test.mjs`

Behavior:

- Provides explicit RealmWorld network policy helpers.
- Future P2P is framed as WebRTC data-channel later, with manual/owner-approved invite envelopes first.
- Explicitly sets `requiresCloudflareWorker: false` and `requiresCentralGameServer: false`.
- Keeps chat/uploads disabled.
- Enforces max 4 peers.
- Tests assert RealmWorld runtime does not fetch game state, use `/api/`, or require a Cloudflare Worker game-state path.

## Validation run

Passed:

```bash
node --check assets/js/realmworld-page.js
node --check assets/js/utils/realmworld-p2p.js
node --check assets/js/utils/site-shell.js
node --check sw.js
node --test tests/unit/realmworld-generator.test.mjs tests/unit/realmworld-lootbox-economy.test.mjs tests/unit/realmworld-p2p.test.mjs tests/unit/realmworld-route-safety.test.mjs
node scripts/site-audit.mjs
node scripts/launch-page-invariants.mjs
node scripts/launch-readiness.mjs
```

Results:

- RealmWorld-focused tests: 11/11 passed.
- Site audit: passed, 52 HTML files scanned, 3 tools, 1 game, sitemap + precache verified.
- Page invariants: 0 blockers, 0 warnings.
- Launch readiness: 0 blockers, 0 warnings.

## Validation caveat

`npm run test:unit` was also attempted for the whole repository. It failed on pre-existing unrelated test harness issues, including:

- `tests/unit/ai-readiness.test.mjs` failing with `Cannot use import statement outside a module`.
- `tests/unit/xp.test.js` failing with `Unexpected token 'export'`.

Those failures are not caused by the RealmWorld Wave 10 patch, but they mean the full unit-test command is not currently a clean release gate. Codex should either fix those old harnesses or split the release gate into stable targeted suites before final signoff.

Full build was not run in this chat environment because project dependencies were not installed in the extracted workspace. Codex should run `npm ci`, `npm run build`, and `npm run smoke:build` locally before deployment.

## Current score

| Area | Score |
|---|---:|
| One-game product clarity | 9.1 / 10 |
| RealmWorld architecture safety | 8.4 / 10 |
| No-worker game-state discipline | 8.6 / 10 |
| Mobile/PWA readiness | 8.1 / 10 |
| SEO/share polish | 8.0 / 10 |
| Release readiness overall | 8.0 / 10 |

## Remaining blockers before flagship-ready

1. Visual browser QA still required on desktop and phone.
2. `npm ci` + `npm run build` still required locally.
3. Full repo unit-test harness needs cleanup or release-gate split.
4. Arweave upload integration still not wired to the current uploader.
5. Smart-contract land metadata mapping still needs a later audit.
6. P2P WebRTC is not implemented yet; only safe policy scaffolding exists.
7. Live site is still older until this backup is applied and deployed.
8. NOWPayments/live payment tests remain separate from RealmWorld and still need production proof.

## CEO decisions

- Keep RealmWorld as the only game.
- Do not build more mini-games.
- Keep public multiplayer out of launch.
- Keep all RealmWorld public state as static owner-approved snapshots later.
- Do not introduce Cloudflare Worker game-state dependency for RealmWorld.
- Use Cloudflare Pages only as static web hosting for the site shell.

## Next recommended wave

Wave 11 — Deploy/CI/live proof runbook + full local build cleanup.

Scope:

- install dependencies
- run full build
- run smoke build
- fix or quarantine broken unit-test harnesses
- verify Cloudflare Pages settings
- verify no accidental worker dependency for RealmWorld
- verify service worker update behavior
- verify mobile browser behavior
- prepare live deployment steps
- keep NOWPayments live test separate and controlled

