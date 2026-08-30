# W479-V — EONBOT Dictate and Use Voice Source Status

## Product decision

EONBOT has two different voice controls with intentionally different behavior.

| Control | What happens | When it can appear |
|---|---|---|
| **Dictate** | The user speaks, sees editable text in the composer, edits if needed, then presses Send. | Only after a tested Local AI or Connected AI route is active and the browser exposes microphone + recognition support. |
| **Use Voice** | The user explicitly starts a spoken conversation. EONBOT listens one turn at a time, replies using browser speech output, then listens again only while the user has kept Voice on. Stop ends listening and speech output immediately. | Only after the active route plus browser microphone, recognition and speech-output support are present. |

Guide Mode keeps microphone and spoken-response controls hidden. A text-only local runtime or a connected text route cannot falsely imply that a local speech model is installed.

## Truth boundary

The current W479-V route is **browser-assisted voice beta**, not a claim of offline Local AI speech.

- Browser speech recognition may be implemented by the browser using a service outside EONAPP.
- The chosen text route can still be Local AI; the speech layer is separately labelled.
- No microphone starts without user action.
- Dictate never auto-sends.
- Use Voice has an explicit Stop state.
- Audio is not persisted by this source feature.
- There is no silent cloud AI fallback.

## Required evidence before general release

- desktop and mobile permission prompts;
- Dictate transcript appears as editable text and does not send automatically;
- Use Voice start, turn-taking, mute/Stop and typed fallback;
- browser/language compatibility matrix;
- browser speech network/privacy disclosure review;
- Local AI and Connected AI route integrity while voice is active;
- interruption, denied permission, no-device, browser-speech network error and page-leave behavior;
- CSP, privacy and accessibility review.

## Future speech adapters

A true local voice tier may later add separate local STT and local TTS adapters. Each needs a declared runtime, user-controlled install, capability check, explicit connection, cancellation, no-silent-cloud proof, local output behavior and device matrix. It must not be inferred from this browser-assisted baseline.
