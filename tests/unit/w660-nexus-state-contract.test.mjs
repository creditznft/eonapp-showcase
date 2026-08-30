import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EON_NEXUS_STATE_SCHEMA,
  applyEonNexusEvent,
  createDefaultEonNexusState,
  createEonNexusStore,
  getEonNexusStateContractTruth,
  normalizeEonNexusState
} from '../../assets/js/nexus/eon-nexus-state-contract.js';

const fixedNow = Date.parse('2026-07-19T12:00:00.000Z');

test('W660A2 default Nexus state is immutable, renderer-neutral and idle', () => {
  const state = createDefaultEonNexusState({ now: fixedNow });
  assert.equal(state.schema, EON_NEXUS_STATE_SCHEMA);
  assert.equal(state.eonbot.state, 'ready');
  assert.equal(state.task.state, 'ready');
  assert.equal(state.route.mode, 'guide');
  assert.equal(state.approval.pending, false);
  assert.equal(state.nodes.length, 0);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.eonbot), true);

  const truth = getEonNexusStateContractTruth();
  assert.equal(truth.ownsConversation, false);
  assert.equal(truth.ownsTaskRuntime, false);
  assert.equal(truth.ownsApprovalExecution, false);
  assert.equal(truth.providerCredentialAccepted, false);
});

test('W660A2 state normalization bounds labels, routes and node collections', () => {
  const state = normalizeEonNexusState({
    conversation: {
      id: 'chat safe<script>',
      label: 'Private conversation',
      messageCount: 99999,
      openRoute: 'javascript:alert(1)'
    },
    project: {
      id: 'project_1',
      selected: true,
      taskCount: 4000,
      artefactCount: 4000
    },
    route: {
      mode: 'local',
      providerId: 'ollama',
      providerLabel: 'Ollama',
      privateOnDevice: true,
      verified: true
    },
    nodes: Array.from({ length: 30 }, (_, index) => ({
      id: `node-${index}`,
      role: 'builder',
      status: index === 0 ? 'active' : 'available'
    }))
  }, { now: fixedNow });

  assert.equal(state.conversation.id, 'chatsafescript');
  assert.equal(state.conversation.messageCount, 500);
  assert.equal(state.conversation.openRoute, '/');
  assert.equal(state.project.taskCount, 1000);
  assert.equal(state.project.artefactCount, 1000);
  assert.equal(state.route.mode, 'local');
  assert.equal(state.route.privateOnDevice, true);
  assert.equal(state.nodes.length, 16);
  assert.equal(state.nodes[0].status, 'active');
});

test('W660A2 task and approval events update only their normalized domains', () => {
  const base = createDefaultEonNexusState({ now: fixedNow });
  const taskState = applyEonNexusEvent(base, {
    type: 'task.changed',
    detail: {
      id: 'eontask_safe_123456789',
      state: 'running',
      stage: 'files',
      stageLabel: 'Inspecting files',
      cancellable: true
    },
    at: '2026-07-19T12:01:00.000Z'
  }, { now: fixedNow });
  assert.equal(taskState.task.state, 'running');
  assert.equal(taskState.task.stageLabel, 'Inspecting files');
  assert.equal(taskState.conversation.label, 'Private conversation');

  const approvalState = applyEonNexusEvent(taskState, {
    type: 'approval.changed',
    detail: { count: 1, reviewRoute: '/workspace', actionId: 'review_1' },
    at: '2026-07-19T12:02:00.000Z'
  }, { now: fixedNow });
  assert.equal(approvalState.approval.pending, true);
  assert.equal(approvalState.approval.count, 1);
  assert.equal(approvalState.approval.reviewRoute, '/workspace');
  assert.equal(approvalState.task.state, 'running');
});

test('W660A2 store publishes immutable replacements without creating operational effects', () => {
  let now = fixedNow;
  const seen = [];
  const store = createEonNexusStore({ now: () => now });
  const unsubscribe = store.subscribe((state, event) => seen.push({ state, event }));

  now += 1000;
  const result = store.dispatch({
    type: 'eonbot.changed',
    detail: { state: 'processing', statusLabel: 'Working' },
    at: now
  });
  assert.equal(result.ok, true);
  assert.equal(result.state.eonbot.state, 'processing');
  assert.equal(seen.length, 1);
  assert.equal(seen[0].event.type, 'eonbot.changed');
  assert.equal(Object.isFrozen(seen[0].state), true);

  now += 1000;
  const replaced = store.replace({
    eonbot: { state: 'complete' },
    results: { count: 1, unread: 0 }
  });
  assert.equal(replaced.state.eonbot.state, 'complete');
  assert.equal(replaced.state.results.count, 1);
  assert.equal(seen.length, 2);

  unsubscribe();
  store.dispose();
});
