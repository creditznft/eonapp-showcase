# EONAPP W108C — Realm Flagship + Device Lab Station Patch

Date: 2026-06-11

## Mission

Continue W108 after the Market/homepage/trust and Creator/Workbench/IoT compression patches. This wave makes Realm/EON City clearer as the flagship world and connects the hidden IoT system into the 3D city safely.

## Product decisions

- EON City remains the public flagship Realm experience.
- Legacy Realm editor surfaces stay hidden from the public first screen through the existing `realm3d-flagship-mode` rules.
- IoT is exposed as a **Device Lab**, not as unsafe automatic game-device control.
- Realm movement may guide or suggest device scenes, but real hardware commands must require explicit user confirmation in Workbench/Automation OS.
- No smart contracts, payment receivers, live trading execution, or secrets were changed.

## Main improvements

### 1. Device Lab becomes a first-class EON City district

Added a new `device` district with:

- Device Lab label and icon
- EON City map coordinates
- Workbench Device Lab route
- dedicated panel id: `device-lab`
- safe description around demo devices, telemetry, scenes, and confirmation gates

### 2. Device Lab station inside EON City

Added:

- `portal-device` in-world portal/station
- Device Safety Engineer NPC
- Device Lab world panel
- Device Lab guided tour stop
- EONBOT quick prompt and guidance routing
- Device Lab visuals in the voxel world

### 3. Private Workstation connection

The private workstation now also knows about Device Lab as an owner-side station, so it connects AI/Vault/Builder/Market workflows with IoT safely.

### 4. Safety policy hardened

`buildRealm3dSafetyPolicy()` now explicitly includes:

```js
silentDeviceControl: false,
deviceActionsRequireConfirmation: true
```

This makes the intended IoT boundary testable instead of just copy text.

### 5. Realm landing page updated

`realm.html` now presents Device Lab from the EON City preflight path:

- Device Lab entry button
- launch-proof bullet: IoT actions need confirmation
- roadmap card explaining the safe IoT station

## Files changed

```text
realm.html
assets/css/realm3d.css
assets/js/realm3d/engine/BlockPalette.js
assets/js/realm3d/engine/EonCityMap.js
assets/js/realm3d/engine/EngineBoot.js
assets/js/realm3d/engine/WorldPanels.js
tests/unit/w108c-realm-device-lab.test.mjs
W108C_REALM_DEVICE_LAB_PATCH_SUMMARY.md
```

## Verification run

```text
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
node --test tests/unit/w108b-ux-compression.test.mjs tests/unit/w108c-realm-device-lab.test.mjs
npm run qa:w98-eoncity-flagship
npm run qa:w103-automation-os
```

All listed checks passed.

## Next recommended wave

W108D should focus on Marketplace/trust/commercial truth polish:

- marketplace default state and contract loading copy
- beta seller policy
- utility NFT disclaimers
- remove public ad-provider confusion from core pages if ads are not part of main website strategy
- improve subscription/trust/payment support flows
