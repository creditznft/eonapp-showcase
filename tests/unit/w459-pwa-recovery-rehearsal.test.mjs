import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonPwaRecoveryRehearsal, getEonPwaRecoveryRehearsalTruth } from '../../assets/js/eon-pwa-recovery-rehearsal.js';
import { W145_PROTECTED_STORAGE_GROUPS } from '../../assets/js/utils/update-safe-user-data.js';
import { inspectW459PwaRecoveryRehearsal } from '../../scripts/w459-pwa-recovery-rehearsal-gate.mjs';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const getCalls = [];
  return {
    getItem(key) { getCalls.push(String(key)); return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    removeItem(key) { data.delete(String(key)); },
    get length() { return data.size; },
    key(index) { return [...data.keys()][index] || null; },
    getCalls,
    values() { return [...data.entries()]; }
  };
}

const NOW = Date.parse('2026-07-01T00:00:00.000Z');

test('W459.1 prepares only a redacted local rehearsal and does not read protected values', () => {
  const initial = {
    'eon:vault:credentials:v1': 'encrypted-secret-placeholder:do-not-read',
    'eon:api-key-vault:v1': 'sk-example-private-value',
    'eon:chat:history:v2': '{"private":"chat content"}',
    'eon:profile': '{"alias":"Local"}'
  };
  const storage = memoryStorage(initial);
  const rehearsal = createEonPwaRecoveryRehearsal({ storage, now: () => NOW });
  assert.equal(rehearsal.prepare().error, 'explicit-user-action-required');
  storage.getCalls.length = 0;
  const prepared = rehearsal.prepare({ safeLabel: 'Review local recovery' }, { explicitUserAction: true });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.rehearsal.inventory.rawValuesRead, false);
  assert.equal(prepared.rehearsal.inventory.rawValuesStored, false);
  assert.equal(prepared.rehearsal.recoveryCertified, false);
  assert.deepEqual(storage.getCalls, ['eon:pwa:recovery-rehearsal:v1']);
  const output = JSON.stringify(prepared);
  assert.equal(output.includes('encrypted-secret-placeholder'), false);
  assert.equal(output.includes('sk-example-private-value'), false);
  assert.equal(output.includes('private chat content'), false);
  assert.equal(output.includes('eon:vault:credentials:v1'), false);
  assert.equal(output.includes('eon:api-key-vault:v1'), false);
  assert.equal(prepared.rehearsal.inventory.protectedKeysPresent, 4);
  assert.ok(prepared.rehearsal.inventory.protectedCategoryCount >= 3);
});

test('W459.1 requires deliberate acknowledgement but never turns a plan into recovery certification', () => {
  const storage = memoryStorage({ 'eon:profile': '{"alias":"Local"}' });
  const rehearsal = createEonPwaRecoveryRehearsal({ storage, now: () => NOW });
  const prepared = rehearsal.prepare({}, { explicitUserAction: true });
  const id = prepared.rehearsal.rehearsalId;
  assert.equal(rehearsal.acknowledgeStep(id, 'backup-check', { explicitUserAction: true }).error, 'explicit-manual-review-confirmation-required');
  let result = prepared;
  for (const step of result.rehearsal.steps) {
    result = rehearsal.acknowledgeStep(id, step.id, { explicitUserAction: true, explicitUserConfirmation: true });
    assert.equal(result.ok, true);
    assert.equal(result.rehearsal.actualBackupCreated, false);
    assert.equal(result.rehearsal.actualRestoreApplied, false);
    assert.equal(result.rehearsal.actualUpdateApplied, false);
    assert.equal(result.rehearsal.rollbackApplied, false);
    assert.equal(result.rehearsal.recoveryCertified, false);
  }
  assert.equal(result.rehearsal.status, 'manual-plan-reviewed');
  assert.equal(result.rehearsal.acknowledgedStepCount, result.rehearsal.requiredStepCount);
});

test('W459.1 protects its own redacted record in W145 and preserves source-only boundaries', () => {
  const rehearsalGroup = W145_PROTECTED_STORAGE_GROUPS.find((group) => group.id === 'pwa-update-recovery');
  assert.ok(rehearsalGroup?.keys.includes('eon:pwa:recovery-rehearsal:v1'));
  const gate = inspectW459PwaRecoveryRehearsal();
  const truth = getEonPwaRecoveryRehearsalTruth();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 9);
  assert.equal(truth.rawVaultValueRead, false);
  assert.equal(truth.automaticUpdateApplication, false);
  assert.equal(truth.recoveryCertified, false);
  assert.equal(truth.productionPwaProof, false);
});
