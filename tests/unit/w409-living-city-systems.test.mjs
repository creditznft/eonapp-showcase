import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_LIVING_SYSTEMS_BLUEPRINT, getCityLivingSystemsProfile, validateCityLivingSystemsBlueprint } from '../../assets/js/city/eon-city-living-systems.js';
import { getCityArtIntakeSummary } from '../../assets/js/city/eon-city-art-intake.js';
import { inspectW409LivingCitySystems } from '../../scripts/w409-living-city-systems-gate.mjs';

test('W409 keeps weather, day/night, NPCs and ambient life bounded and local', () => {
  const result = validateCityLivingSystemsBlueprint();
  assert.equal(result.ok, true, result.errors.join(' | '));
  assert.deepEqual(EON_CITY_LIVING_SYSTEMS_BLUEPRINT.weather.modes, ['rain', 'neon-mist']);
  assert.equal(EON_CITY_LIVING_SYSTEMS_BLUEPRINT.dayNight.visualOnly, true);
  assert.equal(EON_CITY_LIVING_SYSTEMS_BLUEPRINT.dayNight.readsDeviceClock, false);
  assert.equal(EON_CITY_LIVING_SYSTEMS_BLUEPRINT.npcBehavior.fabricatesWork, false);
  assert.equal(EON_CITY_LIVING_SYSTEMS_BLUEPRINT.ambientLife.remoteTraffic, false);
});

test('W409 quality profiles stop optional living effects under reduced effects', () => {
  const balanced = getCityLivingSystemsProfile({ quality: 'balanced' });
  const reduced = getCityLivingSystemsProfile({ quality: 'cinematic', reducedEffects: true });
  assert.equal(balanced.ambientPodCount, 3);
  assert.equal(balanced.cycleMode, 'midnight-dawn');
  assert.equal(reduced.ambientPodCount, 0);
  assert.equal(reduced.cycleMode, 'static-night');
  assert.equal(reduced.rainEnabled, false);
});

test('W409 mission board cannot become an automatic or rewarding action', () => {
  const invalid = JSON.parse(JSON.stringify(EON_CITY_LIVING_SYSTEMS_BLUEPRINT));
  invalid.missionBoard.autoOpenRoute = true;
  invalid.missionBoard.reward = 'value';
  invalid.rendering.remoteAssets = true;
  const result = validateCityLivingSystemsBlueprint(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => /mission-board boundary|renderer boundary/i.test(message)));
});

test('W409 retains local candidate-art truth without final visual certification', () => {
  const art = getCityArtIntakeSummary({ quality: 'balanced' });
  assert.ok(art.shippedBinaryCount >= 8);
  assert.equal(art.loadableCount, 5);
  assert.equal(art.releaseReady, false);
  assert.equal(art.visualCertificationCaptured, false);
});

test('W409 source gate remains source-only and Babylon-canonical', () => {
  const report = inspectW409LivingCitySystems({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.ok(report.checkCount >= 14);
});
