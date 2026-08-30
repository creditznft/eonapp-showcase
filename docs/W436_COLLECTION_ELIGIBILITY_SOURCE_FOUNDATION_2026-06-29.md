# W436 — Collection eligibility and Vault separation source foundation

**Date:** 29 June 2026  
**Status:** Local source foundation. The Collection remains disabled and no item, entitlement or financial product is live.

## What this wave adds

- A separate, non-secret local Collection eligibility register, outside the Vault credential boundary.
- Fixed mission-to-artifact mapping using the existing deterministic reveal catalogue.
- An explicit reviewed-evidence requirement: a caller provides a local evidence hash only after a deliberate person action and local review.
- Local revocation with a second confirmation.
- A Collection display summary in Vault that states eligibility is not a grant, ownership claim, City unlock, or entitlement.
- Update-safe preservation coverage for `eon:collection:eligibility:v1`.

## Truth boundary

- Collection rollout remains disabled.
- A record only means **local review eligibility for later human review**; it is not a reveal, grant, ownership claim, tradable asset, marketplace listing, NFT/token, payment result, chance mechanic, discount or subscription time.
- The module reads no Vault secret and creates no remote request.
- No server verification, Google identity proof, account binding, recovery proof, legal/policy approval, animation release or production device proof is claimed.
