import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW767XVerifiedResultAction, validateEonExpanseW767XVerifiedResultAction } from '../../assets/js/city/w766/eon-expanse-w767x-verified-result-action.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const item = { activityId: 'create-expedition', family: 'productive-mission', label: 'Create Expedition', status: 'review-required' };
const receipt = { ok: true, id: 'creator:verified:1', missionId: 'create-expedition', kind: 'creator-guide-artifact' };

test('W767X offers an explicit claim only for a current verified native result', () => {
  const action = deriveEonExpanseW767XVerifiedResultAction(item, receipt);
  assert.equal(action.available, true);
  assert.equal(action.type, 'claim-verified-result');
  assert.equal(action.buttonLabel, 'Claim verified result');
  assert.equal(action.automaticCompletion, false);
  assert.equal(action.mutatesNativeAuthority, false);
  assert.equal(action.privateContentStored, false);
});

test('W767X rejects missing, completed, mismatched and stale result claims', () => {
  assert.equal(deriveEonExpanseW767XVerifiedResultAction(null, receipt).reason, 'productive-activity-required');
  assert.equal(deriveEonExpanseW767XVerifiedResultAction({ ...item, status: 'completed' }, receipt).reason, 'productive-activity-already-completed');
  assert.equal(deriveEonExpanseW767XVerifiedResultAction(item, { ...receipt, missionId: 'local-ai-survey' }).available, false);
  const action = deriveEonExpanseW767XVerifiedResultAction(item, receipt);
  assert.equal(validateEonExpanseW767XVerifiedResultAction(action).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW767XVerifiedResultAction(action, { explicitUserAction: true, expectedActivityId: 'old' }).reason, 'productive-activity-selection-changed');
  assert.equal(validateEonExpanseW767XVerifiedResultAction(action, { explicitUserAction: true, expectedActivityId: item.activityId, expectedReceiptId: 'stale' }).reason, 'productive-receipt-selection-changed');
});

test('W767X runtime revalidates before XP and overlay prioritizes a ready claim', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /deriveEonExpanseW767XVerifiedResultAction/);
  assert.match(runtime, /validateEonExpanseW767XVerifiedResultAction/);
  assert.match(runtime, /completeProductiveMission\(currentItem\.activityId/);
  assert.match(runtime, /automaticCompletion: false/);
  assert.match(overlay, /verifiedResultAvailable/);
  assert.match(overlay, /Claim verified result/);
  assert.match(overlay, /expectedReceiptId/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
