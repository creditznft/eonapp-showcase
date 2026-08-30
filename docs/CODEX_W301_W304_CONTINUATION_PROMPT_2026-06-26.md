# Codex continuation prompt — W301–W304 implementation handoff

Work from the W301–W304 source handoff. Read first:

- `docs/W301_W304_IMPLEMENTATION_STATUS_2026-06-26.md`
- `docs/W301_GIT_HISTORY_SECRET_REMEDIATION_RUNBOOK_2026-06-26.md`
- `assets/js/capabilities/capability-truth-registry.js`
- `config/w303-legacy-salvage-manifest.json`
- `assets/js/chat/eonbot-action-cards.js`

## Current status

W302, W303, and W304 are implemented and their focused source gates pass. W301 is prepared but not complete because the source handoff has no Git history and remote-history remediation requires an explicit repository-owner decision.

The complete unit suite remains blocked by two defects present in the original supplied W250–W290 archive:

- absent `release-evidence/` boards expected by legacy/current source gates;
- 25 mismatches in the retired-value-systems archive hash verification.

Do not make up evidence files, rewrite archival hashes, or suppress tests. Obtain canonical evidence and manifest data from the authoritative repository/commit first.

## Do now

1. Verify the source handoff checksum and inspect the changed-files manifest.
2. In a clean clone of the actual draft PR, check the exact current secret-scanner findings without printing values.
3. Follow the W301 runbook only after real-credential rotation decisions are recorded by the owner.
4. Restore the missing release-evidence data only from an authoritative source and validate its lineage.
5. Re-run:
   - `npm ci --include=dev --no-audit --no-fund`
   - `npm run lint -- --max-warnings=0`
   - `npm run qa:w301-w304-foundation`
   - `node scripts/secret-scan.mjs --mode=workspace --allow-no-history`
   - `npm run test:unit`
   - `npm run build`

## Do not do

- Do not merge draft PR #2, force-push, deploy, mutate Cloudflare/D1, or begin W305.
- Do not add OAuth, account tables, browser token storage, provider connections, jobs, queues, schedules, publishing, or external execution.
- Do not reactivate legacy social publisher, agent executor, Workbench/Creator standalone routes, platform-backend, referrals, rewards, wallets, pools, swaps, or value systems.
- Do not change the product truth to make a planned/local capability look connected or executed.
