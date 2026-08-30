This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Start Here — W101 Marketplace, NFT, Lootbox and Rewards

This is the authoritative continuation source after W100 Vault and W101 Marketplace/NFT/Lootbox/Rewards polish.

## Certified state

- AI Workstation foundation preserved
- Session 14 EON City/Realm state preserved
- Seven-module W100 Vault preserved
- Premium Marketplace first render with 12 curated listings
- Contract/network/explorer trust states
- Readable lootbox odds and utility-only framing
- NFT diversity gallery: 12 unique outputs, minimum QA 100
- W101 static gate: 38/38
- W101 targeted tests: 11/11
- Full unit suite: 933 passed, 0 failed, 1 skipped
- Browser proof: 19/19
- Reward/Telegram/referral focused tests: 25/25
- Build, 61-page audit and smoke passed
- Smart contracts unchanged: 71/71 files

## Restore

```bash
npm ci
npm run qa:w101-marketplace
npm run qa:w101-nft-diversity
npm run build
npm run audit:site
npm run smoke:build
```

The packaged `dist` is already included. `node_modules` is intentionally excluded.

For browser proof, serve the built `dist` on port 4183, then run:

```bash
W101_BASE_URL=http://127.0.0.1:4183 npm run qa:w101-marketplace:browser
```

## Continue

Next phase: **W102 Complete 11-Language Truth Rebuild**.

> Preserve W96-W101. Keep exactly English, Spanish, Chinese, Japanese, Korean, French, German, Portuguese, Russian, Arabic and Hindi visible. Complete route packs, dynamic strings, English restoration, Arabic RTL and CJK/mobile proof. Do not modify smart contracts or use GitHub unless explicitly requested.
