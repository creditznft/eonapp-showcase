This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP — W260 R1 / W258 C0-I compiler evidence repair freeze

## Authoritative status

- W260 remains an evidence-only **NO-GO** release board. Nothing in this freeze
  approves public release, public preview, device support, security audit or
  legal approval.
- W259 remains local-static only. Real Android, iPhone, desktop, PWA, Preview
  and rollback evidence are still required.
- W258 C0-I exact local compiler-source evidence is now **16/16 complete**.
  This is not deployed runtime identity, contract safety, custody approval or
  permission for EONAPP to make RPC calls.
- **W261 must not start.** Its workspace-only Chain Trust panel requires C0-I
  exit, which remains blocked on external evidence and human review.

## Read first

1. `HANDOFF/W258_C0I_COMPILER_EVIDENCE_REPAIR_2026-06-25.md`
2. `Smart Contracts/HANDOFF_W258_C0I_2026-06-25/README.md`
3. `HANDOFF/R3_CEO_AUDIT_2026-06-25/W258_C0I_RESULT_AND_CODEX_RUNBOOK.md`
4. `release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json`
5. `HANDOFF/W259_CITY_PREVIEW_DEVICE_EVIDENCE_2026-06-25/README.md`
6. `evidence/W258_C0I_COMPILER_REPAIR_VALIDATION_2026-06-25.log`

## What passed locally

- Root: 200/200 approved current-product tests, lint, 193-file build, W247
  firewall, W259 preview boundary, W260 NO-GO board, PWA static gate, secret
  scan and zero production dependency vulnerabilities.
- Smart Contracts: 9/9 C0-I tests, resumable batch proof with 16/16 canonical
  exact compiler-source candidates, offline verifier remains fail-closed.

## Remaining hard blocks

1. Real W259 device/Preview/PWA/rollback/accessibility/data-survival evidence.
2. Independent release, support, rollback and reviewer ownership for W260.
3. Two independent Polygon mainnet RPC receipts and 16-address runtime-hash
   comparison.
4. Live role/operator/treasury/pause/governance evidence and secret-free custody
   attestation.
5. Manifest review and toolchain-audit remediation or accepted risk decision.
6. Hardhat reproducible compile/test/smoke in an environment without the current
   compiler-downloader proxy failure.

## Next safe execution order

1. Run the W259 real-device matrix using only `/eoncity/play?preview=1` and
   redacted test-safe content.
2. Capture the W260 external evidence lanes and preserve NO-GO until reviewed.
3. Complete W258 C0-I only in `Smart Contracts/`; keep EONAPP chain runtime
   disconnected.
4. Create a new reviewed source snapshot after any genuine external evidence.
