# W108D — Marketplace Commercial Truth + Trust Policy Patch

Generated: 2026-06-11

## Mission

Make the NFT Exchange and marketplace commerce surfaces clearer, safer, and more premium before more monetization expansion.

This patch keeps the market powerful, but separates:

- Official EON Team drops
- user seller listings
- local/Vault preview NFTs
- on-chain settlement paths
- manual seller delivery boundaries
- no-profit/no-investment truth copy

## Changes

### Marketplace page

Updated `marketplace.html` with a new **Commercial truth** panel:

- Official EON Team drops generate unique Vault utility NFTs only after verified payment proof.
- User seller listings remain manual-pay beta until escrow, dispute tooling, and automated settlement are certified.
- Local/Vault preview NFTs are not automatically on-chain mints.
- Listings are utility products, not investment products.

Added visible seller-policy checklist in the create-listing panel.

### Marketplace controller

Updated `assets/js/marketplace-page.js`:

- Added per-listing trust chips:
  - Official EON Team / User seller
  - On-chain signature required / Vault/manual settlement
  - Permanent media proof / Preview media
  - Quality tier
- Added purchase safety checklist in the listing modal.
- Replaced generic empty-state logic with contextual empty states for filtered views, My Listings, Sold, and normal browse views.
- Added seller-policy validation before a listing can be created.

### New trust policy module

Added `assets/js/utils/marketplace-trust-policy.js`:

- `MARKETPLACE_TRUST_RAILS`
- `SELLER_POLICY_CHECKLIST`
- `BUYER_SAFETY_CHECKLIST`
- `buildMarketplaceListingTrust()`
- `buildMarketplaceEmptyState()`
- `summarizeSellerPolicy()`
- `validateSellerListingDraft()`

### Trust page

Updated `trust.html` with a dedicated marketplace commerce section explaining:

- buyer truth
- seller truth
- official drop truth
- preview vs on-chain boundaries
- manual-pay beta limits
- no profit/resale/investment promises

### Styling

Updated `assets/css/marketplace.css` with responsive styling for:

- commercial truth panel
- seller policy box
- buyer safety checklist
- per-card trust chips
- clearer empty-state notes

### Tests

Added `tests/unit/w108d-marketplace-trust-policy.test.mjs`.

## Verification passed

```text
npm ci
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
node --test tests/unit/w108b-ux-compression.test.mjs tests/unit/w108c-realm-device-lab.test.mjs tests/unit/w108d-marketplace-trust-policy.test.mjs
npm run qa:w101-marketplace
```

## Important unchanged boundaries

This patch does not change:

- Smart contracts
- deployed contract addresses
- NOWPayments receiver logic
- wallet settlement primitives
- live trading execution
- Cloudflare secrets

## Known note

`npm ci` reports 40 existing dependency audit vulnerabilities. This patch does not run `npm audit fix` because dependency upgrades should be handled as a separate dependency-maintenance wave.

## Recommended next patch

W108E should focus on performance and route certification:

- live browser smoke on main routes
- Lighthouse main-page pass
- lazy-load heavy Creator/Marketplace/Realm modules further
- final route-level console cleanup
- deploy checklist and evidence pack
