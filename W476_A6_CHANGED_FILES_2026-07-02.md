# W476-A6 Changed Files — 2026-07-02

## New

- `config/w476-api-surface-contract.mjs`
- `config/w476-a6-release-evidence-contract.mjs`
- `scripts/w476-api-surface-contract-gate.mjs`
- `scripts/w476-a6-release-evidence-gate.mjs`
- `scripts/w476-a6-supplychain-audit.mjs`
- `tests/unit/w476-api-surface-contract.test.mjs`
- `tests/unit/w476-csp-reporting.test.mjs`
- `tests/unit/w476-a6-release-evidence.test.mjs`
- `docs/W476_A6_API_CSP_SBOM_RELEASE_EVIDENCE.md`
- `docs/W479M_LOCAL_CREATOR_MEDIA_PROGRAMME.md`
- `README_W476_A6_API_CSP_SBOM_RELEASE_EVIDENCE_2026-07-02.md`
- `W476_A6_QUALITY_GATE_REPORT_2026-07-02.md`
- `W476_A6_KNOWN_LIMITS_2026-07-02.md`
- `W476_A6_CHANGED_FILES_2026-07-02.md`
- `CODEX_W476_A6_SAFE_MERGE_HANDOVER_2026-07-02.md`
- `EVIDENCE/W476_A6/*`

## Modified

- `functions/csp-report.js` — modern Reporting API support, document-origin validation, redaction coverage and no-store behavior.
- `_headers` and `public/_headers` — modern `Reporting-Endpoints` header retained in canonical mirrored headers.
- `scripts/w476-release-verify.mjs` — W476-A6 gates/tests/syntax checks included.
- `package.json` — W476-A6 commands, full W476 source verification command, Wrangler 4.106.0 and focused audit remediation overrides.
- `package-lock.json` — remediated reproducible tooling lockfile.
- `docs/W476_A5_LOCAL_AI_PROVIDER_COMPATIBILITY_MASTER_PLAN_2026-07-02.md` — W479-M link and scope clarified.

- `W476_A6_COMMAND_LOGS_2026-07-02.md` — exact local verification commands and results.
- `SOURCE_MANIFEST_W476_A6_API_CSP_SBOM_RELEASE_EVIDENCE_2026-07-02.sha256` — source file integrity manifest (created during packaging).
