import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_EXPLORATION_POSE_SCHEMA, captureEonCityExplorationPose, normalizeEonCityExplorationPose } from '../../assets/js/contracts/city/eon-city-exploration-pose.js';

test('W551 captures a bounded immutable exploration pose before a menu focus transition', () => {
  const pose = captureEonCityExplorationPose({
    player: { x: 4.25, y: 0, z: -8.5, heading: 1.2 },
    camera: { alpha: -0.8, beta: 1.1, radius: 15.5, target: { x: 4.25, y: 1.18, z: -8.5 } }
  });
  assert.equal(pose.schema, EON_CITY_EXPLORATION_POSE_SCHEMA);
  assert.deepEqual(pose.player, { x: 4.25, y: 0, z: -8.5, heading: 1.2 });
  assert.equal(pose.camera.radius, 15.5);
  assert.equal(Object.isFrozen(pose), true);
  assert.equal(Object.isFrozen(pose.player), true);
});

test('W551 rejects incomplete poses and clamps only unsafe numeric extremes', () => {
  assert.equal(normalizeEonCityExplorationPose({ player: { x: 1 }, camera: { alpha: 0, beta: 1, radius: 3 } }), null);
  const pose = normalizeEonCityExplorationPose({
    player: { x: 999999, y: 0, z: -999999, heading: 0 },
    camera: { alpha: 0, beta: 99, radius: -3, target: { x: 999999, y: 0, z: -999999 } }
  });
  assert.equal(pose.player.x, 10000);
  assert.equal(pose.player.z, -10000);
  assert.equal(pose.camera.beta < Math.PI, true);
  assert.equal(pose.camera.radius, 0.1);
});
