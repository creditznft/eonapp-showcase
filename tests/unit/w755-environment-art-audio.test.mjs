import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W755_SCHEMA,
  buildEonCityW755EnvironmentPlan,
  createEonCityW755EnvironmentController,
  resolveEonCityW755LocalTimeProfile,
  validateEonCityW755EnvironmentPlan
} from '../../assets/js/city/w755/eon-city-w755-environment-art-audio.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W755 creates a readable Living Circuit Citadel plan for every quality tier', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = buildEonCityW755EnvironmentPlan({ quality, timeProfile: 'dusk', weatherProfile: 'rain' });
    assert.equal(plan.schema, EON_CITY_W755_SCHEMA);
    assert.equal(plan.floor.stationSocketCount, 10);
    assert.equal(plan.floor.busCount, 10);
    assert.equal(plan.floor.allStationsConnected, true);
    assert.equal(plan.floor.randomCrossings, false);
    assert.equal(plan.skyline.tiers.length, 3);
    assert.equal(plan.skyline.noEmptyBlackHorizon, true);
    assert.equal(plan.weather.visualAmbienceOnly, true);
    assert.equal(plan.weather.realWeather, false);
    assert.equal(plan.materials.remoteTextures, false);
    assert.equal(plan.audio.automaticStart, false);
    assert.equal(validateEonCityW755EnvironmentPlan(plan).ok, true);
  }
});

test('W755 Lite keeps product meaning while reducing effects only', () => {
  const plan = buildEonCityW755EnvironmentPlan({ quality: 'lite', weatherProfile: 'rain' });
  assert.equal(plan.weather.particleCount, 0);
  assert.equal(plan.weather.puddleCueCount, 0);
  assert.equal(plan.lighting.reflectionCueCount, 0);
  assert.equal(plan.floor.stationSocketCount, 10);
  assert.equal(plan.materials.pbrHeroSurfaces.length, 4);
  assert.equal(plan.lighting.readableFacesAndTerminals, true);
});

test('W755 time selection is deterministic and local-only', () => {
  assert.equal(resolveEonCityW755LocalTimeProfile(new Date(2026, 6, 29, 6)), 'dawn');
  assert.equal(resolveEonCityW755LocalTimeProfile(new Date(2026, 6, 29, 12)), 'day');
  assert.equal(resolveEonCityW755LocalTimeProfile(new Date(2026, 6, 29, 18)), 'dusk');
  assert.equal(resolveEonCityW755LocalTimeProfile(new Date(2026, 6, 29, 23)), 'night');
});

test('W755 environment and audio changes require explicit user action', () => {
  const controller = createEonCityW755EnvironmentController({ quality: 'balanced' });
  assert.equal(controller.setProfile({ timeProfile: 'night' }).reason, 'explicit-user-action-required');
  assert.equal(controller.activateAudio().reason, 'explicit-user-action-required');
  const changed = controller.setProfile({ timeProfile: 'night', weatherProfile: 'mist' }, { explicitUserAction: true });
  assert.equal(changed.ok, true);
  assert.equal(changed.visualAmbienceOnly, true);
  assert.equal(changed.realWeather, false);
  assert.equal(controller.getPlan().timeProfile, 'night');
  assert.equal(controller.getPlan().weatherProfile, 'mist');
  controller.dispose();
});

test('W755 runtime is wired as one-scene local ambience authority', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /EON_CITY_CORE_RUNTIME_SCHEMA = 'eon\.city\.command-centre-runtime\.w75[5-9]\.v1'/);
  assert.match(runtime, /buildEonCityW755EnvironmentPlan/);
  assert.match(runtime, /createEonCityW755EnvironmentController/);
  assert.match(runtime, /applyW755EnvironmentPlan/);
  assert.match(runtime, /getEnvironmentArtAudioPlan/);
  assert.match(runtime, /setEnvironmentProfile/);
  assert.match(runtime, /activateCityAudio/);
  assert.match(runtime, /environmentController\.dispose/);
  assert.doesNotMatch(runtime, /navigator\.geolocation/);
});
