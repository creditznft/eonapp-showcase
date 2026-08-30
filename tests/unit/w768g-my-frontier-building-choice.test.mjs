import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768GBuildingChoiceModel, validateEonExpanseW768GBuildingChoiceAction } from '../../assets/js/city/w768/eon-expanse-w768g-my-frontier-building-choice.js';

const unlockedState = Object.freeze({
  schema: 'eon.expanse.my-frontier-state.w768b.v1',
  unlocked: true,
  buildingChoices: Object.freeze({ 'plot-central-command': 'command-core', 'plot-creator': 'creator-workshop' })
});

test('W768G exposes only approved non-central building choices after My Frontier unlock', () => {
  const model = deriveEonExpanseW768GBuildingChoiceModel({ myFrontierState: unlockedState });
  assert.equal(model.visible, true);
  assert.equal(model.plotOptions.length, 6);
  assert.equal(model.plotOptions.some((entry) => entry.plotId === 'plot-central-command'), false);
  const creator = model.plotOptions.find((entry) => entry.plotId === 'plot-creator');
  assert.deepEqual(creator.buildings.map((entry) => entry.buildingId), ['creator-workshop', 'media-foundry', 'design-pavilion']);
  assert.equal(model.action, null);
  assert.equal(model.unavailableReason, 'plot-selection-required');
});

test('W768G requires deliberate plot and building selection and rejects stale current plans', () => {
  const model = deriveEonExpanseW768GBuildingChoiceModel({
    myFrontierState: unlockedState,
    selectedPlotId: 'plot-creator',
    selectedBuildingId: 'design-pavilion'
  });
  assert.equal(model.action.type, 'plan-my-frontier-building');
  assert.equal(validateEonExpanseW768GBuildingChoiceAction(model, {
    explicitUserAction: true,
    expectedPlotId: 'plot-creator',
    expectedBuildingId: 'design-pavilion',
    expectedCurrentBuildingId: 'creator-workshop'
  }).ok, true);
  assert.equal(validateEonExpanseW768GBuildingChoiceAction(model, {
    explicitUserAction: true,
    expectedPlotId: 'plot-creator',
    expectedBuildingId: 'design-pavilion',
    expectedCurrentBuildingId: ''
  }).reason, 'existing-plan-changed');
});

test('W768G prevents re-planning a constructed plot and cross-district injection', () => {
  const constructionProjection = { plots: [{ plotId: 'plot-creator', status: 'constructed', constructedBuildingId: 'creator-workshop' }] };
  const constructed = deriveEonExpanseW768GBuildingChoiceModel({ myFrontierState: unlockedState, constructionProjection, selectedPlotId: 'plot-creator', selectedBuildingId: 'design-pavilion' });
  assert.equal(constructed.action, null);
  assert.equal(constructed.unavailableReason, 'plot-already-constructed');
  const injected = deriveEonExpanseW768GBuildingChoiceModel({ myFrontierState: unlockedState, selectedPlotId: 'plot-knowledge', selectedBuildingId: 'creator-workshop' });
  assert.equal(injected.action, null);
  assert.equal(injected.unavailableReason, 'building-not-allowed-for-plot');
});

test('W768G contains no renderer, coordinates, automatic selection or construction authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768g-my-frontier-building-choice.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(|fetch\s*\(|localStorage/);
  assert.doesNotMatch(source, /automaticSelection\s*:\s*true|automaticConstruction\s*:\s*true/);
  assert.doesNotMatch(source, /\bposition\b|entranceAnchor|roadAnchor|collisionEnvelope/);
});

test('W768G is wired to native selects and a separately confirmed canonical planning callback', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(runtime, /deriveEonExpanseW768GBuildingChoiceModel/);
  assert.match(runtime, /validateEonExpanseW768GBuildingChoiceAction/);
  assert.match(runtime, /onPlanMyFrontierBuilding/);
  assert.match(runtime, /expanseMyFrontier\.selectBuilding/);
  assert.match(overlay, /documentRef,'select'/);
  assert.match(overlay, /eon-expanse-my-frontier-plot/);
  assert.match(overlay, /eon-expanse-my-frontier-building/);
  assert.match(overlay, /Plan building/);
  assert.match(overlay, /expectedCurrentBuildingId/);
  assert.doesNotMatch(overlay, /automaticConstruction\s*:\s*true/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\s*\(/g) || []).length, 1);
});
