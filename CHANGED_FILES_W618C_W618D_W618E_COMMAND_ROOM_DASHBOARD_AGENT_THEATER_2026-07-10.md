# W618C/W618D/W618E — Command Room + Living Dashboard + Agent Theater Foundations

Date: 2026-07-10
Baseline: W618B Share Command Center + Compact Shell source package

## Product decision carried forward

EON City is no longer treated as a confusing first-run route wall. The approved target is:

1. **EON Command Room** — default practical cockpit.
2. **EON Living City Dashboard** — truthful city/status signal layer.
3. **EON Agent Theater** — dormant agents now; active agents only from receipt-backed job signals later.

The 10/10 goal is still not certified until W618F real browser/mobile proof passes.

## Changed files

### City runtime and UI

- `assets/js/eon-city-play-station.js`
  - Imports the W618C Command Room renderer.
  - Imports W618D Living Dashboard signal projection.
  - Imports W618E Agent Theater projection.
  - Renders Command Room as the direct `/eoncity` default cockpit.
  - Suppresses the older first-run overlay from covering the Command Room default.
  - Adds Command Room open buttons to the City HUD and quick strip.
  - Adds Command Room click/keyboard binding.
  - Connects Command Room screens to explicit route opens, Share, District Map and 3D Explore.
  - Adds local operator activity receipt text for route opens.

- `assets/css/eon-city-play.css`
  - Adds W618C Command Room cockpit layout.
  - Adds large readable screen grid.
  - Adds Living Dashboard signal styling.
  - Adds Agent Theater dormant/receipt-entry styling.
  - Adds responsive mobile/compact layout.

### New City modules

- `assets/js/city/eon-city-command-room.js`
  - Defines the default Command Room cockpit model.
  - Defines nine large app/district screens: EONBOT, Projects, Forge, Studio, Local AI, Automations, Vault, Share, District Map.
  - Carries keyboard shortcuts.
  - Renders Command Room markup.
  - Validates safety boundaries: no private work read, no provider start, no checkout, no reward grant, no fake agent activity.

- `assets/js/city/eon-city-living-dashboard.js`
  - Defines truthful dashboard panels for Local AI, Projects, Vault, Share Tower, Automation Relay and Agent Theater.
  - Maps safe state into Command Room signal rows.
  - Keeps Share ledger `not-live` until server proof.
  - Does not probe remote services, start providers, start automation or grant rewards.

- `assets/js/city/eon-city-agent-theater.js`
  - Defines launch-safe Agent Theater foundation.
  - Shows dormant agents without pretending work is running.
  - Activates visible agents only from receipt-backed W439 signals.
  - Never shows raw prompts, outputs, provider identity, credentials or external effects.

### QA gates and tests

- `scripts/w618c-eon-command-room-default-gate.mjs`
- `scripts/w618d-living-dashboard-signals-gate.mjs`
- `scripts/w618e-agent-theater-foundations-gate.mjs`
- `tests/unit/w618c-eon-command-room-default.test.mjs`
- `tests/unit/w618d-living-dashboard-signals.test.mjs`
- `tests/unit/w618e-agent-theater-foundations.test.mjs`
- `package.json`
  - Adds:
    - `qa:w618c-eon-command-room-default`
    - `qa:w618d-living-dashboard-signals`
    - `qa:w618e-agent-theater-foundations`

## Boundaries preserved

- No Dodo checkout.
- No live trial.
- No live referral grant.
- No live EON Key redemption.
- No browser-only entitlement authority.
- No platform-paid hosted AI/image/video generation.
- No cash, crypto, wallet, NFT, payout, commission or renewal-discount reward.
- No fake agent activity.
- No raw prompt/output/provider/credential display in Agent Theater.
- No browser proof claimed yet.

## Next wave

W618F should be real browser/mobile proof and visual QA:

- Chrome/Edge desktop `/eoncity` proof.
- Command Room default visible proof.
- Click every Command Room screen.
- Keyboard shortcuts proof.
- 3D Explore proof.
- District click/tap proof.
- Mouse movement/click travel proof.
- Mobile portrait fallback proof.
- Mobile landscape City proof.
- Sidebar + Share Center visual proof.
- Cache/service-worker update proof.
