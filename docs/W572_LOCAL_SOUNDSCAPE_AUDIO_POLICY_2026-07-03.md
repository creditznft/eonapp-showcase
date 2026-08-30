# W572 — Optional local soundscape and audio policy

**Checkpoint:** source-only W572 implementation. This document is not a browser, device, preview, or production audio receipt.

## What W572 changes

- Adds one source-controlled policy controller for the existing local procedural W369 tone layer.
- Makes City sound an explicit, separately labelled action in both Immersive Work Mode and Spatial Command Space.
- Keeps W572 sound choices only in the active City session. The active City surfaces no longer read or write browser-default sound preferences.
- Stops existing W369 sound when City is paused, the tab is hidden, reduced effects applies, the user mutes, or the user stops it.
- Requires a new direct action after pause/hidden-tab recovery. It never resumes sound automatically.
- Keeps City captions and visual status complete when sound is off, muted, blocked, unsupported, or reduced.

## Asset and provenance boundary

`assets/js/city/eon-city-soundscape-policy.js` is the source-controlled policy register. Its current asset register is intentionally empty.

- No media file, original soundtrack, licensed pack, remote URL, stream, asset proxy, binary art delivery, or audio upload is added.
- The only eligible source is the already-present W369 procedural oscillator layer after a visible action.
- Future valuable or licensed audio requires explicit provenance, licence, browser, physical-device, and edge-policy review before any delivery path is claimed.

## Voice and privacy boundary

W572 does not alter W562. Microphone checking, browser-assisted dictation, speech recognition, and review text remain under their existing separate explicit-consent contract.

W572 adds no microphone/capture/session, TTS/STT, provider request, private-data read, account state, route opening, background work, telemetry, listening-history storage, notification, email, social/multiplayer behavior, payment, entitlement, reward, or ownership state.

## Truthful state

The release remains **source-only / LIMITED_PREVIEW_ONLY**. Local source gates can confirm contracts and static integration, but cannot prove browser playback, browser mute behavior, physical-device audio behavior, preview deployment, or production deployment.
