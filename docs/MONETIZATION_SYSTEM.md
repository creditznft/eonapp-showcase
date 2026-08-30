# EON Monetization System — Complete Reference

*Last updated: 2026-04-26*

## Overview

The EON platform monetization system is built on three pillars:

1. **Pool Points** — Value-independent earning currency
2. **Subscriptions** — USD-priced tiers with Pool Point multipliers
3. **P2P Token Swap** — User-to-user EONL/USD exchange

### Why Pool Points instead of direct EONL?

EONL value can fluctuate dramatically. Pool Points decouple user effort from token price:

- Users earn **Pool Points** through gameplay, tools, creator activity
- Pool Points determine each user's **share of the EONL mint pool**
- At epoch end, EONL is distributed proportional to Pool Point holdings
- Subscriptions boost **Pool Point earning rate**, not direct EONL

---

## Pool Points System

**File**: `assets/js/utils/pool-points.js`  
**Global**: `window.EonPoolPoints`

### Earning Rates

| Action | Base Points |
|--------|------------|
| `game-kill` | 2 |
| `game-floor-complete` | 10 |
| `game-boss-kill` | 50 |
| `game-run-complete` | 100 |
| `game-challenge-win` | 75 |
| `tool-completed` | 5 |
| `creator-post` | 10 |
| `referral-success` | 100 |
| `daily-login` | 5 |
| `lootbox-open` | 5 |
| `subscription-activated` | 200 |

### Subscription Multipliers

| Tier | Pool Point Multiplier |
|------|----------------------|
| Free | 1x |
| Spark ($1/mo) | 2x |
| Builder ($5/mo) | 3x |
| Pro ($15/mo) | 5x |
| Operator ($50/mo) | 5x |

### API

```js
window.EonPoolPoints.awardPoints('game-kill', 'neon-dungeon');  // Award points
window.EonPoolPoints.getTotalPoints();                           // Total points
window.EonPoolPoints.getEpochPoints();                           // Current epoch
window.EonPoolPoints.getMultiplier();                            // Current multiplier
window.EonPoolPoints.getPlanInfo();                              // { plan, multiplier, label }
window.EonPoolPoints.settleEpoch(eonlMinted);                    // Settle epoch → EONL
```

### Epoch Settlement

Pool Points accumulate per epoch (weekly). At epoch end:
1. Total EONL minted for the epoch is determined
2. Each user's share = their Pool Points / total network Pool Points
3. EONL is credited to wallet via `EonWallet.addCoins()`

---

## Subscription Tiers

**File**: `assets/js/utils/subscription.js`  
**Pricing**: `assets/js/utils/entitlements.js`

All prices are in **USD** (cents). Users can pay in USD or EONL via the internal swap.

| Tier | Price (USD) | Key Benefits |
|------|------------|--------------|
| Free | $0 | Play all games, earn Pool Points (1x), see ads, base lootbox |
| Spark | $1/mo | Ad-free, 2x Pool Points, lootbox rarity boost (+10%) |
| Builder | $5/mo | 3x Pool Points, stats export, exclusive skins |
| Pro | $15/mo | 5x Pool Points, tournament entry, monthly legendary lootbox |
| Operator | $50/mo | 5x Pool Points, operator dashboard, priority epoch |

### Feature Gates (Games)

```
games:earn-pool-points    → free    (all users earn Pool Points)
games:ad-free             → spark   (no interstitial ads)
games:pool-points-2x      → spark   (2x Pool Point rate)
games:lootbox-boost       → spark   (better rarity odds)
games:pool-points-3x      → builder (3x Pool Point rate)
games:pool-points-5x      → pro     (5x Pool Point rate)
games:monthly-lootbox     → pro     (guaranteed legendary/month)
games:pool-points-5x-op   → operator (5x Pool Point rate)
```

---

## P2P Token Swap (EONL ↔ USD)

**File**: `assets/js/utils/token-swap.js`  
**Global**: `window.EonTokenSwap`

Offchain, user-to-user swap. No central orderbook. No hosted server required.

### Flow

1. **Maker** creates swap offer: "Sell 100 EONL for $1.00" or "Buy 100 EONL for $1.00"
2. Offer code shared via P2P (GunDB) or manually
3. **Taker** accepts offer → balances adjusted on both sides
4. Receipt code generated for maker to redeem their side

### Price Discovery

- **No fixed EONL/USD rate** — the market is the users
- Supply and demand determines price
- Each maker sets their own price
- P2P network broadcasts offers for discovery

### API

```js
// Create offer
EonTokenSwap.createTokenSwapOffer({
  direction: 'sell_eonl',  // or 'buy_eonl'
  eonlAmount: 100,
  usdAmount: 100,          // cents ($1.00)
  ttlHours: 48
});

// Preview offer code
EonTokenSwap.previewTokenSwapOffer(code);

// Accept offer
EonTokenSwap.acceptTokenSwapOffer(code);

// Redeem receipt (maker side)
EonTokenSwap.redeemTokenSwapReceipt(receiptCode);

// Get USD balance
EonTokenSwap.getBalance();
```

---

## App Versioning System

**File**: `assets/js/utils/app-versioning.js`  
**Global**: `window.EonAppVersion`

### Version Tracks

| Track | Description |
|-------|-------------|
| stable | Production releases |
| beta | Pre-release with new features |
| canary | Bleeding edge, may be unstable |

### API

