# W623G — Multilingual Guide And Voice Real-Device Proof Runbook

Date: 2026-07-11  
Status: ready for execution after W623F  
Purpose: prove that a non-technical user can type or speak in the supported language, receive the correct EONBOT Guide or AI route, and hear a spoken reply where the device provides a matching voice.

## 1. Product decision

EONAPP uses a two-lane speech architecture:

1. **Browser-assisted voice baseline** — no EONAPP API key is required. Speech recognition and speech synthesis use capabilities exposed by the browser or operating system. Recognition may still rely on a browser/OS service and is not automatically private or offline.
2. **Optional local speech lane** — a future signed desktop companion may provide fully local speech-to-text and text-to-speech through an authenticated loopback bridge. It must be separately installed, permissioned, measured and proven before EONAPP labels speech as local/offline.

The language setting stays in **Profile → Voice & language**. The main Chat header follows Auto by default and does not display a permanent language picker.

## 2. Supported source matrix

The W623F source matrix contains exactly eleven product languages:

- English (`en`, speech locale `en-US`)
- Hindi (`hi`, `hi-IN`)
- Spanish (`es`, `es-ES`)
- Portuguese—Brazil (`pt`, `pt-BR`)
- French (`fr`, `fr-FR`)
- German (`de`, `de-DE`)
- Arabic (`ar`, `ar-SA`, RTL)
- Russian (`ru`, `ru-RU`)
- Chinese—Simplified (`zh`, `zh-CN`)
- Japanese (`ja`, `ja-JP`)
- Korean (`ko`, `ko-KR`)

This source matrix is not proof that every browser supplies recognition and spoken voices for every locale.

## 3. Required evidence lanes

### Lane A — automatic language

For every language:

1. Clear the manual speech-language override.
2. Set the app or chat language to the target language.
3. Confirm the document language and direction update correctly.
4. Confirm Chat does not show a permanent language selector.
5. Open Profile and confirm Speech recognition language shows Auto.
6. Return to Chat and record the resolved recognition locale in the evidence receipt.

### Lane B — manual recognition-language override

For every language:

1. Open Profile → Voice & language.
2. Choose the exact recognition locale.
3. Confirm the preference survives reload in the same browser profile.
4. Confirm the selected reply language follows the deliberate manual choice.
5. Reset to Auto and confirm the explicit locale is removed from local storage.

### Lane C — Dictate

For every available browser/locale pair:

1. Tap Dictate; verify microphone permission is requested only after the tap.
2. Speak the fixed phrase three times at normal speed.
3. Confirm interim/final transcript appears as editable text.
4. Confirm Dictate does not send automatically.
5. Edit one word and send manually.
6. Stop Dictate and prove microphone capture ends.
7. Deny permission and prove typed fallback remains usable.

Use three fixed phrases per language:

- greeting/help request;
- Create request such as “create an image” or “build a website”;
- navigation request such as “open my projects” or “open EON City”.

Record exact transcript, expected intent, matched route, browser, OS, device, locale and any recognition error.

### Lane D — Guide reply without an AI key

For every language:

1. Stay in Guide Mode with no Local or Connected model active.
2. Submit the fixed greeting/help request.
3. Confirm the high-value multilingual routing lexicon selects the correct Guide intent.
4. Confirm the core response and controls appear in the target language.
5. Confirm broader untranslated copy falls back to English rather than inventing a translation.
6. Confirm no provider key, model endpoint, Cloudflare speech endpoint or EONAPP speech API is used.

### Lane E — spoken Guide reply

For every device that exposes speech synthesis:

1. Enable spoken replies in Profile.
2. Tap Use Voice.
3. Submit one Guide request in the target language.
4. Confirm the spoken utterance uses the resolved target locale.
5. Record the actual installed voice name and locale.
6. Confirm Stop Voice ends microphone input and speech output immediately.
7. Confirm no background listening restarts after Stop Voice, page hide, route change or logout.
8. When no matching voice exists, prove the UI remains readable and does not claim a native voice is available.

### Lane F — Local and Direct BYOK model language

For at least one proven Local model and one proven Direct BYOK model:

1. Select the target reply language.
2. Confirm the system context includes `Reply in <language> (<code>)`.
3. Ask the same task in the target language.
4. Confirm the model reply stays in the requested language or clearly reports a model limitation.
5. Verify the speech layer is still separate from the model route.
6. Verify no silent fallback from Local to Direct BYOK or from Direct BYOK to Local.

### Lane G — Arabic RTL and CJK

- Arabic: document `dir=rtl`, focus order, composer, transcript, message bubbles, buttons and Profile fields remain usable.
- Chinese/Japanese/Korean: IME composition is not interrupted; Enter does not send while composition is active; transcript and spoken output preserve characters.
- Zoom to 200%, mobile portrait and mobile landscape must not clip language or voice controls.

### Lane H — browser, permission and offline boundaries

For each tested browser:

- speech recognition unavailable;
- microphone absent;
- permission denied;
- permission revoked while page is open;
- synthesis unavailable;
- target voice missing;
- offline mode;
- background/foreground transition;
- interrupted utterance;
- route change during listening;
- stale stored locale after browser update.

The UI must state the limitation, keep typed Chat available and avoid claiming offline/local speech.

## 4. Minimum device matrix

1. Windows desktop: current Chrome and Edge.
2. Android phone: current Chrome/PWA.
3. iPhone/iPad: current Safari/PWA where the required speech APIs are available.
4. At least one lower-memory device.
5. The owner RTX 3050 Windows laptop for the browser voice lane; GPU capability is not relevant to browser speech proof.

Firefox or another browser may be recorded as unsupported; unsupported is a valid result only when the fallback is clear and usable.

## 5. Local speech companion discovery lane

Do not add an EONAPP cloud speech proxy. Investigate a signed desktop companion that:

- stores no audio by default;
- accepts requests only from an authenticated loopback origin;
- offers a local STT adapter and a local TTS adapter behind one provider-neutral contract;
- reports model language coverage, RAM/storage requirements and licence/source details;
- supports explicit download, install, update and removal;
- exposes cancel, timeout, progress and cleanup;
- keeps raw microphone audio ephemeral unless the user explicitly exports it;
- proves airplane-mode transcription and spoken output before receiving a “Local speech” badge.

W623G may produce the adapter contract and capability detector. Implementation and packaging can continue under the secure companion programme if the binary/runtime work is too large for one wave.

## 6. Evidence files

Create one folder per device/browser and language with:

- `environment.json`
- `capability.json`
- `dictation-attempts.json`
- `guide-reply.json`
- `spoken-reply.json`
- `network-boundary.json`
- `screenshots/`
- one short screen recording for the full end-to-end loop
- redacted console log

Never include provider keys, account tokens, microphone audio not explicitly approved for evidence, or private chat content.

## 7. Pass criteria

A language/browser lane passes only when:

- recognition locale resolves correctly;
- Dictate is user-started and editable before send;
- a high-value request routes correctly;
- Guide Mode answers without an AI key;
- spoken reply works where a matching synthesis voice exists, or the fallback is honest;
- Stop Voice stops input and output;
- no audio is retained by EONAPP;
- network behavior is disclosed accurately;
- typed fallback always works;
- RTL/IME/accessibility checks pass.

## 8. Certification boundary

W623F proves source contracts, core translations and routing. W623G must not mark “multilingual voice complete” until the real-device matrix is executed. Browser-assisted recognition is not equivalent to offline local speech. A future local speech companion is not live until airplane-mode evidence proves it.
