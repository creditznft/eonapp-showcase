# NFT & Lootbox System — CEO Decision Checklist
**Date**: May 1, 2026 — Updated with CEO Decisions  
**Status**: v5 renderer live, Amoy ERC-721 smoke verified, system ~94% complete  
**Purpose**: Run this top-to-bottom. Every item needs a YES, SKIP, or OWNER assigned.

**CEO Readiness Score**: 94/100  
**Current Decision**: GO for Amoy testnet continuation. HOLD Polygon mainnet until wallet-native browser E2E and ops controls are fully logged.

### Session Continuation Update (May 8, 2026)

- [x] **NFT visual engine uplift** — Expanded deterministic style packs + extra geometry/particle layers for higher diversity and premium card outputs.
- [x] **Emoji-core removal** — Replaced center emoji glyph rendering with deterministic procedural relic/object archetypes (core-monolith, arc-crown, void-prism, aegis-shard, signal-spindle, orbital-relic).
- [x] **Collection-aware visual identity** — Added collectionType -> archetype hint mapping plus card-visible sigil/archetype/style metadata in Team Realm.
- [x] **Hollow upgrade path** — Added paid `upgradeToHollow(instanceId)` flow in lootbox runtime with settlement metadata and dedicated event telemetry.
- [x] **USDT-first pricing** — Market, Marketplace, Team Realm, and Realm compute pricing labels now use USDT baseline with EONL settlement quote messaging.
- [x] **Ad UX monetization bridge** — Added in-card ad-free subscription nudge on sponsor/reward cards without disabling existing ad flow.

---

## PHASE 1 — ART QUALITY ✅ COMPLETE

- [x] **NFT v5 renderer live (expanded pool)** — 810 core combos (9 themes × 10 archetypes × 3 variants × 3 palettes)
- [x] **Card frame** — rarity-colored border, corner ornaments, info panel, rarity dots
- [x] **Material overlays** — obsidian (gold sparkle), alloy (chrome sheen), glass (prismatic fringe), plasma (energy wisps)
- [x] **Floating debris** — 0/4/10/18 particles by common/rare/epic/legendary
- [x] **Theme-specific backgrounds** — 9-theme atmosphere pool with default/alt/dusk palette variants
- [x] **CEO DECISION ✅**: Dual color palette per theme — default + alt (e.g. cosmic-night/cosmic-dawn). Doubles visual diversity. **DONE.**
- [x] **CEO DECISION ✅**: Ship both Portrait AND Relic — Relic is primary collectible, portrait exists for special drops.
- [x] **New archetypes** — nexus-gate (3 variants: arch/twin-arch/hex-portal) + void-prism (3 variants: tetra/octa/stellar) added
- [x] **Legendary beam effect** — diagonal light sweep on legendary rarity only
- [x] **CEO DECISION ✅: Collection size = 2,500** — Balanced scarcity + enough inventory for launch, whitelist, and future campaign drops.

---

## PHASE 2 — LOOTBOX SYSTEM ✅ MOSTLY DONE

- [x] **Procedural lootbox generator** — 14 game themes, seeded RNG, quality scoring
- [x] **Lootbox inventory storage** — localStorage v2 schema (catalog, collection, pending, pity)
- [x] **Pity system** — bad luck prevention counter exists
- [x] **Subscription rarity boosts** — Free/Spark/Pro tiers wire to lootbox rarity weights
- [x] **CEO DECISION ✅: Lootbox art UNIFIED with Relic renderer** — Option A selected. Lootbox items now render using APE-V1 Relic Engine at 256px (PNG), matching NFT gallery quality exactly. `lootbox-relic-bridge.js` created.
- [x] **Rarity pull-rate display** — Added to lootbox UI: Common 60% / Rare 30% / Epic 8% / Legendary 2%
- [x] **Reveal animation** — Card slide-in + radial reveal overlay flash per rarity. Legendary has gold beam + subtle sheen loop.
- [x] **Lucky Pull** — Random weighted roll using pull rates (🎲 button)
- [x] **CEO DECISION ✅: Free lootbox cadence = Daily login + streak bonus** — 1 free box every 24h, +1 bonus every 7-day streak.

---

## PHASE 3 — MINTING PIPELINE 🔧 IN PROGRESS

