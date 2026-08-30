import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { EON_CITY_W660I_DISTRICTS } from '../../assets/js/city/w660i/eon-city-w660i-district-config.js';
import {
  EON_CITY_W675_PRODUCT_DISTRICTS,
  getEonCityW675DistrictWorldPose,
  getEonCityW675OrientationBeltActivationTruth,
  projectEonCityW675TransportDestination,
  resolveEonCityW675DistrictAtPosition,
  resolveEonCityW675TerminalPlacement
} from '../../assets/js/city/w675/eon-city-w675-orientation-belt-activation.js';
import { getEonCityW674OrientationDistrictArrival } from '../../assets/js/city/w674/eon-city-w674-orientation-district-belt.js';
import { EON_CITY_W659F_DESTINATIONS } from '../../assets/js/city/w659f/eon-city-w659f-transport-runtime.js';
import { getEonCityW660iTerminalsForDistrict } from '../../assets/js/city/w660i/eon-city-w660i-terminal-registry.js';

const legacyById = new Map(EON_CITY_W660I_DISTRICTS.map((entry) => [entry.id, entry]));
const projectedById = new Map(EON_CITY_W675_PRODUCT_DISTRICTS.map((entry) => [entry.id, entry]));

test('W675 relocates only Orientation Hall into its real District Belt', () => {
  assert.equal(EON_CITY_W675_PRODUCT_DISTRICTS.length, 9);
  const orientation = projectedById.get('orientation-hall');
  assert.equal(orientation.spatialModel, 'sanctum-plus-belt');
  assert.ok(orientation.center.z >= 40);
  assert.ok(orientation.radius >= 14);
  assert.notDeepEqual(orientation.center, legacyById.get('orientation-hall').center);

  for (const district of EON_CITY_W675_PRODUCT_DISTRICTS) {
    if (district.id === 'orientation-hall') continue;
    assert.deepEqual(district.center, legacyById.get(district.id).center);
    assert.deepEqual(district.arrival, legacyById.get(district.id).arrival);
  }
});

test('W675 district identity and transport use the same projected arrival authority', () => {
  const arrival = getEonCityW674OrientationDistrictArrival();
  assert.equal(resolveEonCityW675DistrictAtPosition(arrival)?.id, 'orientation-hall');
  assert.equal(resolveEonCityW675DistrictAtPosition({ x: 8.2, z: -3.2 })?.id, 'forge-basilica');

  const projected = projectEonCityW675TransportDestination(legacyById.get('orientation-hall'));
  const runtimeDestination = EON_CITY_W659F_DESTINATIONS.find((entry) => entry.id === 'orientation-hall');
  assert.deepEqual({ x: projected.x, z: projected.z }, { x: arrival.x, z: arrival.z });
  assert.deepEqual(runtimeDestination, projected);
  assert.equal(runtimeDestination.spatialModel, 'sanctum-plus-belt');
});

test('W675 moves all Orientation terminals into the Belt while preserving local offsets', () => {
  const pose = getEonCityW675DistrictWorldPose('orientation-hall');
  const terminals = getEonCityW660iTerminalsForDistrict('orientation-hall');
  assert.equal(terminals.length, 3);
  for (const terminal of terminals) {
    const placement = resolveEonCityW675TerminalPlacement({
      districtId: terminal.districtId,
      terminalId: terminal.id,
      legacyLocalPosition: terminal.localPosition
    });
    assert.deepEqual(terminal.position, placement.position);
    assert.deepEqual(terminal.localPosition, placement.localPosition);
    assert.equal(terminal.spatialModel, 'sanctum-plus-belt');
    assert.ok(Math.hypot(terminal.position.x - pose.center.x, terminal.position.z - pose.center.z) < pose.radius);
  }
});

test('W675 active source owners consume the shared projected district authority', () => {
  const sources = [
    ['../../assets/js/city/eon-city-play-core.js', /EON_CITY_W675_PRODUCT_DISTRICTS/],
    ['../../assets/js/city/w659n/eon-city-w659n-product-layer.js', /resolveEonCityW675DistrictAtPosition/],
    ['../../assets/js/city/w660i/eon-city-w660i-district-composition.js', /getEonCityW675DistrictWorldPose/],
    ['../../assets/js/city/w649/eon-city-w649-district-runtime.js', /EON_CITY_W675_PRODUCT_DISTRICTS/],
    ['../../assets/js/city/eon-city-connected-core.js', /EON_CITY_W675_PRODUCT_DISTRICTS/],
    ['../../assets/js/city/w659f/eon-city-w659f-transport-runtime.js', /projectEonCityW675TransportDestination/]
  ];
  for (const [relative, pattern] of sources) {
    const source = fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
    assert.match(source, pattern, relative);
  }
});

test('W675 remains local, review-first and non-executing', () => {
  const truth = getEonCityW675OrientationBeltActivationTruth();
  assert.equal(truth.oneProjectedDistrictAuthority, true);
  assert.equal(truth.orientationTravelArrivesInBelt, true);
  assert.equal(truth.orientationSanctumRendersInsideBelt, true);
  assert.equal(truth.orientationTerminalsResolveInsideBelt, true);
  assert.equal(truth.atlasShowsBeltLocation, true);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticExecution, false);
  assert.equal(truth.privateDataRead, false);
  assert.equal(truth.networkRequestCreated, false);
});
