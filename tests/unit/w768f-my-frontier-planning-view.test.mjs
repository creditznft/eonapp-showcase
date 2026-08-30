import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768FMyFrontierPlanningView, validateEonExpanseW768FPlanningAction } from '../../assets/js/city/w768/eon-expanse-w768f-my-frontier-planning-view.js';

const receipt = Object.freeze({ id: 'campaign:signal-restoration:complete', campaignId: 'signal-restoration', completedAt: 1785792600000 });

test('W768F stays hidden only when no public or verified access authority is available', () => {
  const locked = deriveEonExpanseW768FMyFrontierPlanningView();
  assert.equal(locked.visible, false);
  assert.equal(locked.stage, 'access-unavailable');
  const ready = deriveEonExpanseW768FMyFrontierPlanningView({ campaignReceipt: receipt });
  assert.equal(ready.visible, true);
  assert.equal(ready.stage, 'unlock-ready');
  assert.equal(ready.action.type, 'unlock-my-frontier');
  assert.equal(validateEonExpanseW768FPlanningAction(ready, { explicitUserAction: true, expectedStage: 'unlock-ready' }).ok, true);
  assert.equal(validateEonExpanseW768FPlanningAction(ready).reason, 'explicit-user-action-required');
});


test('L95 starter access presents direct My Frontier entry without inventing Beacon One progress', () => {
  const view = deriveEonExpanseW768FMyFrontierPlanningView({ starterAccessAvailable: true });
  assert.equal(view.visible, true);
  assert.equal(view.stage, 'starter-ready');
  assert.equal(view.starterAccessAvailable, true);
  assert.equal(view.earlyAccessAvailable, false);
  assert.equal(view.campaignComplete, false);
  assert.equal(view.action.type, 'enter-my-frontier');
  assert.equal(view.action.grantsXp, false);
  assert.equal(view.action.grantsConstructionPermit, false);
  assert.doesNotMatch(view.detail, /Beacon One|Signal Frontier completion is required/i);
  assert.equal(validateEonExpanseW768FPlanningAction(view, { explicitUserAction: true, expectedStage: 'starter-ready' }).ok, true);
});

test('W768F truthfully summarizes planned, constructed and receipt-pending plots', () => {
  const state = { schema: 'eon.expanse.my-frontier-state.w768b.v1', unlocked: true, buildingChoices: { 'plot-central-command': 'command-core', 'plot-creator': 'creator-workshop', 'plot-signal': 'creator-capture-studio' } };
  const constructionProjection = { plots: [{ plotId: 'plot-central-command', status: 'constructed', constructedBuildingId: 'command-core' }] };
  const availability = [
    { plotId: 'plot-creator', authority: 'productive' },
    { plotId: 'plot-signal', authority: 'pending', unavailableReason: 'native-creator-capture-receipt-pending' }
  ];
  const view = deriveEonExpanseW768FMyFrontierPlanningView({ campaignReceipt: receipt, myFrontierState: state, constructionProjection, availability });
  assert.equal(view.stage, 'planning');
  assert.equal(view.constructedCount, 1);
  assert.equal(view.plannedCount, 2);
  assert.equal(view.pendingAuthorityCount, 1);
  assert.equal(view.rows.find((entry) => entry.plotId === 'plot-signal').status, 'receipt-pending');
  assert.equal(view.automaticConstruction, false);
});

test('W768F is a bounded projection without renderer or private content authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768f-my-frontier-planning-view.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(|fetch\s*\(|localStorage/);
  assert.doesNotMatch(source, /automaticUnlock\s*:\s*true|automaticConstruction\s*:\s*true/);
});

test('W768F is wired into the canonical mission board with one explicit unlock callback', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(runtime, /deriveEonExpanseW768FMyFrontierPlanningView/);
  assert.match(runtime, /validateEonExpanseW768FPlanningAction/);
  assert.match(runtime, /onUnlockMyFrontier/);
  assert.match(runtime, /myFrontier,\r?\n\s*myFrontierChoice/);
  assert.match(overlay, /data-eon-expanse-my-frontier/);
  assert.match(overlay, /Open My Frontier/);
  assert.match(overlay, /onUnlockMyFrontierAction/);
  assert.doesNotMatch(overlay, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\s*\(/g) || []).length, 1);
});

test('R08 Beacon One access makes My Frontier unlock-ready before campaign completion', () => {
  const view = deriveEonExpanseW768FMyFrontierPlanningView({ earlyAccessAvailable: true });
  assert.equal(view.visible, true);
  assert.equal(view.stage, 'unlock-ready');
  assert.equal(view.campaignComplete, false);
  assert.equal(view.earlyAccessAvailable, true);
  assert.match(view.detail, /advanced construction remains separately receipt-protected/);
  assert.equal(view.action.type, 'unlock-my-frontier');
});
