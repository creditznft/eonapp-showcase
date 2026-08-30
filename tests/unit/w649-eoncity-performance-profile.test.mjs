import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_W649_PERFORMANCE_PROFILES,
  getEonCityW649PerformanceProfile,
  getEonCityW649PerformanceTruth
} from '../../assets/js/city/w649/eon-city-w649-performance-profile.js';

test('W649H exposes bounded Lite, Balanced, and Cinematic residency profiles', () => {
  assert.deepEqual(Object.keys(EON_CITY_W649_PERFORMANCE_PROFILES), ['lite', 'balanced', 'cinematic']);
  const lite = getEonCityW649PerformanceProfile('lite');
  const balanced = getEonCityW649PerformanceProfile('balanced');
  const cinematic = getEonCityW649PerformanceProfile('cinematic');
  for (const profile of [lite, balanced, cinematic]) {
    assert.equal(profile.preloadAll, false);
    assert.equal(profile.collisionPolicy, 'primitive-proxies-only');
    assert.equal(profile.localOnly, true);
    assert.equal(profile.remoteTelemetry, false);
  }
  assert.equal(lite.maxResidentDistricts, 1);
  assert.equal(balanced.maxResidentDistricts, 2);
  assert.equal(cinematic.maxResidentDistricts, 2);
  assert.equal(lite.maxPopulationCharactersPerDistrict, 1);
  assert.equal(lite.preferDecoderFree, true);
  assert.equal(lite.optionalCharacters, false);
  assert.equal(cinematic.dynamicShadowOwners, 1);
});

test('W649H reduced motion preserves detail while reduced data resolves to Lite', () => {
  const reducedMotion = getEonCityW649PerformanceProfile('cinematic', { reducedMotion: true });
  assert.equal(reducedMotion.id, 'cinematic');
  assert.equal(reducedMotion.reducedEffects, true);
  assert.equal(getEonCityW649PerformanceProfile('balanced', { reducedData: true }).id, 'lite');
  const truth = getEonCityW649PerformanceTruth();
  assert.equal(truth.signedOutHeavyRequests, 0);
  assert.equal(truth.transferOptimizedLod0, true);
  assert.equal(truth.geometricLodReady, false);
  assert.equal(truth.geometricLodCertificationPending, true);
  assert.equal(truth.reducedMotionPreservesVisualDetail, true);
  assert.equal(truth.visualPerformanceClaim, false);
  assert.equal(truth.ownerApprovalRequired, true);
});
