import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W749_LIVING_NEXUS_SCHEMA,
  EON_CITY_W749_RING_IDS,
  EON_CITY_W749_VIEW_EVENT,
  createEonCityW749LivingNexus,
  projectEonCityW749LivingNexusView,
  validateEonCityW749LivingNexusContract
} from '../../assets/js/city/w749/eon-city-w749-living-nexus.js';
import { getEonWorkSurfaceDefinition, normalizeEonWorkSurfaceInvocation } from '../../assets/js/work-surface/eon-work-surface-registry.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

class FakeCustomEvent extends Event {
  constructor(type, options = {}) {
    super(type);
    this.detail = options.detail;
  }
}

class FakeNode {
  constructor(name) {
    this.name = name;
    this.position = { x: 0, y: 0, z: 0, set: (x = 0, y = 0, z = 0) => Object.assign(this.position, { x, y, z }) };
    this.rotation = { x: 0, y: 0, z: 0, set: (x = 0, y = 0, z = 0) => Object.assign(this.rotation, { x, y, z }) };
    this.scaling = { x: 1, y: 1, z: 1, setAll: (value = 1) => Object.assign(this.scaling, { x: value, y: value, z: value }) };
    this.visibility = 1;
    this.enabled = true;
    this.disposed = false;
  }
  setEnabled(value) { this.enabled = Boolean(value); }
  dispose() { this.disposed = true; }
}

class FakeTransformNode extends FakeNode {}
const FakeMeshBuilder = Object.freeze({
  CreateCylinder: (name) => new FakeNode(name),
  CreateTorus: (name) => new FakeNode(name),
  CreateSphere: (name) => new FakeNode(name),
  CreatePolyhedron: (name) => new FakeNode(name)
});

function sourceSnapshot(overrides = {}) {
  return {
    updatedAt: new Date(749_000).toISOString(),
    eonbot: { state: 'processing', statusLabel: 'Processing' },
    project: { id: 'project:749', label: 'Command Core', selected: true, taskCount: 3, artefactCount: 2 },
    task: { id: 'task:749', label: 'Build central Nexus', state: 'running', stageLabel: 'Projecting bounded state' },
    approval: { pending: false, count: 0, label: 'No approval waiting' },
    results: { count: 2, unread: 1, label: 'Two verified results' },
    route: { mode: 'local', providerLabel: 'Local runtime', verified: true },
    connection: { state: 'available', label: 'Connected' },
    nodes: [{ id: 'local', status: 'available' }, { id: 'provider', status: 'selected' }],
    ...overrides
  };
}

test('W749 defines one bounded six-ring Living Nexus projection with no second state owner', () => {
  const validation = validateEonCityW749LivingNexusContract();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(validation.schema, EON_CITY_W749_LIVING_NEXUS_SCHEMA);
  assert.equal(validation.ringCount, 6);

  const view = projectEonCityW749LivingNexusView({ snapshot: sourceSnapshot(), now: 749_000 });
  assert.deepEqual(view.rings.map((entry) => entry.id), EON_CITY_W749_RING_IDS);
  assert.equal(view.truth.ownsProductState, false);
  assert.equal(view.truth.ownsConversation, false);
  assert.equal(view.truth.ownsProjectStore, false);
  assert.equal(view.truth.ownsTaskStore, false);
  assert.equal(view.truth.ownsMissionStore, false);
  assert.equal(view.truth.ownsRenderLoop, false);
  assert.equal(view.truth.fakePercentages, false);
  assert.equal(view.rings.find((entry) => entry.id === 'project')?.total, 0);
  assert.equal(view.rings.find((entry) => entry.id === 'task')?.total, 0);
  assert.equal(view.rings.find((entry) => entry.id === 'approval')?.total, 0);
  assert.equal(view.rings.find((entry) => entry.id === 'results')?.total, 0);
  assert.equal('ratio' in view.rings[0], false);
  assert.equal(view.privacy.providerCredentials, false);
  assert.equal(view.privacy.rawProjectContents, false);
});

