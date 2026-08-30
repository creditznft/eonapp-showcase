import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  EON_NEXUS_W668_MAX_NODES,
  getEonNexusW668FlagshipTruth,
  projectEonNexusW668FlagshipState
} from '../../assets/js/nexus/w668/eon-nexus-w668-flagship-state.js';
import { getEonNexusPulseViewModel } from '../../assets/js/nexus/eon-nexus-pulse.js';
import { getEonNexusLiveViewModel } from '../../assets/js/nexus/eon-nexus-live.js';
import { projectEonCityW660nNexusView } from '../../assets/js/city/w660n/eon-city-w660n-nexus-continuity.js';

const snapshot = Object.freeze({
  eonbot: { state: 'processing', statusLabel: 'Mapping the next verified step' },
  conversation: { id: 'conversation-7', label: 'Private conversation', openRoute: '/?thread=conversation-7' },
  project: { selected: true, id: 'project-eoncity', label: 'EONCITY', status: 'active', openRoute: '/projects' },
  task: { id: 'task-668', state: 'running', stageLabel: 'Building flagship continuity', cancellable: true },
  route: { mode: 'local', providerLabel: 'Local AI', privateOnDevice: true, verified: true },
  approval: { pending: false, count: 0 },
  results: { count: 2, label: '2 verified results', openRoute: '/workspace' },
  connection: { state: 'available' },
  surface: { label: 'Projects', route: '/projects', focusNodeId: 'project' },
  nodes: [
    { id: 'project', kind: 'project', label: 'EONCITY', status: 'selected', count: 1 },
    { id: 'task', kind: 'task', label: 'Current task', status: 'active', count: 1 },
    { id: 'results', kind: 'results', label: 'Results', status: 'complete', count: 2 },
    { id: 'agents', kind: 'agents', label: 'Agents', status: 'available', count: 1 },
    { id: 'approval', kind: 'approval', label: 'Approval', status: 'available', count: 0 },
    { id: 'overflow', kind: 'tool', label: 'Overflow', status: 'available', count: 1 }
  ]
});

function source(path) {
  return fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
}

test('W668 keeps one continuity identity while morphing Pulse, Expanded and Spatial forms', () => {
  const pulse = projectEonNexusW668FlagshipState(snapshot, { surface: 'pulse' });
  const expanded = projectEonNexusW668FlagshipState(snapshot, { surface: 'expanded' });
  const spatial = projectEonNexusW668FlagshipState(snapshot, { surface: 'spatial' });

  assert.equal(pulse.continuityId, expanded.continuityId);
  assert.equal(expanded.continuityId, spatial.continuityId);
  assert.equal(pulse.morphSignature, expanded.morphSignature);
  assert.equal(expanded.morphSignature, spatial.morphSignature);
  assert.equal(pulse.state, 'processing');
  assert.equal(pulse.accent, expanded.accent);
  assert.equal(expanded.accent, spatial.accent);
  assert.deepEqual(pulse.nodes.map((node) => node.id), expanded.nodes.map((node) => node.id));
  assert.deepEqual(expanded.nodes.map((node) => node.id), spatial.nodes.map((node) => node.id));
  assert.equal(pulse.detailLevel, 'signal');
  assert.equal(expanded.detailLevel, 'workspace');
  assert.equal(spatial.detailLevel, 'world');
  assert.ok(pulse.coreScale < expanded.coreScale);
  assert.ok(expanded.coreScale < spatial.coreScale);
});

test('W668 caps the flagship field at five meaningful stable nodes', () => {
  const first = projectEonNexusW668FlagshipState(snapshot, { surface: 'expanded' });
  const second = projectEonNexusW668FlagshipState(snapshot, { surface: 'expanded', stableNodeOrder: first.stableNodeOrder });

  assert.equal(first.nodes.length, EON_NEXUS_W668_MAX_NODES);
  assert.equal(first.hiddenNodeCount, 1);
  assert.deepEqual(first.nodes.map((node) => node.id), second.nodes.map((node) => node.id));
  assert.deepEqual(first.nodes.map((node) => node.displayAngleDeg), second.nodes.map((node) => node.displayAngleDeg));
  assert.ok(first.nodes.every((node) => Number.isFinite(node.displayAngleDeg)));
  assert.ok(first.nodes.every((node) => node.orbitRadius >= 0.78 && node.orbitRadius <= 0.86));
  assert.equal(first.attentionNodeId, 'project');
});

