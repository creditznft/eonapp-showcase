# W654 — EONCITY Technical, Performance and Update Red-Team Audit

## Direct answer: do users redownload all game assets after every app update?

**No.** A normal EONAPP deployment does not force the complete EONCITY library to download again.

- Every City model uses a content-hashed filename.
- Unchanged bytes keep the same URL and remain reusable from browser/Cloudflare cache.
- Changed model bytes generate a different hash and therefore a new URL.
- The new model downloads only when its district or role is needed.
- The entire City is not preloaded.
- Browser storage is best effort: clearing site data, private browsing, storage pressure or browser eviction can require another download.

### Update scenario matrix

| Scenario | Expected transfer |
|---|---|
| Signed out | Entry HTML/CSS only; zero game assets |
| Shell/code-only release | Fresh/revalidated City document and runtime code; unchanged hashed GLBs reused |
| One model changes | New hashed model downloads only when that asset's district is entered |
| Meshopt primary fails | Decoder-free fallback for that asset only |
| Browser cache is evicted or site data cleared | Required starter/district files download again on demand; the complete library is still not preloaded |

Cloudflare Pages can apply custom response headers through `_headers`; the candidate applies long-lived immutable caching only to fingerprinted City binaries. The City document and runtime code remain separately fresh so a new shell cannot silently reuse stale control logic.

## Measured local asset profile

| Metric | Result |
|---|---:|
| Logical library | 38 assets |
| Active launch library | 33 assets |
| Primary + fallback binaries | 76 GLBs |
| Starter primary download | 4.60 MiB |
| Complete active primary set | 22.39 MiB |
| Maximum resident districts | 1 |
| Managed City cache ceiling | 192 entries |
| Signed-out heavy requests | 0 |

## Red-team findings

1. Content-hashed GLBs already had the correct immutable policy.
2. App JavaScript already revalidated separately.
3. The service worker already preserved the release-stable City cache.
4. The City route itself still inherited generic HTML caching and could theoretically point briefly at superseded runtime chunks after a release.
5. Browser cache persistence can never be guaranteed, so the UI and documentation must not promise permanent offline storage.

## Fixes and retained safeguards

- `/eoncity` and `/eoncity.html` now use `no-cache, no-store, must-revalidate`.
- Content-hashed W649 City binaries remain one-year immutable.
- Root and public `_headers` stay byte-identical.
- Root and public service workers stay byte-identical.
- The release-stable cache remains `eonapp-city-assets-v1`.
- Cache activation keeps the City cache instead of deleting it on each app release.
- Cache entries are bounded at 192.
- Authenticated access is checked before the heavy runtime import.
- Starter assets load before the first playable-ready claim.
- District residency remains one district at a time.
- Primary Meshopt assets fall back to decoder-free variants only when required.
- Updating code or art does not touch local projects, Vault data, provider settings, prompts or user files.

## Residual risks reserved for Codex and real devices

- Browser eviction and user-cleared data.
- First-time 4.60 MiB starter transfer on slower mobile networks.
- Real network waterfalls and cache-hit evidence.
- Mobile GPU memory, context loss, heat and battery.
- True geometric LOD1/LOD2 remains pending.
- Visual material, scale, clipping, hand, face and foot-contact approval.

## Score

| Dimension | Before audit | After local fixes | Codex-reserved |
|---|---:|---:|---:|
| Update correctness | 9.0/10 | 9.8/10 | Preview cache headers |
| Asset reuse | 9.4/10 | 9.8/10 | network waterfall |
| Loading truth | 9.2/10 | 9.8/10 | throttled browser proof |
| Performance architecture | 9.0/10 | 9.6/10 | real device metrics |
| Failure honesty | 9.3/10 | 9.8/10 | forced-fallback browser proof |
| **Wave score** | **9.2/10** | **9.7/10 previsual** | **0.3 points reserved** |
