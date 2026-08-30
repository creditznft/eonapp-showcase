import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const gatewayPath = new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url);
const source = await readFile(gatewayPath, 'utf8');

test('W778C mounts side transformations under the existing canonical Gateway root', () => {
  assert.match(source, /mountEonExpanseW778BSideTransformationPresenter\(\{ scene, parent: root, quality, reducedMotion, initialState: initialLivingContent \}\)/);
  assert.match(source, /side-transformation-presenter-failed/);
  assert.equal((source.match(/mountEonExpanseW778BSideTransformationPresenter\(/g) || []).length, 1);
});

test('W778C applies the same canonical living-content state to activities and both transformation presenters', () => {
  assert.match(source, /productiveTransformations\.applyState\?\.\(livingContentState\)/);
  assert.match(source, /sideTransformations\.applyState\?\.\(livingContentState\)/);
  assert.match(source, /sideMissionTransformations/);
});

test('W778C updates and disposes through the existing Gateway lifecycle', () => {
  assert.match(source, /sideTransformations\.update\?\.\(seconds\)/);
  assert.match(source, /sideTransformations\?\.dispose\?\.\(\)/);
  assert.match(source, /sideTransformations:\s*sideTransformations\?\.getSummary/);
  assert.doesNotMatch(source, /new (?:BABYLON\.)?(?:Engine|Scene)\(/);
  assert.doesNotMatch(source, /runRenderLoop\(/);
});
