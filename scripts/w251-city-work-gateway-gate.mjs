#!/usr/bin/env node
/** W251 — City to Workspace work gateway, privacy and action-boundary gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const mission = read('assets/js/contracts/city/city-work-mission.js');
const station = read('assets/js/eon-city-play-station.js');
const workspace = read('assets/js/eon-workspace-pages.js');
const imports = auditActiveSurfaceImports({ root: ROOT });

assert(/CITY_WORKSPACE_MISSION/.test(mission), 'W251 needs one explicit Workspace mission registry.');
assert(/destination:\s*'\/workspace'/.test(mission), 'W251 may target only /workspace.');
assert(/returnRoute:\s*'\/eoncity\/play'/.test(mission), 'W251 must retain an explicit City return route.');
assert(/opaque-receipt-only-no-user-content/.test(mission), 'W251 receipt must declare its no-user-content boundary.');
assert(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location/.test(mission), 'W251 receipt module must not navigate or perform remote I/O.');
assert(/offerCityBeginnerMission/.test(station) && /openCityBeginnerMission/.test(station), 'City Play must offer then separately open the bounded beginner-mission receipt.');
assert(/data-eon-play-mission-id/.test(station), 'City Play review must bind the opaque mission receipt only.');
assert(!/location\.assign|window\.location/.test(station), 'City Play must retain normal user-controlled navigation only.');
assert(/renderCityBeginnerMission/.test(workspace) && /bindCityBeginnerMission/.test(workspace), 'Workspace must visibly render and bind the City mission.');
assert(/createProject\(\{ title, summary, status: 'active' \}\)/.test(workspace), 'A project can be created only from explicit Workspace input.');
assert(/completeCityBeginnerMission/.test(workspace) && /returnCityBeginnerMission/.test(workspace), 'Workspace must separately complete or return a mission.');
assert(imports.ok, `Active graph crosses fenced boundaries: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w251.city-work-gateway-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  errors
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
