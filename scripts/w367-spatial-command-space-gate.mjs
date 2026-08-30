#!/usr/bin/env node
/** W367 — Three.js Spatial Command Space source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import {
  SPATIAL_COMMAND_CAMERA_PRESETS,
  buildSpatialCommandProjection,
  validateSpatialCommandProjection
} from '../assets/js/city/eon-city-spatial-command-space.js';
import { W367_SPATIAL_COMMAND_SPACE_CONTRACT, validateW367SpatialCommandSpaceContract } from '../config/w367-spatial-command-space-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const station = read('assets/js/eon-city-3d-station.js');
const renderer = read('assets/js/city/eon-city-3d-renderer.js');
const css = read('assets/css/eon-city-3d-station.css');
const projectionSource = read('assets/js/city/eon-city-spatial-command-space.js');
const docs = read('docs/W367_THREE_SPATIAL_COMMAND_SPACE_IMPLEMENTATION_2026-06-26.md');
const imports = auditActiveSurfaceImports({ root: ROOT });
const projection = buildSpatialCommandProjection({
  citySummary: { unlockedDistricts: ['command'], progress: { activeObjective: 'visit-command-centre' }, navigation: { currentMode: 'command-space', lastTransition: { fromMode: 'portal' } } },
  agentPresence: [{ id: 'cue-1', role: 'builder', status: 'working', prompt: 'must not cross boundary' }]
});

check(validateSpatialCommandProjection(projection).ok, 'W367 command projection must validate.');
check(validateW367SpatialCommandSpaceContract().length === 0, `W367 contract invalid: ${validateW367SpatialCommandSpaceContract().join(' | ')}`);
check(SPATIAL_COMMAND_CAMERA_PRESETS.map((item) => item.id).join(',') === 'arrival,command-centre,skyline', 'W367 camera presets drifted.');
check(projection.crew.visibleCount === 1 && !JSON.stringify(projection).includes('must not cross boundary'), 'W367 must strip private cue fields before rendering.');
check(/renderCommandBoard/.test(station) && /data-eon3-camera/.test(station) && /data-eon3-prepare-immersive/.test(station), 'W367 station needs Command Board, camera control and visible Babylon handoff review.');
check(/prepareCityModeTransition\(\{ fromMode: 'command-space', toMode: 'immersive-work'/.test(station), 'W367 Babylon handoff must use a local City transition receipt.');
check(/spatial-command-eonbot-guide/.test(renderer) && /makeSpatialCommandEonbot/.test(renderer), 'W367 needs an original EONBOT guide presence inside the Three.js scene.');
check(/setCameraPreset/.test(renderer) && /cameraPresetId/.test(renderer) && /commandGuideVisible/.test(renderer), 'W367 renderer camera and guide lifecycle contract is incomplete.');
check(/eon3-command-board/.test(css) && /eon3-command-lane/.test(css), 'W367 needs premium Command Board styles.');
check(/No GLB, GLTF, texture, animation, audio, music, voice/i.test(docs) && /does not claim/i.test(docs), 'W367 docs must disclose current art/evidence limits.');
check(W367_SPATIAL_COMMAND_SPACE_CONTRACT.truthRules.remoteAssets === false && W367_SPATIAL_COMMAND_SPACE_CONTRACT.truthRules.fakeAgentActivity === false, 'W367 must prohibit remote art and simulated AI activity.');
check(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location/.test(`${station}\n${renderer}\n${projectionSource}`), 'W367 cannot add remote I/O or automatic navigation.');
check(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w367.spatial-command-space-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  commandSpace: {
    route: W367_SPATIAL_COMMAND_SPACE_CONTRACT.route.canonical,
    cameraPresets: SPATIAL_COMMAND_CAMERA_PRESETS.map((item) => item.id),
    localOnly: true,
    privateDataInRenderer: false,
    autoNavigation: false,
    autoExecution: false,
    commandGuide: true
  },
  limitations: [
    'W367 proves source structure and safe renderer lifecycle only, not final AAA asset quality.',
    'No binary character, environment, animation, texture, music or voice asset is delivered in this code-only wave.',
    'No browser, mobile, GPU, production deployment or human visual proof is created by this source gate.'
  ],
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W367_SPATIAL_COMMAND_SPACE_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
