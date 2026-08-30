# UX-3 Checkpoint — Changed File Manifest

This checkpoint contains the validated UX-1, UX-2 and UX-3 source changes relative to the supplied W405 continuation bundle.

## UX-3 additions

- `assets/js/utils/language-matrix.js` — versioned eleven-language full-product matrix, ordered voice matrix and explicit deferred voice-only language list.
- `config/w394c-language-matrix-contract.mjs`
- `scripts/w394c-language-matrix-gate.mjs`
- `tests/unit/w394c-language-matrix.test.mjs`
- `NEXT_CHAT/16_UX3_LANGUAGE_MATRIX_VOICE_IMPLEMENTATION_HANDOVER_2026-06-28.md`
- `NEXT_CHAT/17_UX3_LANGUAGE_MATRIX_VOICE_VALIDATION_RECEIPT_2026-06-28.md`
- `NEXT_CHAT/18_START_HERE_AFTER_UX3_2026-06-28.md`
- `NEXT_CHAT/19_UX3_CHANGED_FILES_2026-06-28.md`

## UX-3 changes

- `assets/js/utils/i18n-rc-registry.js` — public UI release language registry now derives from the language matrix.
- `assets/js/utils/app-language.js` — language normalization and Guide-language selection validate against the same full-product matrix.
- `assets/js/utils/speech-locale.js` — full-product speech locales derive from the matrix, including Portuguese (Brazil) and Chinese (Simplified).
- `assets/js/chat/voice-language-preferences.js` — voice preference options derive from the matrix; previously voice-only Bengali/Indonesian options fall closed to Auto rather than overclaiming support.
- `assets/js/chat-page.js` — runtime selector synchronizes to matrix options; unsupported-browser microphone/selector remain visible but disabled with an explicit text fallback.
- `index.html`, `assets/css/eonbot-home.css` — matrix-aligned static selector and accessible unsupported-browser status note.
- `config/w394b-multilingual-voice-contract.mjs`, `scripts/w394b-multilingual-voice-gate.mjs`, `tests/unit/w394b-multilingual-voice.test.mjs` — W394B aligned to full-product launch language boundaries.
- `package.json` — adds `qa:w394c-language-matrix` and `verify:ux3-language-voice`.
- `NEXT_CHAT/BUNDLE_INDEX.md` — continuation index.

## Earlier UX waves retained

- UX-1 simple guest-to-Google modal and identity-only OAuth boundary.
- UX-2 compact Profile, Settings and Apps in-shell overlays with Sync/billing/connectors still inactive.
- See `09_UX1_CHANGED_FILES_2026-06-28.md` and `15_UX2_CHANGED_FILES_2026-06-28.md` for their detailed manifests.

## Intentionally excluded from handover ZIPs

- `node_modules/`, `dist/`, `artifacts/`, `reports/`, caches, browser profiles and test-result directories;
- `.env`, `.env.*`, environment templates and any secrets;
- generated report caches and bundled output.
