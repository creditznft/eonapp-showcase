#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getEonCityW667WorldGrammarSummary } from '../assets/js/city/w667/eon-city-w667-expanse-world-grammar.js';
import {
  W670_FINAL_RECONCILIATION_CONTRACT,
  validateW670FinalReconciliationContract
} from '../config/w670-final-reconciliation-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));

const contractValidation = validateW670FinalReconciliationContract();
add('contract', contractValidation.ok, contractValidation.errors.join(',') || 'W670 contract valid');

const home = read('index.html');
add('home-local-first', /Local-first · Files stay local/.test(home) && !/Guest mode · Files stay local/.test(home), 'Home composer copy is truthful for guest and signed-in sessions');

const city = read('eoncity.html');
const identity = read('assets/js/city/eon-city-shell-identity-coherence.js');
add('city-identity-import', /eon-city-shell-identity-coherence\.js/.test(city), 'City imports identity coherence after the application shell');
add('city-identity-label', /Open profile and settings/.test(identity) && /data-eon-mobile-profile/.test(identity) && /data-eon-identity-state/.test(identity), 'Signed-in City control is not labelled as sign-in');

const summary = getEonCityW667WorldGrammarSummary();
const minimums = W670_FINAL_RECONCILIATION_CONTRACT.worldDiversityMinimums;
for (const [summaryKey, minimumKey] of [
  ['regionArchetypeCount', 'regionArchetypes'],
  ['streetProfileCount', 'streetProfiles'],
  ['terrainProfileCount', 'terrainProfiles'],
  ['publicSpaceProfileCount', 'publicSpaceProfiles'],
  ['skylineProfileCount', 'skylineProfiles'],
  ['buildingFormCount', 'buildingForms'],
  ['landmarkTypeCount', 'landmarkTypes'],
  ['gameplayPurposeCount', 'gameplayPurposes']
]) {
  add(`world-${summaryKey}`, Number(summary[summaryKey]) >= Number(minimums[minimumKey]), `${summaryKey}: ${summary[summaryKey]} / minimum ${minimums[minimumKey]}`);
}
add('world-combination-space', summary.approximateCombinationSpace > 1_000_000_000, `combination space: ${summary.approximateCombinationSpace}`);
add('world-boundary', summary.visibleHardBorder === false && summary.privateDataRead === false && summary.networkRequestCreated === false, 'Infinite grammar preserves privacy and no-network boundaries');

const runtime = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
for (const marker of [
  'eon-city-w670-expanse-visual-language.js',
  'resolveEonCityW670CellVisualLanguage',
  'resolveEonCityW670BuildingVisual',
  'w670-expanse-terrain-feature',
  'w670-expanse-secondary-street',
  'w670-expanse-public-space',
  'buildingVisual.shape'
]) add(`runtime:${marker}`, runtime.includes(marker), marker);

const packageJson = JSON.parse(read('package.json'));
add('focused-command', packageJson.scripts?.['qa:w670-final-reconciliation'] === 'node scripts/w670-final-reconciliation-gate.mjs && node --test tests/unit/w670-final-reconciliation.test.mjs', 'Focused W670 command exists');

const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
const runner = read('scripts/run-current-unit-suite.mjs');
add('manifest-wave', /^W\d+$/.test(manifest.currentWave) && Number(manifest.currentWave.slice(1)) >= 670, `currentWave: ${manifest.currentWave}`);
add('manifest-count', manifest.testFileCount === manifest.testFiles.length, `${manifest.testFileCount}/${manifest.testFiles.length}`);
add('manifest-test', manifest.testFiles.includes('tests/unit/w670-final-reconciliation.test.mjs'), 'W670 test is maintained');
add('runner-test', runner.includes("'tests/unit/w670-final-reconciliation.test.mjs'"), 'W670 test is in the permanent runner');

const nexus = read('assets/js/nexus/eon-nexus-live.js');
const pulse = read('assets/js/nexus/eon-nexus-pulse.js');
const cityNexus = read('assets/js/city/eon-city-living-nexus-hybrid.js');
const expandedUsesFlagshipProjection = /projectEonNexusW668FlagshipState/.test(nexus);
const pulseUsesFlagshipProjection = /projectEonNexusW668FlagshipState/.test(pulse);
const spatialUsesOneHybridAuthority = /unifies the authored nine-district Core, deterministic local\s+\*?\s*Expanse cells/i.test(cityNexus)
  && /without creating a second\s+\*?\s*assistant/i.test(cityNexus)
  && /EON_CITY_LIVING_NEXUS_SCHEMA/.test(cityNexus);
add('flagship-nexus-preserved', expandedUsesFlagshipProjection && pulseUsesFlagshipProjection && spatialUsesOneHybridAuthority, 'Pulse, Expanded Nexus and Spatial Nexus retain one bounded source identity');

const result = Object.freeze({
  schema: 'eonapp.w670.final-reconciliation-gate.v1',
  wave: 'W670',
  ok: checks.every((check) => check.pass),
  passed: checks.filter((check) => check.pass).length,
  total: checks.length,
  summary,
  checks: Object.freeze(checks)
});

for (const check of checks) console.log(`[W670] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W670] ${result.ok ? 'PASS' : 'FAIL'} ${result.passed}/${result.total}`);
if (!result.ok) process.exitCode = 1;

export default result;
