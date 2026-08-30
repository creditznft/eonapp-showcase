#!/usr/bin/env node
/** W254 — City Play local frame-time governor static safety gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const scene = read('assets/js/city/eon-city-play-babylon.js');
const station = read('assets/js/eon-city-play-station.js');
const imports = auditActiveSurfaceImports({ root: ROOT });

assert(/applyPerformanceProtection/.test(scene), 'W254 needs a named local performance-protection path.');
assert(/frameCount >= 150/.test(scene) && /warmupAverage > 36/.test(scene), 'W254 needs a bounded warm-up threshold before reducing effects.');
assert(/playReducedEffects = true/.test(scene) && /rain\?\.setEnabled\(false\)/.test(scene) && /glow\.intensity = 0/.test(scene), 'W254 must reduce bounded local effects rather than alter work state.');
assert(/setHardwareScalingLevel\(Math\.min\(1\.75/.test(scene), 'W254 hardware scaling must have a bounded protection cap.');
assert(/performanceGovernor/.test(scene), 'W254 runtime summary must disclose local governor state.');
assert(!/localStorage|updateCityPlayPreferences/.test(scene), 'W254 may not silently overwrite the selected quality preference.');
assert(/onPerformanceChange/.test(station) && /Performance protection is active locally/.test(station), 'W254 must tell the player when local protection is active.');
assert(/City Overview remains available/.test(station), 'W254 must retain City Overview exit context.');
assert(!/location\.assign|window\.location|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(`${station}\n${scene}`), 'W254 must not introduce remote I/O or automatic navigation.');
assert(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w254.city-performance-governor-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  limitation: 'This source gate does not measure device frame time, GPU memory, thermal throttling or PWA resume; W254 physical-device evidence remains open.',
  errors
};
const artifacts = path.join(ROOT, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'W254_CITY_PERFORMANCE_GOVERNOR_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
