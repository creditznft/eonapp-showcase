# Changelog — W273-A0 City sensory accessibility

## Scope

City Play source-only sensory preferences and feedback. No deployment, Cloudflare, wallet, chain, referral, reward, payment, provider, microphone, media capture, remote telemetry, or external asset work occurred.

## Changed

- Added local `city-sensory-preferences` with explicit default-off sound and haptic preferences.
- Added City Play gate controls for optional sound/vibration and a permanent visual feedback alternative.
- Added bounded local procedural tone/vibration feedback only after explicit user actions.
- Added `qa:w273-city-sensory-accessibility`, including a negative test for a default-on regression.
- Added W273-A0 to the current static certification core and current-product unit suite.

## Known limits

Only City Play is covered. Real-device, audio-focus, system setting, motion, screen-reader, device, and usability evidence remains external. W260 remains **NO-GO**.
