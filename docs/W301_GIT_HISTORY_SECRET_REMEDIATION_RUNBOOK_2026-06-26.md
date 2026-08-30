# W301 — Git-history secret remediation runbook

**Scope:** remediation of reachable Git history only. The packaged W250–W290 working tree passes `node scripts/secret-scan.mjs --mode=workspace --allow-no-history`; this does **not** prove the remote history is clean.

## Preconditions and owner decisions

1. Keep PR #2 draft and do not deploy Preview or production.
2. Security owner determines whether every historical hit was a real credential or a non-production fixture. Do not paste values into tickets, chat, commits, CI logs, screenshots, or this document.
3. Rotate any credential that could have been real **before** history rewriting. Record only provider, rotation timestamp, owner, and a private incident reference.
4. Inventory all reachable refs: branches, pull-request refs, tags, forks under team control, release artifacts, GitHub Actions caches, and any mirrors.

## Minimal reviewed rewrite approach

Use a disposable clean clone and an approved rewrite tool. For the currently reported paths, remove the affected historical paths from all reachable commits, then restore only the current known-safe versions in one audited commit if those files remain required by the branch.

```bash
# Run only after credential rotation and repository-owner approval.
git clone --mirror <approved-repository-url> eonapp-history-cleanup.git
cd eonapp-history-cleanup.git

git filter-repo \
  --path tests/unit/w211-workspace-automation.test.mjs --invert-paths \
  --path docs/COPILOTHANDOVER.MD --invert-paths \
  --path docs/LAUNCH-CHECKLIST.md --invert-paths

# Verify the rewritten object graph before pushing any rewritten ref.
git fsck --full --no-reflogs --unreachable
```

The exact path list must be regenerated from the current CI scanner output. Do not blindly reuse this example if the scanner reports another reachable file or ref.

## Post-rewrite requirements

1. Restore any required safe current file from a reviewed worktree in a new commit; do not copy a historical version.
2. Force-push only the explicitly approved rewritten branch/ref set. Remove or rewrite all other reachable refs that still retain the old objects.
3. Request GitHub cache/pull-request ref guidance when platform-managed refs retain the old commits.
4. Run `node scripts/secret-scan.mjs --mode=ci` in the rewritten clone and confirm it scans reachable Git history.
5. Run fresh `npm ci --include=dev --no-audit --no-fund`, unit tests, zero-warning lint, build, and the static certification gates.
6. Re-open CI review only after the history scanner is green. Preview remains prohibited until that evidence exists.

## Prohibitions

- No force-push, rewrite, remote ref deletion, Cloudflare change, deployment, or credential revocation occurs from the browser app or this handoff package.
- Never suppress a scanner finding merely by adding a broad ignore rule.
- Never publish a raw historical value while diagnosing the issue.

## Completion evidence

Attach a masked history-scan report, ref inventory, rotation ledger reference, rewrite command review, post-rewrite commit map, CI run URL, and fresh local validation report. W301 is not complete without a green reachable-history scan in the real Git clone.
