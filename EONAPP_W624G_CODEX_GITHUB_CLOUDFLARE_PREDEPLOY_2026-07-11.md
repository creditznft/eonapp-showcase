# W624G Codex GitHub and Cloudflare Predeploy Instructions

Date: 2026-07-11  
Authoritative input: W624G full source snapshot

## Use only these certification commands

```bash
npm ci
npm run verify:codex-predeploy
```

The stable external command remains unchanged. It writes:

- `reports/w624d-codex-predeploy/checkpoint.json`
- `reports/w624d-codex-predeploy/receipt.json`
- `reports/w624d-current-unit-suite/checkpoint.json`
- `reports/w624d-current-unit-suite/receipt.json`

The stable `w624d` paths are permanent certification authorities, not stale wave labels.

## Safe resume

The outer runner checkpoints successful gates against the certifying-source SHA-256 fingerprint. The maintained unit stage is also split into nine serial chunks and checkpoints each green chunk. Re-run the same command after interruption.

Resume is allowed only when the source fingerprint and exact ordered prefixes are unchanged. Any source edit invalidates the checkpoints and restarts certification. Never overlap two runs or edit lock/checkpoint files while a live process exists.

## Expected maintained result

- 226 maintained test files
- 832 assertions
- 785 current passes
- 47 explicit superseded skips
- 0 failures

The 36 untouched historical source files remain checksummed and non-certifying.

## Expected predeploy result

The final receipt must identify `W624G` and show **21/21** successful stages, including W624G’s productive-RPG gate, current alignment/archive authority, lint, secret scan, build, smoke and post-build certification.

## GitHub

Apply the complete snapshot—not only runtime files. Run certification, inspect both receipts, run `git diff --check`, review the secret-safe changed-file list, commit W624G scope, push and update/open the PR. Merge only when PR checks match the local receipt.

## Cloudflare

Deploy through the existing project/branch configuration. Do not recreate D1 databases, rerun destructive migrations, rotate secrets or promote referrals beyond `testing`. Recheck billing/referral endpoints and guest/authenticated City boundaries. Genuine referral, payment, maturity and reversal proofs remain pending unless real lifecycle events occurred.

## Separate browser proof

```bash
npm run proof:w624g-productive-rpg-loop:browser
```

This cannot replace production authentication or genuine product-outcome/device evidence.
