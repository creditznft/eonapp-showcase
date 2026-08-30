#!/usr/bin/env node
/** W366 — Neon Command District vertical-slice static source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import {
  EON_COMMAND_DISTRICT_BLUEPRINT,
  EON_COMMAND_DISTRICT_NPC_ROLES,
  getCommandDistrictMissionCard,
  validateCommandDistrictBlueprint
} from '../assets/js/city/eon-city-command-district.js';
import { W366_NEON_COMMAND_DISTRICT_CONTRACT } from '../config/w366-neon-command-district-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const check = (value, message) => { if (!value) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const scene = read('assets/js/city/eon-city-play-babylon.js');
const station = read('assets/js/eon-city-play-station.js');
const css = read('assets/css/eon-city-play.css');
const district = read('assets/js/city/eon-city-command-district.js');
const docs = read('docs/W366_NEON_COMMAND_DISTRICT_VERTICAL_SLICE_2026-06-26.md');
const imports = auditActiveSurfaceImports({ root: ROOT });
const blueprint = validateCommandDistrictBlueprint();

check(blueprint.ok, `W366 blueprint invalid: ${blueprint.errors.join(' | ')}`);
check(EON_COMMAND_DISTRICT_BLUEPRINT.structures.length >= 7, 'W366 needs Arrival Plaza, Command Centre, Command Room and visible work lanes.');
check(EON_COMMAND_DISTRICT_NPC_ROLES.length >= 6, 'W366 needs a meaningful first guide cast.');
check(EON_COMMAND_DISTRICT_NPC_ROLES.every((role) => String(role.truthRule || '').trim().length >= 24), 'Each W366 guide must carry a meaningful truth rule.');
check(getCommandDistrictMissionCard().progressLabel === '1/6', 'W366 First Command Route stage count drifted.');
check(/addCommandRoomInterior/.test(scene) && /addDistrictRouteBeacons/.test(scene) && /district-guide-/.test(scene), 'Babylon must build the Command Room, route beacons and guide silhouettes.');
check(/hero-operator-procedural/.test(scene) && /eonbot-companion-procedural/.test(scene), 'W366 needs explicit original hero Operator and EONBOT procedural identities.');
check(/getCommandDistrictSceneBlueprint/.test(scene) && /commandDistrict: Object\.freeze/.test(scene), 'Babylon runtime summary must disclose the Command District vertical slice.');
check(/recordCommandDistrictEvent\('entered'/.test(station) && /recordCommandDistrictEvent\('route-prepared'/.test(station) && /recordCommandDistrictEvent\('route-confirmed'/.test(station) && /recordCommandDistrictEvent\('returned'/.test(station), 'Station must wire all First Command Route transitions.');
check(/data-eon-play-district-card/.test(station) && /renderDistrictCard/.test(station), 'Station needs a visible bounded local journey card.');
check(/eon-play-district-card/.test(css) && /safe-area-inset-bottom/.test(css), 'W366 journey card requires safe-area-aware presentation.');
check(/does not claim/i.test(docs) && /No GLB, GLTF, texture, animation, audio/i.test(docs), 'W366 docs must disclose art limitations.');
check(W366_NEON_COMMAND_DISTRICT_CONTRACT.truthRules.routeReviewRequired === true && W366_NEON_COMMAND_DISTRICT_CONTRACT.truthRules.noRemoteAssets === true, 'W366 contract must preserve review and local asset boundaries.');
check(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location/.test(`${district}\n${station}\n${scene}`), 'W366 must not add remote I/O or automatic navigation.');
check(EON_COMMAND_DISTRICT_BLUEPRINT.interactionRules.allowsWalletOrCommerce === false, 'W366 blueprint cannot introduce economic systems.');
check(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w366.neon-command-district-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  district: {
    structures: EON_COMMAND_DISTRICT_BLUEPRINT.structures.map((item) => item.id),
    guideRoles: EON_COMMAND_DISTRICT_NPC_ROLES.map((role) => role.id),
    stageCount: 6,
    localOnly: true,
    remoteAssets: false,
    remoteTelemetry: false
  },
  limitations: [
    'W366 proves source structure and safe journey semantics, not final AAA art or device performance.',
    'No binary character, environment, animation, texture, music or voice asset is delivered in this code-only wave.',
    'No browser, mobile, GPU, controller, production deployment or human visual proof is created by this source gate.'
  ],
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W366_NEON_COMMAND_DISTRICT_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
