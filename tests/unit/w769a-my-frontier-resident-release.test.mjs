import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW769AResidentReleaseView, validateEonExpanseW769AResidentReleaseAction } from '../../assets/js/city/w769/eon-expanse-w769a-my-frontier-resident-release.js';

const receipt = Object.freeze({ id: 'character-arc:navigator:echoes-in-the-archive:1785792701000', residentId: 'navigator', completedAt: 1785792701000 });
const state = Object.freeze({ unlocked: true, residents: Object.freeze({ 'resident-navigator': 'navigator' }), residentReceipts: Object.freeze({ 'resident-navigator': receipt }) });

test('W769A exposes one exact release action for each verified invited resident', () => {
  const view = deriveEonExpanseW769AResidentReleaseView({ myFrontierState: state });
  assert.equal(view.visible, true);
  assert.equal(view.releaseCount, 1);
  assert.equal(view.actions[0].slotId, 'resident-navigator');
  assert.equal(view.actions[0].receiptId, receipt.id);
  assert.equal(view.actions[0].releaseToken, `resident-navigator:navigator:${receipt.id}`);
});

test('W769A rejects locked, receipt-less and stale release requests', () => {
  assert.equal(deriveEonExpanseW769AResidentReleaseView({ myFrontierState: { unlocked: false } }).releaseCount, 0);
  assert.equal(deriveEonExpanseW769AResidentReleaseView({ myFrontierState: { unlocked: true, residents: { 'resident-navigator': 'navigator' }, residentReceipts: {} } }).releaseCount, 0);
  const view = deriveEonExpanseW769AResidentReleaseView({ myFrontierState: state });
  assert.equal(validateEonExpanseW769AResidentReleaseAction(view).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW769AResidentReleaseAction(view, { explicitUserAction: true, expectedSlotId: 'resident-navigator', expectedResidentId: 'navigator', expectedReceiptId: 'forged' }).reason, 'resident-release-action-stale');
});

test('W769A validates explicit release without XP, mission or automatic authority', () => {
  const view = deriveEonExpanseW769AResidentReleaseView({ myFrontierState: state });
  const action = view.actions[0];
  const result = validateEonExpanseW769AResidentReleaseAction(view, { explicitUserAction: true, expectedSlotId: action.slotId, expectedResidentId: action.residentId, expectedReceiptId: action.receiptId, expectedReleaseToken: action.releaseToken });
  assert.equal(result.ok, true);
  assert.equal(result.awardsXp, false);
  assert.equal(result.mutatesMissionState, false);
});

test('W769A state release removes resident presentation authority and permits deliberate re-invitation', () => {
  const stateSource = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768b-my-frontier-state.js', import.meta.url), 'utf8');
  assert.match(stateSource, /releaseResident\(\{ slotId/);
  assert.match(stateSource, /delete residents\[slot\.id\]/);
  assert.match(stateSource, /delete residentReceipts\[slot\.id\]/);
  assert.match(stateSource, /processedReceipts:\s*state\.processedReceipts\.filter/);
});

test('W769A is wired through the canonical mission board and reviewed overlay controls', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(runtime, /deriveEonExpanseW769AResidentReleaseView/);
  assert.match(runtime, /validateEonExpanseW769AResidentReleaseAction/);
  assert.match(runtime, /onReleaseMyFrontierResident/);
  assert.match(runtime, /releaseExpanseMyFrontierResident/);
  assert.match(overlay, /release-my-frontier-resident/);
  assert.match(overlay, /onReleaseMyFrontierResidentAction/);
});

test('W769A owns no runtime, progression, network or private-data path', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w769/eon-expanse-w769a-my-frontier-resident-release.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)|runRenderLoop|fetch\s*\(|localStorage|awardXp|completeMission/);
});
