# W221 — Phase 5: CityWorldState and 2D City RPG vertical slice

## Delivered

- Added a versioned, local-only `CityWorldState` store at `eon:city:world-state:v1`.
- Added migration from historic City preference keys without deleting legacy records.
- Explicitly excludes API credentials, Vault data, wallet/recovery material, private chats, payment state, and affiliate state.
- Replaced the old 2D portal-grid map with a canvas-based lightweight City vertical slice.
- Added keyboard (arrows/WASD), touch D-pad, tap-to-walk, gamepad, collision, interaction, minimap, local objective, and save/return behavior.
- Added deterministic client-side path guidance around scenery; no server movement, simulated NPC traffic, fake player counts, or background activity.
- Retained optional visual 3D entry as an isolated route. It does not claim to share parity yet; renderer parity is Phase 7.
- Maintained disabled commerce/reward/payment/payout/token boundaries.

## Evidence

- `npm run qa:w221-cityworldstate-2d` — unit contract for state creation, migration, collision, interaction, and static runtime boundaries.
- `npm run qa:w188-w190`, `npm run qa:w213-calm-city-trade`, and `npm run qa:w216-local-finalization` — legacy City safety/regression compatibility.
- `npm run lint -- --max-warnings=0` — passed.
- Browser spec: `npm run qa:w221-cityworldstate-2d:browser`.

## Browser limitation

The handover does not contain Chromium binaries. Run `npx playwright install chromium` (or set `CHROMIUM_PATH`) before executing the browser spec. Browser proof must be collected in Codex/CI or a permitted local environment before deployment.
