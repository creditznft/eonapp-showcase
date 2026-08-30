import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w799/eon-expanse-w799b-storm-sector-transformation-presenter.js', import.meta.url), 'utf8');

test('W799B mounts three non-interactive visual transformation signals', () => {
  assert.match(source, /deriveEonExpanseW799AStormTransformations/);
  assert.match(source, /storm-sector-transformation-signal/);
  assert.match(source, /visualSignalOnly: true/);
  assert.match(source, /interactiveSignalCount: 0/);
  assert.match(source, /developmentHeroProxyCount: 0/);
});

test('W799B changes bounded emission and light state from mission truth', () => {
  assert.match(source, /row\.stage === 'restored'/);
  assert.match(source, /row\.stage === 'active'/);
  assert.match(source, /state\.material\.emissiveColor/);
  assert.match(source, /state\.light\.intensity/);
  assert.match(source, /state\.light\.range/);
});

test('W799B is reduced-motion safe and owns no runtime or progression', () => {
  assert.match(source, /reducedMotion \? 1/);
  assert.match(source, /grantsXp: false/);
  assert.match(source, /automaticProgression: false/);
  assert.match(source, /ownsEngine: false/);
  assert.match(source, /ownsScene: false/);
  assert.match(source, /ownsRenderLoop: false/);
  assert.doesNotMatch(source, /new Engine\s*\(|new Scene\s*\(|runRenderLoop\s*\(/);
});
