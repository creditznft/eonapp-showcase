# W599 Current Codex Handover

> **historical-only.** This W599 receipt is preserved for production-authentication provenance. Use `CURRENT_PRODUCT_START_HERE.md` for the single current source and verification entrypoint; do not treat this file as a current coding instruction.

Current source branch:
`codex/w599-authenticated-city-repair`

Current source head:
`2e5a7f0d23f2791d6c8ab39459b953a2f736631d`

Current `origin/main` head when this handover was prepared:
`2e5a7f0d2`

What is done:
- W599 authenticated City access mode is on in production.
- Guest production lane is proven from production with `GUEST_ACCESS_POLICY_PROVEN`.
- Signed-in production lane proved the real Google-authenticated City contract, real Babylon canvas boot, and the guest/auth split.
- Real City source fixes were added for overlay coordination, resume-vs-first-run startup priority, and first-run runtime layout hardening.
- Current source-side checks passed for the latest committed source:
  - `node scripts/w591-eon-city-quality-summit-gate.mjs`
  - `node --test tests/unit/w592-eon-city-flagship-red-team.test.mjs tests/unit/w599-authenticated-city-access-and-cache.test.mjs`
  - `npm run build`

Important truthful blocker:
- At the time this handover was packaged, Cloudflare production was still serving the prior City stylesheet hash:
  - `/assets/eoncity-k_3frjJj.css`
- The newest runtime hardening commit had been pushed to `main`, but that exact production asset flip had not appeared yet during the final polling window.
- Because of that, the final authenticated production rerun is not honestly complete yet for commit `2e5a7f0d2`.

Most recent live findings before the final runtime-hardening deploy propagated:
- Guest lane passed.
- Signed-in lane reached the real canvas and current HUD.
- A real production UI defect remained in the live deployed build being served at that moment:
  - Start Here close action was not clickable because the deployed first-run overlay layout was wrong in the browser.
- The latest source patch was written specifically to harden that layout at runtime after auth/canvas boot.

Evidence folders in this package:
- `reports/w599-live-city-access-preflight/`
- `reports/w599-authenticated-eoncity/`
- `reports/w599-authenticated-eoncity-diagnostics/`
- `output/playwright/w599-guest-production/`

Recommended next step:
1. Confirm production `/eoncity` has flipped away from `/assets/eoncity-k_3frjJj.css`.
2. Rerun:
   - `node scripts/w599-live-city-access-preflight.mjs`
   - `node scripts/w599-run-authenticated-eoncity.mjs`
3. If the Start Here close/hit-area defect is gone, keep the resulting JSON and screenshots as the final W599 production-authenticated evidence set.
