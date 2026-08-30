import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EON_NEXUS_CONTINUITY_STORAGE_KEY,
  EON_NEXUS_CONTINUITY_TTL_MS,
  createEonNexusContinuitySnapshot,
  writeEonNexusContinuitySnapshot,
  readEonNexusContinuitySnapshot,
  getEonNexusContinuityTruth
} from '../../assets/js/nexus/eon-nexus-continuity-contract.js';

function storage() {
  const map = new Map();
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    map
  };
}

const now = Date.parse('2026-07-23T06:00:00.000Z');
const snapshot = {
  eonbot: { state: 'processing', statusLabel: 'Validating' },
  conversation: { id: 'chat_1', label: 'Private conversation', messageCount: 7, openRoute: '/chat?thread=chat_1', rawBody: 'never store' },
  project: { id: 'project_1', label: 'Active project', selected: true, status: 'active', taskCount: 3, artefactCount: 2, openRoute: '/projects?project=project_1', privateContent: 'never store' },
  route: { mode: 'local', providerId: 'ollama', providerLabel: 'Ollama', privateOnDevice: true, verified: true, apiKey: 'never store' },
  task: { id: 'task_1', label: 'Current task', state: 'running', stage: 'validation', stageLabel: 'Validating', cancellable: true, prompt: 'never store' },
  approval: { pending: true, count: 1, label: '1 approval waiting', reviewRoute: '/workspace', payload: 'never store' },
  nodes: Array.from({ length: 7 }, (_, index) => ({ id: `node_${index}`, label: `Node ${index}`, status: index === 2 ? 'active' : 'available', count: 1 })),
  results: { count: 2, unread: 1, label: '2 results ready', openRoute: '/workspace' },
  atlas: { selected: true, projectId: 'project_1', incompleteCount: 2, completedTaskCount: 1, nextAction: { kind: 'review', label: 'Review approval' } },
  surface: { id: 'forge', label: 'Forge', route: '/forge', focusNodeId: 'node_2' }
};

test('W662C carries one bounded privacy-projected identity across the three Nexus forms', () => {
  const value = createEonNexusContinuitySnapshot(snapshot, { sourceRoute: '/forge', cityDestination: 'core', now });
  assert.equal(value.identity.assistantId, 'eonbot');
  assert.equal(value.identity.state, 'processing');
  assert.equal(value.providerRoute.providerLabel, 'Ollama');
  assert.equal(value.project.id, 'project_1');
  assert.equal(value.task.stage, 'validation');
  assert.equal(value.selectedNodeId, 'node_2');
  assert.equal(value.nodes.length, 5);
  assert.equal(Date.parse(value.expiresAt) - Date.parse(value.createdAt), EON_NEXUS_CONTINUITY_TTL_MS);
  const encoded = JSON.stringify(value);
  assert.doesNotMatch(encoded, /never store/);
  assert.doesNotMatch(encoded, /apiKey|rawBody|privateContent|prompt|payload/);
});

test('W662C writes only after explicit action and reads the exact projected state back', () => {
  const store = storage();
  assert.equal(writeEonNexusContinuitySnapshot(snapshot, { storage: store, now }).ok, false);
  const written = writeEonNexusContinuitySnapshot(snapshot, { storage: store, explicitUserAction: true, sourceRoute: '/forge', storageRoute: '/forge', now });
  assert.equal(written.ok, true);
  assert.equal(written.route, '/eoncity?nexus=spatial&destination=core');
  assert.ok(store.getItem(EON_NEXUS_CONTINUITY_STORAGE_KEY));
  const read = readEonNexusContinuitySnapshot({ storage: store, now: now + 1000 });
  assert.equal(read.identity.state, 'processing');
  assert.equal(read.providerRoute.providerId, 'ollama');
  assert.equal(read.project.id, 'project_1');
  assert.equal(read.task.id, 'task_1');
  assert.equal(read.returnContext.route, '/forge');
});

test('W662C expires stale handoffs and keeps the truth boundary explicit', () => {
  const store = storage();
  writeEonNexusContinuitySnapshot(snapshot, { storage: store, explicitUserAction: true, now });
  assert.equal(readEonNexusContinuitySnapshot({ storage: store, now: now + EON_NEXUS_CONTINUITY_TTL_MS + 1 }), null);
  assert.equal(store.getItem(EON_NEXUS_CONTINUITY_STORAGE_KEY), null);
  const truth = getEonNexusContinuityTruth();
  assert.equal(truth.sameAssistantIdentity, true);
  assert.equal(truth.explicitUserActionRequired, true);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.rawMessageBodiesStored, false);
  assert.equal(truth.providerCredentialsStored, false);
});
