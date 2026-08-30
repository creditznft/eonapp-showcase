import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_THIRD_PERSON_SCHEMA,
  createEonCityPointerLook,
  createEonCityStaticCollisionVolumes,
  normalizeEonCityCollisionVolumes,
  resolveEonCityThirdPersonPosition
} from '../../assets/js/city/eon-city-third-person-controller.js';
import { captureEonCityExplorationPose, normalizeEonCityExplorationPose } from '../../assets/js/contracts/city/eon-city-exploration-pose.js';

test('W555B resolves deterministic static collision volumes without a physics or network dependency', () => {
  const result = resolveEonCityThirdPersonPosition({
    position: { x: 0, y: 0, z: 0 },
    desiredMove: { x: 1, z: 0 },
    step: 2,
    bounds: 8,
    radius: 0.4,
    colliders: [{ id: 'wall', type: 'box', x: 1, z: 0, halfWidth: 0.5, halfDepth: 1 }]
  });
  assert.equal(result.schema, EON_CITY_THIRD_PERSON_SCHEMA);
  assert.equal(result.collided, true);
  assert.deepEqual(result.collisionIds, ['wall']);
  assert.equal(result.position.x <= 0.1, true);
});

test('W555B clamps controller movement to a safe City world boundary', () => {
  const result = resolveEonCityThirdPersonPosition({
    position: { x: 4.5, y: 0, z: 0 },
    desiredMove: { x: 1, z: 0 },
    step: 10,
    bounds: 5,
    radius: 0.5
  });
  assert.equal(result.atWorldBoundary, true);
  assert.equal(result.position.x, 4.5);
  assert.equal(result.position.z, 0);
});

test('W555B pointer look only requests lock after a caller invokes it and releases safely', () => {
  const events = [];
  const listeners = new Map();
  const documentRef = {
    pointerLockElement: null,
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type) { listeners.delete(type); },
    exitPointerLock() { this.pointerLockElement = null; listeners.get('pointerlockchange')?.(); }
  };
  const canvas = {
    requestPointerLock() { documentRef.pointerLockElement = canvas; listeners.get('pointerlockchange')?.(); }
  };
  const pointer = createEonCityPointerLook({
    canvas,
    documentRef,
    onLook: (event) => events.push(event)
  });
  assert.equal(pointer.getSnapshot().active, false);
  assert.equal(pointer.request().ok, true);
  assert.equal(pointer.getSnapshot().active, true);
  listeners.get('mousemove')?.({ movementX: 10, movementY: -5 });
  assert.equal(events.length, 1);
  assert.equal(events[0].yaw > 0, true);
  assert.equal(events[0].pitch < 0, true);
  pointer.release('test');
  assert.equal(pointer.getSnapshot().active, false);
  pointer.destroy();
});

test('W555B collision volumes are normalized, bounded, and static-only', () => {
  const volumes = normalizeEonCityCollisionVolumes([{ id: 'bad box', type: 'box', x: 1, z: 2, width: 4, depth: 2 }]);
  assert.equal(volumes[0].id, 'bad-box');
  assert.equal(volumes[0].halfWidth, 2);
  assert.equal(volumes[0].halfDepth, 1);
  const authored = createEonCityStaticCollisionVolumes({ landmarks: [{ id: 'dock', x: 3, z: -2, radius: 4 }] });
  assert.equal(authored.some((volume) => volume.id === 'landmark:dock'), true);
});


test('W555B keeps third-person intent in an exact pose return without claiming browser pointer-lock restoration', () => {
  const captured = captureEonCityExplorationPose({
    player: { x: 2, y: 0, z: -3, heading: 1.2 },
    camera: { alpha: 0.4, beta: 1.1, radius: 8, target: { x: 2, y: 1.18, z: -3 } },
    controller: { mode: 'third-person', pointerLookEnabled: true }
  });
  assert.deepEqual(captured.controller, { mode: 'third-person', pointerLookEnabled: true });
  assert.equal(Object.isFrozen(captured.controller), true);
  const normalized = normalizeEonCityExplorationPose(captured);
  assert.equal(normalized.controller.pointerLookEnabled, true);
  assert.equal(normalized.player.x, 2);
  // The runtime releases pointer lock on return and asks for a fresh gesture;
  // this record preserves intent only, never an OS/browser lock claim.
  assert.equal('browserPointerLockRestored' in normalized, false);
});
