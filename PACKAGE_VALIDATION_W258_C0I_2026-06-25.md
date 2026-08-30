# W258 C0-I Package Validation

This package is a clean source-and-evidence snapshot after W258 C0-I implementation.

## Included

- Full EONAPP source at the R3-F1/F2 + W258 state.
- Full Smart Contracts source workspace with C0-I registry, scripts, exact compiler pin, tests, operator safety changes, and non-authorizing evidence.
- C0-P supplied evidence archive, W258 static/unit/build evidence, and Codex runbook.

## Excluded by package rule

- `node_modules/`
- `dist/`
- `.git/`
- `.env*`
- Hardhat `artifacts/` and `cache/`
- temporary folders, browser reports, and runtime build outputs
- credentials, private keys, seed phrases, and wallet exports

## Evidence status

- EONAPP local-static baseline: passed (193/193 unit tests, lint, production build and selected release gates).
- C0-I code/test/static evidence: passed.
- C0-I approval: blocked; see `CHANGELOG_W258_C0I_MAINNET_IDENTITY_LANE_2026-06-25.md`.
