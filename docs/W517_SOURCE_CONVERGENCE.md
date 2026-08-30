# W517 — Source Convergence

## Scope

W517 is a reproducibility wave only. It does not change product behaviour, activate dormant integrations, or certify a deployment, browser, or device.

It fixes the W516 finding that a normal verification pass could mutate committed route/SEO files and timestamped historical gate reports.

## Canonical commands

```bash
npm run w517:generate
npm run verify:clean-checkout
npm run release:verify:canonical
```

`w517:generate` runs the five owned generators, then writes the deterministic W517 source manifest, source inventory, and release-authority registry.

`verify:clean-checkout` requires a clean Git worktree, runs the prescribed generators, checks root/public PWA mirrors, validates the current manifest, and fails on any source drift. Its time-bearing receipt is written only below `tmp/evidence/w517-source-convergence/`.

`release:verify:canonical` is the source-only release command. It runs clean-checkout verification, current unit tests, lint, tracked-JavaScript syntax, build, smoke, site audit, public-output quarantine, launch readiness, production dependency audit, and a final clean-checkout verification.

## Evidence boundary

- `artifacts/w517-source-convergence/` contains deterministic, committed source metadata only.
- `tmp/evidence/w517-source-convergence/` contains local time-bearing receipts and is ignored by Git.
- The registry makes only its `active` entries release-authoritative. `superseded`, `archival`, and `evidence-only` commands cannot make the canonical result green.
- W489, W492, and W514 remain external real-browser/device evidence work. A W517 pass does not change those statuses.

## Rollback

Revert the W517 commit series and run `npm run w517:generate` on the restored source. No user data, runtime product route, provider integration, payment, reward, social posting, local media adapter, Cloudflare sync, or device-control behaviour is touched by this wave.
