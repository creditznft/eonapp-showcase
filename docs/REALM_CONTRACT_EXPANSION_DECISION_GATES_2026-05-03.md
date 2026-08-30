# Realm Contract Expansion — Decision Gates
**File:** `docs/REALM_CONTRACT_EXPANSION_DECISION_GATES_2026-05-03.md`  
**Scope:** EON Unified Land Metaverse  
**Status:** Mainnet deployed ✅ — gate framework retained for future feature expansions

---

## Post-Deployment Update (2026-05-04)

The launch state has moved beyond pre-gate planning. These contracts are now live on Polygon mainnet:

- `EONRealmLand`: `0xD76B80ed444d861323463B1975d287940E5A168E`
- `EONNFTMarketplace`: `0xB81877E90A784a0eF67f7d02579c5c99b23fDa50`
- `EONRelicNFT`: `0xa9AFf03fBF4aa240188104B31D7641D3b5829ce3`

The decision-gate model in this document remains valuable as a product strategy framework, but it is now an archive of the pre-deployment decision process.

---

## Current Architecture (Pre-Gate)

The Unified Realm system is fully operational as a **local-first JavaScript layer**:

- All parcel state lives in `localStorage` (parcel registry, district registry, transfers, seasons, leagues).
- NFT deed minting uses the **existing `EONRelicNFT` ERC-721 contract** via a queue builder (`buildRealmDeedMintQueue`) + batch mint executor.
- No dedicated on-chain land contract exists yet — and none is needed until at least one gate below is met.
- Asset ownership is modeled via `ownerWallet` on each parcel record; transfers are prepared client-side and executed off-chain (bundle export/import pattern).

**This is the correct architecture for Phase 1–9.** A dedicated land contract adds gas overhead, upgrade complexity, and audit cost that is not justified before the gate thresholds.

---

## Gate 1 — On-Chain Coordinate Ownership Required

**Trigger:** Any of the following:
- Players ask to verify "who owns parcel at grid coordinate X/Y" trustlessly (not just from a local bundle).
- A secondary marketplace (OpenSea, Blur, custom DEX) needs to query parcel ownership by coordinate or tokenId.
- Land boundary disputes need on-chain arbitration.

**What the dedicated contract would add:**
```solidity
mapping(bytes32 => uint256) public coordinateToTokenId;
mapping(uint256 => Parcel) public parcelData; // districtId, gridIndex, rarityTier
```

**Gate Metric:** ≥ 10,000 active parcel owners across all districts OR first secondary market query for coordinate-native ownership proof.

---

## Gate 2 — Parcel Lease Logic On-Chain

**Trigger:**
- Parcel owners want to lease parcels to other users for a fixed EON fee per epoch.
- Lease terms (duration, rent amount, sublease rights) need trustless enforcement.
- Disputes about lease expiry need on-chain resolution.

**What the dedicated contract would add:**
```solidity
struct Lease {
    address lessee;
    uint256 rentPerEpoch; // in EON tokens
    uint64 startEpoch;
    uint64 durationEpochs;
    bool subLeaseAllowed;
}
mapping(uint256 => Lease) public activeLease; // tokenId → lease
```

**Gate Metric:** ≥ 500 distinct parcel lease agreements requested within any 30-day window.

---

## Gate 3 — District Supply Enforcement On-Chain

**Trigger:**
- Current: `maxParcels` per district is soft-enforced in JS. If two clients race to mint the 250th parcel in a premium district, one will succeed and the cap could be exceeded.
- A secondary market forms and supply scarcity needs to be provably enforced at the contract level.

**What the dedicated contract would add:**
```solidity
mapping(string => uint256) public districtSupply;    // districtId → minted
mapping(string => uint256) public districtMaxSupply; // districtId → cap
```

**Gate Metric:** First verifiable race condition attempt on a capped premium district (phase-9 districts: Ice Frontier, Dune Trade Route, Aerial Citadel, Arena Sector) OR ≥ 1,000 deed NFTs minted from phase-9 supply.

---

## Gate 4 — On-Chain Upgrade Slots

**Trigger:**
- Players want upgrades to be irreversible and verifiable on-chain (e.g., for a competitive league leaderboard backed by contract state).
- A third-party game server needs to trust upgrade level claims without querying local storage.

**What the dedicated contract would add:**
```solidity
mapping(uint256 => uint8) public upgradeLevel;    // tokenId → level (max 25)
mapping(uint256 => string) public ascensionTier;  // tokenId → tierId
```

**Gate Metric:** First external game server integration that requires trustless upgrade level verification, OR ≥ 500 parcels at Ascendant+ tier where competitive claims matter.

