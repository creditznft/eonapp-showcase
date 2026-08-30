# W623F — Certification V2, Guide Copy, Language And Voice Foundation

Date: 2026-07-11  
Status: source-complete; focused validation and production build green; deployed parity stale / NO-GO

## What changed

1. Audited and modernized EONBOT Guide wording around the canonical Chat, Create, Projects, Library and EON City hierarchy.
2. Removed the permanent language selector from the main Chat header and moved recognition/reply language overrides to **Profile → Voice & language**.
3. Made browser-supported Dictate and spoken Guide replies usable without an active Local or Connected AI model.
4. Kept voice explicit and fail-closed: microphone starts only after a user action, Dictate remains editable before send, Stop Voice ends input/output, and EONAPP does not persist audio.
5. Added finite high-value intent routing for all eleven release languages: English, Spanish, Chinese, Japanese, Korean, French, German, Portuguese, Russian, Arabic and Hindi.
6. Added deterministic local translations for the core Chat, Guide and voice vocabulary across all non-English release languages. Broader copy may still fall back to English until W623G evidence exists.
7. Propagated the selected reply language into Local and Direct BYOK model context.
8. Removed beginner-facing resurrection of Workspace, Market and Realm concepts; old phrases remain compatibility routes only.
9. Added Certification V2, which compares route source/build state, commercial truth, creator/referral boundaries, Guide/language/voice truth, build provenance and observed deployment parity.
10. Added the W623G real-device multilingual Guide/voice runbook and preserved the W625E local AI video proof programme.

## Validation

- W394B multilingual voice gate: 9/9; tests 3/3.
- W394C language matrix gate: 12/12; tests 3/3.
- W479-V voice gate: 11/11; tests 3/3.
- W230 command hub: 6/6.
- W263 capability execution: 4/4.
- W623C commercial truth: 64/64.
- W623D reachability: 341 reachable files, 579 import edges, zero quarantined modules reachable; tests 5/5.
- W623E information architecture: tests 5/5.
- W623F certification v2: 24/24; tests 6/6; launchReady=false.
- Targeted ESLint: zero errors and zero warnings.
- Workspace secret scan: 3,359 text files scanned; zero potential secrets.
- Production build: passed.
- Distribution files: 452.
- Minified files: 290.
- Size saved: 41.20%.
- Distribution SHA-256: `b7d743b081d82c742306ff61c45d5bef66ec4c180856d0132508db233819dca9`.
- Source checkpoint SHA-256: `49aaba051085d3f1a0d8d2a1418b27f812a44bc3c402f5f93599f1fb33d8ffea`.

## Deployment boundary

This wave did not deploy. External observation recorded the deployed root/Profile as older than W623F and `/create` resolving to `/workspace`. EON City access copy matched. The release state remains **limited preview / NO-GO for unrestricted public launch** until deployed source parity and the remaining real-runtime/device/provider programmes are proven.

## Voice and language truth

Browser speech can provide no-EONAPP-key recognition and synthesis where supported, but browser/OS implementation may use external services and is not an offline/local guarantee. Fully local speech remains a separately installed, authenticated-loopback and real-device-proof requirement.

## Evidence boundary

- Source routing and core deterministic copy are proven; recognition accuracy and installed voices are not.
- Arabic RTL and CJK IME need physical browser/device proof.
- Real local image, local video, Direct BYOK image/video, genuine Dodo customer lifecycle, EONKEYS lifecycle and the W624 City flagship remain pending.
- Historical W353 beta-readiness remains archived and was not rewritten to pass.

## Changed files

Total changed or added files relative to the frozen W623E checkpoint: **45**.

### Product and runtime

- `assets/js/chat-page.js`
- `assets/js/chat/ai-runtime.js`
- `assets/js/chat/chatbot.js`
- `assets/js/chat/eonbot-command-hub.js`
- `assets/js/chat/eonbot-context-pack.js`
- `assets/js/chat/eonbot-context-registry.js`
- `assets/js/chat/eonbot-multilingual-routing.js`
- `assets/js/chat/eonbot-truth-contract.js`
- `assets/js/chat/eonbot-voice-capability-gateway.js`
- `assets/js/chat/guide-mode-playbooks.js`
- `assets/js/chat/intents.js`
- `assets/js/chat/native-voice-strategy.js`
- `assets/js/chat/responses.js`
- `assets/js/profile-page.js`
- `assets/js/utils/offline-screen-translations.js`
- `assets/js/utils/offline-screen-translations.w623f.js`
- `index.html`
- `package.json`
- `profile.html`

### Contracts and gates

- `config/w479v-eonbot-voice-contract.mjs`
- `config/w623f-certification-v2-contract.mjs`
- `scripts/w394b-multilingual-voice-gate.mjs`
- `scripts/w394c-language-matrix-gate.mjs`
- `scripts/w479v-eonbot-voice-gate.mjs`
- `scripts/w623f-certification-v2-gate.mjs`

### Tests

- `tests/unit/w230-eonbot-command-hub.test.mjs`
- `tests/unit/w479v-eonbot-voice.test.mjs`
- `tests/unit/w623f-certification-v2.test.mjs`
- `tests/unit/w623f-core-language-copy.test.mjs`
- `tests/unit/w623f-multilingual-routing.test.mjs`

### Roadmap and handover

- `CHANGED_FILES_W623F_CERTIFICATION_V2_GUIDE_LANGUAGE_VOICE_2026-07-11.md`
- `EONAPP_MASTER_LAUNCH_LEDGER_W623_W640_2026-07-11.json`
- `EONAPP_MASTER_LAUNCH_ROADMAP_W623_W640_2026-07-11.md`
- `EONAPP_W623F_NEXT_CHAT_PROMPT_2026-07-11.md`
- `EONAPP_W623F_NEXT_CHAT_START_HERE_2026-07-11.md`
- `EONAPP_W623F_VALIDATION_RECEIPT_2026-07-11.json`
- `program/EONAPP_W623G_MULTILINGUAL_GUIDE_VOICE_REAL_DEVICE_RUNBOOK_2026-07-11.md`

### Generated evidence

- `artifacts/w263-eonbot-capability-execution-gate/stats.json`
- `artifacts/w394b-multilingual-voice-gate/stats.json`
- `artifacts/w394c-language-matrix-gate/stats.json`
- `artifacts/w479v-eonbot-voice-gate/report.json`
- `reports/w623d-production-reachability/graph.json`
- `reports/w623f-certification-v2/deployed-route-evidence.json`
- `reports/w623f-certification-v2/launch-board.json`
- `reports/w623f-certification-v2/validation-receipt.json`
