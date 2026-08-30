import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEonCityW687DistrictBeltPlan,
  getEonCityW687SupportedDistricts,
  getEonCityW687DistrictTerminalPosition,
  resolveEonCityW687DistrictBeltAtPosition,
  validateEonCityW687DistrictBeltPlan,
  getEonCityW687DistrictBeltSystemTruth
} from '../../assets/js/city/w687/eon-city-w687-district-belt-system.js';

for (const districtId of ['creator-atrium', 'forge-basilica']) {
  test(`W687 builds a reusable productive belt plan for ${districtId}`, () => {
    const plan = buildEonCityW687DistrictBeltPlan(districtId, { quality: 'balanced', mode: 'explore' });
    const result = validateEonCityW687DistrictBeltPlan(plan);
    assert.equal(result.ok, true, result.errors.join(' | '));
    assert.equal(plan.districtId, districtId);
    assert.equal(plan.terminals.length, 3);
    assert.equal(plan.workLoops.length, 3);
    assert.ok(plan.buildings.length >= 3);
    assert.ok(plan.discoveries.length >= 3);
    assert.equal(plan.station.boardingRequiresReview, true);
    assert.equal(plan.expanseGate.separateConfirmationRequired, true);
    assert.equal(plan.automaticNavigation, false);
    assert.equal(plan.automaticExecution, false);
    assert.equal(plan.privateDataRead, false);
  });
}

test('W687 exposes terminal placement and belt detection for supported districts', () => {
  assert.deepEqual(getEonCityW687SupportedDistricts(), ['creator-atrium', 'forge-basilica']);
  const position = getEonCityW687DistrictTerminalPosition('creator-atrium', 'creator-capture-console');
  assert.ok(position && Number.isFinite(position.x) && Number.isFinite(position.z));
  const resolved = resolveEonCityW687DistrictBeltAtPosition('creator-atrium', position);
  assert.equal(resolved?.districtId, 'creator-atrium');
  assert.equal(resolved?.insideBelt, true);
});

test('W687 truth remains review-first and non-executing', () => {
  const truth = getEonCityW687DistrictBeltSystemTruth();
  assert.equal(truth.reusableBuilder, true);
  assert.equal(truth.reviewFirstWorkLoops, true);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticExecution, false);
  assert.equal(truth.privateDataRead, false);
  assert.equal(truth.networkRequestCreated, false);
});
