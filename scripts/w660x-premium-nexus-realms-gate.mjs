#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W660X_PREMIUM_NEXUS_REALMS_CONTRACT } from '../config/w660x-premium-nexus-realms-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

export function inspectW660xPremiumNexusRealms() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'config/w660x-premium-nexus-realms-contract.mjs',
    'assets/js/city/eon-city-living-nexus-realms.js',
    'assets/js/city/eon-city-living-nexus-realm-babylon.js',
    'assets/js/city/eon-city-living-nexus-realm-panel.js',
    'tests/unit/w660x-premium-nexus-realms.test.mjs'
  ];
  add('required-files', required.every(exists), 'premium contract, authored catalog, renderer, panel and behavioral tests exist');
  const catalog = read(required[1]);
  add('premium-schema', /w660x\.premium/.test(catalog) && /premiumAuthoredDepth: true/.test(catalog), 'catalog explicitly marks premium authored depth');
  for (const id of W660X_PREMIUM_NEXUS_REALMS_CONTRACT.premiumRealms) add(`realm-${id}`, catalog.includes(`id: '${id}'`), `${id} remains source-authored`);
  add('named-specialists', /Systems Gardener Lyra/.test(catalog) && /Accord Architect Sol/.test(catalog) && /Forge Specialist Kael/.test(catalog) && /Orbital Curator Aya/.test(catalog) && /Relay Custodian Orin/.test(catalog), 'all five upgraded Realms have named functional specialists');
  add('unique-movement-systems', /Living Vine Transit/.test(catalog) && /Sovereign Procession/.test(catalog) && /Assembly Carrier/.test(catalog) && /Orbital Signal Caravan/.test(catalog) && /Relay Echo Trace/.test(catalog), 'all five upgraded Realms have distinct local movement systems');
  add('verified-realm-reflections', /requiresVerifiedTransformation: true/.test(catalog) && /realmReflection/.test(catalog) && /privateContentStored: false/.test(catalog), 'each Realm has a bounded verified My Realm reflection');
  add('premium-validation', /authored-discoveries-missing/.test(catalog) && /functional-specialist-invalid/.test(catalog) && /movement-system-invalid/.test(catalog) && /premium-depth-invalid/.test(catalog), 'runtime validation rejects shallow Realm plans');
  add('review-first-receipts', /matchingOutcome/.test(catalog) && /requiresSeparateEntryConfirmation: true/.test(catalog) && /requiresSeparateNativeRouteConfirmation: true/.test(catalog), 'premium depth does not weaken review-first receipt boundaries');
  const renderer = read(required[2]);
  add('specialist-rendering', /living-nexus-realm-functional-specialist/.test(renderer) && /CreateCapsule/.test(renderer), 'functional specialists render in the existing scene');
  add('movement-rendering', /living-nexus-realm-movement-system/.test(renderer) && /interpolatePath/.test(renderer) && /entry\.kind === 'path'/.test(renderer), 'Realm movement uses the existing update loop');
  add('reduced-effects', /motionEnabled/.test(renderer) && !/requestAnimationFrame\(|registerBeforeRender/.test(renderer), 'motion is reduced-effects aware and creates no second loop');
  const panel = read(required[3]);
  add('premium-visible-ui', /Functional specialist/.test(panel) && /Living movement/.test(panel) && /My Realm reflection/.test(panel), 'Realm panel explains the premium systems and verified reflection');
  const pkg = JSON.parse(read('package.json'));
  add('package-command', pkg.scripts?.['qa:w660x-premium-nexus-realms'] === 'node scripts/w660x-premium-nexus-realms-gate.mjs && node --test tests/unit/w660x-premium-nexus-realms.test.mjs', 'focused W660X command exists');
  const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
  add('maintained-suite', manifest.testFileCount === manifest.testFiles.length && manifest.testFiles.includes('tests/unit/w660x-premium-nexus-realms.test.mjs'), `${manifest.testFileCount} maintained files include W660X`);
  add('contract-invariants', Object.values(W660X_PREMIUM_NEXUS_REALMS_CONTRACT.invariants).every(Boolean), 'canonical safety and truth invariants remain locked');
  return freeze({ schema: 'eonapp.w660x.premium-nexus-realms-gate.2026-07-21.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: freeze(checks) });
}

const report = inspectW660xPremiumNexusRealms();
for (const check of report.checks) console.log(`[W660X] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W660X] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
