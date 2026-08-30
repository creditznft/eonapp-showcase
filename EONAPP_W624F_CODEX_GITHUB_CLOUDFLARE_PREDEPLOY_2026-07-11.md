# W624F Codex GitHub and Cloudflare Predeploy Instructions

Date: 2026-07-11  
Authoritative input: the W624F full source snapshot in this handover

## Goal

Apply the complete W624F snapshot to the current Codex branch, certify current product truth, update/open the GitHub PR and deploy through the existing Cloudflare project configuration. Do not merge or deploy from an older W624A–W624E worktree.

## Only required certification commands

```bash
npm ci
npm run verify:codex-predeploy
```

The external command intentionally remains stable across waves. It writes the final receipt to:

```text
reports/w624d-codex-predeploy/receipt.json
```

The stable `w624d` directory name is the permanent certification authority, not an indication that W624F is missing.

## Safe interruption and resume

The runner is serial, lock-protected and checkpointed. After every successful stage it writes:

```text
reports/w624d-codex-predeploy/checkpoint.json
```

When a terminal, CI wrapper or remote session interrupts the command, run the same command again. It resumes only when:

- the prior stages form an exact successful prefix of the current ordered stage list; and
- the SHA-256 certifying-source fingerprint is unchanged.

Any source change invalidates the checkpoint and starts a fresh certification. Never edit the checkpoint, receipt or lock manually while a live process exists. A stale lock is removed automatically when its recorded PID is no longer active.

## Expected maintained unit result

```text
826 assertions
779 passed
47 skipped
0 failed
225 maintained test files
```

The 47 skips are exact superseded assertions. Their 36 untouched originals remain checksummed in the explicitly non-certifying archive. Do not use wildcard historical discovery as release authority, reactivate obsolete assertions or rename the stable Codex command.

## Expected ordered predeploy result

The W624F receipt must identify wave `W624F` and show all **20** ordered stages with status `0`, including:

- maintained unit suite;
- live Dodo/current commercial/referral truth;
- production reachability;
- W624A–W624F City gates;
- current-contract alignment and archive integrity;
- zero-warning lint and secret scan;
- production build, smoke and post-build W623F certification.

## GitHub procedure

1. Confirm the intended branch and clean status.
2. Apply the entire W624F snapshot, including `archive/`, `config/`, `scripts/`, `tests/`, programme documents and reports.
3. Run the two required commands above.
4. Inspect the W624F receipt and confirm 20 successful stages.
5. Run `git diff --check` and review a secret-safe changed-file summary.
6. Commit with explicit W624F scope.
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
npm run proof:w624f-command-district-npcs:browser
```

This loopback proof is separate from release certification and cannot substitute for production authentication, physical-device performance or owner visual approval.