test('W668 visibly differentiates real EONBOT states without inventing work', () => {
  const ready = projectEonNexusW668FlagshipState({ ...snapshot, eonbot: { state: 'ready' }, task: {}, results: { count: 0 }, nodes: [] });
  const approval = projectEonNexusW668FlagshipState({ ...snapshot, eonbot: { state: 'ready' }, approval: { pending: true, count: 1 } });
  const error = projectEonNexusW668FlagshipState({ ...snapshot, connection: { state: 'error' } });
  const offline = projectEonNexusW668FlagshipState({ ...snapshot, connection: { state: 'unavailable' } });

  assert.equal(ready.state, 'ready');
  assert.equal(approval.shape, 'decision-gate');
  assert.equal(error.shape, 'fractured-signal');
  assert.equal(offline.shape, 'dormant-core');
  assert.notEqual(approval.accent, error.accent);
  assert.ok(error.energy > ready.energy);
  for (const model of [ready, approval, error, offline]) {
    assert.equal(model.startsAiWork, false);
    assert.equal(model.startsVoiceCapture, false);
    assert.equal(model.autoNavigation, false);
    assert.equal(model.autoApproval, false);
    assert.equal(model.privateContentRead, false);
  }
});

test('W668 feeds the same flagship projection into Pulse, Expanded Nexus and City continuity', () => {
  const pulse = getEonNexusPulseViewModel(snapshot);
  const expanded = getEonNexusLiveViewModel(snapshot);
  const city = projectEonCityW660nNexusView({ snapshot, districtId: 'orientation-hall' });

  assert.equal(pulse.flagship.continuityId, expanded.flagship.continuityId);
  assert.equal(expanded.flagship.continuityId, city.flagship.continuityId);
  assert.equal(pulse.flagship.shape, expanded.flagship.shape);
  assert.equal(expanded.flagship.shape, city.flagship.shape);
  assert.equal(city.autoNavigation, false);
  assert.equal(city.startsAiWork, false);
});

test('W668 integration sources expose the same visual contract without a second assistant or store', () => {
  const pulseSource = source('assets/js/nexus/eon-nexus-pulse.js');
  const liveSource = source('assets/js/nexus/eon-nexus-live.js');
  const livingSource = source('assets/js/nexus/eon-nexus-living-core.js');
  const citySource = source('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const pulseCss = source('assets/css/eon-nexus-pulse.css');
  const liveCss = source('assets/css/eon-nexus-live.css');
  const spatialCss = source('assets/css/eon-nexus-living-core.css');

  for (const js of [pulseSource, liveSource, livingSource]) {
    assert.match(js, /projectEonNexusW668FlagshipState/);
    assert.match(js, /eonNexusShape|dataset\.shape/);
    assert.match(js, /--eon-nexus-accent/);
  }
  assert.match(livingSource, /surface: 'spatial'/);
  assert.match(citySource, /data-eon-w660n-nexus-shape/);
  assert.match(citySource, /same light, topology and node identity/i);
  for (const css of [pulseCss, liveCss, spatialCss]) {
    assert.match(css, /W668/);
    assert.match(css, /--eon-nexus-accent/);
  }

  const truth = getEonNexusW668FlagshipTruth();
  assert.deepEqual(truth.surfaces, ['pulse', 'expanded', 'spatial']);
  assert.equal(truth.secondAssistant, false);
  assert.equal(truth.secondProjectStore, false);
  assert.equal(truth.automaticWork, false);
});
