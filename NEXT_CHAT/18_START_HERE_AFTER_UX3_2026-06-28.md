# Start Here After UX-3

Use this package as the only source baseline. UX-1, UX-2 and UX-3 are implemented and source/build validated.

## Read first

1. `02_UNIFIED_PRODUCT_MASTERPLAN.md`
2. `03_CODEX_AND_MANUAL_PROOF_CHECKLIST.md`
3. `16_UX3_LANGUAGE_MATRIX_VOICE_IMPLEMENTATION_HANDOVER_2026-06-28.md`
4. `17_UX3_LANGUAGE_MATRIX_VOICE_VALIDATION_RECEIPT_2026-06-28.md`
5. `10_UX1_BROWSER_PROOF_LIMITATION_2026-06-28.md`

## Next required phase: W406A manual production proof

Before any EON Sync activation or City visual claim:

- deploy this source through the existing approved production process;
- use a disposable approved Google test account in Production Testing mode;
- capture the real Google account chooser/consent, callback route, refresh/session persistence, sign-out and deletion behavior with credentials redacted;
- test canonical `/realm#my-realm-3d` → `/eoncity` behavior after service-worker update;
- capture desktop keyboard/mouse/HUD, Android/iOS touch controls, safe areas, portrait/landscape and reduced-motion evidence;
- record browser/device/version/date/route and every remaining defect honestly;
- do not call this live proof complete until that evidence exists.

## Parallel code wave after W406A evidence: W411 EON Sync Basic design/code

Build only the local/schema/migration surface for explicit future Sync Basic:

- local-first record envelope (`id`, `type`, `updatedAt`, `version`, `originDeviceId`, `deletedAt`, deterministic content hash);
- safe data inventory for preferences, chat metadata/text explicitly chosen by user, safe project metadata/text and Share/Remix metadata;
- explicit exclusions for Vault/API keys, raw media, model binaries, browser caches and recovery keys;
- no server sync endpoint, no automatic upload and no public “Sync enabled” claim;
- plan explicit user consent, merge/import choice, conflict copies and deletion tombstones before W412.

Package a fresh lean source handover after W411. Keep social posting, Relay rewards, payments, deployment activation and Action Gateway execution locked.
