#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W660U_LIVING_NEXUS_WORLD_SYSTEMS_CONTRACT } from '../config/w660u-living-nexus-world-systems-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

export function inspectW660uLivingNexusWorldSystems() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'config/w660u-living-nexus-world-systems-contract.mjs',
    'assets/js/city/eon-city-living-nexus-world-systems.js',
    'assets/js/city/eon-city-living-nexus-babylon-runtime.js',
    'assets/js/city/eon-city-living-nexus-panel.js',
    'tests/unit/w660u-living-nexus-world-systems.test.mjs',
    'docs/W660P_EONCITY_LIVING_NEXUS_HYBRID_MASTER_ROADMAP_2026-07-21.md'
  ];
  add('required-files', required.every(exists), 'contract, deterministic plan, one-scene renderer, visible panel, tests and roadmap exist');

  const plan = read(required[1]);
  add('deterministic-3x3-plan', /buildEonCityLivingNexusWorldSystemsPlan/.test(plan) && /residentCellCount/.test(plan) && /deterministic: true/.test(plan), 'world systems are derived from the current deterministic resident window');
  add('local-phase-no-device-clock', /VISUAL_PHASES/.test(plan) && /readsDeviceClock: false/.test(plan) && !/new Date|Date\.now/.test(plan), 'visual phases use an explicit local phase index and never read device time');
  add('local-weather-boundary', /clear-neon/.test(plan) && /rain-veil/.test(plan) && /neon-mist/.test(plan) && /readsRealWeather: false/.test(plan) && !/fetch\s*\(|XMLHttpRequest|WebSocket/.test(plan), 'weather is deterministic local presentation without a weather service');
  add('bounded-transit', /Transit Capsule/.test(plan) && /boardable: false/.test(plan) && /automaticTravel: false/.test(plan), 'Transit Capsules are visible bounded encounters and do not auto-travel');
  add('maintenance-truth', /claimsWorkComplete: false/.test(plan) && /readsUserState: false/.test(plan), 'maintenance cues never claim completed work or read user state');
  add('rare-authored-portals', /REALMS/.test(plan) && /inspectOnly: true/.test(plan) && /authoredRealm: true/.test(plan) && /generatedGeometry: false/.test(plan), 'rare Realm portals are authored, inspect-only and deterministic');
  add('reduced-effects-plan', /reducedEffects \? WEATHER\[0\]/.test(plan) && /rainStrandCount: reducedEffects \? 0/.test(plan) && /QUALITY\.lite/.test(plan), 'reduced effects removes motion-heavy transit and rain');

  const runtime = read(required[2]);
  add('one-scene-renderer', /renderLivingWorldSystems/.test(runtime) && /worldSystemsRoot\.parent = expanseRoot/.test(runtime) && !/new Engine\(|createEngine\(|requestAnimationFrame\(/.test(runtime), 'world systems are children of the existing Expanse root with no second engine or loop');
  add('visible-world-meshes', /living-nexus-transit-capsule/.test(runtime) && /living-nexus-local-rain/.test(runtime) && /living-nexus-maintenance-cue/.test(runtime) && /living-nexus-rare-portal/.test(runtime), 'transit, weather, maintenance and rare-portal presentation meshes are emitted');
  add('existing-update-loop', /for \(const transit of worldTransitNodes\)/.test(runtime) && /for \(const maintenance of worldMaintenanceNodes\)/.test(runtime) && /for \(const weather of worldWeatherNodes\)/.test(runtime), 'motion is updated inside the existing Living Nexus update call');
  add('summary-truth', /transitCapsuleCount/.test(runtime) && /realWeatherRead: false/.test(runtime) && /rarePortalCount/.test(runtime), 'runtime summary exposes bounded truthful system state');

  const panel = read(required[3]);
  add('visible-system-status', /eon-play-living-nexus-world-systems/.test(panel) && /no real-weather claim/.test(panel) && /inspect-only authored Realm/.test(panel), 'Living Nexus panel visibly explains the bounded systems');
  add('reuse-capture-and-share', /data-capture-toggle/.test(panel) && /data-eon-play-share-city/.test(panel) && /nothing uploads automatically/i.test(panel) && /No post or upload was performed automatically/.test(panel), 'panel reuses existing consent-based Creator Capture and one global Sharing Center');

  const css = read('assets/css/eon-city-play.css');
  add('responsive-world-status', /eon-play-living-nexus-world-systems/.test(css) && /@media\(max-width:760px\)/.test(css), 'world-system status remains responsive');

  const roadmap = read(required[5]);
  add('roadmap-progress-boundary', /W660U — living-world systems/.test(roadmap) && /W660U bounded source slice is complete/i.test(roadmap) && /authenticated real-browser proof/i.test(roadmap), 'roadmap records bounded W660U source completion without claiming browser proof');

  const pkg = JSON.parse(read('package.json'));
  add('package-command', pkg.scripts?.['qa:w660u-living-nexus-world-systems'] === 'node scripts/w660u-living-nexus-world-systems-gate.mjs && node --test tests/unit/w660u-living-nexus-world-systems.test.mjs', 'focused W660U QA command exists');
  const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
  add('maintained-suite-current', manifest.testFileCount === manifest.testFiles.length && manifest.testFiles.includes('tests/unit/w660u-living-nexus-world-systems.test.mjs') && manifest.testFileCount >= 319, `${manifest.testFileCount} maintained test files include W660U`);

  add('contract-invariants', Object.values(W660U_LIVING_NEXUS_WORLD_SYSTEMS_CONTRACT.invariants).every(Boolean), 'contract keeps all safety and canonical-runtime invariants');
  return freeze({ schema: 'eonapp.w660u.living-nexus-world-systems-gate.2026-07-21.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: freeze(checks) });
}

const report = inspectW660uLivingNexusWorldSystems();
for (const check of report.checks) console.log(`[W660U] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W660U] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
