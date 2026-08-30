# W266 + W276 evidence hardening — 2026-06-25

## W266

- Added a local-only visual regression capture contract for the Chat-first task
  path, City Lite return and exact W259 opt-in Play entry.
- Added a local-target-only capture runner, source gate and NO-GO board.
- Added external visual lanes for physical Android/iPhone, installed PWA,
  constrained fallback and human review; none are pre-claimed.

## W276

- Re-audited W145 update safety and found its explicit-key registry did not
  cover unknown/dynamic `eon:` keys and labeled retired value records too
  strongly.
- Updated local comparison to track all observed app-owned keys by redacted
  fingerprint, including unclassified dynamic keys.
- Reclassified retired value records as preserve-if-present only.
- Added an evidence board and source gate that keeps W260 data restoration
  evidence open until real upgrade/downgrade/restore work is reviewed.

## Boundary

This is evidence and regression hardening only. It does not grant a Preview or
release approval and does not start W261 or any chain/value/commercial runtime.

## Capture-runner reliability repair

- W266 now classifies missing Playwright browser binaries and managed-browser
  URL-policy failures as structured `blocked-environment` receipts.
- A local HTTP 200 preflight is retained, but no screenshot, device or release
  evidence is inferred when capture infrastructure is unavailable.
