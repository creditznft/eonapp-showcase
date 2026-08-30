This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP — W260 Release-Board Freeze

This is the authoritative start file after the W259 handover has been replayed and W260 has been constructed.

## Current truth

- W259 local-static baseline has been independently replayed: 200/200 current-product tests, zero-warning lint, a fresh 193-file production build, W239/W242/W247/W259/R3-F1/R3-F2, all W248–W257 City/EONBOT gates, smoke, site audit, readiness, PWA static gate, secret scan and zero production dependency vulnerabilities.
- W260 is **not a release approval**. It is an evidence-only release board whose current verdict is **NO-GO**.
- The original W259 archive remains the source freeze. This working tree adds only W260 release-board documentation, a board-integrity gate and tests; it does not change app runtime behavior.
- C0-I remains exit-blocked. Browser chain runtime, wallet, signing, token/reward/loot/referral-value, payment, commerce and marketplace UX remain disabled.

## Read next

1. `HANDOFF/W260_RELEASE_CERTIFICATION_BOARD_2026-06-25/00_START_HERE.md`
2. `release-evidence/W260_RELEASE_BOARD_2026-06-25/README.md`
3. `release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json`
4. `HANDOFF/W259_CITY_PREVIEW_DEVICE_EVIDENCE_2026-06-25/README.md`
5. `HANDOFF/W260_RELEASE_CERTIFICATION_BOARD_2026-06-25/03_NEXT_EXECUTION.md`

## Immediate action

Run the real W259 device study. Do not alter the W260 verdict or attach “passed” evidence until the named redacted records, manual reviews and independent owner sign-offs genuinely exist.
