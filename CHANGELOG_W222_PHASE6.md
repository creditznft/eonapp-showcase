# W222 — Phase 6: My Realm MVP

## Delivered

- Rebuilt `/realm-studio` as **My Realm**: a private City district editor rather than a public store, seller surface, or earnings page.
- Added `eon:realm:state:v3`, a versioned local Realm record linked to `CityWorldState` through only a stable Realm ID, theme, and arrival district.
- Added local Realm label, safe handle, theme, City arrival district, and up-to-four private Market preview references.
- Added non-destructive migration from the historic `eon:realm:profile:v2` record. The source record remains untouched.
- Added metadata safety review for reserved/official-looking handles and credentials, wallet material, recovery content, or personal contact details.
- Added a safety boundary: signed `eon3` links contain public Realm identity only. They never contain local City state, private Market previews, Vault data, payment state, attribution, affiliate status, commissions, or payout records.
- Added the Realm state to EON Sync’s encrypted local backup allowlist, with the same recursive secret-redaction rule used for other safe product records.
- Kept public publishing, official Market placement, affiliate, and payout flags explicitly false.

## Evidence

- `npm run qa:w222-my-realm-mvp` — state, City binding, non-destructive migration, safe showcase boundary, metadata review, and signed-link contract.
- `node --test tests/unit/w197-w201-sync-city-device.test.mjs` — encrypted backup includes My Realm state without credentials/secrets.
- `npm run qa:w216-local-finalization` — legacy Realm/city/commercial retirement contract remains green.
- `npm run lint -- --max-warnings=0` — passed.
- Browser spec: `npm run qa:w222-my-realm-mvp:browser`.

## Browser limitation

The source handover intentionally excludes browser binaries. Run the browser spec in Codex/CI or a permitted local environment after installing Playwright Chromium or defining `CHROMIUM_PATH`. Browser proof is not claimed until that run succeeds.
