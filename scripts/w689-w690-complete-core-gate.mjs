#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEonCityW689AllDistrictBelts } from '../assets/js/city/w689/eon-city-w689-all-district-belts.js';
import { buildEonCityW690CompleteCoreIdentityPlan, validateEonCityW690CompleteCoreIdentityPlan } from '../assets/js/city/w690/eon-city-w690-complete-core-identity.js';
import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from '../assets/js/city/eon-city-connected-core.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

export function inspectW689W690CompleteCore() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'assets/js/city/w689/eon-city-w689-all-district-belts.js',
    'assets/js/city/w690/eon-city-w690-complete-core-identity.js',
    'assets/js/city/w690/eon-city-w690-district-belts-babylon.js',
    'tests/unit/w689-all-district-belts.test.mjs',
    'tests/unit/w690-complete-core-identity.test.mjs'
  ];
  add('required-files', required.every(exists), 'W689/W690 source and maintained tests exist');
  const belts = validateEonCityW689AllDistrictBelts();
  add('nine-belts', belts.ok && belts.productiveBeltCount === 9, 'all nine districts use productive Sanctum plus Belt authority');
  const complete = buildEonCityW690CompleteCoreIdentityPlan({ quality: 'balanced' });
  const completeValidation = validateEonCityW690CompleteCoreIdentityPlan(complete);
  add('complete-core', completeValidation.ok, 'complete Core transit, streets, population and identity validate');
  add('core-density', complete.visibleAmbientPopulation >= 36 && complete.activeResidentAnchors >= 45 && complete.functionalBuildingCount >= 35 && complete.discoveryCount >= 27, 'bounded population, functional architecture and discovery density are present');
  add('street-continuity', complete.streetConnections.length >= 20 && complete.transitLoop.closed && complete.transitLoop.stations.length === 9, 'closed transit and connected street graph are present');
  add('distinct-identity', new Set(complete.districts.map((entry) => entry.identity.silhouette)).size === 9 && new Set(complete.districts.map((entry) => entry.identity.streetFamily)).size === 9, 'all districts have distinct skyline and street grammar');
  const connected = buildEonCityConnectedCorePlan({ quality: 'balanced' });
  add('canonical-core-consumer', validateEonCityConnectedCorePlan(connected).ok && connected.completeCoreIdentity?.schema === complete.schema, 'canonical connected Core consumes W690 authority');
  const renderer = read('assets/js/city/w690/eon-city-w690-district-belts-babylon.js');
  add('visible-renderer', /complete-district-functional-building/.test(renderer) && /complete-district-terminal/.test(renderer) && /complete-district-ambient-population/.test(renderer) && /complete-district-expanse-gate/.test(renderer), 'one-scene renderer emits functional belts, population and thresholds');
  add('one-scene-boundary', !/new Engine\(|new Scene\(|createElement\(['"]canvas/.test(renderer), 'W690 creates no engine, scene, canvas or render loop');
  const activeCore = read('assets/js/city/eon-city-connected-core-babylon.js');
  add('renderer-integration', /createEonCityW690DistrictBeltsBabylonRenderer/.test(activeCore) && /allNineBeltsVisible/.test(activeCore), 'canonical Core renderer mounts the complete belt renderer');
  return Object.freeze({ schema: 'eon.city.w689-w690.complete-core-gate.2026-07-25.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: Object.freeze(checks) });
}

const report = inspectW689W690CompleteCore();
for (const check of report.checks) console.log(`[W689-W690] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W689-W690] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
