# W624H Codex GitHub and Cloudflare Predeploy Instructions

Date: 2026-07-11  
Authoritative input: W624H full source snapshot

## Stable certification command

```bash
npm ci
npm run verify:codex-predeploy
```

Do not substitute the historical full-unit bundle. The stable command uses the maintained 227-file suite, 47 explicit non-certifying historical skips, source-fingerprinted outer checkpoints and nine inner unit chunks.

After interruption, rerun the identical command. Resume is allowed only when the certifying source fingerprint is unchanged. Do not overlap processes or manually edit locks/checkpoints.

## Expected maintained result

- 227 maintained files
- 838 assertions
- 791 current passes
- 47 explicit archived skips
- 0 failures

## Expected predeploy result

The receipt at `reports/w624d-codex-predeploy/receipt.json` must identify `W624H` and show **22/22** successful ordered stages, including W624H, alignment/archive guards, lint, secret scan, build, smoke and post-build certification.

## GitHub

Apply the complete snapshot, run certification, inspect the current-unit and predeploy receipts, run `git diff --check`, commit the full W624H scope, push, and merge only when PR checks match the local receipts.

## Cloudflare

Deploy through the existing project configuration. Do not recreate D1, rotate secrets, rerun destructive migrations or change referral rollout from `testing`. Recheck `/api/billing/status`, referral endpoints and City guest/authenticated boundaries.

## Separate browser proof

```bash
npm run proof:w624h-truthful-command-center:browser
```

This cannot replace live production or physical-device evidence.