test('W749 projects real readiness, approval, mission and offline changes without leaking unknown private fields', () => {
  const secret = 'RAW_PRIVATE_PROMPT_SHOULD_NEVER_APPEAR';
  const ready = projectEonCityW749LivingNexusView({
    snapshot: { ...sourceSnapshot(), rawPrompt: secret, project: { ...sourceSnapshot().project, privateContents: secret } },
    missions: [{ localState: 'opened' }, { localState: 'available' }],
    now: 749_000
  });
  assert.equal(ready.state, 'processing');
  assert.equal(ready.missions.progressed, 1);
  assert.equal(ready.missions.total, 2);
  assert.equal(ready.missions.completionClaimed, false);
  assert.equal(ready.missions.xpActive, false);
  assert.doesNotMatch(JSON.stringify(ready), new RegExp(secret));

  const approval = projectEonCityW749LivingNexusView({
    snapshot: sourceSnapshot({
      eonbot: { state: 'waiting-approval', statusLabel: 'Waiting for approval' },
      approval: { pending: true, count: 2, label: 'Two approvals waiting' }
    }),
    now: 749_000
  });
  assert.equal(approval.state, 'waiting-approval');
  assert.equal(approval.approval.pending, true);
  assert.equal(approval.rings.find((entry) => entry.id === 'approval')?.warning, true);
  assert.match(approval.summary, /approval/i);

  const offline = projectEonCityW749LivingNexusView({
    snapshot: sourceSnapshot({
      eonbot: { state: 'offline', statusLabel: 'Offline' },
      connection: { state: 'disconnected', label: 'Offline' }
    }),
    now: 2_000_000
  });
  assert.equal(offline.state, 'offline');
  assert.equal(offline.connection.offline, true);
  assert.equal(offline.freshness.state, 'expired');
  assert.equal(offline.rings.find((entry) => entry.id === 'systems')?.failed, true);
});

test('W749 carries only the bounded W686 selected work-object continuity receipt', () => {
  const view = projectEonCityW749LivingNexusView({
    snapshot: sourceSnapshot(),
    continuity: {
      workObjectHandoff: {
        handoffId: 'handoff:749',
        placement: { reason: 'Continue this reviewed work at the Forge.' },
        workObject: {
          id: 'tool:creator-capture', kind: 'tool', label: 'Creator Capture', status: 'available',
          stationId: 'share-capture', placementRole: 'capture-tool', placementReason: 'Continue the reviewed capture flow.'
        }
      }
    },
    now: 749_000
  });
  assert.equal(view.workObject.present, true);
  assert.equal(view.workObject.id, 'tool:creator-capture');
  assert.equal(view.workObject.stationId, 'share-capture');
  assert.equal(view.workObject.explicitUserActionRequired, true);
  assert.equal(view.workObject.autoNavigate, false);
  assert.equal(view.workObject.autoExecute, false);
  assert.equal(view.rings.find((entry) => entry.id === 'project')?.active, true);
});

test('W749 Babylon presenter emits one shared view event per source refresh and disposes only its own graph', () => {
  const environment = new EventTarget();
  environment.CustomEvent = FakeCustomEvent;
  let snapshot = sourceSnapshot();
  const listeners = new Set();
  let refreshCalls = 0;
  let disposed = false;
  const eventAdapter = {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    start() { for (const listener of listeners) listener(snapshot); return { ok: true }; },
    refresh() {
      refreshCalls += 1;
      snapshot = { ...snapshot, updatedAt: new Date(749_000 + refreshCalls).toISOString() };
      for (const listener of listeners) listener(snapshot);
      return { ok: true, state: snapshot };
    },
    dispose() { disposed = true; listeners.clear(); }
  };
  const events = [];
  environment.addEventListener(EON_CITY_W749_VIEW_EVENT, (event) => events.push(event.detail));
  const sharedMaterial = { id: 'shared-world-material', disposed: false };
  const stationRoot = new FakeTransformNode('station-root');
  stationRoot.position.set(0, 0, -2.5);
  const controller = createEonCityW749LivingNexus({
    scene: {}, stationRecord: { root: stationRoot }, MeshBuilder: FakeMeshBuilder,
    TransformNode: FakeTransformNode, Vector3: class {},
    materials: { stationBase: sharedMaterial, structure: sharedMaterial, signal: sharedMaterial, cyan: sharedMaterial, glass: sharedMaterial, warm: sharedMaterial },
    eventAdapter, environment, now: () => 749_000, reducedMotion: () => false
  });
  assert.equal(controller.ok, true);
  assert.equal(events.length, 1);
  assert.equal(events[0].view.schema, EON_CITY_W749_LIVING_NEXUS_SCHEMA);

  controller.refresh('test-refresh');
  assert.equal(refreshCalls, 1);
  assert.equal(events.length, 2);
  const inspection = controller.inspectRing('approval');
  assert.equal(inspection.ok, true);
  assert.equal(controller.getSelectedRing(), 'approval');
  assert.equal(events.length, 3);
  controller.update(749_000);
  const orbit = controller.getCompanionOrbitTarget(7.49);
  assert.ok(Number.isFinite(orbit.x) && Number.isFinite(orbit.y) && Number.isFinite(orbit.z));

  controller.dispose();
  assert.equal(disposed, true);
  assert.equal(controller.root.disposed, true);
  assert.equal(sharedMaterial.disposed, false);
});


