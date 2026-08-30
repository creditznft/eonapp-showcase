#!/usr/bin/env node
/** W253 — City Play input/orientation/accessibility static gate. */
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
const css = read('assets/css/eon-city-play.css');
const imports = auditActiveSurfaceImports({ root: ROOT });

assert(/data-eon-play-controls-panel/.test(station) && /bindControlGuide/.test(station), 'W253 needs a visible keyboard/touch/controller control guide.');
assert(/data-play-move/.test(station) && /pointercancel/.test(scene), 'W253 touch movement needs visible controls plus pointer-cancel recovery.');
assert(/data-eon-play-pause/.test(station) && /data-eon-play-exit-fullscreen/.test(station) && /Restart EON City/.test(station), 'W253 must keep Pause, Exit full screen and a safe City restart reachable.');
assert(/GAMEPAD_DEAD_ZONE/.test(scene) && /getGamepads/.test(scene) && /onInputModeChange/.test(scene), 'W253 needs optional bounded gamepad movement support.');
assert(/optional-gamepad/.test(scene), 'W253 must label gamepad as optional.');
assert(/orientation\?\.lock\?\.\('landscape'\)/.test(station) && /cannot force orientation in every browser/.test(station), 'W253 must preserve best-effort, not forced, orientation.');
assert(/env\(safe-area-inset-top\)/.test(css) && /orientation:portrait/.test(css), 'W253 requires safe-area and portrait guidance.');
assert(/min-height:3\.5rem/.test(css) && /@media \(max-width:760px\)\{\.eon-play-hud-actions button,.eon-play-hud-actions a\{min-height:3rem/.test(css), 'W253 touch targets are below accessible size.');
assert(!/location\.assign|window\.location|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(`${station}\n${scene}`), 'W253 must not add automatic navigation or remote I/O.');
assert(/Prepared route · review required/.test(station) && /confirmPreparedCityAction/.test(station), 'W253 must retain explicit review/confirm action boundaries.');
assert(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w253.city-input-orientation-accessibility-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  limitations: [
    'Static proof does not replace Android/iPhone/PWA keyboard, gamepad, safe-area or fullscreen/orientation testing.',
    'Gamepad support can request the visible review only; City work actions retain a separate confirmation boundary.'
  ],
  errors
};
const artifacts = path.join(ROOT, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'W253_CITY_INPUT_ORIENTATION_ACCESSIBILITY_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
