# W399 ChatGPT Continuation Handoff

Date: 2026-06-28

## What was completed here

- merged the W390-W399 handover into the active codebase
- validated the merged source in a clean clone first
- removed one stale retired file: `assets/js/utils/nowpayments-config.js`
- ran `npm run verify:w399-prelaunch-candidate`: pass
- confirmed `327/327` runnable unit tests: pass
- confirmed build, smoke build, site audit, and launch readiness: pass
- fixed Cloudflare token access by using the refreshed token from `.env.local`
- applied the identity migration to Preview and Production D1
- verified live `EON_IDENTITY_DB` tables remotely
- deployed the W399 app build to Cloudflare Pages production
- verified `https://eonapp.ch` serves the same HTML as the fresh Pages deployment
- removed the redundant failing GitHub `repository_dispatch` fallback from `ci.yml` and pushed that workflow fix to `main`

## Live deployment truth

- live app domain: `https://eonapp.ch`
- verified Pages production deployment: `https://61316ed5.eonapp-ch.pages.dev`
- verified live app commit: `aeea34e5038e2be96c4fcc7b51e239ee7401f66e`
- follow-up GitHub workflow-only commit: `5336d28`
- follow-up GitHub-triggered production deployment: `https://c13f955c.eonapp-ch.pages.dev`

The newer `5336d28` commit changes GitHub workflow behavior only. It does not change runtime app code, and Cloudflare produced a fresh Production deployment from it, confirming the GitHub-to-Cloudflare path is working again.

## What remains true

- Google OAuth is configured for Production testing mode but was not live-tested in this session
- Preview Google OAuth remains intentionally disabled
- Collection remains locked
- EON Relay remains locked
- Action Gateway remains fail-closed
- connector deployment and custody remain inactive
- creator/remix measurement remains local opt-in count-only
- referral/reward/commercial systems remain inactive

## What ChatGPT should not over-claim

Do **not** claim any of the following as complete unless independently proven after this handoff:

- live Google login, logout, delete-account proof
- identity persistence proof from a real Google test-user session
- W276 update -> rollback -> local-data restoration proof
- real device screenshot certification
- Lighthouse-based release approval
- referral backend activation
- commerce or payment activation

## Best next steps

1. Inspect GitHub Actions on commit `5336d28` and confirm the removed dispatch fallback makes CI green.
2. Run controlled live Google test-user proof on Production testing mode.
3. Capture real desktop/mobile screenshots for Chat, Workspace, Profile, City 2D, and Babylon City Play.
4. Run the remaining browser evidence, rollback/restore proof, and optional Lighthouse pass.
5. Keep referral, commerce, and external action systems disabled until their own proof packs exist.

## Included companion notes

- `W399_MERGE_VALIDATION_STATUS_2026-06-28.md`
- `W399_REFERRAL_DB_AND_IDENTITY_STATUS_2026-06-28.md`
