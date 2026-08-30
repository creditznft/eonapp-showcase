import test from 'node:test';
import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';

import {
  EON_CITY_W660_NEXUS_STATIONS,
  validateEonCityW660NexusStations
} from '../../assets/js/city/w660/eon-city-w660-nexus-stations.js';
import {
  EON_CITY_W660_NEXUS_VISIBILITY_RADIUS,
  createEonCityW660NexusHologram
} from '../../assets/js/city/w660/eon-city-w660-nexus-hologram.js';
import {
  getEonCityW660nNexusContinuityTruth,
  projectEonCityW660nNexusView
} from '../../assets/js/city/w660n/eon-city-w660n-nexus-continuity.js';
import {
  EON_NEXUS_PAGE_CONTEXTS,
  getEonNexusAppShellTruth,
  getEonNexusPageContext,
  projectEonNexusPageSnapshot,
  shouldInstallEonNexusAppShell
} from '../../assets/js/nexus/eon-nexus-app-shell.js';

function sharedSnapshot(overrides = {}) {
  return {
    eonbot: { state: 'waiting-approval', statusLabel: 'Review required', canListen: true },
    conversation: { openRoute: '/?conversation=city-continuity' },
    route: { mode: 'local', privateOnDevice: true, providerLabel: 'Local AI' },
    project: { selected: true, label: 'EONCITY W660N', status: 'active', openRoute: '/projects?project=w660n', taskCount: 4, artefactCount: 3 },
    task: { id: 'task-1', label: 'Nexus integration', stageLabel: 'Validation', cancellable: true },
    approval: { pending: true, count: 2, label: 'Two changes need review', reviewRoute: '/workspace?review=w660n' },
    results: { count: 3, unread: 1, label: 'Three verified results', openRoute: '/workspace?results=w660n' },
    connection: { state: 'available', label: 'Connected' },
    nodes: [
      { id: 'role:forge', kind: 'forge', status: 'working', count: 2 },
      { id: 'role:projects', kind: 'projects', status: 'available', count: 1 }
    ],
    ...overrides
  };
}

function documentFor(page, shell = true) {
  return { body: { dataset: { eonAppShell: shell ? '1' : '0', eonAppPage: page } } };
}

function standaloneDocumentFor(page) {
  return { body: { dataset: { eonNexusShell: '1', eonAppPage: page } } };
}

function fakeAdapter(snapshot) {
  const listeners = new Set();
  let current = snapshot;
  return {
    getSnapshot: () => current,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    start: () => ({ ok: true }),
    emit(next) { current = next; for (const listener of listeners) listener(current); },
    dispose() {}
  };
}

test('W660N projects the same Chat, project, task, approval and results into a nearby City orb', () => {
  const station = EON_CITY_W660_NEXUS_STATIONS.find((entry) => entry.id === 'forge-workflow-nexus');
  const view = projectEonCityW660nNexusView({
    snapshot: sharedSnapshot(),
    station,
    distance: 1.4,
    districtId: station.districtId,
    stationActionsAvailable: true
  });

  assert.equal(view.state, 'waiting-approval');
  assert.equal(view.privateRoute, true);
  assert.equal(view.project.selected, true);
  assert.equal(view.project.label, 'EONCITY W660N');
  assert.equal(view.task.stageLabel, 'Validation');
  assert.equal(view.approval.count, 2);
  assert.equal(view.results.count, 3);
  assert.equal(view.station.inRange, true);
  assert.ok(view.actions.some((entry) => entry.id === 'nexus-continue-chat' && entry.route === '/?conversation=city-continuity'));
  assert.ok(view.actions.some((entry) => entry.id === 'nexus-current-project' && entry.route === '/projects?project=w660n'));
  assert.ok(view.actions.some((entry) => entry.id === 'nexus-review-approval' && entry.route === '/workspace?review=w660n'));
  assert.ok(view.actions.some((entry) => entry.id === 'nexus-open-results' && entry.route === '/workspace?results=w660n'));
  assert.ok(view.actions.some((entry) => entry.source === 'physical-city-station'));
  assert.ok(view.actions.every((entry) => entry.reviewRequired && entry.explicitUserAction && !entry.autoExecute && !entry.autoNavigate));
});

test('W660N keeps physical district actions locked until the player approaches the hologram', () => {
  const station = EON_CITY_W660_NEXUS_STATIONS[0];
  const view = projectEonCityW660nNexusView({
    snapshot: sharedSnapshot(),
    station,
    distance: 8.7,
    districtId: station.districtId,
    stationActionsAvailable: false
  });
  assert.equal(view.station.inRange, false);
  assert.match(view.station.interactionLabel, /Approach/i);
  assert.equal(view.actions.some((entry) => entry.source === 'physical-city-station'), false);
  assert.ok(view.actions.some((entry) => entry.id === 'nexus-continue-chat'));
});

