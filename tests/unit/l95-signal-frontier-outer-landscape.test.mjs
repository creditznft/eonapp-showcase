import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  createEonCityL95SignalFrontierOuterLandscapePlan,
  validateEonCityL95SignalFrontierOuterLandscapePlan
} from '../../assets/js/city/l95/eon-city-l95-signal-frontier-outer-landscape-contract.js';

const qualities = ['lite', 'balanced', 'cinematic'];

test('L95 Signal Frontier outer landscape gives all five zones bounded background depth without fake hero buildings', () => {
  for (const quality of qualities) {
    const plan = createEonCityL95SignalFrontierOuterLandscapePlan({ quality, worldSeed: 745 });
    const validation = validateEonCityL95SignalFrontierOuterLandscapePlan(plan);
    assert.equal(validation.ok, true, validation.errors.join(','));
    assert.equal(plan.zoneCount, 5);
    assert.equal(plan.finishedHeroPrimitiveCount, 0);
    assert.equal(plan.interactiveCount, 0);
    assert.equal(plan.authoredHeroRemainsDominant, true);
    assert.equal(plan.createsRenderLoop, false);
    for (const zone of plan.zones) {
      assert.ok(zone.signature);
      assert.ok(zone.heroAssetId);
      assert.equal(zone.authoredHeroRemainsDominant, true);
      assert.equal(zone.screenshotDistinctWithoutLabels, true);
    }
  }
});

test('L95 Signal Frontier outer landscape scales only a bounded static support budget by quality', () => {
  const lite = createEonCityL95SignalFrontierOuterLandscapePlan({ quality: 'lite' });
  const balanced = createEonCityL95SignalFrontierOuterLandscapePlan({ quality: 'balanced' });
  const cinematic = createEonCityL95SignalFrontierOuterLandscapePlan({ quality: 'cinematic' });
  assert.equal(lite.meshBudget, 30);
  assert.equal(balanced.meshBudget, 40);
  assert.equal(cinematic.meshBudget, 50);
  assert.ok(lite.meshBudget < balanced.meshBudget);
  assert.ok(balanced.meshBudget < cinematic.meshBudget);
});

test('L95 Signal Frontier outer landscape is lazy-mounted with Signal entry and disposed with the canonical gateway', async () => {
  const source = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');
  assert.match(source, /mountEonCityL95SignalFrontierOuterLandscape/);
  assert.match(source, /mountDeferredSignalWorld/);
  assert.match(source, /signalLandscape\?\.activate\?\.\(\)/);
  assert.match(source, /signalLandscape\?\.deactivate\?\.\(\)/);
  assert.match(source, /signalLandscape\?\.dispose\?\.\(\)/);
  assert.match(source, /outerLandscape:/);
});

test('W771C decorative rings/crystals use cadence-bound ambience rather than raw-frame updates', async () => {
  const source = await readFile(new URL('../../assets/js/city/w771/eon-expanse-w771c-zone-environment-kit-presenter.js', import.meta.url), 'utf8');
  assert.match(source, /animationCadenceSeconds/);
  assert.match(source, /lastAnimationAt/);
  assert.match(source, /throttled: true/);
  assert.match(source, /ownsRenderLoop: false/);
});


test('L95 Signal Frontier freezes transform-static base geometry while keeping streamed sectors separate', async () => {
  const frontier = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766b-signal-frontier.js', import.meta.url), 'utf8');
  const environment = await readFile(new URL('../../assets/js/city/w771/eon-expanse-w771c-zone-environment-kit-presenter.js', import.meta.url), 'utf8');
  assert.match(frontier, /staticBaseMeshes/);
  assert.match(frontier, /freezeWorldMatrix/);
  assert.match(frontier, /staticBaseWorldMatrices: true/);
  assert.match(environment, /!\['ring', 'crystal', 'drone'\]\.includes\(entry\.type\)/);
  assert.match(environment, /staticWorldMatrices: true/);
});
