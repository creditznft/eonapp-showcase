# Package validation — W260 R2 / W266 + W276 evidence hardening

The companion `*.integrity.txt` records ZIP integrity, clean extraction and
source-manifest verification after packaging.

## Included

- Full app source, tests, scripts, configurations, contract workspace and
  non-secret evidence required to reproduce local checks.
- W266/W276 source contracts, gates, evidence boards, handoff and validation
  notes.
- Root and Smart Contracts lockfiles.

## Excluded

- `node_modules`, `dist`, `.git`, generated `artifacts`, `tmp`, coverage,
  Playwright reports/results, Hardhat artifacts/cache, `.env*` files and
  secrets.

## Evidence boundary

The W266 generated capture manifest is excluded because it is an
environment-blocked local artifact, not release evidence. The included board
and environment note preserve the limitation transparently.

The source SHA-256 manifest intentionally excludes itself to avoid a circular
checksum.
