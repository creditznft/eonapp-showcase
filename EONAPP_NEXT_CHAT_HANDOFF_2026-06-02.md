# EONAPP Next Chat Handoff — After Wave 10

Use latest backup:

- `EONAPP_W10_REALMWORLD_PWA_LEAN.zip`

## What Wave 10 changed

Wave 10 converted the product direction into code:

- RealmWorld is now the only active game in `assets/js/app-data.js`.
- `games.html` is now a RealmWorld-only landing page.
- `/game` and `/games` route to RealmWorld.
- Old game shells are archived/noindexed and redirected to archive.
- Shared `site-shell.js` navigation now keeps RealmWorld visible.
- Mobile bottom nav now includes World.
- PWA manifest now includes RealmWorld shortcut and games category.
- Service worker bumped to v35 and precaches RealmWorld assets.
- Service worker bypasses navigation cache for sensitive payment/admin/subscription routes.
- RealmWorld page now includes no-worker/decentralized copy, better SEO, mobile polish, reduced-motion support, and lazy NFT art hydration.
- Added `assets/js/utils/realmworld-p2p.js` no-worker policy helpers.
- Added tests for RealmWorld P2P/no-worker route safety.

## Important product rule

EONAPP should have one game only:

> EON RealmWorld — local-first metaverse, deterministic snapshots, Arweave-ready, no public chat, no uploads, ghost visitors only, preset emotes, and no Cloudflare Worker game-state dependency.

Cloudflare Pages may host the static website. Existing payment/admin backend flows may still use their own functions where required. The RealmWorld metaverse/game-state loop should not depend on a Cloudflare Worker.

## Validation passed in this chat

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
- Site audit: passed.
- Page invariants: 0 blockers, 0 warnings.
- Launch readiness: 0 blockers, 0 warnings.

## Known caveat

The whole-repo command `npm run test:unit` was attempted and failed on pre-existing unrelated test-harness issues in `ai-readiness` and `xp` tests. Do not treat the full unit command as clean until Codex fixes or splits those harnesses.

Full build was not run here because dependencies were not installed in the extracted workspace.

## Start next chat with this prompt

Continue EONAPP from `EONAPP_W10_REALMWORLD_PWA_LEAN.zip`. Start Wave 11: install dependencies, run full build, smoke build, fix or quarantine old broken unit-test harnesses, verify Cloudflare Pages deploy settings, verify service worker update behavior, and prepare deploy/runbook. Keep RealmWorld as the only game and do not introduce any Cloudflare Worker dependency for RealmWorld game state.
