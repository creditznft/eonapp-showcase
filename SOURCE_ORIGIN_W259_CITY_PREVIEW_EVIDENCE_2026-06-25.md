# Source Origin — W259 City Preview evidence

- Base source: `EONAPP_R3_F1_F2_W258_C0I_EVIDENCE_BLOCKED_HANDOFF_2026-06-25`.
- Active runtime changes: City Play station, local preview evidence module,
  City Play CSS, W259 unit/gate/test-runner registration and handoff documents.
- No Chat/Vault credential behavior, contract runtime, wallet, signing,
  transaction, reward, commerce or telemetry source was added.
- Existing user local data schemas are untouched; W259 uses its own bounded
  `eon:city:preview-evidence:w259:v1` local key.
- Generated dependencies, `dist`, `.git`, `.env*`, credentials, contract
  artifacts/cache and temporary folders are excluded from the handover ZIP.
- Final closeout re-applied the existing R3-F1/R3-F2 physical archive contracts
  after stale retired root documents appeared in the working copy. The archived
  hashes remain the source of historical record; active routes remain reduced.
