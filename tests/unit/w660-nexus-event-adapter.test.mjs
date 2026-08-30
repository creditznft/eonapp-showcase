import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEonNexusEventAdapter,
  getEonNexusEventAdapterTruth,
  readEonNexusSourceSnapshot
} from '../../assets/js/nexus/eon-nexus-event-adapter.js';

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

function fixtureReaders(state) {
  return {
    getActiveChatThread: () => state.thread,
    readActiveProjectContext: () => state.activeProjectContext,
    loadProjects: () => ({ projects: [state.project] }),
    loadAISettings: () => ({ provider: state.providerId }),
    getAIReadiness: () => state.readiness,
    readKernelSession: () => ({ records: state.taskRecords }),
    listPendingCards: () => state.pendingCards,
    listReviewItems: ({ legacyCards }) => [...state.reviewItems, ...legacyCards],
    listProposals: () => state.proposals,
    listAgentPresence: () => state.agentPresence
  };
}

const baseState = () => ({
  thread: {
    id: 'chat_fixture_1',
    title: 'Private fixture chat',
    messages: [{ role: 'user', text: 'hidden fixture prompt' }],
    updatedAt: '2026-07-19T10:00:00.000Z'
  },
  activeProjectContext: { projectId: 'project_fixture_1', projectTitle: 'Private Project', route: '/projects' },
  project: { id: 'project_fixture_1', title: 'Private Project', status: 'active', tasks: [], artifacts: [] },
  providerId: 'guide',
  readiness: { ready: false, state: 'guide', providerId: 'guide', providerLabel: 'Guide', runtimeType: 'guide' },
  taskRecords: [],
  pendingCards: [],
  reviewItems: [],
  proposals: [],
  agentPresence: []
});

test('W660A2 source adapter reads existing stores through injected readers and returns a redacted snapshot', () => {
  const state = baseState();
  const snapshot = readEonNexusSourceSnapshot({
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
    readers: fixtureReaders(state),
    environment: { navigator: { onLine: true } },
    now: Date.parse('2026-07-19T12:00:00.000Z')
  });

  assert.equal(snapshot.conversation.id, 'chat_fixture_1');
  assert.equal(snapshot.conversation.label, 'Private conversation');
  assert.equal(snapshot.project.id, 'project_fixture_1');
  assert.equal(snapshot.project.label, 'Active project');
  assert.equal(snapshot.route.mode, 'guide');
  assert.doesNotMatch(JSON.stringify(snapshot), /hidden fixture prompt|Private fixture chat|Private Project/);
});

test('W660A2 event adapter refreshes on existing lifecycle events without starting work', () => {
  const source = baseState();
  const environment = new EventTarget();
  environment.navigator = { onLine: true };
  const documentRef = new EventTarget();
  documentRef.hidden = false;
  const readers = fixtureReaders(source);
  let now = Date.parse('2026-07-19T12:00:00.000Z');
  const refreshReasons = [];
  const adapter = createEonNexusEventAdapter({
    environment,
    document: documentRef,
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
    readers,
    now: () => now,
    onRefresh: (_snapshot, reason) => refreshReasons.push(reason)
  });

  const start = adapter.start();
  assert.equal(start.ok, true);
  assert.equal(adapter.getStatus().started, true);
  assert.equal(adapter.getSnapshot().task.state, 'ready');

  source.taskRecords = [{
    taskId: 'eontask_fixture_123456',
    state: 'running',
    workflowState: 'files',
    updatedAt: '2026-07-19T12:01:00.000Z'
  }];
  source.agentPresence = [{
    role: 'builder',
    status: 'active',
    phase: 'working',
    providerKind: 'guide',
    updatedAt: '2026-07-19T12:01:00.000Z'
  }];
  now += 60_000;
  environment.dispatchEvent(new Event('eon:agent-presence'));

  assert.equal(adapter.getSnapshot().task.state, 'running');
  assert.equal(adapter.getSnapshot().eonbot.state, 'processing');
  assert.equal(adapter.getSnapshot().nodes[0].status, 'active');
  assert.equal(refreshReasons.includes('eon:agent-presence'), true);

  source.proposals = [{ id: 'eonprop_fixture_12345678', status: 'reviewing', route: '/workspace' }];
  now += 60_000;
  environment.dispatchEvent(new Event('eon:review-inbox-state-changed'));
  assert.equal(adapter.getSnapshot().approval.pending, true);
  assert.equal(adapter.getSnapshot().eonbot.state, 'waiting-approval');

  adapter.stop();
  assert.equal(adapter.getStatus().started, false);
  adapter.dispose();
  assert.equal(adapter.getStatus().disposed, true);
});

test('W660A2 event adapter truth prohibits operational side effects', () => {
  const truth = getEonNexusEventAdapterTruth();
  assert.equal(truth.startsAiWork, false);
  assert.equal(truth.startsVoiceCapture, false);
  assert.equal(truth.callsProvider, false);
  assert.equal(truth.approvesAction, false);
  assert.equal(truth.runsAutomation, false);
  assert.equal(truth.controlsCity, false);
  assert.equal(truth.rendererReceivesRawStores, false);
});
