import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_NEXUS_W683_MAX_CONNECTIONS,
  EON_NEXUS_W683_MAX_RENDER_OBJECTS,
  getEonNexusW683MorphicRendererTruth,
  projectEonNexusW683MorphicRenderer
} from '../../assets/js/nexus/w683/eon-nexus-w683-morphic-field-renderer.js';

const snapshot = Object.freeze({
  eonbot: { state: 'processing' },
  conversation: { id: 'chat-1', label: 'Private conversation', messageCount: 9, openRoute: '/?thread=chat-1' },
  project: { id: 'project-1', selected: true, label: 'EONCITY', status: 'active', taskCount: 4, artefactCount: 3, openRoute: '/projects?project=project-1' },
  task: { id: 'task-1', label: 'Current task', state: 'running', stageLabel: 'Building Morphic Command Field' },
  approval: { pending: true, count: 1, label: '1 approval waiting', reviewRoute: '/workspace', actionId: 'approval-1' },
  results: { count: 2, label: '2 results available', openRoute: '/workspace' },
  route: { mode: 'local', providerId: 'ollama', providerLabel: 'Local AI', privateOnDevice: true, verified: true },
  connection: { state: 'available' }, atlas: { selected: true },
  nodes: [{ id: 'research', label: 'Research', kind: 'researcher', status: 'active', count: 1 }, { id: 'build', label: 'Build', kind: 'builder', status: 'available', count: 1 }]
});

test('W683 creates a bounded spatial field from real W672 work objects', () => {
  const field = projectEonNexusW683MorphicRenderer(snapshot);
  assert.ok(field.visibleObjects.length <= EON_NEXUS_W683_MAX_RENDER_OBJECTS);
  assert.ok(field.connections.length <= EON_NEXUS_W683_MAX_CONNECTIONS);
  assert.ok(field.visibleObjects.every((object) => Number.isFinite(object.x) && Number.isFinite(object.y) && Number.isFinite(object.z)));
  assert.ok(field.visibleObjects.every((object) => object.draggable && object.keyboardEquivalent && object.voiceEquivalent));
  assert.equal(field.renderer.engine, 'hybrid-dom-babylon');
  assert.equal(field.privateContentRead, false);
});

test('W683 applies local manipulation state without changing source authority', () => {
  const first = projectEonNexusW683MorphicRenderer(snapshot);
  const id = first.visibleObjects.find((object) => object.kind === 'project').id;
  const moved = projectEonNexusW683MorphicRenderer(snapshot, { interactionState: { selectedObjectId: id, layoutOverrides: { [id]: { x: 82, y: 18, z: 4, groupId: 'group:a', compared: true } } } });
  const object = moved.visibleObjects.find((entry) => entry.id === id);
  assert.deepEqual([object.x, object.y, object.z], [82, 18, 4]);
  assert.equal(object.groupId, 'group:a');
  assert.equal(object.compared, true);
  assert.equal(moved.layoutPersistence, false);
  assert.equal(moved.startsAiWork, false);
});

test('W683 connections express project relationships rather than decorative-only rings', () => {
  const field = projectEonNexusW683MorphicRenderer(snapshot);
  assert.ok(field.connections.some((entry) => entry.kind === 'project-task'));
  assert.ok(field.connections.some((entry) => entry.kind === 'task-decision'));
  assert.ok(field.connections.every((entry) => !entry.startsWork && !entry.explicitUserAction));
  assert.ok(field.lanes.some((entry) => entry.id === 'work' && entry.objectCount > 0));
});

test('W683 is wired into both DOM and the single lazy Babylon Living Core', () => {
  const live = fs.readFileSync('assets/js/nexus/eon-nexus-live.js', 'utf8');
  const core = fs.readFileSync('assets/js/nexus/eon-nexus-living-core.js', 'utf8');
  assert.match(live, /projectEonNexusW683MorphicRenderer/);
  assert.match(live, /eon-nexus-live__stage-architecture/);
  assert.match(core, /projectEonNexusW683MorphicRenderer/);
  assert.match(core, /eonWorkObjectId/);
  const truth = getEonNexusW683MorphicRendererTruth();
  assert.equal(truth.oneVisualStage, true);
  assert.equal(truth.secondAssistant, false);
  assert.equal(truth.secondProjectStore, false);
});
