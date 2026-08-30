import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../assets/js/city/w770/eon-expanse-w770c-my-frontier-building-composition-presenter.js', import.meta.url), 'utf8');

test('W770C loads same-origin primary then fallback GLBs for each authored part', () => {
  assert.match(source, /SceneLoader\.LoadAssetContainerAsync/);
  assert.match(source, /\['primary', entry\.variants\?\.primary\]/);
  assert.match(source, /\['fallback', entry\.variants\?\.fallback\]/);
  assert.match(source, /validLocalAsset[\s\S]*w649\|w659f/);
  assert.match(source, /asset-path-invalid/);
});

test('W770C validates visibility, materials, bounds, scale and grounding per component', () => {
  assert.match(source, /evaluateEonExpanseW767AAssetPresentation/);
  assert.match(source, /renderableMeshCount/);
  assert.match(source, /visibleMeshCount/);
  assert.match(source, /materialCount/);
  assert.match(source, /sourceBounds/);
  assert.match(source, /worldBounds/);
  assert.match(source, /groundOffset/);
  assert.match(source, /rejected-authored-composition-part/);
});

test('W770C marks a plot ready only when every required quality part is presented', () => {
  assert.match(source, /presentedRequired === required\.length/);
  assert.match(source, /compositionReady/);
  assert.match(source, /suppressScaffolding: compositionReady/);
  assert.match(source, /preserveFoundation: true/);
  assert.match(source, /finishedBespokeBuilding: false/);
});

test('W770C rejects stale loads and owns no retry, Engine, Scene, render loop or progression authority', () => {
  assert.match(source, /stale-or-disposed-load/);
  assert.match(source, /revisions\.get\(key\) !== revision/);
  assert.match(source, /automaticRetry: false/);
  assert.doesNotMatch(source, /setTimeout|setInterval|fetch\s*\(|localStorage|runRenderLoop|new\s+(?:BABYLON\.)?(?:Engine|Scene)|awardXp|confirmConstruction/);
});
