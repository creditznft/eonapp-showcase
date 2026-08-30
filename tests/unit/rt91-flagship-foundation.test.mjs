import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_RT91_CONTENT_LAYERS,
  EON_CITY_RT91_FLAGSHIP_WORLDS,
  EON_CITY_RT91_SHARED_INVARIANTS,
  getEonCityRt91FlagshipWorld,
  validateEonCityRt91FlagshipWorldContract
} from '../../assets/js/city/rt91/eon-city-rt91-flagship-world-contract.js';
import {
  buildEonCityRt91ContentPerformanceBudget,
  validateEonCityRt91ContentPerformanceBudget
} from '../../assets/js/city/rt91/eon-city-rt91-content-performance-budget.js';
import {
  getEonCityRt91FoundationInventory,
  validateEonCityRt91FoundationInventory
} from '../../assets/js/city/rt91/eon-city-rt91-foundation-inventory.js';

test('RT91 preserves three distinct flagship identities without moving game authority into AI', () => {
  assert.equal(validateEonCityRt91FlagshipWorldContract().ok, true);
  assert.equal(EON_CITY_RT91_FLAGSHIP_WORLDS.length, 3);
  assert.equal(new Set(EON_CITY_RT91_FLAGSHIP_WORLDS.map((entry) => entry.identity)).size, 3);
  assert.equal(getEonCityRt91FlagshipWorld('signal-frontier').identity, 'narrative-restoration-exploration');
  assert.equal(getEonCityRt91FlagshipWorld('storm-sector').identity, 'environmental-hazard-rescue-restoration');
  assert.equal(getEonCityRt91FlagshipWorld('my-frontier').identity, 'persistent-city-builder-productive-rpg');
  assert.equal(EON_CITY_RT91_SHARED_INVARIANTS.runtimeAiMissionAuthorityAllowed, false);
  assert.equal(EON_CITY_RT91_SHARED_INVARIANTS.localAiOptionalForGameCompletion, true);
});

test('RT91 content layers allow only boot-critical work to block first playable frame', () => {
  assert.deepEqual(EON_CITY_RT91_CONTENT_LAYERS.filter((entry) => entry.mayBlockFirstPlayableFrame).map((entry) => entry.id), ['boot-critical']);
  assert.equal(EON_CITY_RT91_SHARED_INVARIANTS.wholeMapEagerLoadingForbidden, true);
  assert.equal(EON_CITY_RT91_SHARED_INVARIANTS.hiddenWorldHeavyWorkSuspended, true);
});

test('RT91 source inventory proves we extend existing foundations instead of rebuilding them', () => {
  const inventory = getEonCityRt91FoundationInventory();
  const validation = validateEonCityRt91FoundationInventory(inventory);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(inventory.shared.detailedWindowCells, 25);
  assert.equal(inventory.shared.macroNeighbourhoodRegionCount, 9);
  assert.equal(inventory.signalFrontier.zoneCount, 5);
  assert.equal(inventory.signalFrontier.campaignMissionCount, 7);
  assert.equal(inventory.stormSector.missionFamilyCount, 3);
  assert.equal(inventory.stormSector.objectiveCount, 9);
  assert.equal(inventory.myFrontier.districtPlotCount, 7);
  assert.equal(inventory.myFrontier.approvedBuildingCount, 19);
  assert.deepEqual(inventory.myFrontier.dedicatedAuthoredAssetPendingIds, [
    'design-pavilion', 'research-observatory', 'expedition-hangar', 'reflection-garden', 'vault-reveal-gallery'
  ]);
});

test('RT91 content budgets bound density by quality and suspend optional world work while hidden', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    for (const worldId of ['signal-frontier', 'storm-sector', 'my-frontier']) {
      const plan = buildEonCityRt91ContentPerformanceBudget({ quality, worldId });
      const validation = validateEonCityRt91ContentPerformanceBudget(plan);
      assert.equal(validation.ok, true, `${quality}/${worldId}: ${validation.errors.join(', ')}`);
      assert.equal(plan.streaming.wholeMapQueueDrainAllowed, false);
      assert.equal(plan.streaming.firstPlayableFrameExcludesOptionalLoads, true);
      assert.equal(plan.truth.deviceCertified, false);
    }
  }
  const hidden = buildEonCityRt91ContentPerformanceBudget({ quality: 'cinematic', worldId: 'my-frontier', hidden: true });
  assert.equal(hidden.streaming.maximumConcurrentOptionalAssetLoads, 0);
  assert.equal(hidden.population.maximumNearAnimatedNpcs, 0);
  assert.equal(hidden.effects.maximumActiveParticleEmitters, 0);
  assert.equal(hidden.gameplay.maximumDynamicMissionCells, 0);
  assert.equal(hidden.gameplay.movementAnimationCameraAndRenderMayRunAtFrameRate, false);
});