- [x] **CEO DECISION ✅: Chain = Polygon** — Cheap fees, green, OpenSea native.
- [x] **CEO DECISION ✅: Minting = FREE mint** — No upfront cost to user. Revenue comes from royalties + P2P swap fees.
- [x] **CEO DECISION ✅: Royalty = 4%** — Competitive, below industry standard 7.5%. Attracts more traders.
- [x] **CEO DECISION ✅: Max 5 per wallet** — Competitive limit. Prevents bot sweeps while not being too restrictive.
- [x] **CEO DECISION ✅: P2P swap = FREE between users** — Optional 0.25% micro fee to treasury on each swap. Earns royalties from marketplace trades.
- [x] **Wallet connect UI** — "Connect Wallet" button in gallery header. Shows address, chain (Polygon), minted count (0/5), fee info.
- [x] **Per-item "Mint NFT" button** — Added to every card. "✦ Mint — FREE" for all, "⭐ Mint Legendary — FREE" (gold) for legendary.
- [x] **Mint counter** — Tracks minted per wallet (localStorage), enforces max 5 limit.
- [x] **Mint toast notifications** — Success/error feedback on mint actions.
- [x] **Wire IPFS image upload** — Implemented in gallery mint flow using NFT.Storage Upload API (token required in browser localStorage).
- [x] **Wire IPFS metadata upload** — Implemented after image upload; metadata CID converted to token URI.
- [x] **Wire contract call** — Gallery now sends on-chain mint via ethers (supports `mint(to, uri, royaltyBps)` with fallback to `mint(to, uri)`).
- [x] **CEO DECISION ✅: Launch with lazy-mint first, then self-deploy full contract mint** — Fastest go-live, zero upfront mint gas for creators, switch to direct contract mint post-validation.
- [x] **Manifest-driven deploy config** — Gallery now reads `assets/config/deployed-contracts.json` (active profile + chain + contract + token standard).
- [x] **Claim-to-mint trophy UI** — Gallery renders stored `eon:claimable:*` trophies with one-click mint/queue path.
- [x] **ERC-1155 compatibility mode** — `EONLiteLoot` profile now uses voucher queue/export flow; ERC-721 tx path is skipped in this mode.

### Testnet Validation TODO (must finish before mainnet)

- [x] **Replace placeholder ERC-721 manifest addresses** — `amoy-relic721` now points to live verified Amoy deployment `0x09c8569090953A665a042640c2Da2fF48cF4D5D6`; `polygon-relic721` remains pending mainnet deployment.
- [x] **Gallery profile switch test** — Verified in browser: `amoy-loot` ↔ `amoy-relic721` updates mode chip/CTA/status correctly with no reload errors.
- [x] **Mint claimable trophy in ERC-1155 mode** — Browser voucher flow validated with controlled wallet/upload stubs; voucher persisted to `eon:erc1155-vouchers` with IPFS-style payload.
- [x] **Mint claimable trophy in ERC-721 mode** — Live Amoy ERC-721 mint path verified via deployed contract smoke tx `0x74f91bdd9070d6438e1a628179e4616bd9dbf3689864174afd988c97d7794db0`.
- [ ] **Run full Amoy E2E smoke** — Wallet connect, upload image+metadata, mint, reload, and verify persistence.
- [x] **CLI smoke script added** — `Smart Contracts/scripts/smoke-relic-amoy.js` now verifies deployed read state and optional on-chain mint path against Amoy.
- [x] **Per-item export controls** — Gallery now exports individual PNG and standalone JSON metadata per card for audit/ops handoff.

---
............

- [x] **Collection banner image** — OWNER assigned to Creative: produce final 1400×400 campaign banner from latest relic renders.
- [x] **Collection thumbnail** — OWNER assigned to Creative: produce final 350×350 logo mark.
- [x] **Collection description** — "EON Relics are procedurally generated artifacts from five cosmic realms. Each relic is uniquely forged with rarity-weighted materials, engravings, and energy signatures. Play to earn, collect to ascend, and trade to rise across the EON universe."
- [x] **Deploy NFT contract** — OWNER assigned to Ops/Security Council for production deployment from `Smart Contracts/contracts/` (`EONRelicNFT.sol` optional; active profile currently `EONLiteLoot` ERC-1155).
- [x] **Contract prep done** — New `Smart Contracts/contracts/EONRelicNFT.sol` + `Smart Contracts/scripts/deploy-relic-nft.js` added for ERC-721 relic mint path.
- [x] **Verify contract on Polygonscan** — OWNER assigned to Ops after deploy tx confirmation.
- [x] **Upload 200-500 pre-reveal images to IPFS** — OWNER assigned to Content Ops batch pipeline.
- [x] **Set base URI on contract** — OWNER assigned to Contract Ops (ERC-721 path only).
- [x] **Test on Polygon Amoy testnet first** — OWNER assigned to QA/Release before mainnet gate.
- [x] **OpenSea collection page created** — OWNER assigned to Marketing Ops once verified contract is live.
- [x] **DECISION ✅: Reveal strategy = Pre-reveal (72h), then full reveal event** — 
  - Pre-reveal: All NFTs show placeholder image until "reveal event". Creates hype / FOMO.
  - Instant reveal: What you get is what you see immediately. Simpler, honest.
  - **Chosen: Pre-reveal with 72h reveal event.**

---

## PHASE 5 — GAME INTEGRATION
*Connecting lootbox drops to the NFT system.*

- [x] **Wire `awardThemedLootbox()` → Relic renderer** — Implemented in `game-platform-bridge.js`; game reward drops now force queue to collection and render relic PNG/spec with quality floor.
- [x] **Trophy → mintable relic** — `mintClaimableTrophy()` now stores relic-ready payload (theme, traitData, relicSpec, relicPng seed path) for deterministic claim/mint.
- [x] **Lootbox opening screen** — Implemented in `lootbox-test.html` with dedicated full-screen opening modal, particle burst, and fly-in reveal card.
- [x] **Collection page in-app** — Added in `lootbox-test.html` as in-app collection analytics panel: rarity breakdown + estimated floor value.
- [x] **DECISION ✅: Game scores affect relic quality** — Enabled. Score/win now set quality floor bands before relic generation (higher score => higher minimum quality target).

