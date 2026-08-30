# W216 Final Polish — Changed Files

## Release orchestration

- `package.json`
  - added `qa:w216-source-syntax`
  - added `qa:w216-release-candidate`
  - added `test:release`
  - added `test:unit:legacy-diagnostic`

## W216 route and public-boundary proof

- `scripts/site-audit.mjs`
  - understands `/realm-studio`, `/referral`, `/r`, and `/m` canonical source routes.
- `scripts/w216-local-finalization-gate.mjs`
  - validates current 2D/3D City separation, signed shares, public truth surfaces, and retirement of old competing routes.
- `tests/unit/w216-local-finalization.test.mjs`
  - proves eon2/eon3 formats, Realm Studio no-registry behavior, disabled commercial modules, public truth, and legacy route retirement.
- `scripts/launch-page-invariants.mjs`
- `scripts/launch-identity-surface-gate.mjs`
- `scripts/app-surface-quality-gate.mjs`
- `assets/js/utils/app-surface-quality-gates.js`

## EON City, Realm, Trade, and sharing

- `eoncity.html`
- `eoncity-3d.html`
- `assets/js/eon-operator-map.js`
- `assets/js/eon-city-3d-station.js`
- `assets/css/eon-city-3d-station.css`
- `realm-studio.html`
- `assets/js/realm-studio-page.js`
- `realm-profile.html`
- `assets/js/realm-profile-page.js`
- `referral.html`
- `assets/js/referral-landing-page.js`
- `assets/js/utils/signed-share-link.js`
- `assets/js/utils/realm-share-runtime.js`
- `assets/js/utils/referral-par.js`
- `assets/js/utils/referral-share-center.js`
- `trade.html`
- `assets/js/trade/eon-trade-page.js`
- `assets/js/trade/eon-trade-safety-proof.js`

## Security, trust, and campaign-disabled truth

- `_headers`
- `_redirects`
- `public/_redirects`
- `assets/js/utils/privacy-telemetry.js`
- `tests/unit/w214-security-trust.test.mjs`
- `about.html`
- `privacy.html`
- `billing.html`
- `support.html`
- `tools.html`
- `leaderboard.html`
- `rewards.html`
- `reward-access.html`
- `telegram.html`
- `assets/js/rewards/eon-rewards-page.js`

## Final handover documentation

- `W216_LOCAL_RELEASE_AUDIT_2026-06-23.md`
- `W216_BROWSER_RENDER_LIMITATION_2026-06-23.md`
- `W216_ARCHIVE_REPRODUCIBILITY_2026-06-23.md`
- `TEST_BASELINE_AND_LEGACY_DIAGNOSTIC_W216_2026-06-23.md`
- `FUTURE_EXPANSION_ROADMAP_POST_W216_2026-06-23.md`
- `CODEX_W180_W215_FINAL_POLISH_MERGE_AND_W216_PREVIEW_PROMPT_2026-06-23.md`
- `CODEX_START_HERE_W216_FINAL.md`
- `CODEX_PACKAGE_CONTENTS_W180_W215_FINAL_POLISH.md`
- `README_APPLY_W180_W215_FINAL_POLISH_2026-06-23.md`
- `CHANGED_FILES_W216_FINAL_POLISH.md`
