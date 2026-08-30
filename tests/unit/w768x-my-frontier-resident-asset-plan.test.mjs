import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_EXPANSE_W768X_RESIDENT_ASSET_POLICIES,
  deriveEonExpanseW768XResidentAssetPlan,
  validateEonExpanseW768XResidentAssetPlan
} from '../../assets/js/city/w768/eon-expanse-w768x-my-frontier-resident-asset-plan.js';

const receipt = (residentId, completedAt = 1785792700000) => Object.freeze({ id: `character-arc:${residentId}:test:${completedAt}`, residentId, completedAt, privateContentStored: false });

test('W768X maps all six authored residents to maintained animated W649 policies', () => {
  assert.deepEqual(Object.keys(EON_EXPANSE_W768X_RESIDENT_ASSET_POLICIES).sort(), ['creator-trade-master','eon-architect','maintenance-specialist','navigator','pathfinder','vault-steward'].sort());
  for (const policy of Object.values(EON_EXPANSE_W768X_RESIDENT_ASSET_POLICIES)) {
    assert.ok(policy.assetAlias);
    assert.ok(policy.targetHeight > 2 && policy.targetHeight < 2.4);
  }
});

test('W768X emits no character request for reserved or receipt-less stations', () => {
  const reserved = deriveEonExpanseW768XResidentAssetPlan({ myFrontierState: { unlocked: true, residents: {}, residentReceipts: {} } });
  assert.equal(reserved.requestedCount, 0);
  assert.equal(reserved.pendingCount, 6);
  const receiptless = deriveEonExpanseW768XResidentAssetPlan({ myFrontierState: { unlocked: true, residents: { 'resident-pathfinder': 'pathfinder' }, residentReceipts: {} } });
  assert.equal(receiptless.requestedCount, 0);
  assert.equal(receiptless.pending.find((entry) => entry.residentId === 'pathfinder').status, 'verified-resident-receipt-required');
});

test('W768X emits exact primary and fallback requests only for verified invited residents', () => {
  const state = { unlocked: true, residents: { 'resident-pathfinder': 'pathfinder', 'resident-navigator': 'navigator' }, residentReceipts: { 'resident-pathfinder': receipt('pathfinder'), 'resident-navigator': receipt('navigator', 1785792701000) } };
  const plan = deriveEonExpanseW768XResidentAssetPlan({ myFrontierState: state });
  assert.equal(plan.requestedCount, 2);
  assert.equal(validateEonExpanseW768XResidentAssetPlan(plan).ok, true);
  for (const request of plan.requests) {
    assert.match(request.primary.primary.path, /^\/assets\/city\/w649\/primary\/characters\/.+\.[a-f0-9]{12}\.glb$/i);
    assert.match(request.primary.fallback.path, /^\/assets\/city\/w649\/fallback\/characters\/.+\.[a-f0-9]{12}\.glb$/i);
    assert.ok(request.primary.animationCount > 0);
    assert.equal(request.stationSignalRemainsUntilValidated, true);
  }
});

test('W768X never counts a resident body before visible authored presentation validation', () => {
  const plan = deriveEonExpanseW768XResidentAssetPlan({ myFrontierState: { unlocked: true, residents: { 'resident-eon-architect': 'eon-architect' }, residentReceipts: { 'resident-eon-architect': receipt('eon-architect') } } });
  assert.equal(plan.residentBodyCountBeforeValidation, 0);
  assert.equal(plan.automaticLoad, false);
  assert.equal(plan.stationSignalRemainsUntilValidated, true);
});

test('W768X is a pure request planner with no renderer, network or persistence ownership', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768x-my-frontier-resident-asset-plan.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /SceneLoader|LoadAssetContainer|new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(|fetch\s*\(|localStorage/);
});
