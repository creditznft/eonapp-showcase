#!/usr/bin/env node
/** W265/W286 — bounded local City district decision and expansion gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W265_FIRST_CITY_DISTRICT_DECISION, validateW265FirstCityDistrictDecision } from '../config/w265-first-city-district-decision.mjs';
import { CITY_LANDMARKS, CITY_STATE_DISTRICT_IDS, getCityLandmarkAction } from '../assets/js/contracts/city/city-landmark-registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const decision = validateW265FirstCityDistrictDecision();
assert(decision.ok, decision.errors.join(' '));
assert(CITY_LANDMARKS.length === 8, 'Only one district may be added to the seven-marker baseline.');
assert(JSON.stringify(CITY_STATE_DISTRICT_IDS) === JSON.stringify(['command', 'workspace', 'market', 'realm', 'library', 'trade', 'vault', 'orientation']), 'District order must append Orientation Hall without rewriting historic IDs.');
const orientation = CITY_LANDMARKS.find((landmark) => landmark.id === 'orientation-hall');
assert(orientation?.districtId === W265_FIRST_CITY_DISTRICT_DECISION.approvedDistrictId, 'Orientation Hall must match the W265 decision.');
assert(orientation?.map?.landmark === 'orientation-atrium', 'Orientation Hall must retain its source-controlled visual motif.');
assert(orientation?.action === null && getCityLandmarkAction('orientation-hall') === null, 'Orientation Hall must not prepare or open a route.');
assert(orientation?.play === null, 'Babylon Play remains explicitly out of W286-A0 scope.');
const lite = read('assets/js/eon-operator-map.js');
const tour = read('assets/js/city/eon-city-3d-renderer.js');
const play = read('assets/js/city/eon-city-play-babylon.js');
assert(/orientation-atrium/.test(lite), 'City Lite must render Orientation Hall.');
assert(/orientation-atrium/.test(tour) && /case 'orientation'/.test(tour), 'Visual Tour must render Orientation Hall.');
assert(/landmark\.play && landmark\.action/.test(play), 'Babylon Play must stay scoped to authored actionable command-district proof landmarks.');
assert(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location\s*=/.test(`${lite}
${tour}`), 'W286 must not add remote I/O or automatic navigation.');
const report = {
  schema: 'eonapp.w265-w286.city-district-expansion-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  decision: { status: W265_FIRST_CITY_DISTRICT_DECISION.status, district: W265_FIRST_CITY_DISTRICT_DECISION.approvedDistrictId, cityPlay: W265_FIRST_CITY_DISTRICT_DECISION.scope.cityPlay },
  city: { landmarkCount: CITY_LANDMARKS.length, districtIds: CITY_STATE_DISTRICT_IDS, orientationActionable: Boolean(getCityLandmarkAction('orientation-hall')) },
  limitations: ['Source-only proof; real visual, performance, touch, accessibility and task-success evidence remains required.', 'This gate does not authorize Babylon Play expansion, remote assets, wallet/chain, rewards/referrals, deployment, or launch.'],
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts/W265_W286_CITY_DISTRICT_EXPANSION_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
