# W287-A0 — EONBOT language, voice and personalization evidence plan

## Implemented source boundary

- EONBOT reply language uses the existing finite selectable chat-language preference.
- Voice output, continuous voice, and local-alias greeting are explicit preferences stored only in the browser profile and default to off.
- A reset returns all W287 controls to default; typed input and visual replies remain available.
- This module does not store transcripts, recordings, provider keys, contacts, a device fingerprint, or a remote identifier. It does not start the microphone or call a remote voice service.

## Required independent evidence

1. Keyboard, touch, screen-reader, permission-denial and muted-system walkthroughs on desktop/mobile/full-browser/Telegram WebView.
2. Locale, RTL and typed-fallback content review for each public language.
3. Privacy review of reset and backup/restore behavior.

## Non-claims

This is not a universal speech-recognition, voice-synthesis, browser-permission, accessibility, language-quality, provider, privacy, beta or launch result.
