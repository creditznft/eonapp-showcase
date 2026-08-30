# Start Here After UX-2

Use this package as the only source baseline. UX-1 and UX-2 are implemented and validated in source.

## Read first

1. `02_UNIFIED_PRODUCT_MASTERPLAN.md`
2. `03_CODEX_AND_MANUAL_PROOF_CHECKLIST.md`
3. `12_UX2_SHELL_MODALS_IMPLEMENTATION_HANDOVER_2026-06-28.md`
4. `13_UX2_VALIDATION_RECEIPT_2026-06-28.md`
5. `10_UX1_BROWSER_PROOF_LIMITATION_2026-06-28.md`

## Next coding wave: UX-3

Implement the shared language matrix and visible, truthful voice controls:

- establish one versioned matrix for the eleven full-product launch languages: English, Hindi, Spanish, Portuguese (Brazil), French, German, Arabic, Russian, Japanese, Korean and Chinese (Simplified);
- wire that matrix through UI language options, speech preference options, Guide behavior and tests;
- keep Auto as the default hint but never overwrite a manual language selection;
- keep the microphone visible beside the composer; when browser speech is unavailable, disable it with a concise explanation and retain text entry;
- keep speech user-tapped, browser-permission based and non-archived; only the user-sent transcript becomes chat text;
- keep Bengali and Indonesian outside the full-product launch claim until UI/Guide support reaches the same level;
- do not activate Sync, connected social accounts, payments, relay rewards, deployment or Action Gateway execution.

Run before and after changes:

```bash
npm ci
npm run verify:w405-live-rescue-source
npm run qa:w394b-multilingual-voice
npm run test:unit
```

Do not claim real-device or live proof unless actually captured. Package a new lean continuation bundle after UX-3.
