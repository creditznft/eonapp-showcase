import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EON_CITY_PRODUCTIVE_RPG_SCHEMA } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { createEonExpanseW766FLivingContent } from '../../assets/js/city/w766/eon-expanse-w766f-living-content.js';
import { deriveEonExpanseW767WProductiveReceipt, validateEonExpanseW767WProductiveReceipt } from '../../assets/js/city/w766/eon-expanse-w767w-productive-receipt-bridge.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const plan = (overrides = {}) => ({
  schema: EON_CITY_PRODUCTIVE_RPG_SCHEMA,
  missions: [{ id: 'creator', state: 'completed', outcome: { kind: 'creator-guide-artifact', route: '/create', source: 'create-local-guide', receiptId: 'creator:verified:1', verifiedAt: 767001, verified: true, privatePrompt: 'must-not-project' } }],
  ...overrides
});

test('W767W derives only a bounded receipt from the maintained native outcome ledger', () => {
  const receipt = deriveEonExpanseW767WProductiveReceipt(plan(), 'create-expedition');
  assert.equal(receipt.ok, true);
  assert.equal(receipt.id, 'creator:verified:1');
  assert.equal(receipt.workspaceId, 'create');
  assert.equal(receipt.nativeMissionId, 'creator');
  assert.equal(receipt.privateContentStored, false);
  assert.equal(JSON.stringify(receipt).includes('must-not-project'), false);
});

test('W767W rejects a merely shaped or stale receipt that does not exactly match current native truth', () => {
  const canonical = deriveEonExpanseW767WProductiveReceipt(plan(), 'create-expedition');
  const shaped = { id: canonical.id, workspaceId: 'create', status: 'completed' };
  assert.equal(validateEonExpanseW767WProductiveReceipt({ missionId: 'create-expedition', workspaceReceipt: shaped, nativePlan: plan() }).reason, 'native-workspace-receipt-mismatch');
  assert.equal(validateEonExpanseW767WProductiveReceipt({ missionId: 'create-expedition', workspaceReceipt: { ...canonical, id: 'stale' }, nativePlan: plan() }).reason, 'native-workspace-receipt-mismatch');
  assert.equal(validateEonExpanseW767WProductiveReceipt({ missionId: 'create-expedition', workspaceReceipt: canonical, nativePlan: plan() }).ok, true);
});

test('W767W keeps Status Review unavailable until a maintained native receipt authority exists', () => {
  const result = deriveEonExpanseW767WProductiveReceipt(plan(), 'status-review');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'native-status-receipt-pending');
});

test('W767W living content fails closed without receipt authority and accepts only the verified bridge', () => {
  const canonical = deriveEonExpanseW767WProductiveReceipt(plan(), 'create-expedition');
  const closed = createEonExpanseW766FLivingContent();
  assert.equal(closed.completeProductiveMission('create-expedition', { explicitUserAction: true, workspaceReceipt: canonical }).reason, 'productive-receipt-authority-unavailable');
  const guarded = createEonExpanseW766FLivingContent({ verifyWorkspaceReceipt: ({ missionId, workspaceReceipt }) => validateEonExpanseW767WProductiveReceipt({ missionId, workspaceReceipt, nativePlan: plan() }) });
  assert.equal(guarded.completeProductiveMission('create-expedition', { explicitUserAction: true, workspaceReceipt: { id: canonical.id, workspaceId: 'create', status: 'completed' } }).reason, 'native-workspace-receipt-mismatch');
  assert.equal(guarded.completeProductiveMission('create-expedition', { explicitUserAction: true, workspaceReceipt: canonical }).ok, true);
});

test('W767W runtime integration reads current native receipts without another Babylon authority', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /deriveEonExpanseW767WProductiveReceipt/);
  assert.match(runtime, /validateEonExpanseW767WProductiveReceipt/);
  assert.match(runtime, /getEonCityProductiveRpgPlan/);
  assert.match(runtime, /getExpanseProductiveReceiptCandidate/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
