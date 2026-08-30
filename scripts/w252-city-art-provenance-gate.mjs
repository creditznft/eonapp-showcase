#!/usr/bin/env node
/** W252 — Original-art, provenance and bounded-visual-budget gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import {
  CITY_PLAY_ART_BIBLE,
  CITY_PLAY_ART_BUDGETS,
  CITY_PLAY_ART_DIRECTION_SCHEMA,
  CITY_PLAY_ORIGINAL_ASSET_LEDGER
} from '../assets/js/city/eon-city-play-art-direction.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const scene = read('assets/js/city/eon-city-play-babylon.js');
const direction = read('assets/js/city/eon-city-play-art-direction.js');
const handoff = read('HANDOFF/CODEX_NEXT_SAFE_EXECUTION_W252.md');
const imports = auditActiveSurfaceImports({ root: ROOT });

assert(CITY_PLAY_ART_DIRECTION_SCHEMA === 'eon.city.play.art-direction.w252.v1', 'W252 art direction schema is missing or unexpected.');
assert(CITY_PLAY_ORIGINAL_ASSET_LEDGER.length >= 4, 'W252 needs a meaningful source-controlled asset provenance ledger.');
for (const asset of CITY_PLAY_ORIGINAL_ASSET_LEDGER) {
  assert(asset.runtimeNetwork === false, `${asset.id} must not fetch an asset at runtime.`);
  assert(asset.userData === false, `${asset.id} must not contain user data.`);
  assert(/^EONAPP original/.test(asset.origin), `${asset.id} must declare original provenance.`);
  assert(/^EONAPP controlled original work$/.test(asset.licence), `${asset.id} must declare a controlled original licence.`);
  assert(/^assets\/js\/city\//.test(asset.sourcePath), `${asset.id} must identify an internal source path.`);
}
for (const [quality, budget] of Object.entries(CITY_PLAY_ART_BUDGETS)) {
  assert(budget.facadeFins >= 1 && budget.facadeFins <= 7, `${quality} facade fin cap is unsafe.`);
  assert(budget.streetProps >= 1 && budget.streetProps <= 16, `${quality} street prop cap is unsafe.`);
  assert(budget.skylineTowers >= 1 && budget.skylineTowers <= 10, `${quality} skyline cap is unsafe.`);
  assert(budget.signCount >= 1 && budget.signCount <= 6, `${quality} sign cap is unsafe.`);
  assert(budget.textureMaxPx <= 1024, `${quality} texture cap exceeds W252 maximum.`);
}
assert(/getCityPlayArtBudget/.test(scene) && /CITY_PLAY_NEON_COMMAND_PALETTE/.test(scene), 'Babylon scene must consume the W252 art contract.');
assert(/DynamicTexture/.test(scene) && /createDistrictSign/.test(scene), 'W252 requires internal procedural signage rather than external art assets.');
assert(/addDistrictFurnishings/.test(scene) && /fogDensity/.test(scene), 'W252 requires authored district atmosphere and bounded furnishing support.');
assert(!/https?:|SceneLoader|AssetsManager|ImportMesh|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(`${scene}\n${direction}`), 'W252 art path must remain procedural and remote-I/O free.');
assert(/original art and visual-production foundation/i.test(handoff), 'W252 Codex handoff is missing.');
assert(/no copied/i.test(`${handoff}\n${CITY_PLAY_ART_BIBLE.mood}`), 'W252 must state its original-art boundary.');
assert(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w252.city-art-provenance-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  ledgerCount: CITY_PLAY_ORIGINAL_ASSET_LEDGER.length,
  profileBudgets: CITY_PLAY_ART_BUDGETS,
  limitations: [
    'This gate proves source-controlled procedural art direction, not final visual quality or human art approval.',
    'This gate does not prove mobile frame time, physical-device rendering, final asset provenance beyond the controlled ledger, or launch readiness.'
  ],
  errors
};
const artifacts = path.join(ROOT, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'W252_CITY_ART_PROVENANCE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
