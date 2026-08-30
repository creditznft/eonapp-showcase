import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_W674_ORIENTATION_BELT_SCHEMA,
  buildEonCityW674OrientationDistrictBeltPlan,
  getEonCityW674OrientationDistrictBeltTruth,
  validateEonCityW674OrientationDistrictBeltPlan
} from '../../assets/js/city/w674/eon-city-w674-orientation-district-belt.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W674 creates the first real Orientation Hall Sanctum plus District Belt vertical slice', () => {
  const plan = buildEonCityW674OrientationDistrictBeltPlan({ quality: 'balanced', mode: 'explore' });
  const validation = validateEonCityW674OrientationDistrictBeltPlan(plan);
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(plan.schema, EON_CITY_W674_ORIENTATION_BELT_SCHEMA);
  assert.equal(plan.districtId, 'orientation-hall');
  assert.equal(plan.sanctum.preserved, true);
  assert.equal(plan.sanctum.productiveTerminalIds.length, 3);
  assert.ok(plan.center.z >= 40, 'the vertical slice must use the enlarged metropolis coordinate authority');
  assert.ok(plan.beltRadius >= 16);
  assert.ok(plan.buildings.length >= 3);
  assert.ok(plan.residents.length >= 5);
  assert.equal(plan.terminals.length, 3);
  assert.equal(plan.station.capsuleCompatible, true);
  assert.equal(plan.expanseGate.separateConfirmationRequired, true);
});

test('W674 buildings and residents are functional bounded interfaces rather than decorative fake workers', () => {
  const plan = buildEonCityW674OrientationDistrictBeltPlan({ quality: 'cinematic' });
  for (const building of plan.buildings) {
    assert.equal(building.functional, true);
    assert.ok(building.route.startsWith('/'));
    assert.ok(building.verbs.length >= 3);
    assert.equal(building.reviewFirst, true);
    assert.equal(building.automaticExecution, false);
  }
  for (const resident of plan.residents) {
    assert.ok(resident.preferredAssetId);
    assert.ok(resident.schedule.includes('idle'));
    assert.equal(resident.claimsRealWork, false);
    assert.equal(resident.automaticWork, false);
    assert.equal(resident.explicitInteraction, true);
  }
});

test('W674 preserves focus/explore parity and scales optional density only', () => {
  const lite = buildEonCityW674OrientationDistrictBeltPlan({ quality: 'lite', mode: 'focus' });
  const cinematic = buildEonCityW674OrientationDistrictBeltPlan({ quality: 'cinematic', mode: 'explore' });
  assert.equal(lite.focusModeDirectTerminalAccess, true);
  assert.equal(cinematic.exploreModeFreeMovement, true);
  assert.equal(lite.terminals.length, cinematic.terminals.length);
  assert.equal(lite.station.capsuleCompatible, true);
  assert.ok(cinematic.residents.length > lite.residents.length);
  assert.ok(cinematic.streetFurniture.lampCount > lite.streetFurniture.lampCount);
  assert.ok(cinematic.ambientPopulation > lite.ambientPopulation);
});

test('W674 renderer is integrated into the one canonical Core scene without hidden execution', async () => {
  const renderer = await readFile(path.join(ROOT, 'assets/js/city/w674/eon-city-w674-orientation-district-belt-babylon.js'), 'utf8');
  const connected = await readFile(path.join(ROOT, 'assets/js/city/eon-city-connected-core-babylon.js'), 'utf8');
  assert.match(renderer, /orientation-functional-building/);
  assert.match(renderer, /orientation-functional-resident/);
  assert.match(renderer, /orientation-transit-capsule/);
  assert.match(renderer, /orientation-eonbot-dock/);
  assert.match(renderer, /orientation-expanse-gate/);
  assert.doesNotMatch(renderer, /new\s+Engine|createElement\(['"]canvas|requestAnimationFrame|localStorage|fetch\(|XMLHttpRequest|WebSocket/);
  assert.match(connected, /createEonCityW674OrientationDistrictBeltRenderer/);
  assert.match(connected, /orientationBeltExpanseGateVisible/);
  const truth = getEonCityW674OrientationDistrictBeltTruth();
  assert.equal(truth.purposefulArchitectureRequired, true);
  assert.equal(truth.visibleResidentPopulationRequired, true);
  assert.equal(truth.decorativeGeometrySubordinateToFunction, true);
  assert.equal(truth.automaticExecution, false);
});
