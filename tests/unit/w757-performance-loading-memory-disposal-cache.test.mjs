import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W757_SCHEMA,
  buildEonCityW757ReliabilityPlan,
  createEonCityW757ReliabilityController,
  validateEonCityW757ReliabilityPlan
} from '../../assets/js/city/w757/eon-city-w757-performance-reliability.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W757 binds progressive loading and resident budgets for every quality tier', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = buildEonCityW757ReliabilityPlan({ quality });
    assert.equal(plan.schema, EON_CITY_W757_SCHEMA);
    assert.equal(plan.loading.firstFrameDoesNotWaitForAllAssets, true);
    assert.ok(plan.loading.maxConcurrentLoads >= 1);
    assert.ok(plan.loading.maxResidentAssets >= 20);
    assert.equal(plan.loading.failedAssetsUseBrandedDegradedMode, true);
    assert.equal(plan.rendering.backgroundDockFrameCapFps, 12);
    assert.equal(plan.rendering.animationDistanceThrottling, true);
    assert.equal(validateEonCityW757ReliabilityPlan(plan).ok, true);
  }
});


test('W757 enforces the approved FPS, first-playable, Dock and distance budgets', () => {
  const lite = buildEonCityW757ReliabilityPlan({ quality: 'lite' });
  const balanced = buildEonCityW757ReliabilityPlan({ quality: 'balanced' });
  const cinematic = buildEonCityW757ReliabilityPlan({ quality: 'cinematic' });
  assert.deepEqual([lite.sustainedFpsTarget, balanced.sustainedFpsTarget, cinematic.sustainedFpsTarget], [30, 50, 60]);
  assert.deepEqual([lite.sustainedFpsFloor, balanced.sustainedFpsFloor, cinematic.sustainedFpsFloor], [25, 40, 45]);
  assert.equal(balanced.firstPlayableBudgetMs, 8_000);
  assert.equal(lite.lowerDeviceLowModeFirstPlayableBudgetMs, 12_000);
  assert.equal(balanced.supportedMobileLandscapeFpsTarget, 30);
});

test('W757 controller caps Dock frames and throttles non-essential distant animation', () => {
  let clock = 0;
  const controller = createEonCityW757ReliabilityController({ quality: 'balanced', now: () => clock });
  assert.equal(controller.shouldRenderFrame({ at: clock, background: true }), true);
  clock += 20;
  assert.equal(controller.shouldRenderFrame({ at: clock, background: true }), false);
  clock += 70;
  assert.equal(controller.shouldRenderFrame({ at: clock, background: true }), true);
  assert.equal(controller.shouldUpdateAnimation({ id: 'far-npc', distance: 50, at: clock }), true);
  clock += 20;
  assert.equal(controller.shouldUpdateAnimation({ id: 'far-npc', distance: 50, at: clock }), false);
  assert.equal(controller.shouldUpdateAnimation({ id: 'eonbot', distance: 50, at: clock, essential: true }), true);
  const snapshot = controller.getSnapshot();
  assert.ok(snapshot.counters.backgroundFramesSkipped >= 1);
  assert.ok(snapshot.counters.distanceAnimationUpdatesSkipped >= 1);
});

test('W757 keeps local memory observation private and cannot self-certify', () => {
  const plan = buildEonCityW757ReliabilityPlan();
  assert.equal(plan.memory.localOnly, true);
  assert.equal(plan.memory.privateContentCollected, false);
  assert.equal(plan.localObservationOnly, true);
  assert.equal(plan.automaticallyCertified, false);
  assert.equal(plan.lifecycle.dockFocusCyclesRequired, 20);
  assert.equal(plan.lifecycle.restartsRequired, 10);
  assert.equal(plan.lifecycle.contextRestoreProofRequired, 1);
});

test('W757 controller records frames, lifecycle cycles and idempotent disposal', () => {
  let clock = 0;
  let disposed = 0;
  const controller = createEonCityW757ReliabilityController({
    quality: 'balanced',
    now: () => clock,
    readMemory: () => ({ usedBytes: 10_000 + clock, totalBytes: 50_000, limitBytes: 100_000 })
  });
  controller.recordStage('engine-created');
  clock = 120;
  controller.recordFirstFrame();
  for (let index = 0; index < 12; index += 1) {
    clock += 17;
    controller.recordFrame(17);
  }
  controller.noteWorkspacePresentation('dock');
  controller.noteWorkspacePresentation('world');
  controller.noteContextLoss();
  controller.noteContextRestore();
  assert.equal(controller.registerDisposer('owned-test-resource', () => { disposed += 1; }), true);
  assert.equal(controller.registerDisposer('owned-test-resource', () => { disposed += 10; }), false);
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.counters.dockFocusCycles, 1);
  assert.equal(snapshot.counters.contextLosses, 1);
  assert.equal(snapshot.counters.contextRestores, 1);
  assert.equal(snapshot.automaticallyCertified, false);
  controller.dispose();
  controller.dispose();
  assert.equal(disposed, 1);
});

test('W757 cache contract requires explicit updates and stale-runtime rejection', () => {
  const plan = buildEonCityW757ReliabilityPlan();
  assert.equal(plan.cache.contentHashedCityAssets, true);
  assert.equal(plan.cache.staleRuntimeChunksRejected, true);
  assert.equal(plan.cache.explicitUpdateChoice, true);
  assert.equal(plan.cache.automaticReload, false);
  assert.equal(plan.cache.privateWorkInCache, false);
  const sw = read('sw.js');
  assert.match(sw, /fetch\(event\.request, \{ cache: 'no-store' \}\)/);
  assert.match(sw, /requiresUserReloadChoice: true/);
  assert.match(sw, /explicitUserAction === true/);
});

test('W757 active runtime records first playable, frame, memory, context and disposal state', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /EON_CITY_CORE_RUNTIME_SCHEMA = 'eon\.city\.command-centre-runtime\.w757\.v1'/);
  assert.match(runtime, /createEonCityW757ReliabilityController/);
  assert.match(runtime, /recordStage\('engine-created'\)/);
  assert.match(runtime, /recordStage\('scene-created'\)/);
  assert.match(runtime, /recordFirstFrame/);
  assert.match(runtime, /shouldRenderFrame\(\{ at: frameAt, background: backgroundPresentation/);
  assert.match(runtime, /shouldUpdateAnimation\(\{ id: `station:/);
  assert.match(runtime, /recordFrame\(frameDurationMs\)/);
  assert.match(runtime, /noteContextLoss/);
  assert.match(runtime, /noteContextRestore/);
  assert.match(runtime, /noteAssets/);
  assert.match(runtime, /getPerformanceReliabilityPlan/);
  assert.match(runtime, /reliabilityController\.dispose/);
});
