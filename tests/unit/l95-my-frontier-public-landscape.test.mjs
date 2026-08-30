import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  createEonCityL95MyFrontierPublicLandscapePlan,
  validateEonCityL95MyFrontierPublicLandscapePlan
} from '../../assets/js/city/l95/eon-city-l95-my-frontier-public-landscape-contract.js';

test('L95 My Frontier public landscape fills all seven districts without fabricating user construction', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = createEonCityL95MyFrontierPublicLandscapePlan({ quality });
    assert.equal(validateEonCityL95MyFrontierPublicLandscapePlan(plan).ok, true);
    assert.equal(plan.districtHalos.length, 7);
    assert.equal(plan.publicLandscapeOnly, true);
    assert.equal(plan.grantsConstruction, false);
    assert.equal(plan.grantsXp, false);
    assert.equal(plan.mutatesMissionState, false);
  }
});

test('L95 My Frontier landscape scales bounded detail by quality instead of loading an unbounded skyline', () => {
  const lite = createEonCityL95MyFrontierPublicLandscapePlan({ quality: 'lite' });
  const balanced = createEonCityL95MyFrontierPublicLandscapePlan({ quality: 'balanced' });
  const cinematic = createEonCityL95MyFrontierPublicLandscapePlan({ quality: 'cinematic' });
  assert.ok(lite.meshBudget < balanced.meshBudget);
  assert.ok(balanced.meshBudget < cinematic.meshBudget);
  assert.ok(cinematic.meshBudget <= 37);
});

test('L95 My Frontier renderer mounts and disposes the public landscape in the same canonical scene', async () => {
  const source = await readFile(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
  assert.match(source, /mountEonCityL95MyFrontierPublicLandscape/);
  assert.match(source, /publicLandscapePresenter/);
  assert.match(source, /publicLandscape:/);
  assert.match(source, /publicLandscapePresenter\?\.dispose\?\.\(\)/);
});
