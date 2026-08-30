# Package validation — W260 R3 A1/A2/A3 roadmap, performance and referral state

The companion integrity file records ZIP integrity, clean extraction and source-manifest verification after packaging.

## Included

- Complete source, tests, scripts, configuration, root and Smart Contracts lockfiles.
- W255–W290 canonical roadmap, A1/A2/A3 handoff, Cloudflare owner runbook and evidence-limit receipts.
- Route inventory and static contracts required to reproduce local checks.
- Non-secret archival manifests and evidence required to preserve the R3-F1 boundary.

## Excluded

- `node_modules`, `dist`, `.git`, generated `artifacts`, temporary/log/cache folders, raw Lighthouse reports, coverage, Playwright output, Hardhat artifacts/cache, `.env*` and secrets.

## Evidence boundary

The package preserves the Lighthouse environment-blocked receipt and all-route static result, but does not pretend either is a valid Lighthouse score. It also preserves the Cloudflare source-state decision without claiming remote dashboard/D1 evidence.

The source SHA-256 manifest excludes itself to avoid a circular checksum.
