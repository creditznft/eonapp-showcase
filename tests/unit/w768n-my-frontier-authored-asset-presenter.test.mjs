import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const presenter = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768n-my-frontier-authored-asset-presenter.js', import.meta.url), 'utf8');
const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');

test('W768N loads only same-origin hashed primary then fallback authored anchors', () => {
  assert.match(presenter, /SceneLoader\.LoadAssetContainerAsync/);
  assert.match(presenter, /\['primary', entry\.variants\?\.primary\]/);
  assert.match(presenter, /\['fallback', entry\.variants\?\.fallback\]/);
  assert.match(presenter, /\/assets\\\/city\\\/\(w649\|w659f\)/);
  assert.match(presenter, /asset-path-invalid/);
});

test('W768N validates mesh visibility, materials, bounds, scale, grounding and placement before presentation', () => {
  assert.match(presenter, /evaluateEonExpanseW767AAssetPresentation/);
  assert.match(presenter, /renderableMeshCount/);
  assert.match(presenter, /visibleMeshCount/);
  assert.match(presenter, /materialCount/);
  assert.match(presenter, /sourceBounds/);
  assert.match(presenter, /worldBounds/);
  assert.match(presenter, /groundOffset/);
  assert.match(presenter, /if \(!truth\.ok\)/);
  assert.match(presenter, /rejected-authored-anchor/);
});

test('W768N rejects stale loads, has no automatic retry and preserves construction truth', () => {
  assert.match(presenter, /stale-or-disposed-load/);
  assert.match(presenter, /revisions\.get\(entry\.plotId\) !== revision/);
  assert.match(presenter, /automaticRetry: false/);
  assert.match(presenter, /foundationSuppressed: false/);
  assert.match(presenter, /scaffoldingSuppressed: false/);
  assert.match(presenter, /finishedBuilding: false/);
  assert.doesNotMatch(presenter, /setInterval|setTimeout|foundation\.setEnabled\(false\)|scaffoldRoot\.setEnabled\(false\)/);
});

test('W768N is mounted by the existing renderer and owns no Engine, Scene or render loop', () => {
  assert.match(renderer, /mountEonExpanseW768NMyFrontierAuthoredAssetPresenter\(\{ scene, plotNodes, assetAdmission \}\)/);
  assert.match(renderer, /deriveEonExpanseW768MAuthoredAssetPlan\(\{ presentation \}\)/);
  assert.match(renderer, /authoredAssetPresenter\?\.apply/);
  assert.match(renderer, /authoredAssetPresenter\?\.dispose/);
  assert.doesNotMatch(presenter, /new Engine|new Scene|runRenderLoop|createElement\(['"]canvas/);
});

test('W768N truth summary exposes no private content or remote dependencies', () => {
  assert.match(presenter, /privateContentStored: false/);
  assert.match(presenter, /remoteAssets: false/);
  assert.match(presenter, /secondEngineCreated: false/);
  assert.match(presenter, /secondSceneCreated: false/);
  assert.match(presenter, /secondRenderLoopCreated: false/);
});


test('L95 W768N constructed-building GLBs obey shared optional asset admission', () => {
  assert.match(presenter, /buildEonCityL95ProgressiveAssetAdmission/);
  assert.match(presenter, /queued-authored-anchor/);
  assert.match(presenter, /optionalConcurrencyLimit/);
  assert.match(presenter, /setOptionalAssetAdmission/);
  assert.match(presenter, /staticWorldMatrices:\s*true/);
  assert.match(renderer, /authoredAssetPresenter\?\.setOptionalAssetAdmission/);
});
