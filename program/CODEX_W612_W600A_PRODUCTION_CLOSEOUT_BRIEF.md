# Codex Brief — W612 Deploy Parity + W600A Production Closure

## Authority and scope

Start from this complete W612 source package. It contains W607 City mechanics plus W612 deploy-candidate provenance. Do not overlay old W596–W598 archives. Do not touch payments, subscriptions, wallet, rewards, account changes, or social-posting paths.

W612 is not a release claim. It only makes W600A evidence capable of detecting a stale/mismatched deployment.

## 1. Establish the real deploy candidate

```bash
git fetch origin --prune
git status --short
git rev-parse HEAD
git rev-parse origin/main
```

Inspect the real branch state and current production deploy. Do not assume this ZIP is already live. Commit the W612 delta normally from the real checkout. The committed revision is the only source revision that may be used for the production run.

## 2. Validate the exact checkout

```bash
npm ci
npm run lint -- --max-warnings=0
npm run qa:w612-build-provenance
npm run qa:w607-city-gameplay-contract
node --test tests/unit/w599-authenticated-city-access-and-cache.test.mjs
npm run test:unit
EONAPP_SOURCE_REVISION="$(git rev-parse HEAD)" npm run build
npm run smoke:build
```

`npm run test:unit` is the maintained current-product certification suite. The unbounded wildcard `node --test tests/unit/*.test.mjs` is historical/archive diagnostics and must not replace the maintained suite or be reported as a release pass.

Before deployment, inspect `dist/build-provenance.json`:

- `sourceRevision` must equal `git rev-parse HEAD`.
- `privacy.containsUserData` and `privacy.containsSecrets` must both be `false`.
- It must include a distribution SHA-256 plus hashes for `eoncity.html`, `eoncity/index.html`, and `sw.js`.

## 3. Deploy and prove exact parity

Deploy the same committed checkout normally. After the production deployment is active, fetch the public provenance document with cache bypass and confirm its `sourceRevision` equals the deployed commit. The `/build-provenance.json` response must be non-cacheable and non-indexable.

Do not redact or alter the hash fields. Redact only browser/session/personal data in evidence exports.

## 4. Normal signed-in W600A browser run

Use only a human's normal signed-in Chrome/Edge profile with a loopback-only DevTools endpoint. Do not run Codegen login, browser-state export/import, cookie injection, fake session, Google bypass, or a guest City renderer route.

Run from the exact checkout that built the deployed candidate:

```bash
EON_CITY_AUTH_BASE_URL=https://eonapp.ch \
EON_CITY_CDP_ENDPOINT=http://127.0.0.1:9222 \
EON_CITY_EXPECTED_BUILD_PROVENANCE="$PWD/dist/build-provenance.json" \
node scripts/w599-run-authenticated-eoncity.mjs
```

Require all of the following in `reports/w599-authenticated-eoncity/summary.json`:

- `outcome: AUTHENTICATED_CITY_AND_GATE_PROVEN` (not merely `PASS_WITH_DIAGNOSTICS`);
- guest access denies full Babylon boot;
- signed-in access permits full boot;
- `deploymentProvenance.sourceRevision` and all four hash fields match the local build;
- Start Here pointer ownership reports `topMatchesControl: true` and the canvas does not win the hit stack;
- named EONBOT, Voice, Chat, Districts, Command Deck and Menu exist; generic `Interact` does not;
- required panels close; keyboard reaches the canvas; refresh recovers.

A `CITY_OVERLAY_POINTER_INTERCEPT`, a provenance mismatch, or a cache mismatch is a real blocker. Do not downgrade it to a test flake.

## 5. What happens next

Only after W600A is real-production green, collect W607 desktop/controller/touch/reduced-motion/low-end Lite evidence. Do not call final art, AAA approval, physical controller/mobile proof, voice conversation, or district expansion complete from source tests.
