import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEonNexusPrivacyProjectedState,
  deriveNexusEonbotState,
  getEonNexusPrivacyProjectionTruth,
  projectNexusApproval,
  projectNexusConversation,
  projectNexusNodes,
  projectNexusProject,
  projectNexusResults,
  projectNexusRoute
} from '../../assets/js/nexus/eon-nexus-privacy-projection.js';
import { getEonNexusCapability, getEonNexusCapabilityTruth } from '../../assets/js/nexus/eon-nexus-capability.js';

const fixedNow = Date.parse('2026-07-19T12:00:00.000Z');

test('W660A2 conversation and project names remain redacted until explicitly opened', () => {
  const thread = {
    id: 'chat_private_1',
    title: 'Secret acquisition plan',
    messages: [{ role: 'user', text: 'private text' }],
    updatedAt: '2026-07-19T11:59:00.000Z'
  };
  const activeContext = { projectId: 'project_private_1', projectTitle: 'Private Launch', route: '/forge' };
  const project = { id: 'project_private_1', title: 'Private Launch', status: 'active', tasks: [{ id: 't1' }], artifacts: [{ id: 'a1' }] };

  const closedConversation = projectNexusConversation(thread);
  const openedConversation = projectNexusConversation(thread, { detailsOpened: true });
  assert.equal(closedConversation.label, 'Private conversation');
  assert.equal(openedConversation.label, 'Secret acquisition plan');
  assert.equal(closedConversation.messageCount, 1);

  const closedProject = projectNexusProject(activeContext, project);
  const openedProject = projectNexusProject(activeContext, project, { detailsOpened: true });
  assert.equal(closedProject.label, 'Active project');
  assert.equal(openedProject.label, 'Private Launch');
  assert.equal(closedProject.taskCount, 1);
  assert.equal(closedProject.artefactCount, 1);
});

test('W660A2 local shield truth requires a verified local route', () => {
  const localReady = projectNexusRoute({
    ready: true,
    providerId: 'ollama',
    providerLabel: 'Ollama',
    runtimeType: 'local'
  });
  const localUnverified = projectNexusRoute({
    ready: false,
    providerId: 'ollama',
    providerLabel: 'Ollama',
    runtimeType: 'local'
  });
  const direct = projectNexusRoute({
    ready: true,
    providerId: 'groq',
    providerLabel: 'Groq',
    runtimeType: 'hosted'
  });

  assert.equal(localReady.mode, 'local');
  assert.equal(localReady.privateOnDevice, true);
  assert.equal(localUnverified.privateOnDevice, false);
  assert.equal(direct.mode, 'direct-provider');
  assert.equal(direct.privateOnDevice, false);
});

test('W660A2 approval and presence projections distinguish waiting, active and complete', () => {
  const approval = projectNexusApproval({
    proposals: [{ id: 'proposal_1', status: 'reviewing', route: '/vault' }],
    reviewItems: [{ id: 'review_1', route: '/workspace' }]
  });
  assert.equal(approval.pending, true);
  assert.equal(approval.count, 2);
  assert.equal(approval.reviewRoute, '/vault');

  const nodes = projectNexusNodes([
    { role: 'researcher', status: 'active', phase: 'working', providerKind: 'cloud', updatedAt: '2026-07-19T11:55:00.000Z' },
    { role: 'builder', status: 'waiting', phase: 'waiting-approval', providerKind: 'local', updatedAt: '2026-07-19T11:56:00.000Z' },
    { role: 'reviewer', status: 'complete', phase: 'complete', updatedAt: '2026-07-19T11:54:00.000Z' }
  ]);
  assert.equal(nodes.find((node) => node.kind === 'researcher').status, 'active');
  assert.equal(nodes.find((node) => node.kind === 'builder').status, 'waiting');
  assert.equal(nodes.find((node) => node.kind === 'reviewer').status, 'complete');
});

test('W660A2 EONBOT state priority represents real listening, approval, work and failure', () => {
  assert.equal(deriveNexusEonbotState({ voiceState: { isListening: true } }), 'listening');
  assert.equal(deriveNexusEonbotState({ approval: { pending: true }, task: { state: 'running' } }), 'waiting-approval');
  assert.equal(deriveNexusEonbotState({ chatState: { pending: true }, task: { state: 'ready' } }), 'processing');
  assert.equal(deriveNexusEonbotState({ task: { state: 'failed' } }), 'error');
  assert.equal(deriveNexusEonbotState({ connection: { state: 'disconnected' } }), 'offline');
});

test('W660A2 complete projected snapshot excludes raw private and credential fields', () => {
  const snapshot = buildEonNexusPrivacyProjectedState({
    thread: {
      id: 'chat_1',
      title: 'Private title',
      messages: [{ role: 'user', text: 'raw secret conversation body' }]
    },
    activeProjectContext: {
      projectId: 'project_1',
      projectTitle: 'Private Project',
      outcome: 'Private outcome',
      route: '/projects'
    },
    project: {
      id: 'project_1',
      title: 'Private Project',
      summary: 'Sensitive project summary',
      tasks: [{ id: 'task_1' }],
      artifacts: [{ id: 'artifact_1', title: 'private-file.txt' }]
    },
    readiness: {
      ready: true,
      providerId: 'groq',
      providerLabel: 'Groq',
      runtimeType: 'hosted',
      apiKey: 'gsk_should_never_appear',
      endpoint: 'https://private.invalid'
    },
    taskRecords: [{
      taskId: 'eontask_123456789012',
      state: 'completed',
      title: 'Private task title',
      artifactIds: ['eonart_123456789012'],
      updatedAt: '2026-07-19T11:59:00.000Z'
    }],
    now: fixedNow
  });

  const serialized = JSON.stringify(snapshot);
  assert.equal(snapshot.conversation.label, 'Private conversation');
  assert.equal(snapshot.project.label, 'Active project');
  assert.equal(snapshot.results.count, 1);
  assert.equal(snapshot.results.unread, 0);
  assert.doesNotMatch(serialized, /raw secret conversation body|Sensitive project summary|private-file\.txt|gsk_should_never_appear|private\.invalid|Private task title/);

  const truth = getEonNexusPrivacyProjectionTruth();
  assert.equal(truth.providerCredential, false);
  assert.equal(truth.privateFilename, false);
  assert.equal(truth.unreadResultsInvented, false);
});

test('W660A2 capability recommendation always retains a static fallback and pauses hidden rendering', () => {
  const staticMode = getEonNexusCapability({
    environment: {},
    reducedMotion: true,
    userPreference: 'auto'
  });
  assert.equal(staticMode.recommendedMode, 'static');
  assert.equal(staticMode.renderActive, false);
  assert.equal(staticMode.staticFallbackAvailable, true);

  const hidden = getEonNexusCapability({
    environment: {
      HTMLCanvasElement: function Canvas() {},
      WebGL2RenderingContext: function WebGL2() {},
      navigator: { deviceMemory: 16, hardwareConcurrency: 16 },
      document: { hidden: true }
    }
  });
  assert.equal(hidden.hidden, true);
  assert.equal(hidden.renderActive, false);
  assert.equal(hidden.requiresBabylon, false);
  assert.equal(hidden.requiresGlb, false);

  const truth = getEonNexusCapabilityTruth();
  assert.equal(truth.createsRenderingContext, false);
  assert.equal(truth.pulseRequiresBabylon, false);
});

test('W660A2 results never invent unread state without a read receipt', () => {
  const results = projectNexusResults({ artifactIds: ['a', 'b'], state: 'completed' });
  assert.equal(results.count, 2);
  assert.equal(results.unread, 0);
});
