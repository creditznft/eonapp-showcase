import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW768MAuthoredAssetPlan, validateEonExpanseW768MAuthoredAssetPlan } from '../../assets/js/city/w768/eon-expanse-w768m-my-frontier-authored-asset-plan.js';

const constructed = (plotId, buildingId) => ({ plotId, selectedBuildingId: buildingId, status: 'constructed-foundation', foundationVisible: true, scaffoldingVisible: true });

test('W768M requests authored anchors only for verified constructed foundations', () => {
  const plan = deriveEonExpanseW768MAuthoredAssetPlan({ presentation: { plots: [
    constructed('plot-central-command', 'command-core'),
    { plotId: 'plot-creator', selectedBuildingId: 'creator-workshop', status: 'planned-hologram', foundationVisible: false, scaffoldingVisible: false }
  ] } });
  assert.equal(validateEonExpanseW768MAuthoredAssetPlan(plan).ok, true);
  assert.equal(plan.plots.find((row) => row.plotId === 'plot-central-command').status, 'load-authored-anchor');
  assert.equal(plan.plots.find((row) => row.plotId === 'plot-creator').status, 'not-requested');
  assert.equal(plan.requestedCount, 1);
});

test('W768M keeps missing dedicated art visibly pending rather than using a fake hero', () => {
  const plan = deriveEonExpanseW768MAuthoredAssetPlan({ presentation: { plots: [constructed('plot-personal', 'reflection-garden')] } });
  const row = plan.plots.find((entry) => entry.plotId === 'plot-personal');
  assert.equal(row.status, 'dedicated-art-pending');
  assert.equal(row.requestAsset, false);
  assert.equal(row.foundationMustRemainVisible, true);
  assert.equal(row.scaffoldingMustRemainVisible, true);
  assert.equal(row.finishedBuildingVisible, false);
});

test('W768M never loads assets from a plan alone or hides construction truth', () => {
  const plan = deriveEonExpanseW768MAuthoredAssetPlan();
  assert.equal(plan.plannedHologramsCanRequestAssets, false);
  assert.equal(plan.foundationHiddenByAnchor, false);
  assert.equal(plan.scaffoldingHiddenByAnchor, false);
  assert.equal(plan.finishedBuildingPrimitives, 0);
});

test('W768M has no XP, progression, automatic construction or private-content authority', () => {
  const plan = deriveEonExpanseW768MAuthoredAssetPlan({ presentation: { plots: [constructed('plot-systems', 'local-ai-observatory')] } });
  assert.equal(plan.automaticConstruction, false);
  assert.equal(plan.privateContentStored, false);
  for (const row of plan.plots) {
    assert.equal(row.grantsXp, false);
    assert.equal(row.mutatesProgression, false);
  }
});
