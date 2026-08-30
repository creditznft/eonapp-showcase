# Source origin — W260 R2 / W266 + W276 evidence hardening

## Baseline

This tree begins from the independently validated:

```text
EONAPP_W260_R1_W258_C0I_COMPILER_EVIDENCE_REPAIR_FREEZE_2026-06-25.zip
```

The baseline's W260 release board is still NO-GO, and W258 C0-I remains
exit-blocked.

## Scope of this R2 freeze

- Adds W266 local-only visual capture planning, anti-fabrication gates and
  structured environment-blocked receipts.
- Re-audits W145 through W276 so every observed app-owned `eon:` key is compared
  across the local simulated update boundary.
- Updates regression tests, handover and validation material only.

## Explicitly unchanged

- No public route, product feature, City renderer, chain/RPC, wallet, signing,
  payment, commerce, token, reward, loot, referral-value, provider intake,
  remote telemetry or release approval is introduced.
- W259's exact `?preview=1` gate remains unchanged.
- W260 remains NO-GO and W261 remains prohibited.

See `W260_R2_W266_W276_CHANGED_FILES_2026-06-25.md` and the source SHA-256
manifest for the final package inventory.