test('W749 keeps bounded guide mode alive when source, continuity or mission readers fail', () => {
  const environment = new EventTarget();
  environment.CustomEvent = FakeCustomEvent;
  const statuses = [];
  const controller = createEonCityW749LivingNexus({
    scene: {},
    stationRecord: { root: new FakeTransformNode('station-root') },
    MeshBuilder: FakeMeshBuilder,
    TransformNode: FakeTransformNode,
    Vector3: class {},
    materials: {},
    eventAdapter: {
      getSnapshot() { throw new Error('source unavailable'); },
      subscribe() { throw new Error('subscription unavailable'); },
      start() { throw new Error('start unavailable'); },
      refresh() { throw new Error('refresh unavailable'); },
      dispose() {}
    },
    readContinuity() { throw new Error('storage denied'); },
    getMissions() { throw new Error('mission store denied'); },
    environment,
    now() { throw new Error('clock unavailable'); },
    onStatus: (message) => statuses.push(message)
  });

  assert.equal(controller.ok, true);
  assert.equal(controller.getView().schema, EON_CITY_W749_LIVING_NEXUS_SCHEMA);
  assert.equal(controller.getView().workObject.present, false);
  assert.equal(controller.getView().missions.total, 0);
  assert.equal(controller.getView().truth.ownsProductState, false);
  assert.doesNotThrow(() => controller.refresh('reader-failure'));
  assert.ok(statuses.some((message) => /guide mode/i.test(message)));
  assert.ok(statuses.some((message) => /refresh failed/i.test(message)));
  controller.dispose();
});

test('W749 source integrates the 3D hero, Nexus Dock, ring inspection, freshness and release gates', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const contract = read('assets/js/city/w731/eon-city-w731-command-hub-contract.js');
  const nexus = read('assets/js/city/w749/eon-city-w749-living-nexus.js');
  const adapter = read('assets/js/work-surface/adapters/eon-nexus-panel.js');
  const registry = read('assets/js/contracts/work-surface/eon-work-surface-registry.js');
  const host = read('assets/js/work-surface/eon-work-surface-host.js');
  const css = read('assets/css/eon-work-surface.css');
  const sw = read('sw.js');
  const publicSw = read('public/sw.js');
  const build = read('scripts/build-production.mjs');

  const definition = getEonWorkSurfaceDefinition('nexus');
  assert.equal(definition.adapter, '/assets/js/work-surface/adapters/eon-nexus-panel.js');
  assert.equal(normalizeEonWorkSurfaceInvocation({ id: 'nexus', presentationMode: 'dock', context: { cityPresentation: true } }).id, 'nexus');

  assert.match(contract, /id: 'eonbot-nexus'.*surface: 'nexus'/);
  assert.match(runtime, /createEonNexusCityProjectionAdapter/);
  assert.match(runtime, /readEonNexusCityContinuityProjection/);
  assert.match(runtime, /createEonCityW749LivingNexus/);
  assert.match(runtime, /resolveEonCityR04MeshInteraction\(pickedMesh\)/);
  assert.match(runtime, /const nexusRingId = String\(resolved\.nexusRingId/);
  assert.match(runtime, /refreshLivingNexus/);
  assert.match(runtime, /inspectLivingNexusRing/);
  assert.match(runtime, /livingNexus\.update/);
  assert.match(runtime, /livingNexus\.dispose/);
  assert.match(runtime, /station\.id === 'eonbot-nexus' \? 'nexus'/);
  assert.match(nexus, /privacyShield/);
  assert.match(nexus, /getCompanionOrbitTarget/);
  assert.match(nexus, /setPresentationEnabled/);
  assert.match(nexus, /isPresentationEnabled/);
  assert.match(nexus, /ownsProductState: false/);
  assert.match(adapter, /EON_CITY_W749_VIEW_EVENT/);
  assert.match(adapter, /data-eon-nexus-ring/);
  assert.match(registry, /id: 'nexus'/);
  assert.match(host, /eon-nexus-panel\.js/);
  assert.match(css, /\.eon-nexus-dock/);
  assert.match(css, /orientation:landscape/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(sw, /RELEASE_ID = 'w765-2026-07-31-release-identity-source-template'/);
  assert.equal(publicSw, sw);
  assert.match(build, /eon\.city\.living-nexus\.w749\.v1/);
});
