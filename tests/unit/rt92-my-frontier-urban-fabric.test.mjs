import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const art = await readFile(new URL('../../assets/js/city/rt92/my-frontier/eon-city-rt92-my-frontier-urban-fabric.js', import.meta.url), 'utf8');
const renderer = await readFile(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');

test('RT92 My Frontier urban fabric gives all seven districts a unique authored visual signature', () => {
  for (const signature of [
    'monumental-civic-axis', 'expressive-prismatic-media', 'archive-observatory-data-canopy',
    'pristine-industrial-service-grid', 'vertical-relay-spire-field', 'linear-departure-motion-axis',
    'calm-garden-reflection-quarter'
  ]) assert.match(art, new RegExp(signature));
  assert.match(art, /districts\?\.length !== 7/);
});

test('RT92 My Frontier adds the city between user buildings without taking land, navigation or collision authority', () => {
  assert.match(art, /radialRoutes: 6/);
  assert.match(art, /ringRoutes: 6/);
  assert.match(art, /districtPlazas: 7/);
  assert.match(art, /sidewalkPairs: 12/);
  for (const family of ['wayfinding-pylon', 'public-lamp', 'utility-cabinet', 'bench', 'planter-pod', 'eonbot-service-point']) assert.match(art, new RegExp(family));
  assert.match(art, /userBuildingCount: 0/);
  assert.match(art, /ownsNavigation: false/);
  assert.match(art, /ownsCollision: false/);
});

test('RT92 My Frontier density responds to progression and distance while keeping public base fabric visible', () => {
  assert.match(art, /additionalSkylineRespondsToDistrictLevel: true/);
  assert.match(art, /publicBaseAlwaysVisible: true/);
  assert.match(art, /minimumDistrictLevel/);
  assert.match(art, /setStreamingFocus/);
  assert.match(art, /distantRadius/);
  assert.match(art, /writesProgression: false/);
});

test('RT92 My Frontier urban fabric adds zero new binary payload and no second runtime', () => {
  assert.match(art, /firstFrameHubBinaryDelta: 0/);
  assert.match(art, /newBinaryBytes: 0/);
  assert.match(art, /proceduralGeometryOnly: true/);
  assert.match(art, /ownsRenderLoop: false/);
  assert.match(art, /remoteTextures: false/);
  assert.doesNotMatch(art, /runRenderLoop\s*\(/);
  assert.doesNotMatch(art, /new\s+Engine\s*\(/);
  assert.doesNotMatch(art, /new\s+Scene\s*\(/);
});

test('W768I mounts RT92 urban fabric only inside the existing deferred My Frontier renderer lifecycle', () => {
  assert.match(renderer, /mountEonCityRt92MyFrontierUrbanFabric/);
  assert.match(renderer, /rt92UrbanFabricPresenter\?\.applyState/);
  assert.match(renderer, /rt92UrbanFabricPresenter\?\.setStreamingFocus/);
  assert.match(renderer, /if \(unlocked\) rt92UrbanFabricPresenter\?\.activate/);
  assert.match(renderer, /rt92UrbanFabricPresenter\?\.deactivate/);
  assert.match(renderer, /rt92UrbanFabricPresenter\?\.update/);
  assert.match(renderer, /rt92UrbanFabricPresenter\?\.dispose/);
});
