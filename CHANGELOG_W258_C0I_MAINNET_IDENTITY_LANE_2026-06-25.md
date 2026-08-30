# W258 — C0-I Polygon Mainnet Identity Lane

## Status

**IMPLEMENTATION COMPLETE / C0-I EXIT BLOCKED.**

This wave adds only evidence tooling and operator safety. It does **not** connect EONAPP runtime to Polygon, request wallet access, sign anything, perform transactions, expose token/reward/loot/referral claims, or alter user data.

## Delivered

- Canonical 16-contract Polygon-mainnet C0-I registry derived from the supplied C0-P evidence.
- Address checksum normalisation for five mixed-case manifest values; byte values were unchanged.
- Read-only verifier allowing only `eth_chainId`, `eth_blockNumber`, `eth_getCode`, and `eth_call`.
- Two-RPC policy with fail-closed comparison and a required-exit mode.
- Exact `solc` `0.8.24` compiler pin, matching Hardhat's `viaIR`, optimizer `200`, and `paris` EVM settings.
- All 16 canonical labels compile as exact local source candidates under the pinned `solc` `0.8.24`, `viaIR`, optimizer `200` and `paris` settings. The repair uses one persisted proof file per label and a resumable batch verifier; no weaker compiler settings were substituted.
- Council approval/execution scripts now reject any action manifest whose declared `network` differs from the selected Hardhat network before signer resolution.
- Owner manual corrected: `role-grants-polygon.json` is recognised as an Amoy-labelled historical file, not a Polygon-mainnet execution input.
- Pending role/custody attestation template; it contains no signing material and cannot authorize C0-I.

## Honest blockers

1. The sandbox cannot fetch either approved public RPC endpoint, so the two live RPC runs are absent.
2. Hardhat compile/test/smoke cannot download compiler metadata because the sandbox proxy is malformed (`HH502`, `Proxy opts.uri is mandatory`). The supplied 149/149 proof remains supplied evidence, not an independently reproduced result here.
3. Full contract-toolchain audit is **53 vulnerabilities: 18 low, 27 moderate, 8 high**. Production-only audit is zero vulnerabilities.
4. Role/operator state and custody review are intentionally pending human/live-RPC evidence.

## Product decision

C0-P deployment presence remains usable as planning evidence. C0-I remains **NO-GO**. EONAPP stays chain-runtime disconnected until C0-I has two successful live RPC receipts, complete source/runtime disposition, role/operator evidence, custody approval, and a reviewed manifest repair.
