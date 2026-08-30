# EONAPP.CH Final Release Signoff (2026-05-04)

## Done (Verified)
- [x] `main` is synced to GitHub remote.
- [x] Frontend launch gates pass:
  - `launch:readiness`
  - `launch:page-gate`
  - `launch:identity-gate`
  - `launch:games-identity-gate`
  - `launch:lootbox-gate`
- [x] `audit:site` passes.
- [x] Frontend lint passes (clean).
- [x] Frontend unit tests pass.
- [x] Smart contracts compile and smoke tests pass.
- [x] CI workflow hardened with script smoke checks and site audit gate.
- [x] Deploy workflow hardened with Cloudflare secret precheck.
- [x] Node 24 action-runtime migration flag added in CI + deploy workflows.

## Pending (External Console Action Needed)
- [ ] Add GitHub secret `CLOUDFLARE_API_TOKEN`.
- [ ] Add GitHub secret `CLOUDFLARE_ACCOUNT_ID`.
- [ ] Re-run `Deploy to Cloudflare Pages` and confirm success.
- [ ] Confirm latest CI run status is green in GitHub Actions UI.
- [ ] Confirm latest deploy run status is green in GitHub Actions UI.
- [ ] Verify live route accessibility from non-blocked network/browser.

## Evidence Snapshot
- Last confirmed code sync branch: `main...origin/main` clean.
- Last known deploy failure reason: missing `apiToken` input.
- Workflow files updated:
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy.yml`

## Operational Handoff
Use this runbook to finish Cloudflare integration:
- `docs/CLOUDFLARE_GITHUB_CONNECTION_GUIDE_2026-05-04.md`
