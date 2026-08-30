import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768HMyFrontierReadiness, validateEonExpanseW768HReadinessAction } from '../../assets/js/city/w768/eon-expanse-w768h-my-frontier-readiness.js';

const state = Object.freeze({
  schema: 'eon.expanse.my-frontier-state.w768b.v1',
  unlocked: true,
  buildingChoices: Object.freeze({
    'plot-central-command': 'command-core',
    'plot-creator': 'creator-workshop',
    'plot-signal': 'creator-capture-studio',
    'plot-transit': 'gateway-terminal'
  })
});

const availability = Object.freeze([
  { plotId: 'plot-central-command', buildingId: 'command-core', authority: 'campaign', sourceMissionId: 'the-first-reveal' },
  { plotId: 'plot-creator', buildingId: 'creator-workshop', authority: 'productive', sourceMissionId: 'create-expedition' },
  { plotId: 'plot-signal', buildingId: 'creator-capture-studio', authority: 'pending', unavailableReason: 'native-creator-capture-receipt-pending' },
  { plotId: 'plot-transit', buildingId: 'gateway-terminal', authority: 'campaign', sourceMissionId: 'the-first-reveal' }
]);

test('W768H distinguishes ready permits, required maintained work and pending receipt bridges', () => {
  const view = deriveEonExpanseW768HMyFrontierReadiness({
    myFrontierState: state,
    availability,
    permitAssessments: [
      { plotId: 'plot-central-command', permit: { ok: true, sourceMissionId: 'the-first-reveal' }, verification: { ok: true } },
      { plotId: 'plot-creator', permit: { ok: false, reason: 'verified-native-outcome-required' }, verification: { ok: false, reason: 'verified-native-outcome-required' } },
      { plotId: 'plot-transit', permit: { ok: true, sourceMissionId: 'the-first-reveal' }, verification: { ok: true } }
    ]
  });
  assert.equal(view.readyCount, 2);
  assert.equal(view.rows.find((entry) => entry.plotId === 'plot-creator').status, 'work-required');
  assert.equal(view.rows.find((entry) => entry.plotId === 'plot-signal').status, 'receipt-bridge-pending');
  assert.equal(view.action.workspaceId, 'create');
  assert.equal(view.physicalConstructionAvailable, false);
});

test('W768H keeps a claimed native result separate from the explicit Expanse claim action', () => {
  const view = deriveEonExpanseW768HMyFrontierReadiness({
    myFrontierState: state,
    availability,
    permitAssessments: [{ plotId: 'plot-creator', permit: { ok: true, sourceMissionId: 'create-expedition' }, verification: { ok: false, reason: 'productive-result-claim-required' } }]
  });
  const creator = view.rows.find((entry) => entry.plotId === 'plot-creator');
  assert.equal(creator.status, 'verified-result-claim-required');
  assert.equal(creator.action, null);
  assert.equal(view.action, null);
});

test('W768H revalidates exact work routing and never completes or constructs automatically', () => {
  const view = deriveEonExpanseW768HMyFrontierReadiness({
    myFrontierState: state,
    availability,
    permitAssessments: [{ plotId: 'plot-creator', permit: { ok: false, reason: 'verified-native-outcome-required' }, verification: { ok: false, reason: 'verified-native-outcome-required' } }]
  });
  assert.equal(validateEonExpanseW768HReadinessAction(view, {
    explicitUserAction: true,
    expectedPlotId: 'plot-creator',
    expectedBuildingId: 'creator-workshop',
    expectedWorkspaceId: 'create',
    expectedReason: 'verified-native-outcome-required'
  }).ok, true);
  assert.equal(validateEonExpanseW768HReadinessAction(view, { explicitUserAction: true, expectedWorkspaceId: 'library' }).reason, 'construction-workspace-selection-changed');
  assert.equal(validateEonExpanseW768HReadinessAction(view).reason, 'explicit-user-action-required');
});

test('W768H is a privacy-safe projection without renderer, XP or automatic construction authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768h-my-frontier-readiness.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(|awardXp|localStorage|fetch\s*\(/);
  assert.doesNotMatch(source, /physicalConstructionAvailable\s*:\s*true|automaticConstruction\s*:\s*true|automaticCompletion\s*:\s*true/);
});

test('W768H remains wired to one separate review-work action', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(runtime, /deriveCurrentMyFrontierReadiness/);
  assert.match(runtime, /validateEonExpanseW768HReadinessAction/);
  assert.match(runtime, /onOpenMyFrontierWork/);
  assert.match(runtime, /expanse-my-frontier-readiness/);
  assert.match(runtime, /getExpanseMyFrontierReadiness/);
  assert.match(overlay, /Review required work/);
  assert.match(overlay, /myFrontierReadiness/);
  assert.match(overlay, /onOpenMyFrontierWorkAction/);
  assert.doesNotMatch(fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768h-my-frontier-readiness.js', import.meta.url), 'utf8'), /confirm-my-frontier-construction|physicalConstructionAvailable\s*:\s*true/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\s*\(/g) || []).length, 1);
});