```js
// Publish new version (admin)
EonAppVersion.publishVersion({
  version: '2.0.0',
  track: 'stable',
  changelog: 'New features...',
  artifactUrl: 'ipns://...',
  isLatest: true
});

// Switch to a version (user)
EonAppVersion.switchVersion(versionId);

// Rollback to previous
EonAppVersion.rollback();

// Check for updates
EonAppVersion.checkForUpdate();

// Get preferences
EonAppVersion.setPreferences({ preferredTrack: 'beta', autoUpdate: true });
```

### Service Worker Integration

When a user switches versions, the service worker receives a `VERSION_SWITCH` message and clears caches before reload.

---

## Ad Integration

**Files**: `assets/js/ads/config.js`, `assets/js/ads/AdManager.js`  
**Game helper**: `assets/js/utils/game-monetization.js`

### Ad Slots in Games

All flagship games include:
```html
<div class="ad-slot" data-ad-slot="game-interstitial"></div>
```

### Ad Types

| Slot | Type | When Shown |
|------|------|-----------|
| `game-interstitial` | Interstitial | Between floors (every 3 floors) |
| `game-gameover-banner` | Banner | On death/game over |
| `rewardedUnlock` | Rewarded | User opts in for bonus |

### Subscriber Behavior

- **Free users**: See interstitials, can watch rewarded ads
- **Spark+ subscribers**: Ad-free (interstitials/skipped, rewarded auto-granted)

---

## Wallet & Pool Ledger

**File**: `assets/js/utils/wallet.js`  
**Keys**: `eon:wallet:v1`, `eon:pool-ledger:v1`

### Pool Emission Flow

```
User action → Pool Points awarded (with subscription multiplier)
           → recordPoolEmission() called (with pool boost)
           → Pool ledger updated (gamer/tools/creator/referral/nft pools)
           → At epoch end: Pool Points → EONL share
```

### Daily Earning Caps (Legacy, being replaced by Pool Points)

| Category | Base Cap | Spark (2x) | Builder (3x) | Pro (5x) |
|----------|---------|------------|--------------|----------|
| game-reward | 500 | 1000 | 1500 | 2500 |
| tool-reward | 200 | 400 | 600 | 1000 |
| lootbox | 500 | 1000 | 1500 | 2500 |

---

## Lootbox System

**File**: `assets/js/utils/lootbox.js`  
**Global**: `window.EonLootbox`

### Subscription Rarity Boost

| Tier | Luck Bonus |
|------|-----------|
| Free | 0 |
| Spark | +0.10 (10% better odds) |
| Builder | +0.15 |
| Pro | +0.20 |
| Operator | +0.30 |

### NFT Swap (Existing)

Lootbox items can be swapped P2P via signed offer codes:
- `createSwapOfferCode()` → share code → `acceptSwapOfferCode()` → `redeemSwapReceiptCode()`
- P2P discovery via GunDB (`p2p-discovery.js`)

---

## Files Reference

| File | Purpose |
|------|---------|
| `assets/js/utils/pool-points.js` | Pool Points earning & epoch system |
| `assets/js/utils/token-swap.js` | P2P EONL/USD swap |
| `assets/js/utils/app-versioning.js` | App version management |
| `assets/js/utils/subscription.js` | Subscription tiers & feature gates |
| `assets/js/utils/entitlements.js` | Plan definitions & pricing |
| `assets/js/utils/wallet.js` | EONL wallet & pool ledger |
| `assets/js/utils/lootbox.js` | NFT lootbox & swaps |
| `assets/js/utils/game-monetization.js` | Shared game monetization helper |
| `assets/js/utils/p2p-discovery.js` | GunDB P2P offer discovery |
| `assets/js/utils/backend-client.js` | Worker swap reconciliation |
| `assets/js/ads/config.js` | Ad slot definitions |
| `assets/js/ads/AdManager.js` | Ad rendering engine |
| `assets/js/games/game-shell.js` | Game bootstrap (ads + subs) |

---

## Neon Dungeon

**Path**: `games/neon-dungeon/`  
**Total**: 4,831 lines (18 JS modules + HTML)

### Modules

| Module | Lines | Purpose |
|--------|-------|---------|
| `engine.js` | 595 | Core game loop, combat, AI |
| `quests.js` | 408 | Daily bounties & challenge modes |
| `ui.js` | 463 | HUD, overlays, menus |
| `systems.js` | 493 | Particle, buff, damage systems |
| `ai.js` | 253 | Enemy & boss AI |
| `dungeon.js` | 252 | Procedural floor generation |
| `effects.js` | 261 | Visual effects |
| `renderer.js` | 251 | Canvas rendering |
| `bootstrap.js` | 266 | Main entry point |
| `persistence.js` | 222 | Save, history, leaderboards |
| `eon-integration.js` | 209 | Platform integration |
| `config.js` | 186 | Game configuration |
| `data.js` | 184 | Item/enemy data tables |
| `utils.js` | 234 | Utility functions |
| `story.js` | 108 | Narrative events |
| `ad-integration.js` | 128 | Subscription-aware ads |
| `sound.js` | 39 | Sound effects |
| `input.js` | 21 | Input handling |

---

## Testing

**Playwright tests** in `e2e/`:
- `monetization.spec.js` — Pool Points, Token Swap, App Versioning (6 tests, all passing)
- `games-individual.spec.js` — All flagship games load without errors (11 games)
- `lootbox.spec.js` — Lootbox system integrity
- `vault-profile.spec.js` — Vault page functionality

Run: `npx playwright test --project=chromium`
