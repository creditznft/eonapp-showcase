# W612 changed files — deploy provenance / W600A closure

## Runtime/build changes

- `scripts/build-provenance.mjs` — deterministic public deploy-candidate fingerprint helper.
- `scripts/build-production.mjs` — emits provenance after final minification.
- `scripts/w599-run-authenticated-eoncity.mjs` — compares local deploy candidate with the live public provenance before City proof.
- `_headers` and `public/_headers` — cache-bypass and de-index the provenance document in the deployment header sources.

## Test/quality changes

- `scripts/w612-build-provenance-gate.mjs` — source-integrity gate.
- `tests/unit/w612-build-provenance.test.mjs` — deterministic hash/privacy/revision tests.
- `scripts/run-current-unit-suite.mjs` — includes the W612 unit tests.
- `package.json` — adds `qa:w612-build-provenance`.

## Handover/receipt documents

- `W612_BUILD_PROVENANCE_AND_W600A_CLOSEOUT_2026-07-04.md`
- `CODEX_W612_W600A_PRODUCTION_CLOSEOUT_BRIEF.md`
- `CHANGED_FILES_W612_BUILD_PROVENANCE_2026-07-04.md`

No payment, subscription, wallet, rewards, social posting, client-only AI, user data, or City art/district behavior changed in W612.
