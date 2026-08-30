import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { EON_CITY_W660I_DISTRICTS } from '../../assets/js/city/w660i/eon-city-w660i-district-config.js';
import { getEonCityW660iTerminalsForDistrict } from '../../assets/js/city/w660i/eon-city-w660i-terminal-registry.js';
import { EON_CITY_W659F_DESTINATIONS } from '../../assets/js/city/w659f/eon-city-w659f-transport-runtime.js';
import {
  EON_CITY_W689_PRODUCT_DISTRICTS,
  buildEonCityW689DistrictBeltPlan,
  getEonCityW689DistrictWorldPose,
  getEonCityW689SupportedDistricts,
  projectEonCityW689TransportDestination,
  resolveEonCityW689DistrictAtPosition,
  resolveEonCityW689TerminalPlacement,
  validateEonCityW689AllDistrictBelts,
  getEonCityW689AllDistrictBeltsTruth
} from '../../assets/js/city/w689/eon-city-w689-all-district-belts.js';

const legacyById = new Map(EON_CITY_W660I_DISTRICTS.map((entry) => [entry.id, entry]));

test('W689 activates all nine districts as productive Sanctum plus Belt identities', () => {
  const result = validateEonCityW689AllDistrictBelts();
  assert.equal(result.ok, true, result.errors.join(' | '));
  assert.equal(result.productiveBeltCount, 9);
  assert.equal(EON_CITY_W689_PRODUCT_DISTRICTS.length, 9);
  for (const district of EON_CITY_W689_PRODUCT_DISTRICTS) {
    assert.equal(district.spatialModel, 'sanctum-plus-belt');
    assert.ok(district.radius >= 14);
    assert.notDeepEqual(district.center, legacyById.get(district.id).center);
  }
});

test('W689 builds distinct reviewed plans for all eight non-Orientation districts', () => {
  const supported = getEonCityW689SupportedDistricts();
  assert.equal(supported.length, 8);
  const silhouettes = new Set();
  const streetFamilies = new Set();
  for (const id of supported) {
    const plan = buildEonCityW689DistrictBeltPlan(id, { quality: 'balanced', mode: 'explore' });
    assert.ok(plan, id);
    assert.ok(plan.buildings.length >= 2, id);
    assert.ok(plan.terminals.length >= 2, id);
    assert.ok(plan.workLoops.length >= 2, id);
    assert.ok(plan.residents.length >= 3, id);
    assert.equal(plan.station.boardingRequiresReview, true, id);
    assert.equal(plan.expanseGate.separateConfirmationRequired, true, id);
    assert.equal(plan.automaticNavigation, false, id);
    assert.equal(plan.automaticExecution, false, id);
    silhouettes.add(plan.identity.silhouette);
    streetFamilies.add(plan.identity.streetFamily);
  }
  assert.equal(silhouettes.size, 8);
  assert.equal(streetFamilies.size, 8);
});

test('W689 travel, terminal placement and physical identity share the same projected authority', () => {
  for (const district of EON_CITY_W689_PRODUCT_DISTRICTS) {
    const pose = getEonCityW689DistrictWorldPose(district.id);
    assert.equal(resolveEonCityW689DistrictAtPosition(pose.arrival)?.id, district.id);
    const projectedDestination = projectEonCityW689TransportDestination(legacyById.get(district.id));
    assert.deepEqual(EON_CITY_W659F_DESTINATIONS.find((entry) => entry.id === district.id), projectedDestination);
    for (const terminal of getEonCityW660iTerminalsForDistrict(district.id)) {
      const placement = resolveEonCityW689TerminalPlacement({ districtId: district.id, terminalId: terminal.id, legacyLocalPosition: terminal.localPosition });
      assert.equal(placement.spatialModel, 'sanctum-plus-belt');
      assert.deepEqual(terminal.position, placement.position);
      assert.ok(Math.hypot(placement.position.x - pose.center.x, placement.position.z - pose.center.z) < pose.radius);
    }
  }
});

test('W689 active City source owners prefer the complete projected authority', () => {
  const sources = [
    ['../../assets/js/city/eon-city-play-core.js', /EON_CITY_W689_PRODUCT_DISTRICTS/],
    ['../../assets/js/city/w659n/eon-city-w659n-product-layer.js', /resolveEonCityW689DistrictAtPosition/],
    ['../../assets/js/city/w660i/eon-city-w660i-district-composition.js', /getEonCityW689DistrictWorldPose/],
    ['../../assets/js/city/w649/eon-city-w649-district-runtime.js', /EON_CITY_W689_PRODUCT_DISTRICTS/],
    ['../../assets/js/city/eon-city-connected-core.js', /EON_CITY_W689_PRODUCT_DISTRICTS/],
    ['../../assets/js/city/w659f/eon-city-w659f-transport-runtime.js', /projectEonCityW689TransportDestination/],
    ['../../assets/js/city/w660i/eon-city-w660i-terminal-registry.js', /resolveEonCityW689TerminalPlacement/]
  ];
  for (const [relative, pattern] of sources) assert.match(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'), pattern, relative);
});

test('W689 truth remains review-first and private-safe', () => {
  const truth = getEonCityW689AllDistrictBeltsTruth();
  assert.equal(truth.allNineDistrictBeltsActive, true);
  assert.equal(truth.allSanctumsPreserved, true);
  assert.equal(truth.distinctIdentityGrammarRequired, true);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticExecution, false);
  assert.equal(truth.privateDataRead, false);
  assert.equal(truth.networkRequestCreated, false);
});
