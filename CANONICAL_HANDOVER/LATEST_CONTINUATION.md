# Next-chat continuation — W479-V + W479-P0

## Source of truth

Use the accompanying `EONAPP_W479_VOICE_AND_UNIVERSAL_POST_KIT_SOURCE_2026-07-02.zip` and verify its SHA-256 before extracting. The archive is self-contained source only: no `node_modules`, `dist`, `.git`, local browser state, credentials or secret values.

## Completed source work

### W479-V — EONBOT voice

- Added `assets/js/chat/eonbot-voice-capability-gateway.js`.
- Guide Mode hides Dictate and Use Voice.
- Dictate writes the final transcript into the composer and never auto-sends.
- Use Voice is explicit start/stop with one-turn browser-assisted recognition + speech output.
- No audio persistence, background listening, silent AI fallback or local-offline voice claim.
- Gate: `npm run qa:w479-v-voice`.

### W479-P0 — Universal Ready-to-Post kit

- Upgraded the existing local Share Pack into a manual-first universal post kit.
- Supports 14 destination labels and Any app.
- One user-selected local image/video may enter an explicit native-share call only; it is never saved in the pack, uploaded, hosted, proxied or sent through Chat/City.
- Text/metadata pack provides copy and download fallback for desktop or unsupported browsers.
- No social OAuth, API posting, schedule, token custody, tracking, referral generation or receipt claim.
- Gate: `npm run qa:w479-p-manual-post`.

## Clean verification commands

```bash
npm ci
npm run qa:w479-v-voice
npm run qa:w479-p-manual-post
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm audit
npm audit --omit=dev
npm run security:secret-scan
```

## Known honest limits

- Browser-assisted voice has not been proven in a reviewed desktop/mobile device matrix.
- Native share sheet/file handoff has not been proven on declared target devices.
- No local STT/TTS adapter is live.
- No local image/video generation adapter is live.
- No social account connector is live.
- Deploy/browser/CSP/PWA/accessibility/recovery proof from W476-B/W477/W478 remains required.

## Next recommended work

Finish documented W476-B/W477/W478/W479 external proof, then start W479-M device-guided Local Creator Media with one honest image adapter first. Keep manual Ready-to-Post as the universal release path while official social connectors stay in W481.
