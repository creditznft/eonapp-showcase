import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');

test('W770D mounts the composition presenter inside the existing canonical My Frontier renderer', () => {
  assert.match(renderer, /deriveEonExpanseW770BCompositionPlan/);
  assert.match(renderer, /mountEonExpanseW770CBuildingCompositionPresenter\(\{ scene, plotNodes, assetAdmission \}\)/);
  assert.match(renderer, /buildingCompositionPresenter\?\.apply/);
  assert.match(renderer, /buildingCompositionPresenter\?\.dispose/);
  assert.match(renderer, /buildingCompositionPresenter\?\.setOptionalAssetAdmission/);
  assert.equal((renderer.match(/runRenderLoop/g) || []).length, 0);
});

test('W770D suppresses scaffolding only after a required authored composition or RT92 bespoke replacement validates', () => {
  assert.match(renderer, /compositionReadiness\.get\(entry\.plotId\)\?\.compositionReady === true/);
  assert.match(renderer, /bespokeReadiness\.get\(entry\.plotId\)\?\.ready === true/);
  assert.match(renderer, /target\.scaffoldRoot\.setEnabled\(entry\.scaffoldingVisible === true && !ready\)/);
  assert.match(renderer, /setBespokeReadyPlots/);
  assert.match(renderer, /onReadinessChange\?\.\(\(\) =>/);
  const updateStart = renderer.indexOf('    update(at = ceremonyClock(), playerPosition = null) {');
  const updateEnd = renderer.indexOf('    reactResident(', updateStart);
  assert.ok(updateStart >= 0 && updateEnd > updateStart);
  assert.doesNotMatch(renderer.slice(updateStart, updateEnd), /applyCompositionValidation\(\)/);
  assert.doesNotMatch(renderer, /foundation\.setEnabled\(entry\.foundationVisible === true && !ready\)/);
});

test('W770D prevents the legacy single-anchor presenter from duplicating a W770 composition', () => {
  assert.match(renderer, /composedBuildingIds/);
  assert.match(renderer, /superseded-by-authored-composition/);
  assert.match(renderer, /authoredAssetPresenter\?\.apply\?\.\(\{ plan: fallbackAnchorPlan \}\)/);
});

test('W770D truth summary separates fallback composition readiness, RT92 catalogue completion and actually presented bespoke art', () => {
  assert.match(renderer, /presentedBuildingCompositionCount/);
  assert.match(renderer, /scaffoldingSuppressedAfterValidationCount/);
  assert.match(renderer, /bespokeBuildingArtCompleteCount: Number\(bespokeLandmarkSummary\.catalogueCompleteCount/);
  assert.match(renderer, /presentedBespokeLandmarkCount: Number\(bespokeLandmarkSummary\.presentedCount/);
  assert.match(renderer, /finishedHeroPrimitives: 0/);
});
