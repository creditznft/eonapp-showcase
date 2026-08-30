# EONAPP W108A First Patch — EON City Home + Personal Market NFT Drops

Date: 2026-06-11
Base: EONAPP_GPT55_W107C_SOURCE_TEST_BUILD_SNAPSHOT_2026-06-11.zip

## What changed

### 1. Market first-visit NFT generation
- Added `assets/js/utils/market-starter-nfts.js`.
- Every new browser/user now gets a deterministic local-first EON City starter NFT drop.
- Drop items are inserted before the Genesis catalog so first-time Market users see generated NFTs immediately after hydration.
- Added Save to Vault action for generated starter NFTs.
- Saves compatible local records into:
  - `eon:nft:collection:v1`
  - `eon:nft-collection:v3`
- Added user-visible personal drop header with count and Vault-saved status.

### 2. Market search and empty-state repair
- Search now indexes title, description, type, collection type, seller, mode, price, district, series, tags, and utility unlocks.
- Empty state no longer says the catalog is broken on first load.
- Empty state now explains how to clear search and return to all Genesis / starter / creator / compute items.
- Market static copy now promises personal EON City starter drops honestly and says paid listings remain gated until seller/payment controls are verified.

### 3. Homepage remodel
- Rewrote homepage around the real product flagship:
  - EON City
  - EONBOT AI Chat
  - AI Cockpit
- Added visual EON City stage with districts/towers:
  - AI Tower
  - Vault Tower
  - Market/NFT Boulevard
  - Trade Dome
  - Private Workstation
  - Device Lab
- Added first-5-minute product story.
- Added Market NFT showcase section.
- Added clean connected-stack cards for Vault, Trade, Creator Studio, Device Lab, Market, and Trust.
- Removed public homepage ad verification metas from the main first impression.
- Removed duplicate marquee phrase block from the homepage.

### 4. Trust page upgrade
- Trust page now has meaningful static fallback content before JavaScript hydration.
- Added trust promises for:
  - AI & keys
  - Market & NFTs
  - Wallet & payments
  - IoT & devices
- Clarified that local preview NFTs are not automatically on-chain collectibles.
- Clarified that real-device actions require confirmation and should not silently run from Realm/gameplay.

### 5. Tests and verification
Passed:
- `npm ci`
- `npm run lint -- --max-warnings=0`
- `npm run build`
- `npm run smoke:build`
- `npm run audit:site`
- `node --test tests/unit/w108-market-starter-drop.test.mjs`

Notes:
- `npm ci` reports existing dependency audit vulnerabilities from the dependency tree: 40 total (28 low, 8 moderate, 4 high). This patch did not address dependency upgrades because that can be breaking and should be a separate dependency-maintenance pass.

## Main files changed / added

- `index.html`
- `market.html`
- `trust.html`
- `assets/js/market-page.js`
- `assets/js/utils/market-starter-nfts.js`
- `assets/css/home.css`
- `assets/css/market.css`
- `assets/css/trust-showcase.css`
- `tests/unit/w108-market-starter-drop.test.mjs`

## Next recommended W108B patch

1. Creator Studio progressive disclosure.
2. Workbench simplified front screen.
3. Realm EON City-first cleanup with legacy editor hidden behind Advanced.
4. IoT Device Lab discoverability in Workbench + Realm.
5. Marketplace trust/live-data polish and contract-map fallback cleanup.
