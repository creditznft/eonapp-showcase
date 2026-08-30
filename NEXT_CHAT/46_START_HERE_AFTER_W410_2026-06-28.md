# Start Here After W410

Use this W410 package as the only source baseline. Do not merge older handovers over it.

## Read first

1. `NEXT_CHAT/00_READ_ME_FIRST.md`
2. `NEXT_CHAT/44_W410_CITY_VALIDATION_LAB_IMPLEMENTATION_HANDOVER_2026-06-28.md`
3. `NEXT_CHAT/45_W410_CITY_VALIDATION_LAB_VALIDATION_RECEIPT_2026-06-28.md`
4. `NEXT_CHAT/02_UNIFIED_PRODUCT_MASTERPLAN.md`
5. `NEXT_CHAT/03_CODEX_AND_MANUAL_PROOF_CHECKLIST.md`
6. `docs/W406B_CITY_ART_INTAKE_AND_PIPELINE_2026-06-28.md`
7. `docs/W407_ARRIVAL_DISTRICT_2026-06-28.md`
8. `docs/W408_CREATOR_FORGE_DISTRICT_2026-06-28.md`
9. `docs/W409_LIVING_CITY_SYSTEMS_2026-06-28.md`
10. `docs/W410_CITY_VALIDATION_LAB_2026-06-28.md`

## Baseline command

```bash
npm ci
npm run verify:w410-city-validation-lab
```

## Current state

- UX-1 / UX-2 / UX-3 are source/build certified.
- W411 is a local-only Sync Basic foundation; no endpoint, upload, Vault Sync, device merge or public Sync release exists.
- Share-2 attaches user-tapped Share Pack / Remix actions to local Creator and Forge output summaries only.
- W406B/W407/W408/W409/W410 provide a source-only canonical Babylon City foundation: no binary art, remote asset, final visual claim or device proof.
- W410 offers a local Validation Lab and existing Device Lab for manual evidence. Neither can inspect media, probe devices, auto-pass cases or certify a release.

## Next required work

**W406A manual proof:** deploy the current source, then capture real desktop, Android and iOS evidence for keyboard/mouse/touch/pause/reset/Command Deck, Arrival/Creator/Forge/Mission Board, reduced-motion, quality-governor fallback and the legacy `/realm#my-realm-3d` redirect/cache. Record actual defects. Do not replace this with source tests.

After that manual evidence, evaluate whether W411/W412 Sync Basic should proceed. Do not activate Sync, Relay, social posting, provider execution, deployment, payment, reward or Vault syncing.
