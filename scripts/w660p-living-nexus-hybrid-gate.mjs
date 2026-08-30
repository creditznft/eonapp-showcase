#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W660P_LIVING_NEXUS_HYBRID_CONTRACT } from '../config/w660p-living-nexus-hybrid-contract.mjs';
import { getEonCityLivingNexusSnapshot, validateEonCityLivingNexusSnapshot } from '../assets/js/city/eon-city-living-nexus-hybrid.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

export function inspectW660pLivingNexusHybrid() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'docs/W660P_EONCITY_LIVING_NEXUS_HYBRID_MASTER_ROADMAP_2026-07-21.md',
    'config/w660p-living-nexus-hybrid-contract.mjs',
    'assets/js/city/eon-city-living-nexus-hybrid.js',
    'assets/js/city/eon-city-living-nexus-panel.js',
    'tests/unit/w660p-living-nexus-hybrid.test.mjs'
  ];
  add('required-files', required.every(exists), 'roadmap, contract, runtime, panel and tests exist');

  const roadmap = read(required[0]);
  add('ceo-option-locked', /Option 3: Living Nexus Hybrid/.test(roadmap) && /Handcrafted Core \+ Living Streets \+ Seeded Expanse \+ Rare Realms \+ Productive Missions \+ Persistent Personal Transformation/.test(roadmap), 'final hybrid formula is locked');
  add('three-destinations', ['EONCITY CORE', 'THE EXPANSE', 'MY REALM'].every((label) => roadmap.includes(label)) && W660P_LIVING_NEXUS_HYBRID_CONTRACT.destinations.length === 3, 'Core, Expanse and My Realm are explicit');
  add('two-modes', /Focus Mode/.test(roadmap) && /Explore Mode/.test(roadmap) && W660P_LIVING_NEXUS_HYBRID_CONTRACT.modes.length === 2, 'Focus and Explore modes are explicit');
  add('vertical-slice', W660P_LIVING_NEXUS_HYBRID_CONTRACT.verticalSlice.length === 10 && /return through Nexus/.test(roadmap) && /reflected in My Realm/.test(roadmap), 'ten-step productive vertical slice is explicit');
  add('codex-browser-proof-roadmap', /Chrome, Edge, Firefox and Opera/.test(roadmap) && /mobile\/touch/.test(roadmap) && /Functions-inclusive Cloudflare Pages deployment/.test(roadmap), 'future authenticated browser and deployment proof is required');

  const snapshot = getEonCityLivingNexusSnapshot({ storage: null, position: { x: 0, z: 0 }, seed: 'gate-seed' });
  const validation = validateEonCityLivingNexusSnapshot(snapshot);
  add('runtime-contract-valid', validation.ok && validation.cellCount === 25 && snapshot.expanse.interactiveCellCount === 9 && snapshot.expanse.horizonCellCount === 16 && validation.destinationCount === 3, validation.ok ? '3 destinations and connected 5×5 streamed Expanse validate' : validation.errors.join(', '));
  add('truth-boundaries', snapshot.reviewFirst && !snapshot.autoNavigation && !snapshot.automaticExecution && !snapshot.privateDataRead && !snapshot.privateContentStored && !snapshot.networkRequestCreated && !snapshot.rewardIssued && !snapshot.paymentClaimed, 'review-first and no fake completion/value claims');
  add('no-parallel-systems', !snapshot.secondAssistantCreated && !snapshot.secondProjectStoreCreated && !snapshot.secondTaskStoreCreated && !snapshot.secondRenderLoopCreated && !snapshot.secondCanvasCreated, 'one EONBOT/store/runtime/canvas architecture preserved');

  const station = read('assets/js/eon-city-play-station.js');
  const panel = read('assets/js/city/eon-city-living-nexus-panel.js');
  const css = read('assets/css/eon-city-play.css');
  add('city-ui-integrated', /renderEonCityLivingNexusPanel/.test(station) && /bindEonCityLivingNexusPanel/.test(station) && /data-eon-play-open-living-nexus/.test(station), 'Living Nexus is visible in the existing City UI');
  add('reviewed-native-route', /data-eon-living-review-realm/.test(panel) && /data-eon-living-native-route/.test(panel) && /second click/.test(panel), 'My Realm handoff stays review-first');
  add('mobile-reduced-motion-css', /eon-play-living-nexus-panel/.test(css) && /prefers-reduced-motion:reduce/.test(css) && /max-width:390px/.test(css), 'panel has responsive and reduced-motion treatment');

  const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
  add('maintained-suite-manifest-repaired', manifest.testFileCount === manifest.testFiles.length && manifest.testFiles.includes('tests/unit/w660n-eon-nexus-end-to-end.test.mjs') && manifest.testFiles.includes('tests/unit/w660o-nexus-launch-continuity.test.mjs'), `${manifest.testFileCount} maintained tests including W660N/O`);
  const packageJson = JSON.parse(read('package.json'));
  add('package-command', packageJson.scripts?.['qa:w660p-living-nexus-hybrid'] === 'node scripts/w660p-living-nexus-hybrid-gate.mjs && node --test tests/unit/w660p-living-nexus-hybrid.test.mjs', 'focused W660P QA command exists');

  return freeze({ schema: 'eonapp.w660p.living-nexus-hybrid-gate.2026-07-21.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: freeze(checks) });
}

const report = inspectW660pLivingNexusHybrid();
for (const check of report.checks) console.log(`[W660P] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W660P] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
