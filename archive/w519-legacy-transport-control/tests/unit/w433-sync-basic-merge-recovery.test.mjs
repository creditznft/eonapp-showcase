import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonSyncBasicRecord } from '../../assets/js/eon-sync/eon-sync-basic-foundation.js';
import {
  buildEonSyncBasicMergeRecoveryPlan,
  getEonSyncBasicMergeRecoveryTruth,
  prepareReviewedEonSyncBasicMerge,
  restoreReviewedEonSyncBasicRollback,
  runEonSyncBasicMergeRecoveryScenarios
} from '../../assets/js/eon-sync/eon-sync-basic-merge-recovery.js';
import { inspectW433SyncBasicMergeRecovery } from '../../scripts/w433-sync-basic-merge-recovery-gate.mjs';

const localDevice = 'device_w433localproof0001';
const remoteDevice = 'device_w433remoteproof0001';

async function record(input) {
  return createEonSyncBasicRecord({ ...input, originDeviceId: input.originDeviceId || localDevice });
}

test('W433 produces a deterministic review plan and does not mutate source records', async () => {
  const local = await record({ id: 'preferences:theme', type: 'preferences', content: { theme: 'graphite' }, updatedAt: '2026-06-28T08:00:00.000Z' });
  const remote = await record({ id: 'preferences:theme', type: 'preferences', content: { theme: 'ivory' }, updatedAt: '2026-06-28T09:00:00.000Z', originDeviceId: remoteDevice });
  const before = JSON.stringify(local);
  const plan = await buildEonSyncBasicMergeRecoveryPlan({ localRecords: [local], remoteRecords: [remote], now: Date.parse('2026-06-29T00:00:00.000Z') });
  assert.equal(plan.status, 'review-ready');
  assert.equal(plan.decisions[0].operation, 'replace-local-review');
  assert.equal(plan.decisions[0].automaticOverwrite, false);
  assert.equal(JSON.stringify(local), before);
  assert.equal(plan.browserStorageChanged, false);
  assert.equal(plan.networkRequestCreated, false);
});

test('W433 blocks unselected or under-consented changes and returns only a stage when approved', async () => {
  const remote = await record({ id: 'preferences:language', type: 'preferences', content: { language: 'en' }, updatedAt: '2026-06-28T08:00:00.000Z', originDeviceId: remoteDevice });
  const plan = await buildEonSyncBasicMergeRecoveryPlan({ localRecords: [], remoteRecords: [remote] });
  const decisionId = plan.decisions[0].id;
  assert.equal(prepareReviewedEonSyncBasicMerge(plan, { explicitUserAction: true }).error, 'explicit-changing-review-selection-required');
  assert.equal(prepareReviewedEonSyncBasicMerge(plan, { selectedDecisionIds: [decisionId], explicitUserAction: true }).error, 'selected-review-consent-required');
  const staged = prepareReviewedEonSyncBasicMerge(plan, { selectedDecisionIds: [decisionId], explicitUserAction: true, explicitImportConsent: true });
  assert.equal(staged.ok, true);
  assert.equal(staged.stageOnly, true);
  assert.equal(staged.browserStorageChanged, false);
  assert.equal(staged.networkRequestCreated, false);
  assert.equal(staged.replicaRecords.length, 1);
  const rollback = restoreReviewedEonSyncBasicRollback(staged.rollbackSnapshot);
  assert.equal(rollback.restoredReplicaRecords.length, 0);
});

test('W433 local scenario covers replacement, conflict copy, tombstone review and source preservation', async () => {
  const scenario = await runEonSyncBasicMergeRecoveryScenarios();
  assert.equal(scenario.valid, true);
  assert.equal(scenario.localRecordsUnchanged, true);
  assert.equal(scenario.missingConsent.ok, false);
  assert.equal(scenario.staged.ok, true);
  assert.equal(scenario.staged.stagedTombstones.length, 1);
  assert.equal(scenario.physicalDeviceProof, false);
});

test('W433 gate and truth keep Sync Basic outside a live release claim', () => {
  const gate = inspectW433SyncBasicMergeRecovery();
  const truth = getEonSyncBasicMergeRecoveryTruth();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 8);
  assert.equal(truth.liveSync, false);
  assert.equal(truth.browserStorageWrite, false);
  assert.equal(truth.automaticMerge, false);
  assert.equal(truth.secureVaultSyncIncluded, false);
});
