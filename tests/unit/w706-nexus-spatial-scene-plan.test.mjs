import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { buildEonNexusW706SpatialScenePlan, getEonNexusW706SpatialSceneTruth } from '../../assets/js/nexus/w706/eon-nexus-w706-spatial-scene-plan.js';
import { getEonNexusW719SpatialSurface } from '../../assets/js/nexus/w719/eon-nexus-w719-spatial-surface.js';

const snapshot = Object.freeze({
  eonbot: { state: 'processing' },
  conversation: { id: 'c1', label: 'Private conversation', messageCount: 3, openRoute: '/' },
  project: { id: 'p1', selected: true, label: 'Project', status: 'active', taskCount: 2, artefactCount: 1, openRoute: '/projects' },
  task: { id: 't1', label: 'Task', state: 'running', stageLabel: 'Build' },
  approval: { pending: true, count: 1, label: 'Approval', actionId: 'a1' },
  results: { count: 1, label: 'Result', openRoute: '/workspace' },
  route: { mode: 'local', providerLabel: 'Local', privateOnDevice: true },
  connection: { state: 'available' }, atlas: { selected: true }, nodes: []
});

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W706 builds bounded real 3D scene plans for every responsive layout', () => {
  for (const mode of ['compact', 'split', 'full', 'in-world']) {
    const plan = buildEonNexusW706SpatialScenePlan(snapshot, { layoutMode: mode });
    assert.equal(plan.mode, mode);
    assert.equal(plan.primaryRenderer, 'babylon-spatial-command-field');
    assert.ok(plan.objects.length <= plan.layout.maximumObjects);
    assert.ok(plan.objects.every((object) => Number.isFinite(object.position.x) && Number.isFinite(object.position.y) && Number.isFinite(object.position.z)));
    assert.ok(plan.objects.every((object) => object.pickable && object.draggable));
    assert.equal(plan.camera.automaticOrbit, false);
  }
});

test('W706 selected work object becomes the bounded camera target', () => {
  const initial = buildEonNexusW706SpatialScenePlan(snapshot, { layoutMode: 'full' });
  const project = initial.objects.find((object) => object.kind === 'project');
  const selected = buildEonNexusW706SpatialScenePlan(snapshot, { layoutMode: 'full', selectedObjectId: project.id });
  assert.equal(selected.selectedObjectId, project.id);
  assert.deepEqual(selected.camera.target, selected.objects.find((object) => object.id === project.id).position);
  assert.match(selected.camera.authorityKey, new RegExp(project.id));
});

test('W719.13 visible rotate and zoom controls drive the Babylon camera authority', () => {
  const baseline = buildEonNexusW706SpatialScenePlan(snapshot, {
    layoutMode: 'full',
    interactionState: { view: { rotation: 0, zoom: 1 } }
  });
  const changed = buildEonNexusW706SpatialScenePlan(snapshot, {
    layoutMode: 'full',
    interactionState: { view: { rotation: 36, zoom: 1.18 } }
  });
  assert.notEqual(changed.camera.alpha, baseline.camera.alpha);
  assert.ok(changed.camera.radius < baseline.camera.radius);
  assert.notEqual(changed.camera.authorityKey, baseline.camera.authorityKey);
  assert.match(changed.camera.authorityKey, /36:1\.18/);
});

test('W706 relationship geometry uses the same real object identifiers', () => {
  const plan = buildEonNexusW706SpatialScenePlan(snapshot);
  const ids = new Set(plan.objects.map((object) => object.id));
  assert.ok(plan.relations.length > 0);
  assert.ok(plan.relations.every((relation) => ids.has(relation.fromId) && ids.has(relation.toId)));
  assert.ok(plan.relations.every((relation) => relation.pickable === false));
});

test('W706 existing Babylon core consumes the scene plan as primary visual without global auto-spin', () => {
  const source = read('assets/js/nexus/eon-nexus-living-core.js');
  const chat = read('assets/js/nexus/eon-nexus-chat-pulse.js');
  const css = read('assets/css/eon-nexus-living-core.css');
  assert.match(source, /buildEonNexusW706SpatialScenePlan/);
  assert.match(source, /surface\.objects/);
  assert.match(source, /data\.spatialPrimary|dataset\.spatialPrimary/);
  assert.match(chat, /mountEonNexusLivingCore/);
  assert.match(chat, /page: 'chat'/);
  assert.match(source, /root\.rotation\.y = 0/);
  assert.doesNotMatch(source, /root\.rotation\.y = t/);
  assert.match(css, /Babylon is the primary spatial command field/);
  assert.match(css, /data-spatial-renderer='ready'/);
  assert.match(css, /eon-nexus-live__visual-grid \{ z-index:0; opacity:0; visibility:hidden/);
});

test('W719.13 one Babylon authority morphs between expanded NEXUS and Project Atlas', () => {
  const plan = Object.freeze({
    state: 'processing',
    accent: '#a78bfa',
    secondaryAccent: '#22d3ee',
    spatialScene: buildEonNexusW706SpatialScenePlan(snapshot, { layoutMode: 'full' })
  });
  const nexus = getEonNexusW719SpatialSurface(plan, { activeTab: 'conversation' });
  assert.equal(nexus.surface, 'nexus');
  assert.ok(nexus.objects.length > 0);
  assert.equal(nexus.centre.label, 'EON NEXUS');

  const emptyAtlas = getEonNexusW719SpatialSurface(plan, { activeTab: 'atlas', atlasSpatialModel: { selected: false } });
  assert.equal(emptyAtlas.surface, 'atlas');
  assert.equal(emptyAtlas.empty, true);
  assert.equal(emptyAtlas.objects.length, 4);
  assert.ok(emptyAtlas.objects.some((object) => object.label === 'Projects'));
  assert.ok(emptyAtlas.objects.some((object) => object.label === 'EON City'));

  const selectedAtlas = getEonNexusW719SpatialSurface(plan, {
    activeTab: 'atlas',
    atlasSpatialModel: {
      selected: true,
      centre: { id: 'p1', label: 'EONAPP', status: 'active' },
      view: { mode: 'overview', selectedNodeId: 't1' },
      nodes: [{ id: 't1', label: 'Build NEXUS', meta: 'in progress', kind: 'task', x: 72, y: 34, z: 2, selected: true }],
      edges: [{ id: 'p1-t1', fromId: 'p1', toId: 't1', kind: 'project-work', strength: 0.8 }],
      cityAnchor: { id: 'city-anchor', label: 'EON City', meta: 'Reviewed handoff', x: 28, y: 82, z: -0.2, active: true }
    }
  });
  assert.equal(selectedAtlas.selected, true);
  assert.equal(selectedAtlas.centre.label, 'EONAPP');
  assert.equal(selectedAtlas.objects.length, 2);
  assert.equal(selectedAtlas.relations.length, 1);
  assert.ok(selectedAtlas.objects.every((object) => object.atlasNode === true));
});

test('W706 truth preserves one state, one scene and no automatic effects', () => {
  const truth = getEonNexusW706SpatialSceneTruth();
  assert.equal(truth.babylonPrimaryVisual, true);
  assert.equal(truth.compactSplitFullAndInWorld, true);
  assert.equal(truth.oneSceneAuthority, true);
  assert.equal(truth.secondAssistant, false);
  assert.equal(truth.automaticOrbit, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.startsAiWork, false);
});
