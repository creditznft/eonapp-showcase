# W650 — EONCITY Cache, Loading and Update Safety

## Decision

EONCITY remains authenticated-only. Google/EONAPP identity must be confirmed before the Babylon runtime, City audio or any W649 GLB request is started.

The City asset library is delivered as content-hashed static Cloudflare Pages files. Unchanged asset bytes keep the same URL between releases. Changed asset bytes receive a new URL. This permits the browser HTTP cache and the release-independent service-worker Cache API to reuse unchanged GLBs across logout/login, route changes and app-shell deployments.

## Implemented cache layers

1. Cloudflare Pages `_headers` applies `Cache-Control: public, max-age=31556952, immutable` only to `/assets/city/w649/*` after detaching the generic app-asset rule.
2. App JavaScript and CSS remain `max-age=0, must-revalidate`, so an application update does not make stale code permanent.
3. The service worker owns the release-independent cache `eonapp-city-assets-v1`. Activation preserves that cache while retiring obsolete release caches.
4. Direct City asset fetches use the browser cache and the service worker uses cache-first handling only for strict content-hashed W649 paths.
5. The cache is bounded to 192 entries and never reads, writes or clears protected user data.
6. After authenticated access, the app makes a best-effort `navigator.storage.persist()` request. A denial never blocks City entry or creates a false guarantee.

## Loading experience

The signed-out route remains a polished static Google-login portal. After authorization, the loading shield shows:

- access confirmation;
- device/profile preparation;
- saved-asset cache status;
- real byte progress when the response exposes a trustworthy total;
- the currently loading premium asset;
- a truthful degraded/procedural fallback message when required.

The shield cannot reach 100% or disappear until both conditions are true:

1. the Babylon renderer has produced its first frame; and
2. Pathfinder, EONBOT and the Orientation Hall starter assets have settled.

## Measured payload policy

- Preserved library: 38 logical assets / 76 primary and fallback GLBs.
- Active launch library: 33 logical assets / 66 runtime variants.
- Authenticated primary starter set: 7 logical assets, 4,825,776 bytes (4.60 MiB).
- Entire active primary library: 23,482,756 bytes (22.39 MiB).
- The runtime does not preload the complete library.
- Only one district is resident at a time.
- Decoder-free fallbacks are fetched only when the compressed primary cannot be used.

At one million first-time users, the primary starter transfer is approximately 4.39 TiB in aggregate. That is materially smaller than transferring a 100 MB package to every user, and repeat entries/app-shell updates reuse unchanged files when they remain in browser storage.

## User-data safety

The W145 update-survival gate separately proved 62/62 protected local keys across 10 data groups survived a simulated Cloudflare application update byte-for-byte. The City asset cache does not inspect or mutate those keys. Logout does not clear the City cache. Application version switching no longer broadcasts a blanket cache-clear command.

## Honest boundaries

- Browser persistence is best-effort unless the browser grants persistent storage.
- Users, private-browsing termination, storage pressure or browser policy can still remove cached files.
- Google login gates the product boot; static asset URLs are not a cryptographic DRM boundary.
- Local browser data survival does not by itself provide multi-device synchronization or cloud backup.
- Real Google-authenticated Cloudflare Preview evidence remains required before production.