test('W660N renders nine readable district landmarks from one shared adapter and no second loop', () => {
  const validation = validateEonCityW660NexusStations();
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(validation.count, 9);
  assert.ok(EON_CITY_W660_NEXUS_VISIBILITY_RADIUS >= 10);

  const engine = new NullEngine();
  const scene = new Scene(engine);
  const adapter = fakeAdapter(sharedSnapshot());
  const layer = createEonCityW660NexusHologram({ scene, adapter, quality: 'cinematic', reducedMotion: false, environment: {} });
  assert.equal(layer.start().stationCount, 9);
  const station = EON_CITY_W660_NEXUS_STATIONS[0];
  const nearest = layer.update({ x: station.position.x, z: station.position.z }, 0.016);
  const summary = layer.getSummary();
  assert.equal(nearest.station.id, station.id);
  assert.equal(nearest.inRange, true);
  assert.equal(summary.stationCount, 9);
  assert.ok(summary.visibleStationIds.includes(station.id));
  assert.equal(summary.approvalPending, true);
  assert.equal(summary.privateOnDevice, true);
  assert.equal(summary.projectSelected, true);
  assert.equal(summary.resultCount, 3);
  assert.equal(summary.ownsRenderLoop, false);
  assert.equal(summary.secondCanvas, false);
  assert.match(summary.visualProfile, /state-rings/);
  layer.dispose();
  scene.dispose();
  engine.dispose();
});


test('W660N lets EONBOT visibly acknowledge a waiting Nexus approval without executing it', async () => {
  const { createEonCityW660mExperienceDirector } = await import('../../assets/js/city/w660m/eon-city-w660m-experience-director.js');
  const director = createEonCityW660mExperienceDirector({ quality: 'balanced' });
  const snapshot = director.update({
    moving: false,
    playerPosition: { x: 0, y: 0, z: 0 },
    currentDistrictId: 'orientation-hall',
    nearby: { type: 'nexus', id: 'orientation-nexus-guide', position: { x: 1, y: 0, z: 0 } },
    nexusState: 'waiting-approval',
    nexusApprovalPending: true,
    nexusProjectSelected: true
  });
  assert.equal(snapshot.companionMode, 'observe');
  assert.equal(snapshot.nexusState, 'waiting-approval');
  assert.equal(snapshot.nexusApprovalPending, true);
  assert.equal(snapshot.nexusProjectSelected, true);
  assert.equal(snapshot.startsAiWork, false);
  assert.equal(snapshot.opensRoutes, false);
});

test('W660N gives every application-shell route an intentional page role and refuses unknown routes', () => {
  const expected = ['forge', 'projects', 'workspace', 'local-ai', 'library', 'automations', 'vault', 'settings', 'billing', 'create', 'profile', 'eon-keys', 'insights', 'market', 'preview-studio', 'apps', 'realm-studio', 'capsule', 'help', 'support', 'install', 'retired-campaigns'];
  assert.deepEqual(Object.keys(EON_NEXUS_PAGE_CONTEXTS).sort(), expected.sort());
  for (const page of expected) {
    const context = getEonNexusPageContext(page);
    assert.equal(context.id, page);
    assert.ok(context.label);
    assert.ok(context.summary.length > 20);
    assert.equal(shouldInstallEonNexusAppShell({ page, document: documentFor(page) }), true, page);
  }
  assert.equal(getEonNexusPageContext('unknown-product'), null);
  assert.equal(shouldInstallEonNexusAppShell({ page: 'unknown-product', document: documentFor('unknown-product') }), false);
  assert.equal(shouldInstallEonNexusAppShell({ page: 'chat', document: documentFor('chat') }), false);
  assert.equal(shouldInstallEonNexusAppShell({ page: 'eoncity', document: documentFor('eoncity') }), false);
  assert.equal(shouldInstallEonNexusAppShell({ page: 'billing', document: standaloneDocumentFor('billing') }), true);
  assert.equal(shouldInstallEonNexusAppShell({ page: 'support', document: standaloneDocumentFor('support') }), true);
});

test('W660N page projection prioritizes the current product signal without exposing private content', () => {
  const projected = projectEonNexusPageSnapshot(sharedSnapshot(), getEonNexusPageContext('forge'));
  assert.equal(projected.surface.id, 'forge');
  assert.equal(projected.surface.pageSpecific, true);
  assert.equal(projected.nodes[0].kind, 'forge');
  assert.match(projected.surface.summary, /Forge flow/);
  assert.equal(Object.hasOwn(projected.surface, 'conversationText'), false);
  assert.equal(Object.hasOwn(projected.surface, 'projectContent'), false);
});

test('W660N truth contracts preserve one assistant, one selected project and review-first operation', () => {
  const cityTruth = getEonCityW660nNexusContinuityTruth();
  const appTruth = getEonNexusAppShellTruth();
  assert.equal(cityTruth.ninePhysicalStationsUseSharedState, true);
  assert.equal(cityTruth.sameConversation, true);
  assert.equal(cityTruth.sameSelectedProject, true);
  assert.equal(cityTruth.districtActionsRequireProximity, true);
  assert.equal(cityTruth.startsAiWork, false);
  assert.equal(cityTruth.autoNavigation, false);
  assert.equal(appTruth.intentionalPlacementMatrix, true);
  assert.equal(appTruth.unknownShellRoutesDoNotAutoMount, true);
  assert.equal(appTruth.restrainedSupportAndSecurityRoutes, true);
  assert.equal(appTruth.standaloneSupportedPages, true);
  assert.equal(appTruth.secondConversationStore, false);
  assert.equal(appTruth.secondProjectStore, false);
});
