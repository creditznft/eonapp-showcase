# EONAPP RT97 — CODEX RELEASE START HERE

Status: **local release candidate source; not yet deployed**. Production remains the RT95 authority until the protected RT97 workflow finishes successfully.

## Immutable baseline authority
- Repository: `creditznft/EONAPP`
- Production baseline branch: `backup/rt95-live-exact-2026-08-29`
- Production baseline commit: `4d09eba31704b3fb25e41a5cdeb72702ac703825`
- Production baseline tree: `7731d852448f0cabdb2a1f9817af861115200887`
- RT97 source branch to create/use: `codex/rt97-release-candidate-2026-08-30`
- RT97 release trigger branch: `release/rt97-production`
- Protected workflow: `.github/workflows/rt97-production-release.yml`
- Explicit request file: `.github/rt97-production-request.json`

Do **not** invent a commit or tree for this ZIP. Codex must create the Git commit after reconstructing the supplied source on an isolated branch rooted at the exact RT95 baseline, then record the real commit/tree in the request only after CI is green.

## Non-negotiable release sequence
1. Verify the supplied package SHA-256 and manifests.
2. Clone/fetch `creditznft/EONAPP`; confirm exact RT95 baseline exists and is unchanged.
3. Create `codex/rt97-release-candidate-2026-08-30` from the exact RT95 baseline. Never force-push.
4. Replace the branch worktree with the supplied RT97 candidate source while preserving `.git`; verify the source delta/manifests.
5. Use Node 22 and exact `npm ci` dependencies.
6. Run `npm run verify:codex-predeploy` and `npm run verify:rt97-release` plus normal CI. Repair genuine failures; do not weaken security or policy gates.
7. Commit/push the exact candidate branch. Wait for **CI** to finish green on that exact commit.
8. Before the production trigger, verify Cloudflare Production project settings. **India (`IN`) must be present in `EON_VEXRAIL_COUNTRIES`.** See `02_CLOUDFLARE_PRODUCTION_AUTHORITY.md`.
9. Put the exact green source commit/tree into `.github/rt97-production-request.json` on `release/rt97-production` and push that request branch. That push is the only intended Production trigger.
10. The protected workflow re-runs predeploy + RT97 gates, validates Cloudflare configuration, applies ordered D1 migrations, builds an immutable candidate, deploys identical bytes to the gate Preview, proves Preview, captures rollback authority, promotes identical bytes to Production, proves eonapp.ch, and rolls back automatically if post-deploy proof fails.
11. After workflow success, perform the real Chrome/India/browser/device checks in `05_PRODUCTION_BROWSER_TEST_MATRIX.md` before scaling traffic.

## Executive release boundaries
- Ordinary display/banner advertising remains **OFF** on product/work surfaces and EON City.
- AdSense bootstrap is restricted to reviewed public guide/editorial acquisition pages. Google approval/account/CMP/live placement review remain external gates.
- ExoClick is used only for the explicit Sponsor Video / bounded rewarded route. Browser completion cannot mint permanent economic value.
- Vexrail is selected-country sponsored AI; Production allowlist includes `US,CA,GB,DE,IN`. Local AI/BYOK never silently falls back to Vexrail.
- Sponsored Discovery is a separate signed-in review-and-confirm tool that sends only the bounded reviewed commercial intent as a new one-turn request through the existing Vexrail server authority. No full conversation, Local/BYOK answer, memory, BYOK key, file or attachment is sent; it never consumes the guest one-shot.
- Paid traffic scaling remains closed until reconciled provider evidence shows positive contribution economics.
- Physical-device City acceptance cannot be manufactured by CI; weak Android/device recovery remains an explicit post-deploy certification gate.
