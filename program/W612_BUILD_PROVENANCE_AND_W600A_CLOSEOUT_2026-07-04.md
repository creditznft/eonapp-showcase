# W612 — Deploy-Candidate Provenance for W600A Authenticated City Closure

**Date:** 4 July 2026  
**Baseline:** W607 sanitized source mechanics, source-only validation complete  
**Status:** W612 source complete; W600A normal-browser production proof remains open.

## Why this small wave exists

W600A already rejects a Start Here dialog that is visually present but pointer-intercepted by the Babylon canvas. The prior runner did not, however, prove that the browser was looking at the exact build that was just validated and deployed. W612 closes that evidence gap without changing City gameplay, identity, AI, payment, wallet, subscription, or social-posting behavior.

## Delivered

- `scripts/build-provenance.mjs` writes `dist/build-provenance.json` after production minification.
- The manifest contains only deployment-parity data: exact source revision when available, deterministic distribution SHA-256, City document hashes and service-worker hash. It excludes itself from the digest to avoid a circular hash.
- It explicitly declares `containsUserData: false` and `containsSecrets: false`.
- `_headers` marks `/build-provenance.json` as `no-cache, no-store, must-revalidate` and non-indexable.
- `scripts/w599-run-authenticated-eoncity.mjs` now requires a local deploy-candidate manifest, fetches the live one without cache, and fails on any revision or City/distribution hash mismatch.
- Failure markers are explicit: `LOCAL_BUILD_PROVENANCE_MISSING`, `LOCAL_SOURCE_REVISION_MISSING`, `DEPLOYED_BUILD_PROVENANCE_UNAVAILABLE`, `DEPLOYED_SOURCE_REVISION_MISMATCH`, and `DEPLOYED_ASSET_HASH_MISMATCH`.

## Important source-package limitation

This handover is a sanitized ZIP, not a Git checkout. Its local build correctly records `sourceRevision: null`. That is not a production result. Codex must build/deploy from the real Git checkout, where `git rev-parse HEAD` or `EONAPP_SOURCE_REVISION` supplies the exact committed revision. The authenticated runner intentionally refuses to certify an artifact with no revision.

## Local validation receipt

| Gate | Result |
|---|---|
| `npm ci` | passed; audit reported 0 vulnerabilities |
| `npm run lint -- --max-warnings=0` | passed |
| `npm run qa:w612-build-provenance` | passed (2/2) |
| `npm run qa:w607-city-gameplay-contract` | passed (6/6) |
| `node --test tests/unit/w599-authenticated-city-access-and-cache.test.mjs` | passed (5/5) |
| `npm run test:unit` | passed (741/741 current tests) |
| `npm run build` | passed; emitted cache-bypassed provenance manifest |
| `npm run smoke:build` | passed |

The direct wildcard command `node --test tests/unit/*.test.mjs` was attempted only to reconcile an outdated brief. It runs the full historical archive, including intentionally excluded evidence-dependent suites, and exceeded the execution window. It is **not** the repository's current certification command. The maintained certification command is `npm run test:unit`; do not represent the wildcard run as passed or failed release evidence.

## Production closure still required

1. Use the real repository, fetch current `origin/main`, and make this W612 delta a normal commit.
2. Build from that checkout so the emitted manifest has the exact committed revision.
3. Deploy normally; do not use a preview as a substitute for production.
4. Use a human's ordinary signed-in Chrome/Edge profile attached only through loopback CDP. Do not create a storage state, inject cookies, fake a session, or bypass Google login.
5. Run `scripts/w599-run-authenticated-eoncity.mjs` against `https://eonapp.ch`.
6. Require `AUTHENTICATED_CITY_AND_GATE_PROVEN`, a matching `deploymentProvenance` block, Start Here `pointerOwnership`, screenshots, guest denial, signed-in boot, named HUD checks and refresh recovery.

## Next order after W600A

Do not start W608 final art or district expansion until W600A is proved. Then complete W607 desktop mouse/keyboard, controller, touch landscape, mobile Lite, reduced-motion, collision/camera, Voice/Chat, portal return and refresh/resume captures. W607 AI real-output evaluation is parallel only after W600A is queued and remains direct/local with redacted receipts.
