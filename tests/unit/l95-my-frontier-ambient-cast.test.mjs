import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEonCityL95MyFrontierAmbientCastPlan,
  validateEonCityL95MyFrontierAmbientCastPlan
} from '../../assets/js/city/l95/eon-city-l95-my-frontier-ambient-cast-contract.js';

test('L95 My Frontier public ambient cast scales 1/2/3 actors by quality', () => {
  assert.equal(createEonCityL95MyFrontierAmbientCastPlan({ quality: 'lite' }).actorCount, 1);
  assert.equal(createEonCityL95MyFrontierAmbientCastPlan({ quality: 'balanced' }).actorCount, 2);
  assert.equal(createEonCityL95MyFrontierAmbientCastPlan({ quality: 'cinematic' }).actorCount, 3);
});

test('L95 My Frontier ambient actors are shipped animated characters but never residents, agents or progression', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = createEonCityL95MyFrontierAmbientCastPlan({ quality });
    const validation = validateEonCityL95MyFrontierAmbientCastPlan(plan);
    assert.equal(validation.ok, true, validation.errors.join(','));
    assert.equal(plan.entries.every((entry) => entry.sourceStatus.startsWith('READY')), true);
    assert.equal(plan.entries.every((entry) => entry.interactive === false && entry.resident === false && entry.agent === false), true);
    assert.equal(plan.grantsXp, false);
    assert.equal(plan.grantsConstruction, false);
    assert.equal(plan.mutatesMissionState, false);
  }
});

test('L95 My Frontier ambient presenter is pressure-aware and owns no render loop', async () => {
  const source = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../../assets/js/city/l95/eon-city-l95-my-frontier-ambient-cast.js', import.meta.url), 'utf8'));
  assert.match(source, /const maxConcurrentLoads = 1/);
  assert.match(source, /buildEonCityL95ProgressiveAssetAdmission/);
  assert.match(source, /animation\?\.start\?\.\(true, 0\.82\)/);
  assert.match(source, /ownsRenderLoop: false/);
  assert.match(source, /interactive: false/);
});


test('L95 My Frontier canonical renderer mounts and owns the ambient cast lifecycle', async () => {
  const source = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8'));
  assert.match(source, /mountEonCityL95MyFrontierAmbientCast\(\{ scene, parent: root, quality, assetAdmission \}\)/);
  assert.match(source, /ambientCastPresenter\?\.setOptionalAssetAdmission\?\.\(effective\)/);
  assert.match(source, /ambientCast: ambientCastPresenter\?\.getSummary\?\.\(\) \|\| null/);
  assert.match(source, /ambientCastPresenter\?\.dispose\?\.\(\)/);
  assert.doesNotMatch(source, /ambientCastPresenter\?\.update/);
});


test('L95 My Frontier ambient cast pauses off-world animation while retaining decoded actors for same-session reuse', async () => {
  const presenter = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../../assets/js/city/l95/eon-city-l95-my-frontier-ambient-cast.js', import.meta.url), 'utf8'));
  const renderer = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8'));
  assert.match(presenter, /setActive\(nextActive = true\)/);
  assert.match(presenter, /if \(active\) state\.animation\.start\?\.\(true, 0\.82\)/);
  assert.match(presenter, /else state\.animation\.stop\?\.\(\)/);
  assert.match(presenter, /sameSessionReuse: true/);
  assert.match(renderer, /ambientCastPresenter\?\.setActive\?\.\(active && unlocked\)/);
  assert.match(renderer, /ambientCastPresenter\?\.setActive\?\.\(false\)/);
});
