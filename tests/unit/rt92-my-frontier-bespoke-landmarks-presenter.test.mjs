import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const presenter = await readFile(new URL('../../assets/js/city/rt92/my-frontier/eon-city-rt92-my-frontier-bespoke-presenter.js', import.meta.url), 'utf8');
const renderer = await readFile(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
const fallback = await readFile(new URL('../../assets/js/city/w770/eon-expanse-w770c-my-frontier-building-composition-presenter.js', import.meta.url), 'utf8');

test('RT92 bespoke presenter uses canonical Babylon asset containers and strict same-origin content-addressed paths', () => {
  assert.match(presenter, /SceneLoader\.LoadAssetContainerAsync/);
  assert.match(presenter, /LOCAL_CONTENT_ADDRESSED_PATH/);
  assert.match(presenter, /\/assets\\\/city\\\/rt92\\\/my-frontier\\\/landmarks/);
  assert.match(presenter, /evaluateEonExpanseW767AAssetPresentation/);
  assert.match(presenter, /presented-bespoke-landmark/);
  assert.match(presenter, /rejected-bespoke-landmark/);
});

test('RT92 bespoke presenter is presentation-only and preserves plot collision/navigation authority', () => {
  assert.match(presenter, /mesh\.checkCollisions = false/);
  assert.match(presenter, /collisionsOwned: false/);
  assert.match(presenter, /navigationOwned: false/);
  assert.match(presenter, /oneRenderLoop: true/);
  assert.match(presenter, /secondRenderLoopCreated: false/);
  assert.doesNotMatch(presenter, /runRenderLoop\s*\(|new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|fetch\s*\(|localStorage|awardXp|confirmConstruction/);
});

test('W768I mounts bespoke landmarks only in My Frontier lifecycle and hides W770 fallback only after validated readiness', () => {
  assert.match(renderer, /mountEonCityRt92MyFrontierBespokePresenter/);
  assert.match(renderer, /bespokeLandmarkPresenter\?\.apply/);
  assert.match(renderer, /bespokeLandmarkPresenter\?\.setStreamingFocus/);
  assert.match(renderer, /bespokeLandmarkPresenter\?\.setActive/);
  assert.match(renderer, /bespokeLandmarkPresenter\?\.dispose/);
  assert.match(renderer, /bespokeReadyPlotIds/);
  assert.match(renderer, /setBespokeReadyPlots/);
  assert.match(renderer, /bespokeReadiness\.get\(entry\.plotId\)\?\.ready === true \|\| compositionReadiness/);
  assert.match(fallback, /setBespokeReadyPlots/);
  assert.match(fallback, /state\.wrapper\?\.setEnabled\?\.\(!suppressedPlotIds\.has\(state\.plotId\)\)/);
  assert.match(fallback, /fallbackHiddenOnlyAfterBespokeValidation: true/);
});

test('RT92 eliminates the five-item art-production backlog without claiming a constructed landmark is ready before load validation', () => {
  assert.match(renderer, /bespokeBuildingArtCompleteCount: Number\(bespokeLandmarkSummary\.catalogueCompleteCount/);
  assert.match(renderer, /levelThreeLandmarkArtPending: Number\(bespokeLandmarkSummary\.catalogueCompleteCount \|\| 0\) < 5/);
  assert.match(presenter, /finishedBespokeBuilding: ready/);
  assert.match(presenter, /fallbackRequired: !ready/);
});
