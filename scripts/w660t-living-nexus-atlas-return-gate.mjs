#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W660T_LIVING_NEXUS_ATLAS_RETURN_CONTRACT } from '../config/w660t-living-nexus-atlas-return-contract.mjs';
import { EON_CITY_W667_PRACTICAL_WORLD_BOUND } from '../assets/js/city/w667/eon-city-w667-expanse-world-grammar.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

export function inspectW660tLivingNexusAtlasReturn() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'config/w660t-living-nexus-atlas-return-contract.mjs',
    'assets/js/city/eon-city-living-nexus-hybrid.js',
    'assets/js/city/eon-city-living-nexus-panel.js',
    'tests/unit/w660t-living-nexus-atlas-return.test.mjs',
    'docs/W660P_EONCITY_LIVING_NEXUS_HYBRID_MASTER_ROADMAP_2026-07-21.md'
  ];
  add('required-files', required.every(exists), 'contract, existing Living Nexus store, panel, tests and roadmap exist');

  const hybrid = read(required[1]);
  add('same-store-extension', /EON_CITY_LIVING_NEXUS_STORAGE_KEY/.test(hybrid) && /atlasDiscoveries/.test(hybrid) && /returnPoint/.test(hybrid) && !/ATLAS_STORAGE_KEY/.test(hybrid), 'Atlas extends the canonical Living Nexus store instead of creating a second database');
  add('bounded-private-discoveries', /MAX_ATLAS_DISCOVERIES = 48/.test(hybrid) && /sharePermission: 'private'/.test(hybrid) && /privateContentStored: false/.test(hybrid), 'discoveries are bounded and private by construction');
  add('public-safe-fields', W660T_LIVING_NEXUS_ATLAS_RETURN_CONTRACT.atlas.fields.every((field) => hybrid.includes(field)), 'only coarse cell, seed, visual, road, purpose and time fields are retained');
  add('explicit-record-and-return', /recordAtlasCell\(cellId/.test(hybrid) && /setAtlasReturnPoint\(cellId/.test(hybrid) && /prepareAtlasReturn/.test(hybrid) && /explicit-user-action-required/.test(hybrid), 'record, set and return operations require explicit user action');
  add('bounded-return-point', /LIVING_NEXUS_WORLD_BOUND = EON_CITY_W667_PRACTICAL_WORLD_BOUND/.test(hybrid) && EON_CITY_W667_PRACTICAL_WORLD_BOUND === 1_000_000 && /automaticNavigation: false/.test(hybrid) && /atlas-return-point-unavailable/.test(hybrid), 'one return point remains within the deterministic-infinite practical world bound and never auto-navigates');
  add('verified-my-realm-only', /recordVerifiedOutcome/.test(hybrid) && /verified-bounded-outcome-required/.test(hybrid) && /OUTCOME_TRANSFORMATIONS/.test(hybrid), 'My Realm transformations still originate only from bounded verified outcomes');
  add('no-private-or-value-system', !/fetch\s*\(|XMLHttpRequest|WebSocket|indexedDB\.open/.test(hybrid) && /rewardIssued: false/.test(hybrid) && /paymentClaimed: false/.test(hybrid), 'Atlas adds no network, database, reward, payment or entitlement system');

  const panel = read(required[2]);
  add('visible-atlas-controls', /data-eon-living-record-atlas/.test(panel) && /data-eon-living-set-return/.test(panel) && /data-eon-living-return-atlas/.test(panel), 'record, set-return and return-through-Nexus controls are visible');
  add('private-atlas-copy', /private EON Atlas/.test(panel) && /No project, prompt, file or identity data was stored/.test(panel), 'UI states the bounded private-data boundary');
  add('explicit-runtime-return', /enterLivingNexusDestination\(snapshot.destination/.test(panel) && /returnPoint/.test(panel) && /separate explicit click/.test(panel), 'the panel hands the return point to the existing renderer only after an explicit click');

  const babylon = read('assets/js/city/eon-city-play-babylon.js');
  add('canonical-scene-return', /enterLivingNexusDestination\(destination = 'core'.*returnPoint/s.test(babylon) && /atlasReturnApplied/.test(babylon) && /livingNexusRuntime\.update\(\{ position: operator\.position/.test(babylon), 'return repositions and rebuilds inside the existing Babylon scene');
  add('return-validation', /returnTarget = destination === 'expanse'/.test(babylon) && /Math\.abs\(Number\(returnPoint\.x\)\) <= LIVING_NEXUS_WORLD_BOUND/.test(babylon), 'untrusted return coordinates are validated against the bounded world');

  const css = read('assets/css/eon-city-play.css');
  add('responsive-atlas-ui', /eon-play-living-nexus-atlas/.test(css) && /@media\(max-width:760px\)/.test(css), 'private Atlas summary is responsive');

  const roadmap = read(required[4]);
  add('roadmap-progress-and-proof-boundary', /W660T — Atlas and My Realm return loop/.test(roadmap) && /W660T source implementation is complete/i.test(roadmap) && /authenticated real-browser proof/i.test(roadmap) && /Functions-inclusive Cloudflare Pages/.test(roadmap), 'roadmap records W660T source completion while external proof remains pending');

  const pkg = JSON.parse(read('package.json'));
  add('package-command', pkg.scripts?.['qa:w660t-living-nexus-atlas-return'] === 'node scripts/w660t-living-nexus-atlas-return-gate.mjs && node --test tests/unit/w660t-living-nexus-atlas-return.test.mjs', 'focused W660T QA command exists');
  const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
  add('maintained-suite-current', manifest.testFileCount === manifest.testFiles.length && manifest.testFiles.includes('tests/unit/w660t-living-nexus-atlas-return.test.mjs') && manifest.testFileCount >= 318, `${manifest.testFileCount} maintained test files include W660T`);

  return freeze({ schema: 'eonapp.w660t.living-nexus-atlas-return-gate.2026-07-21.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: freeze(checks) });
}

const report = inspectW660tLivingNexusAtlasReturn();
for (const check of report.checks) console.log(`[W660T] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W660T] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
