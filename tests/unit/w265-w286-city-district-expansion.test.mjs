import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { W265_FIRST_CITY_DISTRICT_DECISION, validateW265FirstCityDistrictDecision } from '../../config/w265-first-city-district-decision.mjs';
import { CITY_LANDMARKS, CITY_STATE_DISTRICT_IDS, getCityLandmark, getCityLandmarkAction } from '../../assets/js/contracts/city/city-landmark-registry.js';
import { createCityWorldState, normalizeCityWorldState } from '../../assets/js/contracts/city/city-world-state.js';
import { buildCity3dSceneModel } from '../../assets/js/city/eon-city-3d-model.js';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W265 approves only a bounded local Orientation Hall expansion', () => {
  assert.equal(validateW265FirstCityDistrictDecision().ok, true);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.approvedDistrictId, 'orientation');
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.scope.cityPlay, false);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.artPolicy.externalAssetSpendApproved, false);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.artPolicy.remoteAssetsAllowed, false);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.performancePolicy.additionalNetworkRequests, 0);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.trustPolicy.route, null);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.trustPolicy.walletOrChain, false);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.trustPolicy.rewardsOrReferral, false);
});

test('W286 preserves prior City state while exposing Orientation Hall in City Lite and Visual Tour', () => {
  assert.deepEqual(CITY_STATE_DISTRICT_IDS, ['command', 'workspace', 'market', 'realm', 'library', 'trade', 'vault', 'orientation']);
  const hall = getCityLandmark('orientation-hall');
  assert.equal(hall?.districtId, 'orientation');
  assert.equal(hall?.map?.landmark, 'orientation-atrium');
  assert.equal(hall?.action, null);
  assert.equal(getCityLandmarkAction('orientation-hall'), null);
  const legacy = normalizeCityWorldState({
    worldId: 'legacy-city', citySeed: 'legacy', unlockedDistricts: ['command', 'workspace'],
    progress: { visitCounts: { command: 2, workspace: 1 }, lastDistrictId: 'workspace' }
  }, { now: 1 });
  assert.deepEqual(legacy.unlockedDistricts, ['command', 'workspace']);
  assert.equal(legacy.districtGraph.at(-1), 'orientation');
  assert.equal(legacy.progress.visitCounts.command, 2);
  const model = buildCity3dSceneModel(createCityWorldState({ now: 2, worldId: 'w286-city' }), { now: 2 });
  assert.equal(model.districts.find((district) => district.id === 'orientation')?.landmark, 'orientation-atrium');
  assert.equal(CITY_LANDMARKS.filter((landmark) => landmark.districtId === 'orientation').length, 1);
});

test('W286 adds only source-controlled local presentation and keeps Babylon Play scoped to the command-district proof', () => {
  const registry = read('assets/js/contracts/city/city-landmark-registry.js');
  const lite = read('assets/js/eon-operator-map.js');
  const tour = read('assets/js/city/eon-city-3d-renderer.js');
  const play = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(registry, /orientation-atrium/);
  assert.match(lite, /orientation-atrium/);
  assert.match(tour, /orientation-atrium/);
  assert.match(tour, /case 'orientation'/);
  assert.match(play, /landmark\.play && landmark\.action/);
  assert.doesNotMatch(`${registry}
${lite}
${tour}`, /fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location\s*=/);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.trustPolicy.walletOrChain, false);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.trustPolicy.rewardsOrReferral, false);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.trustPolicy.providerOrVaultContext, false);
  assert.equal(W265_FIRST_CITY_DISTRICT_DECISION.trustPolicy.commercialSurface, false);
});
