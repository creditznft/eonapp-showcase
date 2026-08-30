# RT97 Git provenance and green-CI procedure

## Confirm baseline before applying RT97
```bash
git fetch origin --prune
git rev-parse origin/backup/rt95-live-exact-2026-08-29
git rev-parse 'origin/backup/rt95-live-exact-2026-08-29^{tree}'
```
Expected:
- commit `4d09eba31704b3fb25e41a5cdeb72702ac703825`
- tree `7731d852448f0cabdb2a1f9817af861115200887`

If either differs, stop. Do not rebase RT97 onto an unverified moving branch.

## Candidate branch
```bash
git switch --detach 4d09eba31704b3fb25e41a5cdeb72702ac703825
git switch -c codex/rt97-release-candidate-2026-08-30
```
Apply/copy the supplied RT97 release-candidate tree into this isolated worktree. Do not copy `.git` from an archive and do not delete the live backup branch.

## Local certification before commit
Use Node 22. Then:
```bash
npm ci --include=dev --no-audit --no-fund --prefer-offline
npm run verify:codex-predeploy
npm run verify:rt97-release
npm run security:secret-scan
```
If the full maintained suite exposes an inherited assertion, prove it against the exact RT95/RT96 authority before changing it. Never make a security/privacy/revenue assertion weaker merely to turn CI green.

## Commit and push
Suggested commit message:
```text
RT97: release candidate — India Vexrail, AdSense guides, lifecycle and trust gates
```
Then:
```bash
git add -A
git diff --cached --check
git commit -m "RT97: release candidate — India Vexrail, AdSense guides, lifecycle and trust gates"
SOURCE=$(git rev-parse HEAD)
TREE=$(git rev-parse "${SOURCE}^{tree}")
printf 'SOURCE=%s\nTREE=%s\n' "$SOURCE" "$TREE"
git push -u origin codex/rt97-release-candidate-2026-08-30
```
No force push.

## Green means exact-source green
The `CI` workflow has an RT97-specific job and the permanent predeploy job. Do not authorize Production from a local-only PASS. Record the successful `CI` workflow run tied to the exact candidate SHA.

The RT97 Production workflow also independently queries GitHub and refuses to release unless the request SHA is exactly the current `codex/rt97-release-candidate-2026-08-30` tip and a successful `CI` push run exists for that SHA.

## Production request
Only after exact-source CI is green:
1. Create/switch to `release/rt97-production` from an appropriate repository authority without changing candidate source.
2. Replace the placeholder `sourceCommit` and `sourceTree` in `.github/rt97-production-request.json` with the exact values printed above.
3. Commit only the request update on the release branch.
4. Push normally. This triggers `RT97 Exact Production Release`.

Do not modify `.github/workflows/rt92-production-release.yml`; it is historical RT92 authority. RT97 uses its own workflow.
