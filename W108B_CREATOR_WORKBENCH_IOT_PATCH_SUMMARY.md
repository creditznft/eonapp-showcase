# W108B — Creator Studio + Workbench UX Compression + Device Lab

Date: 2026-06-11
Base: W108A EON City + Market starter NFT patch

## Mission
Make the next high-traffic power surfaces feel cleaner for first-time users without deleting advanced capability.

## Main decisions

1. Creator Studio now opens with a clear launchpad instead of a wall of tools.
2. Workbench now starts with six obvious actions: Ask, Build, Launch, Trade research, Creator, Vault.
3. Advanced Workbench modes remain available but are collapsed by default.
4. IoT is exposed as a safe Device Lab, not hidden as a vague mode.
5. Real device commands now require explicit browser confirmation from the Workbench UI.
6. A demo device path was added so users can understand Device Lab before connecting hardware.

## Files changed

- `creator-studio.html`
- `assets/css/creator-studio.css`
- `assets/js/creator-studio-page.js`
- `workbench.html`
- `assets/css/workbench.css`
- `assets/js/workbench-page.js`
- `tests/unit/w108b-ux-compression.test.mjs`

## Creator Studio improvements

- Added a new `Creator launchpad` section above the deep panels.
- First-run actions are now:
  - Start with idea
  - Make video package
  - Make image / thumbnail
  - Make voice / podcast
  - Publish / schedule
- Sidebar was compressed:
  - Primary creator actions are visible first.
  - Script Lab, Music Lab, Calendar, Analytics, IDE Mode, Runtime, Vault / Keys moved into an `Advanced creator tools` drawer.
- Advanced drawer automatically opens when a user activates an advanced panel.

## Workbench improvements

- Added a new `Workbench launchpad` section.
- First-run actions are now:
  - Ask
  - Build
  - Launch
  - Trade research
  - Creator
  - Vault
- Moved Hive out of first-visible Core mode and into Professional / advanced.
- Collapsed Professional / advanced by default.
- Renamed Lifestyle into `Device + system lab`.
- Fixed duplicate `id="wb-mission-run"` button bug.

## Device Lab / IoT improvements

- Public Workbench section renamed from `IoT Control Hub` to `Device Lab / IoT Control`.
- Added explicit safety copy:
  - local-first device list
  - explicit confirmation
  - Realm-ready but no silent device execution
- Added `Add Demo Device` path.
- Renamed `Add Device` action to `Connect Real Device`.
- Real device commands now call `window.confirm()` before on/off/remove actions.
- Scene activation also requires confirmation.
- Demo devices use local/non-network protocol so users can test Device Lab without external hardware.

## Verification run

Passed:

```bash
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
node --test tests/unit/w108b-ux-compression.test.mjs
npm run qa:w103-automation-os
```

## Safety boundaries kept

This patch does not change:

- smart contracts
- payment receivers
- wallet settlement logic
- live trading execution
- NOWPayments callback logic
- Cloudflare secrets

## Recommended next wave

W108C should refine Realm as the flagship visual layer and connect the Device Lab concept into EON City as a station:

- EON City first screen polish
- private workstation station
- Device Lab station
- legacy Realm editor hidden behind advanced mode
- 3D only loaded after Enter City
- safe scene suggestions only, no automatic device execution
