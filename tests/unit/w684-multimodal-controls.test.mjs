import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEonNexusW684InteractionController,
  createEonNexusW684LocalGestureMode,
  getEonNexusW684MultimodalTruth,
  interpretEonNexusW684GestureFrame,
  interpretEonNexusW684VoiceCommand
} from '../../assets/js/nexus/w684/eon-nexus-w684-multimodal-controls.js';

const objects = Object.freeze([
  { id: 'project:p1', kind: 'project', label: 'EONCITY', x: 30, y: 40, z: 1 },
  { id: 'task:t1', kind: 'task', label: 'Build renderer', x: 62, y: 55, z: 2 },
  { id: 'result:r1', kind: 'result', label: 'Candidate output', x: 70, y: 22, z: 1 }
]);

test('W684 moves, groups, compares, parks and restores real objects with undo', () => {
  const controller = createEonNexusW684InteractionController();
  controller.reconcile(objects);
  controller.select('project:p1');
  controller.moveBy('project:p1', 8, -4, 1);
  assert.equal(controller.getState().layoutOverrides['project:p1'].x, 38);
  controller.select('task:t1', { additive: true });
  controller.groupSelected();
  assert.ok(controller.getState().activeGroupId);
  controller.toggleCompare('project:p1');
  controller.toggleCompare('task:t1');
  assert.deepEqual(controller.getState().compareIds, ['project:p1', 'task:t1']);
  controller.park('task:t1');
  assert.equal(controller.getState().layoutOverrides['task:t1'].parked, true);
  controller.undo();
  assert.equal(controller.getState().layoutOverrides['task:t1'].parked, false);
});

test('W684 grouping requires two real selections and view commands update the bounded visible state', () => {
  const controller = createEonNexusW684InteractionController();
  controller.reconcile(objects);
  controller.select('project:p1');
  assert.equal(controller.groupSelected().reason, 'two-objects-required');
  controller.select('task:t1', { additive: true });
  assert.equal(controller.groupSelected().reason, 'group-selected');
  controller.applyCommand({ ok: true, action: 'rotate-view', payload: { delta: 22 } });
  controller.applyCommand({ ok: true, action: 'expand-view', payload: {} });
  assert.equal(controller.getState().view.rotation, 22);
  assert.equal(controller.getState().view.expanded, true);
});

test('W684 voice transcripts map to bounded commands but never execute product work', () => {
  assert.deepEqual(interpretEonNexusW684VoiceCommand('select EONCITY', objects).payload.objectId, 'project:p1');
  assert.equal(interpretEonNexusW684VoiceCommand('move task right 6', objects).action, 'move');
  assert.equal(interpretEonNexusW684VoiceCommand('open atlas', objects).action, 'request-atlas');
  const receipt = interpretEonNexusW684VoiceCommand('activate', objects);
  assert.equal(receipt.explicitUserActionRequired, true);
  assert.equal(receipt.autoExecute, false);
  assert.equal(receipt.autoNavigate, false);
  assert.equal(interpretEonNexusW684VoiceCommand('move missing object right 6', objects).reason, 'object-not-found');
});

test('W684 gesture frames require local processing, confidence and stability', () => {
  assert.equal(interpretEonNexusW684GestureFrame({ gesture: 'open-palm', confidence: .99, heldMs: 400, localOnly: false }).reason, 'gesture-must-be-local');
  assert.equal(interpretEonNexusW684GestureFrame({ gesture: 'open-palm', confidence: .4, heldMs: 400, localOnly: true }).reason, 'gesture-confidence-too-low');
  assert.equal(interpretEonNexusW684GestureFrame({ gesture: 'closed-hand', confidence: .96, heldMs: 800, localOnly: true }, { now: 2000, lastAcceptedAt: 0 }).action, 'park-selected');
  assert.equal(interpretEonNexusW684GestureFrame({ gesture: 'pinch-drag', confidence: .96, localOnly: true, objectId: 'task:t1', deltaX: 4, deltaY: -2 }, { now: 2000, lastAcceptedAt: 0 }).action, 'move');
  assert.equal(interpretEonNexusW684GestureFrame({ gesture: 'pinch-drag', confidence: .96, localOnly: true, deltaX: 4, deltaY: -2 }, { now: 2000, lastAcceptedAt: 0 }).reason, 'gesture-target-required');
});

test('W684 local camera mode cannot start automatically or without an injected detector', async () => {
  const controller = createEonNexusW684InteractionController();
  const mode = createEonNexusW684LocalGestureMode({ controller, detectorFactory: null, environment: {} });
  assert.equal((await mode.start()).reason, 'explicit-user-action-required');
  assert.equal((await mode.start({ explicitUserAction: true })).reason, 'local-detector-unavailable');
  const truth = getEonNexusW684MultimodalTruth();
  assert.equal(truth.cameraStartsAutomatically, false);
  assert.equal(truth.cameraFramesUploaded, false);
  assert.equal(truth.everyGestureHasButtonKeyboardEquivalent, true);
});
