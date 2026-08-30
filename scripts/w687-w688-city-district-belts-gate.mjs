#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCityW687SupportedDistricts, buildEonCityW687DistrictBeltPlan, validateEonCityW687DistrictBeltPlan } from '../assets/js/city/w687/eon-city-w687-district-belt-system.js';
import { EON_CITY_W688_PRODUCT_DISTRICTS, validateEonCityW688CreatorForgeBeltActivation } from '../assets/js/city/w688/eon-city-w688-creator-forge-belt-activation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

export function inspectW687W688CityDistrictBelts() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const requiredFiles = [
    'assets/js/city/w687/eon-city-w687-district-belt-system.js',
    'assets/js/city/w688/eon-city-w688-creator-forge-belt-activation.js',
    'tests/unit/w687-district-belt-system.test.mjs',
    'tests/unit/w688-creator-forge-belt-activation.test.mjs'
  ];
  add('required-files', requiredFiles.every(exists), 'W687/W688 source and maintained tests exist');
  const supported = getEonCityW687SupportedDistricts();
  add('supported-districts', supported.includes('creator-atrium') && supported.includes('forge-basilica') && supported.length === 2, 'reusable belt builder supports Creator Atrium and Forge Basilica');
  const plans = supported.map((id) => buildEonCityW687DistrictBeltPlan(id));
  add('valid-plans', plans.every((plan) => validateEonCityW687DistrictBeltPlan(plan).ok), 'all reusable district plans validate');
  const activation = validateEonCityW688CreatorForgeBeltActivation(EON_CITY_W688_PRODUCT_DISTRICTS);
  add('activation-valid', activation.ok && activation.activatedCount === 3, 'orientation, creator and forge belts are active in projected authority');
  const productLayer = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  add('product-layer-integration', /resolveEonCityW688DistrictAtPosition/.test(productLayer), 'product layer resolves districts through W688 authority');
  const terminals = read('assets/js/city/w660i/eon-city-w660i-terminal-registry.js');
  add('terminal-integration', /resolveEonCityW688TerminalPlacement/.test(terminals), 'terminal registry projects Creator/Forge terminals through W688 authority');
  const transport = read('assets/js/city/w659f/eon-city-w659f-transport-runtime.js');
  add('transport-integration', /projectEonCityW688TransportDestination/.test(transport), 'transport destinations use the shared W688 projected arrivals');
  const core = read('assets/js/city/eon-city-play-core.js');
  add('runtime-integration', /EON_CITY_W688_PRODUCT_DISTRICTS/.test(core), 'play core uses the extended projected district set');
  return Object.freeze({ schema: 'eon.city.w687-w688.gate.2026-07-25.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: Object.freeze(checks) });
}

const report = inspectW687W688CityDistrictBelts();
for (const check of report.checks) console.log(`[W687-W688] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W687-W688] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
