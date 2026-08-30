import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_W673_CORE_SCALE,
  buildEonCityW673HybridMetropolisPlan,
  getEonCityW673HybridMetropolisTruth,
  validateEonCityW673HybridMetropolisPlan
} from '../../assets/js/city/w673/eon-city-w673-hybrid-metropolis-plan.js';
import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from '../../assets/js/city/eon-city-connected-core.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W673 turns all nine compact rooms into preserved Sanctums with real District Belts', () => {
  const plan = buildEonCityW673HybridMetropolisPlan({ quality: 'balanced', mode: 'explore' });
  const validation = validateEonCityW673HybridMetropolisPlan(plan);
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(plan.districts.length, 9);
  assert.equal(plan.scale, EON_CITY_W673_CORE_SCALE);
  assert.ok(plan.minimumCentreDistance >= 18);
  for (const district of plan.districts) {
    assert.equal(district.sanctum.preserved, true);
    assert.ok(district.belt.secondaryBuildings.length >= 2);
    assert.ok(district.belt.activeNpcAnchors.length >= 3);
    assert.equal(district.belt.transitStation.capsuleCompatible, true);
    assert.equal(district.belt.expanseGate.automaticEntry, false);
    assert.equal(district.belt.functionalObjectsFirst, true);
  }
});

test('W673 quality changes population and furniture without removing productive routes', () => {
  const lite = buildEonCityW673HybridMetropolisPlan({ quality: 'lite', mode: 'focus' });
  const cinematic = buildEonCityW673HybridMetropolisPlan({ quality: 'cinematic', mode: 'explore' });
  assert.equal(lite.stations.length, 9);
  assert.equal(lite.expanseGates.length, 9);
  assert.ok(cinematic.districts[0].belt.activeNpcAnchors.length > lite.districts[0].belt.activeNpcAnchors.length);
  assert.ok(cinematic.districts[0].belt.streetFurnitureCount > lite.districts[0].belt.streetFurnitureCount);
  assert.equal(lite.focusModeDirectAccess, true);
  assert.equal(cinematic.exploreModeDiscovery, true);
});

test('W673 is embedded in the existing one-scene Connected Core contract', () => {
  const core = buildEonCityConnectedCorePlan({ quality: 'balanced', mode: 'explore' });
  const validation = validateEonCityConnectedCorePlan(core);
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(core.hybridMetropolis.schema, 'eon.city.hybrid-metropolis.w673.v1');
  assert.equal(core.hybridMetropolis.oneCanonicalScene, true);
  assert.equal(core.hybridMetropolis.automaticNavigation, false);
});

test('W673 source remains a pure plan and locks the C3 owner vision', async () => {
  const source = await readFile(path.join(ROOT, 'assets/js/city/w673/eon-city-w673-hybrid-metropolis-plan.js'), 'utf8');
  const connected = await readFile(path.join(ROOT, 'assets/js/city/eon-city-connected-core.js'), 'utf8');
  assert.doesNotMatch(source, /@babylonjs|localStorage|fetch\(|XMLHttpRequest|WebSocket/);
  assert.match(source, /sanctum-plus-belt/);
  assert.match(source, /transitCapsuleRequired:\s*true/);
  assert.match(source, /functionalObjectsFirst:\s*true/);
  assert.match(connected, /hybridMetropolis/);
  const truth = getEonCityW673HybridMetropolisTruth();
  assert.equal(truth.currentRoomsBecomeSanctums, true);
  assert.equal(truth.realDistrictBeltsRequired, true);
  assert.equal(truth.expanseVisibleBeyondEveryDistrict, true);
  assert.equal(truth.automaticExecution, false);
});
