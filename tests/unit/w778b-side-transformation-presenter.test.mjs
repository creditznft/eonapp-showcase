import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w778/eon-expanse-w778b-side-transformation-presenter.js', import.meta.url), 'utf8');

test('W778B mounts side-mission memories under a supplied canonical parent', () => {
  assert.match(source, /new TransformNode\('w778b-side-transformation-root', scene\)/);
  assert.match(source, /if \(parent\) root\.parent = parent/);
  assert.match(source, /ring\.isPickable = false/);
  assert.match(source, /marker\.isPickable = false/);
});

test('W778B responds only to the canonical side completion projection', () => {
  assert.match(source, /deriveEonExpanseW778ASideMissionTransformations\(livingContentState\)/);
  assert.match(source, /entry\.node\.setEnabled\(row\.active\)/);
  assert.match(source, /row\.completionCount/);
});

test('W778B uses host updates and owns no engine, scene, interaction or render loop', () => {
  assert.doesNotMatch(source, /new (?:BABYLON\.)?(?:Engine|Scene)\(/);
  assert.doesNotMatch(source, /runRenderLoop\(/);
  assert.doesNotMatch(source, /onPointerObservable/);
  assert.match(source, /ownsRenderLoop: false/);
  assert.match(source, /reducedMotion/);
});
