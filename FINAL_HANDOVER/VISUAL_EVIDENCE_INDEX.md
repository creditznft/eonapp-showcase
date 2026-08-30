# Visual evidence index and screenshot capture manifest

## Truthful status

This final source package does **not** contain live browser/device screenshots. The managed environment could not produce valid browser navigation/Lighthouse traces, and manufacturing screenshots would be misleading. Existing source artwork remains in `assets/img/og/default.svg` and the PWA manifest; it is design artwork, not launch evidence.

## Existing capture tooling

- `npm run qa:w266-visual-proof-lab:capture` — local-only capture helper.
- `scripts/realm3d-screenshot-qa.mjs` — Three.js visual capture helper.
- `scripts/w249-babylon-play-proof-spike-gate.mjs` — Babylon source/proof guard.
- `scripts/w148-all-device-visual-proof-gate.mjs` — all-device visual guard.
- `docs/W282_W259_W266_W276_EXTERNAL_EVIDENCE_PROTOCOL_2026-06-25.md` — required real-device protocol.

## Required captured states

See `FINAL_HANDOVER/screenshots/CAPTURE_MANIFEST.csv`. Capture screenshots/video only after verifying no prompts, outputs, keys, provider account details, Vault content, wallet/referral/payment data, Cloudflare IDs, or personal data are visible.

## PWA artwork note

`manifest.webmanifest` currently references `assets/img/og/default.svg` for its declared desktop/mobile PWA artwork. It should not be represented as a physical-device screenshot.
