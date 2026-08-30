import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildEonCityL95RuntimePerformanceBudget,
  validateEonCityL95RuntimePerformanceBudget
} from '../../assets/js/city/l95/eon-city-l95-runtime-performance-budget.js';

const runtimePath = new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url);
const runtimeSource = fs.readFileSync(runtimePath, 'utf8');

test('L95 runtime budget preserves immediate gameplay while bounding decorative work', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = buildEonCityL95RuntimePerformanceBudget({ quality });
    assert.equal(validateEonCityL95RuntimePerformanceBudget(plan).ok, true);
    assert.equal(plan.gameplayCriticalAtFrameRate, true);
    assert.equal(plan.pointerHoverPicking.pointerPickStillImmediate, true);
    assert.equal(plan.pointerHoverPicking.keyboardInteractionStillImmediate, true);
    assert.ok(plan.pointerHoverPicking.intervalMs <= 110);
    assert.ok(plan.ambience.maximumDecorativeUpdatesPerSecond <= 56);
    assert.ok(plan.ambience.stationMonitorCheckIntervalMs <= 240);
    assert.ok(plan.housekeeping.orphanInputReconcileIntervalMs <= 180);
    assert.ok(plan.proximitySampling.intervalMs <= 96);
    assert.equal(plan.proximitySampling.stationAndAmbientDistancesNeverRecomputedEveryFrame, true);
    assert.equal(plan.proximitySampling.reliabilityAnimationCadenceRemainsAuthoritative, true);
    assert.equal(plan.housekeeping.domVisibilityInspectionNeverRunsEveryFrame, true);
  }
});

test('L95 coarse pointer and reduced motion do not spend cycles on hover/background animation', () => {
  const plan = buildEonCityL95RuntimePerformanceBudget({ quality: 'cinematic', coarsePointer: true, reducedMotion: true });
  assert.equal(plan.pointerHoverPicking.enabled, false);
  assert.equal(plan.pointerHoverPicking.intervalMs, 0);
  assert.deepEqual(plan.ambience.animatedSkylineTiers, []);
  assert.equal(plan.ambience.maximumDecorativeUpdatesPerSecond, 0);
});

test('W731 consumes L95 budget and disables raw Babylon pointer-move picking', () => {
  assert.match(runtimeSource, /buildEonCityL95RuntimePerformanceBudget/);
  assert.match(runtimeSource, /scene\.skipPointerMovePicking\s*=\s*true/);
  assert.match(runtimeSource, /performanceBudget\.pointerHoverPicking\.intervalMs/);
  assert.match(runtimeSource, /performanceBudget\.ambience\.skylinePulseIntervalMs/);
  assert.match(runtimeSource, /performanceBudget\.proximitySampling\?\.intervalMs/);
  assert.match(runtimeSource, /stationDistanceCache/);
  assert.match(runtimeSource, /citizenDistanceCache/);
  assert.match(runtimeSource, /skylineLightStrips/);
  assert.match(runtimeSource, /freezeWorldMatrix\?\.\(\)/);
});

test('L95 Living Nexus and Command Centre visual motion is cadence-bound without changing interaction authority', () => {
  assert.match(runtimeSource, /const hubHeroAnimationInterval = performanceBudget\.ambience\.hubHeroAnimationIntervalMs/);
  assert.match(runtimeSource, /frameAt - lastHubHeroAnimationAt >= hubHeroAnimationInterval[\s\S]*livingNexus\.update\?\.\(frameAt\)[\s\S]*commandCentre\.update\?\.\(frameAt\)/);
  assert.equal(buildEonCityL95RuntimePerformanceBudget({ quality: 'cinematic' }).ambience.hubHeroAnimationIntervalMs, 33);
  assert.equal(buildEonCityL95RuntimePerformanceBudget({ quality: 'balanced' }).ambience.hubHeroAnimationIntervalMs, 40);
});
