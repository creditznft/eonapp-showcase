# EONAPP Mainnet Launch Sync (2026-05-04)

## Scope

This document is the frontend/app launch handoff for live Polygon mainnet contracts.
It syncs addresses, frontend integration points, ABI usage, and immediate launch steps.

## Canonical Mainnet Contract Addresses

- EONLiteSecurityCouncil: 0xa60fd5Ed96bB9D05aE4C25A6dee7A728003a2B77
- EONLiteRegistry: 0x8801d584fe9E7Aed7415036811B5e1Ce4C3FfC2D
- EONLiteToken: 0xeEb533C54BAEb6E9E4386dAf84F3Ed4B75B7c219
- EONLiteProofHub: 0xd00a959308b8627Fe873C9de4987e0C11FB724C5
- EONLiteEmissionController: 0xC30606E56f03685e2f54f43b6f81eE4A1b5c2B7F
- TreasuryVault: 0x56e5A0381ad347aAF44CaD37967DD3CB5dF1369d
- LiquidityVault: 0xc403c7eFB809B914289Dc0D153115fACdc44b911
- ReserveVault: 0x9D11A1F5fD8f21C4fd161Ee0C659a417a890725b
- EONLiteRewardsDistributor: 0xC41A158b9f58a89d42c56C8a3c73a884366bc333
- EONLiteEpochSettlement: 0xb09083f7073CA5EB3d227e55E51eAE297F258dE6
- EONLiteReferralLedger: 0x469e47392ee5722553b63c5df9f707936A5D2134
- EONLiteQuantumRegistry: 0x1314e367BFE8E6c95438eB8b603481482EBf631c
- EONLiteLoot: 0x560a002D2b6261650096637073EA5d4c8FD98c3B
- EONLiteGovernanceToggle: 0xcCa6F04b9675956eA1ed65F0B25e5c87D0b7F3Db
- EONRewardOperator: 0x5B300753836282609d3dCe06F183777468555d09
- EONReferralOperator: 0x174f3764F21a0AB651f8ac592352aa1C343A885D
- EONLootOperator: 0x850DD1A2f6315D2DE776b3b627f53C5b046eBdac
- EONRealmLand: 0xD76B80ed444d861323463B1975d287940E5A168E
- EONNFTMarketplace: 0xB81877E90A784a0eF67f7d02579c5c99b23fDa50
- EONRelicNFT: 0xa9AFf03fBF4aa240188104B31D7641D3b5829ce3

## Frontend Integration Sources of Truth

- Contract manifest: assets/config/deployed-contracts.json
- Runtime config + minimal ABIs: assets/js/utils/contracts-config.js
- Marketplace UI controller: assets/js/marketplace-page.js
- Main marketplace page: marketplace.html
- Community trigger module: assets/js/utils/community-triggers.js
- Realm queue generator: assets/js/utils/realm-parcels.js
- Vault UI panel: assets/js/vault-page.js

## ABI Integration Status

- Minimal runtime ABIs are now centralized in assets/js/utils/contracts-config.js:
  - EONNFTMarketplace: listItem, buyItem, cancelListing
  - EONRelicNFT: ownerOf, approve, setApprovalForAll, safeTransferFrom
  - EONLiteToken: approve
  - EONLiteEpochSettlement: previewSettlement, settleEpoch

If full ABIs are required in-browser later, generate and ship sanitized JSON ABI subsets under assets/config/abis/.

## Marketplace + Realm UI Status

- Marketplace page exists and is accessible at /marketplace.html.
- Marketplace now displays live network and contract routing addresses in UI.
- On-chain listing mode now auto-injects the correct collection contract per listing type.
- Realm dashboard exists inside Vault at /vault.html under Unified Realm sections.
- Realm deed mint queue export now defaults to network=polygon.

## Admin Surface Status

Current admin capabilities exist but are split across surfaces:

- Frontend vault/operator controls in vault.html and assets/js/vault-page.js.
- Backend admin API routes exist in platform-backend/src/index.js (`/api/v1/admin/*`) with HMAC auth.

Gap for launch hardening:

- No dedicated single-page web admin console (admin.html) yet.
- Recommendation: build a separate operator console that signs admin API requests and surfaces governance + epoch workflows in one place.

## Immediate Next Steps (Launch Ready)

1. Add real on-chain tx execution buttons in marketplace for list/buy/cancel with wallet prompts and transaction receipts.
2. Add EON token approval flow before on-chain buy in marketplace.
3. Add network mismatch guardrails on every on-chain action (auto switch to chainId 137).
4. Add dedicated operator console page for admin API endpoints with signed request helper.
5. Add e2e coverage for marketplace on-chain path and vault trigger path against a staging RPC.
6. Run final launch sweep for stale Amoy wording and placeholder addresses in docs and marketing pages.

## Verification Reference

Mainnet deployment verification baseline:
- 51 checks passed
- 0 checks failed
- 3 warnings (known non-breaking view getter differences)

Primary verification/report source:
- Smart Contracts/DEPLOYMENT_REPORT_POLYGON_MAINNET.md