---

## Gate 5 — On-Chain Marketplace Settlement

**Trigger:**
- A sale or transfer is executed between two parties who do not trust each other's local bundle export.
- A peer-to-peer sale with atomic settlement (send EON → receive deed NFT) is requested.
- EON staking vault integration requires parcel ownership proof for yield boosts.

**What the dedicated contract would add:**
```solidity
// ERC-721 safeTransferFrom already handles NFT transfer
// Add atomic EON swap:
function buyParcel(uint256 tokenId) external {
    uint256 price = listedPrice[tokenId];
    IEON(EON_TOKEN).transferFrom(msg.sender, ownerOf(tokenId), price);
    _transfer(ownerOf(tokenId), msg.sender, tokenId);
}
```

**Gate Metric:** First on-chain resale/transfer on a secondary market OR first atomic EON-for-parcel swap request from a non-custodial wallet.

---

## Decision Gate Summary Table

| Gate | Trigger | Metric | Current Status |
|------|---------|--------|----------------|
| 1 — Coordinate ownership | Secondary marketplace or trustless coordinate query | 10,000 active owners | ⛔ Not met — contract ready |
| 2 — Lease logic | Lease agreements requested | 500 leases in 30d | ⛔ Not met — contract ready |
| 3 — Supply enforcement | Race condition on capped district OR 1k phase-9 mints | 1,000 phase-9 deed mints | ⛔ Not met — contract ready |
| 4 — Upgrade slots | External game server integration | 500 Ascendant+ parcels | ⛔ Not met — contract ready |
| 5 — Marketplace settlement | On-chain resale or atomic EON swap | First secondary sale | ⛔ Not met — EONNFTMarketplace.sol compiled & ready |

**Any single gate being met → deploy `EONRealmLand.sol` + `EONNFTMarketplace.sol` to Amoy → mainnet after audit.**
**Both contracts designed, compiled, and awaiting deployment trigger (2026-05-03).**

---

## Recommended Dedicated Contract When Gates Are Met

**Contract name:** `EONRealmLand.sol`  
**Pattern:** UUPS upgradeable, ERC-721, AccessControl  
**Inherits:** EONRelicNFT patterns (tested, audited)  
**Network:** Polygon Amoy testnet → Polygon mainnet  
**Timelock:** `EONGovernanceTimelock` holds `DEFAULT_ADMIN_ROLE` and `UPGRADER_ROLE`  

### Minimal Viable Interface (For Reference)

```solidity
interface IEONRealmLand {
    // Core parcel data
    function parcelData(uint256 tokenId) external view returns (
        string memory districtId, uint16 gridIndex, uint8 rarityTier, uint8 upgradeLevel, string memory ascensionTier
    );

    // Supply enforcement
    function districtSupply(string calldata districtId) external view returns (uint256);
    function districtMaxSupply(string calldata districtId) external view returns (uint256);

    // Upgrade (gate 4)
    function upgradeParcel(uint256 tokenId) external; // onlyOwner, increments level, emits event

    // Lease (gate 2)
    function createLease(uint256 tokenId, address lessee, uint256 rentPerEpoch, uint64 durationEpochs) external;
    function claimRent(uint256 tokenId) external;
    function terminateLease(uint256 tokenId) external;

    // Marketplace (gate 5)
    function listParcel(uint256 tokenId, uint256 priceInEon) external;
    function buyParcel(uint256 tokenId) external;
    function delistParcel(uint256 tokenId) external;

    // Migration from EONRelicNFT deeds
    function migrateDeed(uint256 relicTokenId, address owner, bytes calldata proof) external;
}
```

---

## Pre-Gate Action Items (Now, Before Any Gate)

1. **Keep `EONRelicNFT` as the deed contract.** Mint queue is ready (`buildRealmDeedMintQueue`). Use batch mint executor for Phase 9 districts.
2. **Maintain `ownerWallet` in all parcel records** for future `migrateDeed` compatibility.
3. **Log all off-chain transfers** in `REALM_TRANSFERS_KEY` storage. These become migration proofs when `migrateDeed` is deployed.
4. **Monitor gate metrics** via vault analytics and community event tracking.
5. **Deployment discipline:** `EONRealmLand.sol` and `EONNFTMarketplace.sol` are compiled and ready, but deployment remains gate-driven. Deploy to Amoy only after at least one gate is met and 8/10 admin multi-sig approves; mainnet only after audit sign-off.

---

*Last updated: 2026-05-03 — Session Phase 10 completion*
