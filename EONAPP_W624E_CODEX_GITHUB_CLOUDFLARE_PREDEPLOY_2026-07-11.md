# W624E Codex GitHub and Cloudflare Predeploy Instructions

Date: 2026-07-11  
Authoritative input: the W624E full source snapshot in this handover

## Goal

Apply the complete W624E snapshot to the current Codex branch, certify current product truth once, then update/open the GitHub PR and deploy through the existing Cloudflare project configuration. Do not merge or deploy from an older W624A–W624D worktree.

## Only required certification commands

```bash
npm ci
npm run verify:codex-predeploy
```

The external command intentionally remains stable across waves. The lock-protected runner now includes W624E and writes:

```text
reports/w624d-codex-predeploy/receipt.json
```

The `w624d` directory name is a compatibility-stable certification authority, not an indication that W624E is missing. Verify that the receipt schema/wave is W624E and all **19** ordered stages have status `0`.

## Expected maintained unit result

```text
820 tests
773 passed
47 skipped
0 failed
224 maintained test files
```

The 47 skips are exact superseded assertions. Their 36 original files remain checksummed in the explicitly non-certifying archive. Do not use wildcard historical discovery as release authority, delete the archive, reactivate obsolete assertions or rename the stable Codex command.

## GitHub procedure

1. Confirm target branch and clean status.
2. Apply the complete W624E snapshot, including `archive/`, `config/`, `scripts/`, `tests/`, programme documents and reports.
3. Run the two required commands above once.
4. Inspect the W624E receipt and confirm 19 successful stages.
5. Run `git diff --check` and review a secret-safe changed-file summary.
6. Commit with explicit W624E scope.
7. Push and update/open the PR.
8. Merge/fast-forward only when PR checks agree with the local receipt.

## Cloudflare procedure

Cloudflare referral infrastructure is already live in **testing**. Do not recreate databases, rerun destructive migrations, alter identity/billing databases, rotate secrets or promote the referral rollout during this City deployment.

Deploy the certified source through the existing project/branch configuration. Recheck:

- `/api/billing/status`
- `/api/referrals`
- `/api/billing/referral-status`
- `/eoncity` guest preview boundary
- authenticated `/eoncity` only with a genuine session

Keep genuine referral/payment/maturity/reversal proof pending unless real business events occurred.

## Separate browser evidence

```bash
npm run proof:w624e-eonbot-orbit:browser
```

This loopback proof is separate from release certification and cannot substitute for production authentication, physical-device performance or owner visual approval.
