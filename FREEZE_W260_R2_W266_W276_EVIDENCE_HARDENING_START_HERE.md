This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP — W260 R2 / W266 + W276 evidence-hardening freeze

## Authoritative status

- **W260 remains a binding evidence-only NO-GO.** Nothing in this freeze
  approves a public release, Preview, device support, security/legal sign-off
  or deployment.
- **W266 Visual Proof Lab is source-ready but not visually certified.** Its
  local server preflight returned HTTP 200; the capture environment lacked an
  available Playwright browser and the structured result is
  `blocked-environment`. No screenshots or human approvals are claimed.
- **W276 Data Survival Re-audit is local-static only.** It now tracks every
  observed app-owned `eon:` key, including dynamic/unclassified keys. It does
  not prove a real deployment, PWA update/rollback or device restore.
- **W258 C0-I stays exit-blocked** despite 16/16 local compiler-source proof.
  The EONAPP runtime remains chain-disconnected.
- **W261 must not start.** No chain/wallet/RPC/signing/value/commercial feature
  is permitted.

## Read first

1. `HANDOFF/W266_W276_EVIDENCE_HARDENING_2026-06-25/README.md`
2. `release-evidence/W266_VISUAL_PROOF_LAB_2026-06-25/VISUAL_PROOF_BOARD.json`
3. `release-evidence/W276_DATA_SURVIVAL_REAUDIT_2026-06-25/DATA_SURVIVAL_BOARD.json`
4. `EVIDENCE/W266_VISUAL_PROOF_LAB_2026-06-25/LOCAL_CAPTURE_ENVIRONMENT_BLOCK.md`
5. `FREEZE_W260_R1_W258_C0I_COMPILER_REPAIR_START_HERE.md`
6. `release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json`
7. `HANDOFF/W259_CITY_PREVIEW_DEVICE_EVIDENCE_2026-06-25/README.md`

## Fresh local verification

- Root unit suite: **207/207 passing**.
- Lint: zero warnings.
- Production build: **193 files**.
- W145, W247, W259, W260, W266 and W276 gates: passed.
- Smoke build, site audit (40 HTML), launch readiness, PWA static QA and secret
  scan: passed.
- Root production-only dependency audit: **0 vulnerabilities**.
- Root full dependency audit: **6 development advisories** (1 low, 1 moderate,
  4 high), still open.
- Smart Contracts C0-I offline verifier: explicit fail-closed block; **9/9**
  tests pass. Its separate full dependency audit has **53 advisories** (18 low,
  27 moderate, 8 high), still open.

## Hard blocks still requiring external evidence

1. W259 real Android/iPhone/desktop device matrix and redacted task evidence.
2. W266 local screenshots in a browser-enabled environment plus independent
   physical-device, constrained fallback, installed-PWA and human visual review.
3. W276 Preview upgrade/downgrade, installed-PWA rollback, cache/IndexedDB and
   restore/recovery drills with redacted fixtures.
4. W260 independent release, support, rollback, security/legal and owner
   sign-offs.
5. W258 live RPC/runtime, roles/custody and manifest-review evidence.
6. Accepted risk decision or remediation for both development toolchains.

## Next safe execution order

1. Capture the W259/W266 device matrix without changing product behavior.
2. Perform the W276 external update/restore drill; keep the board NO-GO until
   redacted evidence is reviewed.
3. Complete W260 owners and independent review evidence.
4. Keep C0-I isolated in `Smart Contracts/`; do not connect EONAPP to chain
   surfaces.
5. Create a new verified source freeze only after genuine external evidence is
   added.
