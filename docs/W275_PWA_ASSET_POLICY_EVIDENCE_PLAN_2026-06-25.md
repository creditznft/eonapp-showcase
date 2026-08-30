# W275-A0 — Offline/PWA Asset Policy Evidence Plan

## Delivered source controls

- Service Worker cache version is `v49`.
- Stable shell precache is bounded to 40 entries and has no raw source JS/CSS paths.
- Runtime asset and page caches are bounded to 160 and 32 entries.
- Vault/Vault Backup and other protected navigation routes are network-only/no-store and are not precached.
- A replacement worker remains waiting until the Profile action explicitly requests `SKIP_WAITING`; first install still activates normally when no controller exists.

## Evidence still required

1. First install on a real Android, iPhone/Safari and desktop browser.
2. User-approved update followed by a single clean refresh and retained local profile data.
3. An update rollback/recovery drill with a known previous release.
4. Slow-network and offline recovery, including an honest fallback for protected routes.
5. Storage-pressure/cache-eviction observation.

## Claim fence

A source test cannot prove a real browser accepted, retained, updated, rolled back or evicted this Service Worker. W260 remains **NO-GO**.
