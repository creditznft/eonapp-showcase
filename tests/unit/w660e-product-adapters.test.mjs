import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EON_NEXUS_FORGE_STAGES,
  getEonNexusProductAdapterTruth,
  readEonNexusProductAdapterSnapshot
} from '../../assets/js/nexus/eon-nexus-product-adapters.js';

const fixedNow = Date.parse('2026-07-19T12:00:00.000Z');
const snapshot = (overrides = {}) => readEonNexusProductAdapterSnapshot({
  now: fixedNow,
  localStorage: null,
  sessionStorage: null,
  kernelSession: { records: [{ taskId: 'task_1', state: 'review-needed', workflowState: 'validation', updatedAt: '2026-07-19T11:59:00.000Z' }] },
  activeProjectContext: { projectId: 'project_1', updatedAt: '2026-07-19T11:00:00.000Z' },
  projectState: { projects: [{ id: 'project_1', title: 'Private title', updatedAt: '2026-07-19T11:30:00.000Z' }] },
  settings: {},
  readiness: { ready: true, runtimeType: 'local', providerId: 'ollama', state: 'ready', checkedAt: '2026-07-19T11:58:00.000Z' },
  libraryAssets: [{ id: 'asset_1', title: 'Private filename', updatedAt: '2026-07-19T10:00:00.000Z' }],
  automationState: {
    schedules: [{ id: 'schedule_1', enabled: true, nextRunAt: '2026-07-20T09:00:00.000Z' }],
    audit: [
      { id: 'ok', status: 'success', at: '2026-07-19T09:00:00.000Z' },
      { id: 'failed', status: 'failed', at: '2026-07-19T10:00:00.000Z' },
      { id: 'waiting', status: 'waiting-condition', at: '2026-07-19T11:00:00.000Z' }
    ],
    approvals: [{ id: 'approval_1', status: 'pending' }]
  },
  vaultSummary: { credentialMetadataCount: 2, recoveryReviewCount: 1, sensitiveFixture: 'vault-value-must-not-project' },
  billingArchitecture: { hostedProvider: 'Dodo Payments', paidPlans: [{ id: 'plus' }, { id: 'studio' }] },
  ...overrides
});

test('W660E exposes exactly eight bounded read-only product adapters', () => {
  const value = snapshot();
  assert.equal(value.schema, 'eon.nexus.product-adapters.w660e.v1');
  assert.deepEqual(Object.keys(value.adapters).sort(), ['automations', 'billing', 'forge', 'library', 'local-ai', 'projects', 'settings', 'vault']);
  assert.equal(value.presence.length, 8);
  assert.equal(value.truth.ownsProductStore, false);
  assert.equal(value.truth.startsForge, false);
  assert.equal(value.truth.runsAutomation, false);
  assert.equal(value.truth.readsVaultContents, false);
  assert.equal(value.truth.changesBilling, false);
});

test('W660E Forge adapter keeps the complete seven-stage workflow and current truthful stage', () => {
  const forge = snapshot().adapters.forge;
  assert.deepEqual(forge.detail.stages, EON_NEXUS_FORGE_STAGES);
  assert.deepEqual(EON_NEXUS_FORGE_STAGES, ['request', 'planner', 'files', 'generator', 'validation', 'preview', 'approval']);
  assert.equal(forge.detail.currentStage, 'validation');
  assert.equal(forge.status, 'waiting');
  assert.equal(forge.count, 1);
});

test('W660E distinguishes private local AI without silently changing routes', () => {
  const local = snapshot().adapters['local-ai'];
  assert.equal(local.status, 'active');
  assert.equal(local.providerKind, 'local');
  assert.equal(local.detail.privateOnDevice, true);

  const hosted = snapshot({ readiness: { ready: true, runtimeType: 'hosted', providerId: 'groq', state: 'ready' } }).adapters['local-ai'];
  assert.equal(hosted.status, 'available');
  assert.equal(hosted.detail.privateOnDevice, false);
});

test('W660E automation adapter preserves upcoming, successful, failed and waiting categories', () => {
  const automation = snapshot().adapters.automations;
  assert.deepEqual(automation.detail, { upcoming: 1, successful: 1, failed: 1, waiting: 2 });
  assert.equal(automation.status, 'failed');
  assert.equal(automation.count, 4);
});

test('W660E Library, Vault, Settings and Billing project only restrained presence facts', () => {
  const value = snapshot();
  assert.equal(value.adapters.library.count, 1);
  assert.equal(value.adapters.library.detail.provenanceOnly, true);
  assert.equal(value.adapters.vault.count, 3);
  assert.equal(value.adapters.vault.detail.secureStateOnly, true);
  assert.equal(value.adapters.settings.detail.helpPulseOnly, true);
  assert.equal(value.adapters.billing.detail.serverAuthorityOnly, true);
  assert.doesNotMatch(JSON.stringify(value), /Private filename|Private title|vault-value-must-not-project/);
});

test('W660E truth contract prohibits execution, duplicated stores and raw secrets', () => {
  const truth = getEonNexusProductAdapterTruth();
  assert.equal(truth.adapterCount, 8);
  assert.equal(truth.readOnly, true);
  assert.equal(truth.startsWork, false);
  assert.equal(truth.duplicatesStores, false);
  assert.equal(truth.rawSecrets, false);
});
