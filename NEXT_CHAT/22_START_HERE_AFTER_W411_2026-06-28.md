# Start Here After W411

Use this package as the only source baseline. UX-1, UX-2, UX-3 and the W411 Sync Basic **local-only** foundation are implemented and source/build validated.

## Read first

1. `02_UNIFIED_PRODUCT_MASTERPLAN.md`
2. `03_CODEX_AND_MANUAL_PROOF_CHECKLIST.md`
3. `20_W411_SYNC_BASIC_FOUNDATION_IMPLEMENTATION_HANDOVER_2026-06-28.md`
4. `21_W411_SYNC_BASIC_FOUNDATION_VALIDATION_RECEIPT_2026-06-28.md`
5. `10_UX1_BROWSER_PROOF_LIMITATION_2026-06-28.md`

## Baseline verification

```bash
npm ci
npm run verify:w411-sync-basic-foundation
```

## Mandatory manual proof still outstanding: W406A

Before calling any source work live, deploy through the approved process and capture redacted evidence for:

- Google account chooser/consent, callback back to the original EONAPP route, refresh/session persistence, sign-out and disposable-test-account deletion behavior;
- canonical `/realm#my-realm-3d` → `/eoncity` behavior after the service-worker update;
- desktop keyboard/mouse/HUD/Pause/Reset/Command Deck behavior;
- Android/iOS touch joystick, camera swipe, safe areas, portrait/landscape and reduced-motion behavior;
- browser/device/version/date/route and every remaining defect.

W411 does not reduce any of these W406A requirements.

## Next implementation boundary: W412, only when the design is ready

Do not wire the W411 foundation to a backend simply because Google sign-in works. A later W412 must first implement and prove:

- authenticated, idempotent Sync Basic record endpoints and a final retention/deletion policy;
- explicit post-login opt-in and an exact safe-data selection summary;
- clear guest-work import/merge choices on both first and second devices;
- controlled conflict-copy, tombstone and restore behavior;
- two-device and offline/reconnect evidence with redacted logs;
- no Vault/API-key Sync unless the separate Secure Vault Sync E2EE/recovery/revocation design is complete.

## Safe parallel product work

The next non-activation code wave may attach local Share Pack / Remix Card actions to completed useful Creator and Forge outputs. Keep it user-tapped, public-safe and local/native-share only; do not add posting, social OAuth, Relay rewards, payment, user deployment or Action Gateway execution.

Package a fresh lean handover after each substantial wave. Exclude all environment files, secrets, dependencies, built output, reports and browser profiles.
