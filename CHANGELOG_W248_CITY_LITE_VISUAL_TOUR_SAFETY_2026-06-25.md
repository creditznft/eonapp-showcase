# W248 — City Lite / Visual Tour safety hardening

- Renamed the existing optional Three.js presentation to **EON City Visual Tour** in active public copy.
- Kept **EON City Lite** as the canonical, all-device 2D route.
- Replaced implicit/direct City destination opening with prepare → review → explicit user confirmation.
- Added a destination cancel path and clear no-background-work wording.
- Added persistent `pagehide` disposal and persisted `pageshow` remount for the Three.js Visual Tour.
- Added three focused W248 regression tests and registered them in the current unit suite.
- No wallet, payment, token, reward, provider, local-data migration, or Babylon-runtime change was introduced.

See `HANDOFF/W248_EXISTING_CITY_VISUAL_TOUR_AUDIT_2026-06-25.md` and `EVIDENCE/W248/`.
