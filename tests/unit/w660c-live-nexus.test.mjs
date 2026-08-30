import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EON_NEXUS_LIVE_MAX_PRIMARY_NODES,
  getEonNexusLiveTruth,
  getEonNexusLiveViewModel
} from '../../assets/js/nexus/eon-nexus-live.js';
import { createDefaultEonNexusState } from '../../assets/js/nexus/eon-nexus-state-contract.js';
import { getEonNexusChatPulseTruth } from '../../assets/js/nexus/eon-nexus-chat-pulse.js';

const fixedNow = Date.parse('2026-07-19T12:00:00.000Z');

function baseSnapshot() {
  return createDefaultEonNexusState({ now: fixedNow });
}

test('W660C Live Nexus exposes no more than five real primary nodes', () => {
  const nodes = Array.from({ length: 8 }, (_, index) => ({
    id: `role:${index}`,
    kind: 'tool',
    label: `Tool ${index + 1}`,
    status: index === 6 ? 'active' : 'available',
    count: 1,
    providerKind: 'guide'
  }));
  const model = getEonNexusLiveViewModel({ ...baseSnapshot(), nodes });
  assert.equal(EON_NEXUS_LIVE_MAX_PRIMARY_NODES, 5);
  assert.equal(model.primaryNodes.length, 5);
  assert.equal(model.hiddenNodeCount, 3);
  assert.ok(model.primaryNodes.every((node) => nodes.some((source) => source.id === node.id)));
});

test('W660C Live Nexus keeps selected node positions stable across refreshes', () => {
  const first = getEonNexusLiveViewModel({
    ...baseSnapshot(),
    nodes: [
      { id: 'role:researcher', label: 'Research', status: 'active' },
      { id: 'role:builder', label: 'Build', status: 'available' }
    ]
  });
  const second = getEonNexusLiveViewModel({
    ...baseSnapshot(),
    nodes: [
      { id: 'role:builder', label: 'Build', status: 'failed' },
      { id: 'role:researcher', label: 'Research', status: 'complete' }
    ]
  }, {
    selectedNodeId: 'role:researcher',
    stableNodeOrder: first.stableNodeOrder
  });
  assert.deepEqual(second.primaryNodes.map((node) => node.id), ['role:researcher', 'role:builder']);
  assert.equal(second.selectedNode.id, 'role:researcher');
});

test('W660C Live Nexus labels private local routes only from projected truth', () => {
  const local = getEonNexusLiveViewModel({
    ...baseSnapshot(),
    route: { mode: 'local', providerLabel: 'Ollama', privateOnDevice: true, verified: true }
  });
  assert.equal(local.privateRoute, true);
  assert.match(local.routeLabel, /Private on this device/);

  const hosted = getEonNexusLiveViewModel({
    ...baseSnapshot(),
    route: { mode: 'hosted', providerLabel: 'EONAPP Hosted', privateOnDevice: false, verified: true }
  });
  assert.equal(hosted.privateRoute, false);
  assert.equal(hosted.routeLabel, 'EONAPP Hosted');
});

test('W660C Live Nexus exposes only safe existing routes and observable controls', () => {
  const model = getEonNexusLiveViewModel({
    ...baseSnapshot(),
    conversation: { openRoute: 'javascript:alert(1)' },
    project: { selected: true, label: 'Active project', openRoute: 'https://evil.invalid/project' },
    task: { state: 'running', stageLabel: 'Inspecting files', cancellable: true },
    approval: { pending: true, count: 1, label: '1 approval waiting', reviewRoute: '//evil.invalid/review' },
    results: { count: 2, label: '2 results available', openRoute: 'data:text/html,bad' }
  });
  assert.equal(model.conversationRoute, '/');
  assert.equal(model.projectRoute, '/projects');
  assert.equal(model.reviewRoute, '/workspace');
  assert.equal(model.resultRoute, '/workspace');
  assert.equal(model.canStop, true);
  assert.equal(model.reviewVisible, true);
  assert.equal(model.resultVisible, true);
});

test('W660C truth receipt prohibits duplicate stores, hidden execution and heavy renderers', () => {
  const truth = getEonNexusLiveTruth();
  assert.equal(truth.sameStateAdapter, true);
  assert.equal(truth.secondConversationStore, false);
  assert.equal(truth.rawMessageBodyRead, false);
  assert.equal(truth.startsAiWork, false);
  assert.equal(truth.startsVoiceAutomatically, false);
  assert.equal(truth.startsMicrophoneAutomatically, false);
  assert.equal(truth.approvesActionAutomatically, false);
  assert.equal(truth.rendersFakeAgents, false);
  assert.equal(truth.rendersFakeProgress, false);
  assert.equal(truth.maximumPrimaryNodes, 5);
  assert.equal(truth.gesturesHaveButtonEquivalents, true);
  assert.equal(truth.desktopWheelZoom, true);
  assert.deepEqual(truth.boundedZoom, { minimum: 0.78, maximum: 1.18 });
  assert.equal(truth.requiresCanvas, false);
  assert.equal(truth.requiresWebGl, false);
  assert.equal(truth.requiresBabylon, false);
  assert.equal(truth.requiresGlb, false);

  const chatTruth = getEonNexusChatPulseTruth();
  assert.equal(chatTruth.liveNexusUsesSameAdapter, true);
  assert.equal(chatTruth.liveNexusLazyLoaded, true);
});
