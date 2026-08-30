This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W393 — Babylon Command Deck

**Source baseline:** W392 direct EON City entry, continued in the same runnable tree.  
**Status:** source/build/test evidence only. This is not a real-device, human visual, PWA-update, production, social, account, reward, or commerce approval claim.  
**Lean package:** active runnable source and test/config code only; no `node_modules`, `dist`, browser reports, Git history, screenshots, video proof, or external credentials.

## Product change

The public City flow now remains one world:

1. User selects **EON City**.
2. `/eoncity` starts the local Babylon district directly.
3. The visible **Command Deck** action focuses the operator inside the Babylon Command Deck room and opens a compact local navigation panel.
4. The user explicitly chooses EONBOT, EON Forge, Projects, Library, or City Map.

The Command Deck is not a second workspace or public Three.js application. The old Three.js tour remains a non-primary legacy preview while the public Command Deck lives inside Babylon.

## In-world design

- Command Room visual signage is now **COMMAND DECK**.
- Original procedural display panels identify EONBOT, Forge, Projects, Library, and City Map.
- The Deck panel is safe-area responsive and works as a compact overlay on narrow screens.
- The runtime `focusCommandDeck()` clears manual movement/local markers and moves the operator to the local Deck viewpoint. It never opens another route by itself.
- Every destination is an ordinary visible link. Choosing one writes a local operator activity receipt, disposes the City renderer, and then follows the user click.

## Boundary preserved

No private work is rendered in the Deck. No Chat message, project source, Vault material, provider credential, account data, payment, reward, referral, social connection, telemetry, remote asset, background task, automatic post, or automatic route action was added.

The W390–W391 Collection and viral-growth policy remains a disabled planning document only: `EONAPP_W390_W391_COLLECTION_AND_VIRAL_GROWTH_DECISION_2026-06-27.md`.

## Added / changed implementation

- `assets/js/city/eon-city-command-deck.js` — compact local Deck card contract and validation.
- `assets/js/city/eon-city-play-babylon.js` — Command Deck visual panels, local Deck focus method, Deck metadata.
- `assets/js/eon-city-play-station.js` — HUD action, local Deck panel, explicit route receipt.
- `assets/css/eon-city-play.css` — responsive Command Deck panel styles.
- `config/w393-command-deck-contract.mjs` — W393 public-boundary contract.
- `scripts/w393-command-deck-gate.mjs` — static source boundary gate.
- `tests/unit/w393-command-deck.test.mjs` — current-product unit coverage.
- `PRODUCT_MAP.md` — W393 renderer and City navigation truth.

## Validation completed

```text
npm run lint -- --max-warnings=0          passed
npm run qa:w392-direct-eoncity-entry      passed (13/13)
npm run qa:w393-command-deck              passed (11/11)
npm run qa:w366-neon-command-district     passed
npm run qa:w249-babylon-play-proof-spike  passed
npm run test:unit                         332 passed
npm run build                             passed
npm run smoke:build                       passed
npm run audit:site                        passed
npm run launch:readiness                  passed
node scripts/w249-babylon-play-proof-spike-gate.mjs --require-dist  passed
```

## Still required before any deploy or flagship claim

1. Capture direct desktop and mobile City screenshots/video, including Deck open/close and each visible destination.
2. Test the user laptop and a real mobile device: direct entry, touch UI, narrow desktop, portrait/landscape, optional full screen, reduced effects, and City Map fallback.
3. Confirm the Deck focus location looks attractive and the procedural display panels are readable at actual render scale.
4. Fresh GitHub clone: rerun CI/history secret scan, because this lean snapshot intentionally has no `.git` history.
5. Complete Preview deployment, Cloudflare console/network/CSP, installed-PWA update/rollback, and production reviewer proof.

## Next work

- **W394:** City mobile/touch/HUD performance and real-device visual pass.
- **W390A/W390B:** only after this City usability pass, add Collection display and deterministic Vault Reveal—no referral, no value reward, no Store.
- **W395:** Google identity/D1 proof before any account-backed entitlement or referral pilot.
- **W388/W389:** GitHub App and user-owned Cloudflare deployment after Forge change-review/integrity is approved.
