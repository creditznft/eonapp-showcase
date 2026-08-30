import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const presenter=fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768y-my-frontier-resident-presenter.js',import.meta.url),'utf8');
const renderer=fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js',import.meta.url),'utf8');

test('W768Y loads same-origin animated characters through primary and fallback attempts',()=>{
  assert.match(presenter,/SceneLoader\.LoadAssetContainerAsync/);
  assert.match(presenter,/variantAttempts\(request\)/);
  assert.match(presenter,/\/assets\\\/city\\\/w649\\\/\(primary\|fallback\)\\\/characters/);
  assert.match(presenter,/asset-path-invalid/);
});

test('W768Y validates visible meshes, materials, bounds, scale, grounding and animation groups',()=>{
  for (const token of [/evaluateEonExpanseW767AAssetPresentation/,/renderableMeshCount/,/visibleMeshCount/,/materialCount/,/sourceBounds/,/worldBounds/,/groundOffset/,/animationGroupCount/]) assert.match(presenter,token);
  assert.match(presenter,/if \(!truth\.ok \|\| Number\(container\.animationGroups/);
  assert.match(presenter,/getEonCityW649AnimationProfile/);
  assert.match(presenter,/animation\?\.start/);
});

test('W768Y hides the invited signal only after accepted authored presentation',()=>{
  assert.match(presenter,/target\.invitedSignal\?\.setEnabled\?\.\(false\)/);
  assert.match(presenter,/rejected-authored-resident/);
  assert.match(presenter,/target\.invitedSignal\?\.setEnabled\?\.\(true\)/);
  assert.match(presenter,/stationSignalSuppressed:true/);
});

test('W768Y rejects stale loads and never creates a procedural resident body or automatic retry',()=>{
  assert.match(presenter,/stale-or-disposed-load/);
  assert.match(presenter,/revisions\.get\(request\.slotId\)!==revision/);
  assert.match(presenter,/proceduralResidentBody:false/);
  assert.match(presenter,/automaticRetry:false/);
  assert.doesNotMatch(presenter,/setInterval|setTimeout|MeshBuilder|CreateCapsule|CreateBox/);
});

test('W768Y is mounted by the canonical My Frontier renderer and owns no runtime',()=>{
  assert.match(renderer,/mountEonExpanseW768YResidentPresenter/);
  assert.match(renderer,/deriveEonExpanseW768XResidentAssetPlan/);
  assert.match(renderer,/residentAssetPresenter\?\.apply/);
  assert.match(renderer,/residentAssetPresenter\?\.dispose/);
  assert.doesNotMatch(presenter,/new Engine|new Scene|runRenderLoop|createElement\(['"]canvas/);
});


test('L95 W768Y resident GLBs obey shared optional asset admission without disabling animations',()=>{
  assert.match(presenter,/buildEonCityL95ProgressiveAssetAdmission/);
  assert.match(presenter,/queued-authored-resident/);
  assert.match(presenter,/optionalConcurrencyLimit/);
  assert.match(presenter,/setOptionalAssetAdmission/);
  assert.match(presenter,/wrapper\.freezeWorldMatrix/);
  assert.match(renderer,/mountEonExpanseW768YResidentPresenter\(\{ scene, residentNodes, assetAdmission \}\)/);
  assert.match(renderer,/residentAssetPresenter\?\.setOptionalAssetAdmission/);
  assert.match(presenter,/animation\?\.start/);
});
