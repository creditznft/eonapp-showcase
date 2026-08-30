import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_NEXUS_W672_MAX_WORK_OBJECTS,
  getEonNexusW672CommandFieldTruth,
  projectEonNexusW672CommandField
} from '../../assets/js/nexus/w672/eon-nexus-w672-morphic-command-field.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const snapshot = Object.freeze({
  eonbot: { state: 'processing' },
  conversation: { id: 'chat-1', label: 'Private conversation', messageCount: 9, openRoute: '/?thread=chat-1' },
  project: { id: 'project-1', selected: true, label: 'EONCITY', status: 'active', taskCount: 4, artefactCount: 3, openRoute: '/projects?project=project-1' },
  task: { id: 'task-1', label: 'Current task', state: 'running', stageLabel: 'Building Morphic Command Field' },
  approval: { pending: true, count: 1, label: '1 approval waiting', reviewRoute: '/workspace', actionId: 'approval-1' },
  results: { count: 2, label: '2 results available', openRoute: '/workspace' },
  route: { mode: 'local', providerId: 'ollama', providerLabel: 'Local AI', privateOnDevice: true, verified: true },
  connection: { state: 'available' },
  atlas: { selected: true },
  nodes: [
    { id: 'research', label: 'Research', kind: 'researcher', status: 'active', providerKind: 'local', count: 1 },
    { id: 'build', label: 'Build', kind: 'builder', status: 'available', providerKind: 'local', count: 1 },
    { id: 'review', label: 'Validation', kind: 'reviewer', status: 'available', providerKind: 'guide', count: 1 }
  ]
});

test('W672 projects only real privacy-bounded work objects into the command field', () => {
  const field = projectEonNexusW672CommandField(snapshot);
  assert.ok(field.visibleObjects.length <= EON_NEXUS_W672_MAX_WORK_OBJECTS);
  assert.deepEqual(field.presentKinds.slice(0, 6), ['approval', 'result', 'task', 'project', 'conversation', 'route']);
  assert.ok(field.visibleObjects.some((object) => object.kind === 'tool'));
  assert.ok(field.visibleObjects.every((object) => object.explicitUserAction && !object.startsWork && !object.automaticNavigation));
  assert.equal(field.privateContentRead, false);
});

test('W672 gives urgent truthful state the visual focus without auto-approving it', () => {
  const field = projectEonNexusW672CommandField(snapshot);
  assert.equal(field.selectedObject.kind, 'approval');
  assert.equal(field.selectedPrimaryVerb.action, 'review');
  assert.equal(field.composition, 'decision-gate');
  assert.equal(field.automaticApproval, false);
  const waiting = projectEonNexusW672CommandField({ ...snapshot, eonbot: { state: 'ready' } });
  assert.equal(waiting.state, 'waiting-approval');
  assert.equal(waiting.composition, 'decision-gate');
});

test('W672 keeps object identity and positions stable across refreshes', () => {
  const first = projectEonNexusW672CommandField(snapshot);
  const second = projectEonNexusW672CommandField(snapshot, { stableObjectOrder: first.stableObjectOrder, selectedObjectId: 'project:project-1' });
  assert.deepEqual(first.visibleObjects.map((row) => row.id), second.visibleObjects.map((row) => row.id));
  assert.deepEqual(first.visibleObjects.map((row) => [row.x, row.y]), second.visibleObjects.map((row) => [row.x, row.y]));
  assert.equal(second.selectedObject.id, 'project:project-1');
});

test('W672 Live Nexus source exposes a morphic work field and explicit inspector actions', async () => {
  const live = await readFile(path.join(ROOT, 'assets/js/nexus/eon-nexus-live.js'), 'utf8');
  const css = await readFile(path.join(ROOT, 'assets/css/eon-nexus-live.css'), 'utf8');
  assert.match(live, /projectEonNexusW683MorphicRenderer/);
  assert.match(live, /eon-nexus-live__work-objects/);
  assert.match(live, /eon-nexus-live__focus-card/);
  assert.match(live, /dataset\.eonNexusComposition/);
  assert.match(css, /W672 — Morphic Command Field/);
  assert.match(css, /eon-nexus-live__work-object/);
  assert.match(css, /eon-nexus-live__morphic-lattice/);
  const truth = getEonNexusW672CommandFieldTruth();
  assert.equal(truth.oneEonbot, true);
  assert.equal(truth.realWorkObjectsOnly, true);
  assert.equal(truth.optionalGestureLayerDeferred, true);
  assert.equal(truth.startsAiWork, false);
});
