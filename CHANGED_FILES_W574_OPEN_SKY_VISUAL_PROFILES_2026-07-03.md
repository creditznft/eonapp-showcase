# W574 — Open-Sky Visual Profiles Change Record

## Scope

Adds source-controlled, session-only Command Horizon sky and lighting looks. Names such as Dawn, Dusk, and Storm are visual styles only; no real-world time, weather, forecast, location, or external state is read or represented.

## Source changes

- `assets/js/city/eon-city-open-sky-profiles.js` — pure W574 visual-profile contract, validation, truth report, and bounded profile options.
- `assets/js/city/eon-city-play-babylon.js` — local Babylon sky shell, bounded atmosphere geometry, fixed lighting application, pause/reduced-effects guards, and session profile setter.
- `assets/js/eon-city-play-station.js` — in-City session-only open-sky selector and truthful settings copy.
- `tests/unit/w574-open-sky-visual-profiles.test.mjs` — profile, Lite/reduced, boundary, and source-gate coverage.
- `scripts/w574-open-sky-visual-profiles-gate.mjs` — W574 source gate.
- `scripts/run-current-unit-suite.mjs` and `package.json` — certification registration.
- `docs/W574_OPEN_SKY_VISUAL_PROFILES_SCOPE_BOARD_2026-07-03.md` — approved scope and limits.

## Explicit non-goals

No device clock, weather service, forecast, calendar, network, remote asset, binary loader, telemetry, storage, audio, voice, microphone, account/private data, payment, entitlement, reward, ownership, route action, autonomous work, preview deployment, production deployment, browser visual certification, or device proof.
