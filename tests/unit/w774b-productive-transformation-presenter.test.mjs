import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w774/eon-expanse-w774b-productive-transformation-presenter.js', import.meta.url), 'utf8');

test('W774B mounts five non-interactive signals under a supplied canonical parent', () => {
  assert.match(source, /new TransformNode\('w774b-productive-transformation-root', scene\)/);
  assert.match(source, /if \(parent\) root\.parent = parent/);
  assert.match(source, /ring\.isPickable = false/);
  assert.match(source, /beacon\.isPickable = false/);
});

test('W774B responds only to the derived completed productive mission projection', () => {
  assert.match(source, /deriveEonExpanseW774AProductiveTransformations\(livingContentState\)/);
  assert.match(source, /entry\.node\.setEnabled\(row\.active\)/);
});

test('W774B uses the host update and owns no engine, scene or render loop', () => {
  assert.doesNotMatch(source, /new (?:BABYLON\.)?(?:Engine|Scene)\(/);
  assert.doesNotMatch(source, /runRenderLoop\(/);
  assert.match(source, /ownsRenderLoop: false/);
  assert.match(source, /reducedMotion/);
});
