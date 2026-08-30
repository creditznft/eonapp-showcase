# W274-A0 — City Scripted Guide: Source Readiness and Evidence Plan

## Scope

W274-A0 adds a finite **local orientation guide** to City Play. It is compiled only from the allowlisted City landmark registry. It is not EONBOT, a human, a chatbot, an autonomous actor, a social system, or a remote service.

## Source guarantees

- The guide reads only public landmark metadata in `city-landmark-registry.js`.
- It has no route field, automatic navigation, work confirmation, task startup, private-data read, persistence, telemetry or network transport.
- It opens only an accessible local dialog after the visitor presses **Guide**.
- It identifies itself as scripted local guidance and provides visual text without requiring sound.
- The source gate rejects remote APIs, navigation/action APIs, missing no-route boundaries, absent controls, missing focus styling, or removal of the W260 NO-GO condition.

## Not proven by source

- NPC behavior, social presence, moderation or safe conversational behavior.
- Human/assistive-technology usability, language suitability, visual contrast, motion sensitivity or real-device interaction.
- Public launch readiness, independent review, beta feedback, or W260 closure.

## Evidence still required

1. Content-owner review of every shipped guide sentence and terminology.
2. Keyboard, focus-trap/escape, screen-reader, zoom, reduced-motion and mobile-device review.
3. Moderation/safety review before any guide becomes generated, conversational, social, voice-enabled, persistent or connected to an external model.
4. Device/browser usability evidence and documented rollback decision.

## Claim fence

This source baseline proves only finite local guide copy and interaction boundaries. It cannot prove real-world moderation, NPC behavior, social presence, accessibility or device usability.