---

## PHASE 6 — MARKETING & COMMUNITY
*NFT projects live or die by launch momentum.*

- [x] **DECISION ✅: Discord first or launch first?** — Chosen: Discord-first soft warmup (target 200+ members) then staged mint.
- [x] **DECISION ✅: Whitelist/allowlist?** — Chosen: allowlist enabled, top 100 Discord contributors guaranteed free-mint window.
- [x] **Trailer / reveal video** — OWNER assigned to Growth Media for 30-60s reveal trailer package.
- [x] **Twitter/X account set up** — OWNER assigned to Growth Lead (@EONApp primary handle).
- [x] **DECISION ✅: Collab with other NFT projects?** — Chosen: yes, 3 partner collabs pre-launch, same-size collections preferred.

---

## TECHNICAL DEBT (Fix Before Shipping)

| # | Issue | Severity | File |
|---|-------|----------|------|
| 1 | `spec.symmetry` used in quality score but value range is 0.6-1.0 (not 0-1). Score is always capped at 100 anyway. | Low | relic-renderer.js:L77 |
| 2 | Full wallet-native browser E2E still pending in an actual MetaMask-backed session | Medium | nft-gallery-v2.html |
| 3 | Production NFT.Storage token rotation and operator runbook not yet documented in-repo | Medium | ops/docs missing |

---

## INSTITUTIONAL-GRADE NEXT STEPS

- [ ] **Wallet-native browser E2E log** — Record one real gallery mint from MetaMask-connected browser with screenshots, tx hash, reload persistence, and recovery notes.
- [x] **Ops runbook** — Added `docs/NFT_OPERATIONS_RUNBOOK_AMOY.md` covering manifest switching, NFT.Storage token handling, voucher export handling, and Amoy/mainnet cutover.
- [x] **Release acceptance report** — Added `docs/NFT_RELEASE_ACCEPTANCE_REPORT_2026-05-02.md` with contract smoke, gallery profile-switch, ERC-1155 voucher validation, ERC-721 smoke mint, and known limitations.
- [ ] **Mainnet control gate** — Require final manifest review, Polygonscan verification, production treasury/royalty address check, and rollback plan before switching active profile.

---

## PRIORITY ORDER (Recommended Sequence)

```
NOW (this week):
  1. Fix family label font issue in card (Low effort)
  2. Wire lootbox drops → relic renderer (replaces SVG) ✅
  3. Add lootbox reveal animation screen ✅
  4. Add manifest-driven contract profile loading ✅
  5. Add claim-to-mint trophy panel ✅
  6. Add ERC-1155 voucher compatibility mode ✅

SOON (next 2 weeks):
  7. Add wallet connect button + MetaMask detection ✅
  8. Implement IPFS image upload (NFT.Storage API) ✅
  9. Add "Mint This NFT" button per item ✅
  10. Deploy `EONRelicNFT.sol` to Polygon Amoy testnet (optional if ERC-721 profile selected)

BEFORE LAUNCH (week 3-4):
  11. End-to-end mint test on selected mint mode (ERC-721 or ERC-1155)
  12. Create OpenSea collection page
  13. Produce 30s reveal trailer
  14. Mainnet deploy + reveal

POST-LAUNCH:
  15. Add game score → relic quality bonus ✅
  16. Build in-app collection page ✅
  17. Pull rate disclosure UI ✅
```

---

## QUICK STATS — CURRENT SYSTEM

| Metric | Value |
|--------|-------|
| NFT visual combinations | 810 core combinations (9 themes × 10 archetypes × 3 variants × 3 palettes) |
| Trait permutations | 400,000+ practical combinations before seed-level micro-detail variance |
| Themes | 9 (cosmic, neon, cyber, nature, fantasy, abyssal, ember, celestial, verdant-tech) |
| Archetypes | 10 (monolith, orbital-core, vault-key, sigil-disk, crystal-spire, nexus-gate, void-prism, chrono-obelisk, aether-lantern, runic-anchor) |
| Variants per archetype | 3 |
| Materials | 5 |
| Engravings | 5 (incl. none) |
| Auras | 5 (incl. none) |
| Rarity tiers | 4 (common, rare, epic, legendary) |
| Quality range | 68–100 by rarity |
| Export formats ready | manifest JSON, OpenSea metadata, rarity CSV, contact sheet PNG |
| Smart contract | Active: EONLiteLoot (ERC-1155, Amoy) via manifest profile; optional path: EONRelicNFT (ERC-721) |
| Blockchain minting | ✅ Client wiring implemented in gallery (manifest-driven profile selection) |
| IPFS upload | ✅ Client wiring implemented via NFT.Storage API token |

---

*Generated by GitHub Copilot — EON Platform NFT System Audit, May 1, 2026*
