#!/usr/bin/env node
/** W250 — City Play local-state and prepared-action gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const state = read('assets/js/contracts/city/city-world-state.js');
const actions = read('assets/js/city/city-prepared-action.js');
const station = read('assets/js/eon-city-play-station.js');
const scene = read('assets/js/city/eon-city-play-babylon.js');
const imports = auditActiveSurfaceImports({ root: ROOT });

assert(/CITY_WORLD_STATE_VERSION = 2/.test(state), 'CityWorldState must be version 2 for W250.');
assert(/play:\s*normalizeCityPlay/.test(state), 'V2 must normalize only allowlisted City Play state.');
assert(/updateCityPlayPreferences/.test(state) && /recordCityPlayLandmark/.test(state), 'V2 must expose controlled local Play updates.');
assert(!/apiKey|privateChat|vaultSecret|deviceFingerprint/.test(actions), 'Prepared City action module must not name or carry private data.');
assert(/CITY_PLAY_ACTION_DESTINATIONS/.test(actions), 'Prepared action destinations must be explicit and finite.');
assert(/requiresUserConfirmation:\s*true/.test(actions), 'Prepared actions must require user confirmation.');
assert(/return \{ ok: true, reason: null, action: confirmed, href: confirmed\.route \}/.test(actions), 'Confirmation must return a route rather than navigating itself.');
assert(!/location\.assign|window\.location|fetch\s*\(/.test(actions), 'Prepared action module must not navigate or perform remote I/O.');
assert(/onLandmarkChange/.test(scene) && /getNearestLandmark/.test(scene), 'Babylon scene must publish only local nearby-landmark state.');
assert(/data-eon-play-action-review/.test(station), 'City Play must expose a visible review sheet.');
assert(/prepareCityPlayAction/.test(station) && /confirmPreparedCityAction/.test(station), 'City Play must use the prepared-action boundary.');
assert(!/location\.assign|window\.location/.test(station), 'City Play must not navigate via JavaScript.');
assert(imports.ok, `Active source graph crosses fenced boundaries: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = { schema: 'eonapp.w250.city-prepared-action-gate.v1', ok: errors.length === 0, generatedAt: new Date().toISOString(), errors, activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount } };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
