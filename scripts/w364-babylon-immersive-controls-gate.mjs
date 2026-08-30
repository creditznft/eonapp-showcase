#!/usr/bin/env node
/** W364 — Immersive Work Mode game-grade controls static gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const station = read('assets/js/eon-city-play-station.js');
const scene = read('assets/js/city/eon-city-play-babylon.js');
const controls = read('assets/js/city/eon-city-immersive-controls.js');
const css = read('assets/css/eon-city-play.css');
const contract = read('config/w364-babylon-immersive-controls-contract.mjs');
const plan = read('docs/W364_BABYLON_IMMERSIVE_CONTROLS_IMPLEMENTATION_2026-06-26.md');
const imports = auditActiveSurfaceImports({ root: ROOT });

assert(/mountCityPlayAnalogJoystick/.test(station) && /data-eon-play-joystick/.test(station), 'W364 needs a primary analogue touch joystick.');
assert(/data-play-move/.test(station) && /pointercancel/.test(station), 'W364 must retain an accessible directional touch fallback with cancellation handling.');
assert(/data-eon-play-minimap-canvas/.test(station) && /data-eon-play-toggle-map/.test(station), 'W364 needs a local minimap with explicit visibility control.');
assert(/data-eon-play-toggle-click-move/.test(station) && /Click-to-move enabled locally/.test(station), 'W364 needs opt-in local click-to-move.');
assert(/KeyM/.test(scene) && /KeyE/.test(scene) && /Escape/.test(scene), 'W364 needs keyboard map, interaction-request and pause shortcuts.');
assert(/GAMEPAD_INTERACT_BUTTON/.test(scene) && /onInteractRequest\?\.\('gamepad'\)/.test(scene), 'W364 needs bounded gamepad interaction request support.');
assert(/never confirms a destination/.test(scene) && /Separate confirmation is still required/.test(station), 'W364 must preserve separate route confirmation.');
assert(/scene\.pick\(.*mesh\.name === 'street'/s.test(scene) && /setClickMove/.test(scene), 'W364 click-to-move must target only the local street surface.');
assert(/getPlayerPosition/.test(scene) && /getControlSummary/.test(scene) && /mountCityPlayMinimap/.test(controls), 'W364 minimap needs bounded public player/control summaries.');
assert(/removeEventListener\('pointercancel', clickMovePointerCancel\)/.test(scene) && /controlUnsubscribers/.test(station), 'W364 must clean up scene and HUD input listeners.');
assert(/safe-area-inset-bottom/.test(css) && /eon-play-mobile-controls \.eon-play-touch-controls button\{min-inline-size:3\.5rem;min-block-size:3\.5rem/.test(css) && /eon-play-joystick/.test(css), 'W364 controls need safe-area spacing, a primary joystick and 56px directional touch targets.');
assert(/remote telemetry|telemetry: 'none'/.test(contract) && /No action opens a native route automatically/.test(plan), 'W364 contract must preserve local-only and no-auto-route boundaries.');
assert(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location/.test(`${station}\n${scene}\n${controls}`), 'W364 must not add remote I/O or automatic navigation.');
assert(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w364.babylon-immersive-controls-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  controls: ['analogue-touch-joystick', 'accessible-direction-pad', 'keyboard-shortcuts', 'mouse-click-to-move', 'optional-gamepad', 'local-minimap'],
  limitations: [
    'Static proof does not replace Android, iPhone/Safari, desktop GPU or real-gamepad testing.',
    'Click-to-move is a local assist feature rather than navmesh pathfinding.',
    'Gamepad and keyboard can request review only; application routes require a separate visible confirmation.'
  ],
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  errors
};
const artifacts = path.join(ROOT, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'W364_BABYLON_IMMERSIVE_CONTROLS_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
