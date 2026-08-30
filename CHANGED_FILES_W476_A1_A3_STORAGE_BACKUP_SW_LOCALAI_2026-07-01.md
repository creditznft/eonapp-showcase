# W476-A1/A2/A3 partial repair package — 2026-07-01

This source package continues the W476 truth/storage/network repair programme.

## Completed in this package

- W476-A1 storage gateway carried forward from the prior package.
- W476-A2 portable state contract added at `config/w476-portable-state-contract.mjs`.
- Vault backup eligibility now delegates to the portable state contract and exposes a manifest in boundary/restore plans.
- Sensitive/payment/OAuth/referral/signed payload records are excluded from portable backup by explicit contract.
- W476-A3 service-worker cache ownership repair:
  - removed fixed `v54` cache identity;
  - replaced delete-all-unknown cache cleanup with EONAPP-prefix-only cleanup;
  - removed `.html` duplicates and retired City aliases from precache;
  - added release-scoped update-apply message requirement.
- W476 Local AI preference repair:
  - canonical persisted value is now `local-first`;
  - old `local` values migrate to `local-first`;
  - loopback-only check remains enforced.
- `release:verify` now covers storage, portable state contract, service worker contract, Local AI preference, and syntax checks.

## Verification run locally

```bash
npm run release:verify
```

Result: PASS locally. This is not production/browser/device certification.

## Still not claimed

- No production deploy proof.
- No GA DebugView/Tag Assistant proof.
- No real Ollama/LM Studio/Jan browser proof.
- No real service-worker update/rollback survival proof.
- No Dodo/payment work.
