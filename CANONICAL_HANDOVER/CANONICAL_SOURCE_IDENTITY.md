# Canonical package identity

## Exact upstream source used

- **Input source archive:** `EONAPP_W479_VOICE_AND_UNIVERSAL_POST_KIT_SOURCE_2026-07-02.zip`
- **Input source SHA-256:** `573c1cab1a6f42bc2184f01848e537bacdda95aaacabc048e10b2ecb0e7e7614`
- **Input source entry count:** 2837 files
- **Input source scope:** complete runnable source through W479-V + W479-P0.

## What this canonical package adds

This canonical package does **not** change application source code. It preserves every source file from the verified input archive byte-for-byte and adds only:

- `00_CODEX_START_HERE__CANONICAL_W479V_P0.md`;
- `CANONICAL_HANDOVER/` with a single current merge protocol, current roadmap, current wave reports, and source manifest.

## Strong supersession rule

Codex must not combine this package with a prior W479 pre-Codex ZIP or sequentially overlay older W476/W477/W478 source packages. This archive is already the full accumulated source state. Overlaying older ZIPs after it can reintroduce stale files and remove later W479-V/P0 controls.

## Base branch rule

The codex transcript supplied by the owner records a verified live-fix base at `origin/codex/w4672-release-clean`, tip `503328e250d84f84d5af0577cb8ee5690798b9ec`, three commits ahead of `origin/main` with no divergence at the time of inspection. Re-fetch and re-check remote state before use; do not assume the branch is unchanged.
