import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT, getArrivalDistrictFirstMission, validateArrivalDistrictBlueprint } from '../../assets/js/city/eon-city-arrival-district.js';
import { getCityArtIntakeSummary } from '../../assets/js/city/eon-city-art-intake.js';
import { inspectW407ArrivalDistrict } from '../../scripts/w407-arrival-district-gate.mjs';

test('W407 Arrival District keeps the canonical five-part first frame and visible non-rewarding mission', () => {
  const result = validateArrivalDistrictBlueprint();
  assert.equal(result.ok, true, result.errors.join(' | '));
  assert.deepEqual(EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.firstFrame.map((entry) => entry.id), ['arrival-gate', 'wet-street-path', 'command-deck-exterior', 'skyline-depth', 'eonbot-companion']);
  const mission = getArrivalDistrictFirstMission();
  assert.equal(mission.autoStart, false);
  assert.equal(mission.autoOpenRoute, false);
  assert.equal(mission.reward, null);
});

test('W407 retains local candidate-art truth without claiming final visual release', () => {
  const art = getCityArtIntakeSummary({ quality: 'balanced' });
  assert.ok(art.shippedBinaryCount >= 8);
  assert.equal(art.loadableCount, 5);
  assert.equal(art.releaseReady, false);
  assert.equal(art.visualCertificationCaptured, false);
});

test('W407 rejects automatic routing or forbidden remote values', () => {
  const invalid = JSON.parse(JSON.stringify(EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT));
  invalid.firstMission.autoOpenRoute = true;
  invalid.firstFrame[0].remoteUrl = 'https://example.invalid/gate.glb';
  const result = validateArrivalDistrictBlueprint(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => /user-controlled|forbidden remote URL/i.test(message)));
});

test('W407 source gate remains source-only and Babylon-canonical', () => {
  const report = inspectW407ArrivalDistrict({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.ok(report.checkCount >= 12);
});
