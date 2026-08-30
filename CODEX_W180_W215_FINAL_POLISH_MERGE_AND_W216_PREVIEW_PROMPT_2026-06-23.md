This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex: W180–W215 Final Polish Merge and W216 Preview Evidence

## Role

Act as a careful release engineer. Treat this archive as a full cumulative source tree. Do not layer earlier W180–W212 archives over it.

## Non-negotiable boundaries

- Monetization stays disabled: no ads, offerwalls, referral rewards, revenue share, payouts, checkout, payment activation, subscriptions from rewards, provider SDKs, callbacks, or campaigns.
- `eon2` referral links and `eon3` Realm links remain self-contained, durable signed links; do not introduce a D1/KV/Worker issued-link registry, resolver, click log, or raw-token storage.
- Existing `REFERRALS_DB` may only be used later for qualified pseudonymous relationship records, not link issuance/opening.
- 2D EON City remains default. The 3D station is optional, device-gated, quiet, and must retain a 2D fallback.
- Trade remains manual/reference/paper-only. No exchange execution, order creation, withdrawal, or raw credential acceptance.

## 1. Verify package before any merge

1. Download the final archive and `.sha256` sidecar.
2. Verify the SHA-256 value.
3. Extract into a new temporary directory.
4. Confirm `package.json`, `package-lock.json`, `_headers`, `_redirects`, `assets`, `functions`, `scripts`, `tests`, `public`, and the W216 documents are present.
5. Confirm there are no `.env` secrets, `node_modules`, `dist`, local IPNS config, or old ZIP archives in the package.

## 2. Merge safely into the live repository

1. In the live repo, create a branch such as `release/w180-w215-final-polish`.
2. Record `git status`, current commit, and a clean pre-merge backup/commit.
3. Compare the extracted tree with the live repo. Preserve any proven newer live fix that is not represented in this archive; do not blindly overwrite it.
4. Apply the final tree as the intended W180–W215 baseline.
5. Review conflicts in these priority areas:
   - `_headers`, `_redirects`, `public/_redirects`, `vite.config.mjs`;
   - `assets/js/utils/signed-share-link.js`, `referral-par.js`, `realm-share-runtime.js`;
   - `realm-studio.html`, `realm-profile.html`, `referral.html`;
   - `eoncity.html`, `eoncity-3d.html`, City CSS/JS;
   - `trade.html`, Trade safety modules;
   - reward/campaign compatibility modules and `functions/api/rewards/*`;
   - local Vault persistence and backup modules;
   - W216 audit scripts and tests.
6. Do not bring historical W181–W212 packages back into the tree.

## 3. Install and prove the local release candidate

Run:

```bash
npm ci
npm run qa:w216-release-candidate
```

Expected result: zero exit status. This validates current targeted W180–W216 source gates, syntax, lint, build, smoke, site audit, launch gates, PWA manifest/source readiness, and production dependency audit.

Then run, record, and do not conceal:

```bash
npm run test:unit
```

The broad legacy diagnostic is currently expected to remain red because it retains stale historic assumptions. Read `TEST_BASELINE_AND_LEGACY_DIAGNOSTIC_W216_2026-06-23.md`; do not claim it is green.

## 4. Cloudflare Preview W216 evidence run

Deploy a Preview, not production. Use the preview URL in a real browser and collect evidence for:

1. `/chat`, `/projects`, `/library`, `/workspace`, `/market`, `/vault`, `/trade`.
2. `/eoncity` on desktop and low-device/mobile widths.
3. `/eoncity/3d` on a capable desktop, reduced-motion, save-data, mobile, and no-JavaScript fallback scenarios.
4. `/realm-studio` create → save local record → issue fresh `eon3` link → copy/native share → QR scan on a second device.
5. `/referral` issue fresh `eon2` link → copy/QR scan → landing verification.
6. `/about`, `/privacy`, `/billing`, `/support`, `/tools`, `/leaderboard`, `/rewards`, `/telegram` for truthful no-campaign language.
7. PWA install/update on Android, iPhone Safari, and desktop.
8. Vault/Projects/Library/Automations/Market preview/Realm Studio persistence across a Preview update with same browser profile.
9. Response headers, CSP behavior, no provider SDK/callback requests, and no console errors.

Fill `EONAPP_W216_EVIDENCE_MATRIX_2026-06-23.md` with links/screenshots/results. Only after the matrix is complete and reviewed may production promotion be considered.

## 5. Commit discipline

- Commit source and tests separately from generated evidence.
- Never commit `.env`, Cloudflare secrets, real API keys, wallet keys, recovery phrases, provider callbacks, exported encrypted user backups, or QR screenshots containing private user data.
- Do not say “fully certified” until real Preview/device evidence is attached.
