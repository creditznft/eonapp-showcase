import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID,
  EON_CITY_OPEN_SKY_SCHEMA,
  getEonCityOpenSkyProfileOptions,
  getEonCityOpenSkyProfilePlan,
  getEonCityOpenSkyTruth,
  normalizeEonCityOpenSkyProfileId,
  validateEonCityOpenSkyProfilePlan
} from '../../assets/js/city/eon-city-open-sky-profiles.js';
import { inspectW574OpenSkyVisualProfiles } from '../../scripts/w574-open-sky-visual-profiles-gate.mjs';

test('W574 returns allowlisted source-controlled visual profiles without time or weather inputs', () => {
  const first = getEonCityOpenSkyProfilePlan({ quality: 'balanced', profileId: 'dawn-glass' });
  const second = getEonCityOpenSkyProfilePlan({ quality: 'balanced', profileId: 'dawn-glass' });
  assert.deepEqual(first, second);
  assert.equal(first.schema, EON_CITY_OPEN_SKY_SCHEMA);
  assert.equal(first.profile.id, 'dawn-glass');
  assert.equal(first.profile.realWorldTime, false);
  assert.equal(first.profile.realWorldWeather, false);
  assert.equal(first.readsDeviceClock, false);
  assert.equal(first.realWorldWeather, false);
  assert.equal(first.realWorldCalendar, false);
  assert.equal(validateEonCityOpenSkyProfilePlan(first).ok, true);
  assert.equal(normalizeEonCityOpenSkyProfileId('not-allowed'), EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID);
});

test('W574 keeps Lite and reduced-effects static while richer visual profiles are capped', () => {
  const lite = getEonCityOpenSkyProfilePlan({ quality: 'lite', profileId: 'clear-horizon' });
  const reduced = getEonCityOpenSkyProfilePlan({ quality: 'cinematic', profileId: 'signal-storm', reducedEffects: true });
  const balanced = getEonCityOpenSkyProfilePlan({ quality: 'balanced', profileId: 'violet-dusk' });
  const cinematic = getEonCityOpenSkyProfilePlan({ quality: 'cinematic', profileId: 'violet-dusk' });
  assert.equal(lite.atmosphereLayers.length, 0);
  assert.equal(lite.motionEnabled, false);
  assert.equal(lite.motionState, 'quality-lite');
  assert.equal(lite.sky.staticFallback, true);
  assert.equal(reduced.atmosphereLayers.length, 0);
  assert.equal(reduced.motionEnabled, false);
  assert.equal(reduced.motionState, 'reduced-effects');
  assert.equal(reduced.sky.staticFallback, true);
  assert.equal(balanced.atmosphereLayers.length, 1);
  assert.equal(cinematic.atmosphereLayers.length, 2);
  assert.equal(cinematic.atmosphereLayers.every((layer) => layer.localVisualOnly && layer.interactive === false && layer.animated === true), true);
});

test('W574 pause and session-only selection preserve a readable static fallback', () => {
  const paused = getEonCityOpenSkyProfilePlan({ quality: 'cinematic', profileId: 'signal-storm', paused: true });
  const options = getEonCityOpenSkyProfileOptions();
  assert.equal(paused.motionEnabled, false);
  assert.equal(paused.motionState, 'city-paused');
  assert.equal(paused.sky.staticFallback, true);
  assert.equal(paused.atmosphereLayers.length, 0);
  assert.equal(options.length, 4);
  assert.equal(options.every((option) => option.sourceControlled && option.sessionOnly && option.visualStyleOnly), true);
  assert.equal(validateEonCityOpenSkyProfilePlan(paused).ok, true);
});

test('W574 rejects sensitive fields, real-world semantics, and invalid budgets', () => {
  const plan = getEonCityOpenSkyProfilePlan({ quality: 'balanced' });
  const sensitive = { ...plan, accountId: 'nope' };
  const realWorld = { ...plan, profile: { ...plan.profile, forecast: true } };
  const badLayers = { ...plan, atmosphereLayers: [...plan.atmosphereLayers, { ...plan.atmosphereLayers[0] }] };
  assert.equal(validateEonCityOpenSkyProfilePlan(sensitive).ok, false);
  assert.equal(validateEonCityOpenSkyProfilePlan(realWorld).ok, false);
  assert.equal(validateEonCityOpenSkyProfilePlan(badLayers).ok, false);
});

test('W574 truth remains local visual, session-only, noninteractive, and non-commercial', () => {
  const truth = getEonCityOpenSkyTruth({ quality: 'cinematic', profileId: 'violet-dusk' });
  assert.equal(truth.valid, true);
  assert.equal(truth.localVisualOnly, true);
  assert.equal(truth.sourceControlled, true);
  assert.equal(truth.sessionOnly, true);
  assert.equal(truth.proceduralGeometry, true);
  assert.equal(truth.binaryAssets, false);
  assert.equal(truth.remoteAssets, false);
  assert.equal(truth.remoteTelemetry, false);
  assert.equal(truth.userData, false);
  assert.equal(truth.soundRequested, false);
  assert.equal(truth.voiceRequested, false);
  assert.equal(truth.storageRequested, false);
  assert.equal(truth.workloadJobStarted, false);
  assert.equal(truth.interactive, false);
  assert.equal(truth.autonomous, false);
  assert.equal(truth.commercial, false);
  const report = inspectW574OpenSkyVisualProfiles({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 16);
});
