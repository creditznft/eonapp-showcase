# R3-F1/F2 — physical source reduction and route tiering

**Date:** 2026-06-25  
**Status:** Local-static complete. External browser/device/release proof remains open.

## What changed

### R3-F1 — physical active-source reduction

- Moved **103** dormant wallet, transaction, payment, loot, referral-value, legacy Vault and historical value-system files into `archive/retired-value-systems/original/`.
- Preserved each archived file under `archive/retired-value-systems/MANIFEST.json` with a SHA-256 hash.
- Added `scripts/r3-f1-physical-source-reduction-gate.mjs` and a unit test that fail if a retired value-system file returns to active source, a raw EVM address appears in active runtime, or a transaction primitive appears in active source/output.
- Maintained existing browser-user local data. This wave changes source organisation and active code boundaries; it does not delete or migrate user storage.
- Updated W143/W174 current policy checks to inspect active Legal, Terms, Billing, Privacy and Support surfaces only.

### R3-F2 — route tiering and root simplification

- Defined a source-controlled route tier map in `config/route-tiering.mjs`.
- Kept the four-route work loop canonical: **Chat → Projects → Workspace → EON City**.
- Moved **8** redirect-only root documents into `archive/retired-route-surfaces/original/`, retained their 301 route-contract redirects, and hash-recorded them in `archive/retired-route-surfaces/MANIFEST.json`.
- Removed the stale active `eon-browser.html` document that referenced a retired module and caused the site audit to fail.
- Added `scripts/r3-f2-route-tiering-gate.mjs` and a unit test to reject return of retired root documents or loss of their redirects.
- Updated Automation Studio retirement checks to inspect the route contract rather than a deleted compatibility document.

## Fresh local-static proof

- **193/193** approved current-product tests passed.
- Zero-warning lint passed.
- Fresh production build passed.
- R3-F1 and R3-F2 gates passed.
- W239, W242, W243, W244, W247, W248, W249–W257 gates passed.
- Current policy, public trust, smoke, site audit, PWA static, readiness, identity, page, quality, secret scan and `npm audit --omit=dev` passed.
- Site audit now scans 40 emitted HTML files and verifies sitemap/precache successfully.

Evidence: `EVIDENCE/R3_F1_F2_SOURCE_REDUCTION_ROUTE_TIERING_2026-06-25_FINAL/`.

## Product and security boundaries retained

- Chat/EONBOT remains primary; Vault is the only credential/provider-verification surface.
- City Lite, Visual Tour and Babylon Play remain distinct modes with shared bounded City actions.
- City actions remain prepare → review → separate confirm.
- No chain RPC, wallet prompt, signing, transaction, token, reward, loot, referral value, payment, payout, marketplace or on-chain user-data runtime is enabled.

## Still open

- W258-C0-I contract identity/ABI/roles/custody proof.
- W259 physical Android/iPhone/desktop City evidence.
- W260 Preview/live/PWA update/rollback/Git/CSP/network/Lighthouse/accessibility/human release board.
