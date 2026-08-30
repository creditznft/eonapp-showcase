import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW770BCompositionPlan } from '../../assets/js/city/w770/eon-expanse-w770b-my-frontier-building-composition-plan.js';

const presentation = (status = 'constructed-foundation') => ({ plots: [{
  plotId: 'plot-creator', district: 'creator', selectedBuildingId: 'media-foundry', constructedBuildingId: status === 'constructed-foundation' ? 'media-foundry' : '', status,
  foundationVisible: status === 'constructed-foundation', scaffoldingVisible: status === 'constructed-foundation', hologramVisible: status === 'planned-hologram'
}] });

test('W770B requests compositions only for verified constructed foundations', () => {
  const built = deriveEonExpanseW770BCompositionPlan({ presentation: presentation(), quality: 'balanced' });
  const planned = deriveEonExpanseW770BCompositionPlan({ presentation: presentation('planned-hologram'), quality: 'balanced' });
  assert.equal(built.requestedPlotCount, 1);
  assert.equal(built.plots.find((entry) => entry.plotId === 'plot-creator').requestComposition, true);
  assert.equal(planned.requestedPlotCount, 0);
  assert.equal(planned.plannedHologramsRequestAssets, false);
});

test('W770B scales authored component requests by Lite, Balanced and Cinematic quality', () => {
  const lite = deriveEonExpanseW770BCompositionPlan({ presentation: presentation(), quality: 'lite' });
  const balanced = deriveEonExpanseW770BCompositionPlan({ presentation: presentation(), quality: 'balanced' });
  const cinematic = deriveEonExpanseW770BCompositionPlan({ presentation: presentation(), quality: 'cinematic' });
  assert.equal(lite.requestedPartCount < balanced.requestedPartCount, true);
  assert.equal(balanced.requestedPartCount < cinematic.requestedPartCount, true);
  assert.equal(lite.plots.find((entry) => entry.plotId === 'plot-creator').requiredPartCount >= 1, true);
});

test('W770B preserves foundations and scaffolding until visible validation succeeds', () => {
  const plan = deriveEonExpanseW770BCompositionPlan({ presentation: presentation(), quality: 'cinematic' });
  const row = plan.plots.find((entry) => entry.plotId === 'plot-creator');
  assert.equal(row.preserveFoundation, true);
  assert.equal(row.preserveScaffoldingUntilValidated, true);
  assert.equal(row.suppressScaffoldingBeforeValidation, false);
  assert.equal(row.finishedBespokeBuilding, false);
});

test('W770B owns no loader, retry, construction, persistence or free-placement authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w770/eon-expanse-w770b-my-frontier-building-composition-plan.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /SceneLoader|LoadAssetContainer|setTimeout|setInterval|fetch\s*\(|localStorage|confirmConstruction|awardXp|new\s+(?:BABYLON\.)?(?:Engine|Scene)/);
  const plan = deriveEonExpanseW770BCompositionPlan({ presentation: presentation() });
  assert.equal(plan.automaticRetry, false);
  assert.equal(plan.privateContentStored, false);
});
