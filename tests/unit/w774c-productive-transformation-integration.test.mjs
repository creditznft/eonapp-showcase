import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');

test('W774C mounts productive transformations under the existing Expanse root', () => {
  assert.match(source, /mountEonExpanseW774BProductiveTransformationPresenter\(\{ scene, parent: root/);
  assert.match(source, /productiveTransformations: productiveTransformations\?\.getSummary/);
});

test('W774C applies the same canonical living-content state to stations and transformations', () => {
  assert.match(source, /const activities = activityAnchors\?\.applyState\?\.\(livingContentState\)/);
  assert.match(source, /const transformations = productiveTransformations\.applyState\?\.\(livingContentState\)/);
  assert.match(source, /productiveTransformations\.applyState\?\.\(livingContentState\)/);
});

test('W774C updates through the host loop and disposes with the Gateway lifecycle', () => {
  assert.match(source, /productiveTransformations\.update\?\.\(seconds\)/);
  assert.match(source, /productiveTransformations\?\.dispose\?\.\(\)/);
  assert.doesNotMatch(source, /productiveTransformations\.(?:completeMission|awardXp|recordReceipt)/);
  assert.doesNotMatch(source, /new (?:BABYLON\.)?(?:Engine|Scene)\(/);
  assert.doesNotMatch(source, /runRenderLoop\(/);
});
