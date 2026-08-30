# UX-3 Language Matrix and Voice Fallback — Implementation Handover

**Date:** 2026-06-28  
**Baseline:** W405 continuation bundle only, then validated UX-1 and UX-2 checkpoints  
**Status:** source implementation and source/build validation complete; browser/device speech evidence remains required.

## What changed

UX-3 reconciles the public UI, browser speech-recognition choices, speech locale helper, deterministic Guide-mode routing, Settings destination and source tests behind one versioned language matrix.

### The honest launch matrix

The full-product launch set is exactly eleven languages:

1. English
2. Hindi
3. Spanish
4. Portuguese (Brazil)
5. French
6. German
7. Arabic
8. Russian
9. Chinese (Simplified)
10. Japanese
11. Korean

The original public UI registry keeps its established release ordering internally, while the voice selector uses a deliberate recognition-friendly order starting with English, Hindi and Spanish. Both derive from the same `assets/js/utils/language-matrix.js` source.

Bengali and Indonesian are now explicitly deferred from the full-product selector and language claim. Browser recognition alone is not treated as full UI or Guide support.

### Voice behavior

- The composer microphone remains visible beside the send control.
- When browser speech recognition is unavailable, microphone and selector remain visible but disabled and show: **Voice input is not supported in this browser. You can keep typing.**
- Voice input remains user-tapped and browser-permission based.
- No audio recording, separate transcript store, remote speech transport or Sync activation was added.
- Only a transcript the user sends becomes ordinary chat text; recognition locale/preference metadata remains minimal.
- `Auto` remains the default hint. Deliberately selecting a manual voice language sets the chat/Guide response language for that session preference; returning to `Auto` does not silently overwrite the manual chat-language preference.
- Guide-mode copies already route through `resolveChatLanguage()` and `translateChatUi()`, so deterministic guidance follows the selected chat language when static translation exists. It does not claim open-ended language understanding without a configured model.

### New source checks

- W394B was aligned to the eleven-language full-product matrix while retaining local-only privacy boundaries.
- W394C adds a dedicated contract, gate and unit tests for the shared language matrix, truthful unsupported-browser fallback and no remote audio path.
- `npm run verify:ux3-language-voice` provides the new full source/build certification command.

## What this does not prove

This package does not prove microphone permission, browser speech-recognition availability, recognition accuracy, TTS voice availability, mobile keyboard/viewport behavior or device-localized visual QA. It also does not prove live Google OAuth, EON Sync, connected apps or any payment/collaboration capability.
