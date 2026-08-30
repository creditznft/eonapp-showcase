# W479-V — EONBOT Voice and Dictation programme

## Product decision

EONBOT will have **two different controls**, following the simple mental model users already understand:

- **Dictate** — speak one message, receive editable text, then choose Send.
- **Use Voice** — a live, turn-by-turn spoken conversation with a visible Stop control.

They are not shown in Guide Mode. They appear only when an active, proven voice adapter is available for the user’s selected local setup or configured AI provider. The default chat remains typed, fast and private.

## W479-V0 — voice capability gateway

One capability registry decides whether Dictate or Use Voice may appear. It must report the active mode truthfully:

- `guide` — no microphone controls; show typed chat and setup guidance only.
- `dictation-ready` — a user-selected speech-to-text adapter is ready.
- `voice-ready` — an explicit speech-to-text + text-to-speech/conversation path is ready.
- `blocked` — microphone, policy, device or provider state prevents use; keep typed chat available.

No browser guessing, no hidden microphone, no background recording, no “always listening,” and no silent cloud fallback.

## W479-V1 — Dictate first

The first live voice feature is Dictate because it is the lowest-risk, most useful creator/workflow interaction.

1. User taps/holds the microphone button labelled **Dictate**.
2. EONAPP requests browser microphone permission only at that moment.
3. Audio goes only to the selected adapter: clearly labelled **Local** or **Provider**.
4. The returned transcript is placed in the composer for editing; it is not sent automatically.
5. User presses Send, retries, or discards.
6. The session is stopped and audio buffers are released.

UI requirement: tooltip and accessible label state exactly what happens, for example: **“Dictate — turn speech into editable text.”**

## W479-V2 — Use Voice mode

Use Voice becomes available only when a tested adapter can handle the full route: microphone input, transcription, conversational response and spoken output.

- Tap **Use Voice** to start; the UI shows the active voice route as Local or Provider.
- Include clear listening/thinking/speaking states, transcript visibility, a prominent Stop button, mute/output controls and typed fallback.
- No camera/screenshare by default.
- No voice memory, profiling or background capture.
- Leaving the page, pressing Stop, denying permission, losing the selected runtime/provider or an adapter error stops the session immediately.

UI requirement: tooltip and accessible label: **“Use Voice — have a live conversation with EONBOT.”**

## W479-V3 — adapter order

1. **Configured provider voice adapter** — only when the user has explicitly selected a provider route and the provider supports the required audio capability. It must label network use before recording.
2. **Local voice stack adapter** — separate local STT and TTS capability checks; a text-only Ollama/LM Studio/Jan connection is not enough to claim voice.
3. **Browser speech APIs** — optional, clearly labelled experimental convenience only after browser/device proof. They are not the universal EONAPP voice foundation.

## W479-V4 — proof required per adapter

- explicit user gesture and permission grant/deny/revoke;
- Local/Provider indicator and accurate privacy copy;
- transcription accuracy and editable transcript in supported languages;
- cancel, retry, device-loss and network-loss states;
- no background microphone after Stop/page navigation;
- audio queue cleanup and no audio persisted without user action;
- mobile keyboard/interruptions/headset and desktop output proof;
- accessibility labels, captions/transcript and typed fallback;
- CSP/CORS/PNA proof for local paths; no silent cloud fallback.

## Release boundary

W479-V does not turn on audio merely because a button exists. Each voice adapter is separate, evidence-gated and beta-labelled until the complete device matrix passes.
