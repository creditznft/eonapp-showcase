# W273-A0 — City sensory accessibility evidence plan

## Delivered source controls

- City Play exposes local **optional sound** and **optional vibration** preferences.
- Both preferences default to off and remain off until a visitor explicitly changes them.
- Optional feedback can occur only after a visitor action: prepare a route, pause, or resume.
- Visual status remains available whether sound/vibration is enabled or disabled.
- Cues are procedural browser-local tones and bounded vibration patterns; no audio asset, autoplay, microphone, media capture, remote transport, or telemetry is used.
- The source gate rejects default-on preferences, missing visual alternatives, media/autoplay/microphone code, and remote transports.

## Evidence still required

Real-device Android/iPhone/Desktop validation for mute/haptic persistence, system haptic suppression, audio-focus behavior, hearing/vestibular accessibility, reduced-motion interaction, screen-reader wording, storage-clear/reset behavior, and user testing.

## Claim fence

This is a City Play source baseline only. It does not prove audio/vibration support, hearing or vestibular accessibility, or usability on real hardware. W260 remains **NO-GO**.
