# W399 Referral DB And Identity Status

Date: 2026-06-28

## Identity truth

- Cloudflare Pages Production and Preview both have `EON_IDENTITY_DB` configured.
- The identity migration `identity/migrations/0001_eon_identity.sql` was applied remotely to both databases.
- Remote verification confirmed the expected identity tables are present.
- Production auth rollout remains `testing`.
- Preview auth rollout remains `disabled`.

## Google OAuth truth

- Cloudflare Pages config contains the expected Production Google OAuth variables and secrets.
- Preview remains intentionally unset for Google OAuth.
- This session did **not** complete a live Google test-user login, logout, delete-account, or local-data-restore proof.
- Therefore Google auth is **source-ready and infra-ready, not live-certified**.

## Referral DB truth

- The active W399 source keeps referral and reward systems inactive.
- The current Pages Functions required only `EON_IDENTITY_DB` for this release path.
- The Pages project still contained stale legacy D1 bindings from older referral-era configurations.
- One invalid binding referenced a non-existent D1 database id and blocked production deployment.

## What was cleaned

To unblock the live W399 deploy, stale non-required Cloudflare Pages bindings were removed from project config:

- `EONAPP_REFERRALS_DB`
- `REFERRALS_DB`
- stale `EONAPP_KV`
- stale `EONAPP_ASSETS`
- stale `EONAPP_BACKUPS`

This cleanup did **not** remove any active W399 app capability, because the current release path does not use those bindings.

## Recommendation for future referral work

If referral or reward storage is reintroduced later:

1. recreate or confirm the intended D1 database in Cloudflare
2. bind it with the exact current database id
3. add explicit server handlers and tests for the active source
4. keep it disabled until end-to-end proof is collected

Until then, the honest status is:

- identity path: configured and migrated
- referral path: inactive and intentionally not part of the live W399 release
