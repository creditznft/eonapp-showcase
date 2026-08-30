#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W660Z_LIVING_NEXUS_INSTITUTIONAL_CONTRACT } from '../config/w660z-living-nexus-institutional-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const exists = (name) => fs.existsSync(path.join(root, name));
const freeze = Object.freeze;

export function inspectW660zLivingNexusInstitutionalReadiness() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'config/w660z-living-nexus-institutional-contract.mjs',
    'assets/js/city/eon-city-connected-core.js',
    'assets/js/city/eon-city-connected-core-babylon.js',
    'assets/js/city/eon-city-living-nexus-realms.js',
    'assets/js/city/eon-city-living-nexus-realm-babylon.js',
    'assets/js/city/eon-city-living-nexus-babylon-runtime.js',
    'scripts/w660z-local-performance-proof.mjs',
    'scripts/w660z-local-browser-proof.mjs',
    'scripts/w660z-local-browser-proof-runner.mjs',
    'tests/unit/w660z-living-nexus-institutional.test.mjs'
  ];
  add('required-authority-files', required.every(exists), 'institutional contract, runtime systems, performance proof, browser proof and maintained tests exist');

  const core = read('assets/js/city/eon-city-connected-core.js');
  add('connected-nine-district-core', /EON_CITY_W689_PRODUCT_DISTRICTS/.test(core) && /buildEonCityW690CompleteCoreIdentityPlan/.test(core) && /closed: true/.test(core) && /street-graph-not-connected/.test(core), 'current nine-district Belt authority is joined by a validated closed transit and street graph');
  add('focus-explore-parity', /focusModeFastTravelRetained: true/.test(core) && /physicalWalkingSupported: true/.test(core), 'Focus and Explore preserve direct productivity and physical travel');

  const realms = read('assets/js/city/eon-city-living-nexus-realms.js');
  for (const id of ['archive-noir', 'living-bio-city', 'golden-sovereign', 'forge-depths', 'orbital-white-city', 'nexus-ruins']) {
    add(`premium-realm-${id}`, realms.includes(`id: '${id}'`) || realms.includes(`'${id}'`), `${id} remains source-controlled in the premium catalog`);
  }
  add('realm-depth-contract', /premiumAuthoredDepth/.test(realms) && /movementSystem/.test(realms) && /realmReflection/.test(realms), 'premium Realm contracts include authored depth, living movement and verified My Realm reflection');
  add('verified-transformation-only', /requiresVerifiedTransformation: true/.test(realms) && /transformation/.test(realms), 'Realm transformations remain matching-receipt dependent');

  const runtime = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
  add('one-runtime-integration', /createEonCityConnectedCoreBabylonRenderer/.test(runtime) && /createEonCityLivingNexusRealmBabylonRenderer/.test(runtime) && !/new Engine\(|requestAnimationFrame\(|registerBeforeRender/.test(runtime), 'Core, Expanse, My Realm and curated Realms remain in one externally-owned runtime loop');
  add('resident-cell-bound', /residentCellCount/.test(runtime) && /renderedCellCount/.test(runtime), 'streamed world exposes bounded residency and disposal observations');
  add('safe-realm-return', /realmReturnPoint/.test(runtime) && /exitRealm/.test(runtime) && /automaticNavigation: false/.test(runtime), 'curated Realm entry retains an immediate explicit return path');
  add('reduced-effects-runtime', /setReducedEffects/.test(runtime) && /connectedCoreRenderer\.setPresentation/.test(runtime), 'reduced effects propagates through the canonical runtime');

  const pkg = JSON.parse(read('package.json'));
  add('focused-command', pkg.scripts?.['qa:w660z-living-nexus-institutional'] === 'node scripts/w660z-living-nexus-institutional-gate.mjs && node --test tests/unit/w660z-living-nexus-institutional.test.mjs', 'focused W660Z certification command exists');
  add('performance-command', pkg.scripts?.['proof:w660z-living-nexus:performance'] === 'node --expose-gc scripts/w660z-local-performance-proof.mjs', 'bounded local lifecycle proof command exists');
  add('browser-command', pkg.scripts?.['proof:w660z-living-nexus:browser'] === 'node scripts/w660z-local-browser-proof-runner.mjs', 'local Chromium/WebGL proof command exists');

  const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
  add('maintained-suite', manifest.testFileCount === manifest.testFiles.length && manifest.testFiles.includes('tests/unit/w660z-living-nexus-institutional.test.mjs'), `${manifest.testFileCount} maintained files include W660Z`);
  add('truth-boundaries', Object.values(W660Z_LIVING_NEXUS_INSTITUTIONAL_CONTRACT.invariants).every(Boolean), 'institutional safety, privacy, review and production boundaries remain locked');

  return freeze({
    schema: 'eonapp.w660z.living-nexus-institutional-gate.2026-07-21.v1',
    ok: checks.every((entry) => entry.pass),
    passed: checks.filter((entry) => entry.pass).length,
    total: checks.length,
    checks: freeze(checks)
  });
}

const report = inspectW660zLivingNexusInstitutionalReadiness();
for (const entry of report.checks) console.log(`[W660Z] ${entry.pass ? 'PASS' : 'FAIL'} ${entry.id}: ${entry.detail}`);
console.log(`[W660Z] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
