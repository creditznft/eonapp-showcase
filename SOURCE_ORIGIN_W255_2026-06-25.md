# W255 source origin

This handover is derived from `EONAPP_W249_W254_R3_CEO_MEGA_AUDIT_SOURCE_FREEZE_2026-06-25` as the sole baseline.

It adds W255 City parity registry work only: shared landmark/action identity, stale Realm alias correction, tests, gates, evidence and handover documentation. It does not merge an older handover and does not activate chain, wallet, token, reward, payment, commerce, referral-value, marketplace, provider credential or public publishing behavior.

`npm ci` is required after extraction. The package deliberately excludes dependencies, `dist`, `.git`, environment files, caches and secrets.
