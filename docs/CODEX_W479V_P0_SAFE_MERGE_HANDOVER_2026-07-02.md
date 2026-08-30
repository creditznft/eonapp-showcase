# Codex safe merge handoff — W479-V Voice + W479-P0 Universal Ready-to-Post

## Scope

This package adds two source-level product foundations:

1. Capability-gated EONBOT Dictate and browser-assisted Use Voice.
2. A universal manual-first Ready-to-Post kit for creators.

It does not add any direct social connector, platform OAuth, token storage, media hosting/proxying, local image/video runtime, payment or background job.

## High-value files

- `assets/js/chat/eonbot-voice-capability-gateway.js`
- `assets/js/chat-page.js`
- `config/w479v-eonbot-voice-contract.mjs`
- `scripts/w479v-eonbot-voice-gate.mjs`
- `tests/unit/w479v-eonbot-voice.test.mjs`
- `assets/js/share/eon-share-pack.js`
- `assets/js/share/eon-share-pack-workspace.js`
- `config/w479p-universal-manual-post-contract.mjs`
- `scripts/w479p-universal-manual-post-gate.mjs`
- `tests/unit/w479p-universal-manual-post.test.mjs`
- `docs/W479P_UNIVERSAL_READY_TO_POST_SYSTEM_2026-07-02.md`
- `docs/W479V_DICTATE_AND_USE_VOICE_SOURCE_STATUS_2026-07-02.md`

## Safety invariants — do not weaken

- Guide Mode keeps voice controls hidden.
- Dictate writes editable composer text and never calls send automatically.
- Use Voice only begins on an explicit user click and Stop cancels browser recognition/speech immediately.
- Browser voice is labelled browser-assisted; do not claim offline local speech.
- Native sharing requires `userGesture: true`.
- A selected image/video may be handed to `navigator.share` only for that action; do not serialize it, store it, upload it or add it to a Share Pack.
- `createEonSharePack` stays metadata/text-only.
- Do not add fetch, WebSocket, XHR, beacon, OAuth, platform credential, remote post id, schedule, referral field or tracking field to the Ready-to-Post path.
- No auto-generated public/referral link.

## Required clean verification

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

## Deployment review still required

Do not call either feature publicly certified until evidence shows:

- Guide/Local/Connected voice display states in desktop and mobile browsers;
- microphone denial/no-device/no-speech/network/language/page-leave behavior;
- Dictate transcript editable-before-send;
- Use Voice start/stop/typed fallback and browser privacy disclosure;
- mobile native image and video share where browser support exists;
- desktop copy/download/manual-upload fallback;
- no media upload, host/proxy request, public-link generation, token persistence or platform publish request;
- W476-B/W477/W478 deployed route/CSP/PWA/accessibility/recovery proof.

## Next order

W479-M local creator media (adapter-by-adapter), W479.5 non-payment certification, W480 Dodo after owner GO, W481 serial official connectors after core certification.
