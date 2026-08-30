# W624D Codex GitHub and Cloudflare Predeploy Instructions

Date: 2026-07-11  
Authoritative input: the W624D full source snapshot in this handover

## Goal

Sync the W624D source to the current Codex branch, certify current product truth once, then open/update the GitHub PR. Do not merge or deploy from an older W624A/W624C worktree.

## Required commands

```bash
npm ci
npm run verify:codex-predeploy
```

Successful completion writes:

```text
reports/w624d-codex-predeploy/receipt.json
```

The runner rejects overlapping certification, forces serial unit execution and performs 18 ordered stages. Do not start a second test run while it is active.

## What the current suite means

Expected maintained unit result:

```text
814 tests
767 passed
47 skipped
0 failed
```

The 47 skips are not unknown debt. They are exact superseded assertions listed in `config/w624d-current-contract-alignment-contract.mjs`. Their 36 original files are preserved in `archive/tests/superseded-exact-copy/W624D_2026-07-11/` with checksums. Current replacement tests are mandatory and the archive gate fails if a skip, replacement or checksum drifts.

Do not run wildcard test discovery as the release authority. Do not reactivate old approval-pending Dodo, pre-Create navigation or alternate-City assertions merely to reduce skips.

## GitHub procedure

1. Confirm the target branch and clean status.
2. Copy/apply the complete W624D snapshot, including `archive/`, `config/`, `scripts/`, `tests/`, programme docs and reports.
3. Run the required predeploy command.
4. Inspect the receipt and verify every stage has status `0`.
5. Review `git diff --check` and a secret-safe changed-file summary.
6. Commit with an explicit W624D scope.
7. Push the branch and update/open the PR.
8. Merge/fast-forward only after the PR checks agree with the local current-contract receipt.

## Cloudflare procedure

Cloudflare referral infrastructure is already live in **testing**. Do not recreate databases, rerun destructive migrations, alter identity databases, rotate secrets or set the referral rollout to Production during this City deployment.

Deploy the certified source through the existing project/branch configuration. After deploy, recheck:

- `/api/billing/status`
- `/api/referrals`
- `/api/billing/referral-status`
- `/eoncity` guest preview boundary
- authenticated `/eoncity` only when a genuine session is available

Keep genuine referral maturity/payment/reversal proof pending unless real business events occurred.

## Browser/device evidence

Run separately on a browser-capable owner/Codex machine:

```bash
npm run proof:w624d-wayfinder-camera:browser
```

This proof is not a substitute for physical touch/controller/performance or owner visual approval.
