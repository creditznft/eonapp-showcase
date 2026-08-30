#!/usr/bin/env node
/** W255 — canonical City landmark/action/state parity static gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES } from '../config/route-contract.mjs';
import {
  CITY_ACTIONABLE_LANDMARK_IDS,
  CITY_LANDMARKS,
  CITY_STATE_DISTRICT_IDS,
  getCityLandmarkAction
} from '../assets/js/contracts/city/city-landmark-registry.js';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const primary = new Set(PRIMARY_APP_ROUTES.map((entry) => entry.from));
const ids = CITY_LANDMARKS.map((landmark) => landmark.id);
const districtIds = CITY_LANDMARKS.map((landmark) => landmark.districtId);
const routes = CITY_ACTIONABLE_LANDMARK_IDS.map((id) => getCityLandmarkAction(id)?.route);
const imports = auditActiveSurfaceImports({ root: ROOT });

assert(new Set(ids).size === ids.length, 'Landmark IDs must be unique.');
assert(new Set(districtIds).size === districtIds.length, 'Persisted City district IDs must be unique.');
assert(JSON.stringify(districtIds) === JSON.stringify(CITY_STATE_DISTRICT_IDS), 'CityWorldState must preserve the canonical district order.');
assert(CITY_LANDMARKS.length === 8, 'W265/W286 must retain the seven original City markers and add only the approved Orientation Hall.');
assert(CITY_ACTIONABLE_LANDMARK_IDS.length === 5, 'W255 must retain exactly five safe, finite City actions.');
for (const route of routes) {
  assert(primary.has(route), `City action route is not canonical: ${route}`);
  assert(/^(?:\/|\/(?:chat|projects|workspace|realm-studio|local-ai))$/.test(route), `City route is outside the W255 allowlist: ${route}`);
}
assert(getCityLandmarkAction('preview-gallery') === null, 'Preview Gallery must not expose a transaction or catalog route.');
assert(getCityLandmarkAction('vault-safehouse') === null, 'Vault Safehouse must not pass a credential context through City.');
assert(getCityLandmarkAction('orientation-hall') === null, 'Orientation Hall must remain a local non-actionable district.');

const engine = read('assets/js/city/eon-city-2d-engine.js');
const state = read('assets/js/contracts/city/city-world-state.js');
const model = read('assets/js/city/eon-city-3d-model.js');
const station = read('assets/js/eon-city-3d-station.js');
const map = read('assets/js/eon-operator-map.js');
const play = read('assets/js/city/eon-city-play-babylon.js');
const actions = read('assets/js/city/city-prepared-action.js');
assert(/CITY_LANDMARKS/.test(engine) && !/CITY_DISTRICTS\s*=\s*Object\.freeze\(\[/.test(engine), 'City Lite must derive districts from the landmark registry.');
assert(/CITY_STATE_DISTRICT_IDS/.test(state), 'CityWorldState must use canonical persisted district IDs.');
assert(/CITY_DISTRICTS/.test(model), 'Visual Tour model must use the same registry-derived 2D district projection.');
assert(/CITY_LANDMARKS/.test(play) && !/CITY_PLAY_LANDMARKS\s*=\s*Object\.freeze\(\[/.test(play), 'Babylon Play must derive rendered landmarks from the registry.');
assert(/getCityLandmarkAction/.test(actions) && /CITY_ACTION_SOURCES/.test(actions), 'Prepared actions must use the registry and name the City mode source.');
assert(/prepareCityAction/.test(map) && /confirmPreparedCityAction/.test(map), 'City Lite must use shared prepare/review/confirm actions.');
assert(/prepareCityAction/.test(station) && /confirmPreparedCityAction/.test(station), 'Visual Tour must use shared prepare/review/confirm actions.');
assert(!/location\.assign|location\.href\s*=|window\.location\s*=|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(`${map}\n${station}\n${play}`), 'W255 must not introduce automatic navigation or remote I/O.');
assert(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w255.city-parity-registry-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  landmarkCount: CITY_LANDMARKS.length,
  actionableLandmarkCount: CITY_ACTIONABLE_LANDMARK_IDS.length,
  routes,
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  limitations: [
    'Static proof does not replace visual, touch, fullscreen, context-loss or task-success testing on real devices.',
    'The approved Orientation Hall is a local non-actionable expansion; this gate does not authorize chain features, wallets, rewards, commerce, remote I/O, or autonomous actions.'
  ],
  errors
};
const artifacts = path.join(ROOT, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'W255_CITY_PARITY_REGISTRY_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
