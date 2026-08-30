import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from '../../assets/js/city/eon-city-connected-core.js';
import {
  buildEonCityW690CompleteCoreIdentityPlan,
  validateEonCityW690CompleteCoreIdentityPlan,
  getEonCityW690DistrictIdentity,
  getEonCityW690CompleteCoreTruth
} from '../../assets/js/city/w690/eon-city-w690-complete-core-identity.js';

test('W690 completes the nine-district Core identity with bounded visible density', () => {
  const plan = buildEonCityW690CompleteCoreIdentityPlan({ quality: 'balanced', mode: 'explore' });
  const result = validateEonCityW690CompleteCoreIdentityPlan(plan);
  assert.equal(result.ok, true, result.errors.join(' | '));
  assert.equal(result.districtCount, 9);
  assert.equal(result.connectionCount, 23);
  assert.equal(result.stationCount, 9);
  assert.equal(result.visibleAmbientPopulation, 36);
  assert.equal(result.activeResidentAnchors, 45);
  assert.equal(result.functionalBuildingCount, 35);
  assert.equal(result.terminalCount, 24);
  assert.equal(result.discoveryCount, 27);
});

test('W690 gives every district a distinct silhouette, street family and functional loop', () => {
  const plan = buildEonCityW690CompleteCoreIdentityPlan();
  assert.equal(new Set(plan.districts.map((entry) => entry.identity.silhouette)).size, 9);
  assert.equal(new Set(plan.districts.map((entry) => entry.identity.streetFamily)).size, 9);
  for (const district of plan.districts) {
    assert.ok(district.buildings.length >= 2, district.id);
    assert.ok(district.terminals.length >= 2, district.id);
    assert.ok(district.workLoops.length >= 2, district.id);
    assert.ok(district.discoveries.length >= 3, district.id);
    assert.ok(district.activeResidents.length >= 3, district.id);
    assert.ok(district.ambientActors.length >= 2, district.id);
    assert.equal(district.station.explicitTravelReviewRequired, true, district.id);
    assert.equal(district.eonbotDock.explicitDockActionRequired, true, district.id);
    assert.equal(district.expanseGate.separateConfirmationRequired, true, district.id);
    assert.equal(getEonCityW690DistrictIdentity(district.id, plan)?.id, district.id);
  }
});

test('W690 Focus and reduced-effects preserve the whole Core without ambient motion', () => {
  const focus = buildEonCityW690CompleteCoreIdentityPlan({ quality: 'cinematic', mode: 'focus' });
  assert.equal(focus.motionEnabled, false);
  assert.equal(focus.districts.length, 9);
  assert.equal(focus.transitLoop.capsuleCount, 3);
  assert.equal(validateEonCityW690CompleteCoreIdentityPlan(focus).ok, true);
  const reduced = buildEonCityW690CompleteCoreIdentityPlan({ quality: 'cinematic', reducedEffects: true });
  assert.equal(reduced.motionEnabled, false);
  assert.equal(reduced.districts.length, 9);
});

test('W690 complete Core is consumed by the canonical connected Core plan', () => {
  const connected = buildEonCityConnectedCorePlan({ quality: 'balanced' });
  assert.equal(validateEonCityConnectedCorePlan(connected).ok, true);
  assert.equal(connected.completeCoreIdentity.schema, 'eon.city.complete-core-identity.w690.v1');
  assert.equal(connected.streetConnections.length, 23);
  assert.equal(connected.transitLoop.stations.length, 9);
  assert.equal(connected.districts.every((entry) => entry.identity?.silhouette), true);
});

test('W690 renderer stays inside the existing Babylon scene and exposes visible functional belts', () => {
  const renderer = fs.readFileSync(new URL('../../assets/js/city/w690/eon-city-w690-district-belts-babylon.js', import.meta.url), 'utf8');
  const connected = fs.readFileSync(new URL('../../assets/js/city/eon-city-connected-core-babylon.js', import.meta.url), 'utf8');
  assert.match(renderer, /complete-district-functional-building/);
  assert.match(renderer, /complete-district-terminal/);
  assert.match(renderer, /complete-district-ambient-population/);
  assert.match(renderer, /complete-district-discovery/);
  assert.match(renderer, /complete-district-transit-station/);
  assert.match(renderer, /complete-district-eonbot-dock/);
  assert.match(renderer, /complete-district-expanse-gate/);
  assert.doesNotMatch(renderer, /new Engine\(|new Scene\(|createElement\(['"]canvas/);
  assert.match(connected, /createEonCityW690DistrictBeltsBabylonRenderer/);
  assert.match(connected, /allNineBeltsVisible/);
});

test('W690 truth keeps work, navigation, privacy and payment boundaries locked', () => {
  const plan = buildEonCityW690CompleteCoreIdentityPlan();
  const truth = getEonCityW690CompleteCoreTruth();
  assert.equal(truth.nineDistinctProductiveDistricts, true);
  assert.equal(truth.closedReviewedTransitLoop, true);
  assert.equal(truth.connectedLivingStreetGraph, true);
  assert.equal(plan.automaticNavigation, false);
  assert.equal(plan.automaticExecution, false);
  assert.equal(plan.privateDataRead, false);
  assert.equal(plan.privateContentStored, false);
  assert.equal(plan.networkRequestCreated, false);
  assert.equal(plan.rewardIssued, false);
  assert.equal(plan.paymentClaimed, false);
});
