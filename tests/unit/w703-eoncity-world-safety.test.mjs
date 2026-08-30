import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_CITY_W703_CORE_BOUNDS,
  enforceEonCityW703WorldSafety,
  getEonCityW703WorldSafetyTruth,
  isEonCityW703PositionInsideBounds,
  resolveEonCityW703UnstuckPose,
  sanitizeEonCityW703CameraPose,
  sanitizeEonCityW703PlayerPosition,
  sanitizeEonCityW703TransitionPose
} from '../../assets/js/city/w703/eon-city-w703-world-safety.js';

function vector(x = 0, y = 0, z = 0) {
  return {
    x, y, z,
    copyFromFloats(nextX, nextY, nextZ) { this.x = nextX; this.y = nextY; this.z = nextZ; }
  };
}

test('W703 clamps escaped and non-finite player positions above the world floor', () => {
  const escaped = sanitizeEonCityW703PlayerPosition({ x: 999, y: -900, z: Number.NaN });
  assert.equal(escaped.x, EON_CITY_W703_CORE_BOUNDS.maxX - 0.45);
  assert.equal(escaped.y, 0);
  assert.equal(escaped.z, 0);
  assert.equal(isEonCityW703PositionInsideBounds(escaped), true);
});

test('W703 camera sanitation prevents below-ground orbit poses', () => {
  const pose = sanitizeEonCityW703CameraPose({ beta: Math.PI, radius: 2, target: { x: 0, y: -50, z: 0 } });
  assert.ok(pose.beta >= EON_CITY_W703_CORE_BOUNDS.cameraBetaMin);
  assert.ok(pose.beta <= EON_CITY_W703_CORE_BOUNDS.cameraBetaMax);
  assert.ok(pose.radius >= EON_CITY_W703_CORE_BOUNDS.cameraRadiusMin);
  assert.ok(pose.target.y >= EON_CITY_W703_CORE_BOUNDS.cameraTargetMinY);
  assert.ok(pose.estimatedPositionY >= EON_CITY_W703_CORE_BOUNDS.cameraPositionMinY);
  assert.equal(pose.aboveGround, true);
});

test('W703 sanitizes restored and transition poses through one authority', () => {
  const pose = sanitizeEonCityW703TransitionPose({
    x: Infinity,
    y: -4,
    z: -999,
    cameraBeta: 99,
    cameraRadius: -1
  }, { fallback: { x: 12, z: 14 } });
  assert.equal(pose.x, 12);
  assert.equal(pose.z, EON_CITY_W703_CORE_BOUNDS.minZ + 0.45);
  assert.equal(pose.y, 0);
  assert.equal(pose.sanitized, true);
  assert.equal(pose.automaticNavigation, false);
});

test('W703 Babylon-compatible enforcement repairs player, target and camera limits', () => {
  const playerAnchor = { position: vector(500, -100, -500) };
  const camera = {
    alpha: -Math.PI / 2,
    beta: 9,
    radius: 1,
    target: vector(0, -99, 0)
  };
  const result = enforceEonCityW703WorldSafety({ camera, playerAnchor });
  assert.equal(result.aboveGround, true);
  assert.equal(playerAnchor.position.y, 0);
  assert.ok(playerAnchor.position.x <= EON_CITY_W703_CORE_BOUNDS.maxX);
  assert.ok(camera.target.y >= EON_CITY_W703_CORE_BOUNDS.cameraTargetMinY);
  assert.equal(camera.lowerBetaLimit, EON_CITY_W703_CORE_BOUNDS.cameraBetaMin);
  assert.equal(camera.upperBetaLimit, EON_CITY_W703_CORE_BOUNDS.cameraBetaMax);
  assert.equal(camera.lowerRadiusLimit, EON_CITY_W703_CORE_BOUNDS.cameraRadiusMin);
  assert.equal(camera.upperRadiusLimit, EON_CITY_W703_CORE_BOUNDS.cameraRadiusMax);
});

test('W703 unstuck prefers a valid current or last-safe position before spawn', () => {
  const current = resolveEonCityW703UnstuckPose({ currentPosition: { x: 3, z: 4 }, lastSafePosition: { x: 3.2, z: 4.2 }, spawn: { x: 0, z: 0 } });
  assert.equal(current.source, 'current-safe');
  assert.equal(current.x, 3);
  const checkpoint = resolveEonCityW703UnstuckPose({ currentPosition: { x: 7, z: 8 }, lastSafePosition: { x: 3, z: 4 }, spawn: { x: 0, z: 0 } });
  assert.equal(checkpoint.source, 'last-safe');
  assert.equal(checkpoint.x, 3);
  const last = resolveEonCityW703UnstuckPose({ currentPosition: { x: 999, z: 999 }, lastSafePosition: { x: 8, z: 9 }, spawn: { x: 0, z: 0 } });
  assert.equal(last.source, 'last-safe');
  assert.equal(last.x, 8);
  const spawn = resolveEonCityW703UnstuckPose({ currentPosition: { x: 999, z: 999 }, lastSafePosition: { x: -999, z: -999 }, spawn: { x: 1, z: 2 } });
  assert.equal(spawn.source, 'spawn');
  assert.equal(spawn.x, 1);
});

test('W703 truth contract requires underside occlusion and explicit recovery', () => {
  const truth = getEonCityW703WorldSafetyTruth();
  assert.equal(truth.hardCameraPositionFloor, true);
  assert.equal(truth.sanitizedRestoredPoses, true);
  assert.equal(truth.perFrameEnforcementSupported, true);
  assert.equal(truth.undersideOccluderRequired, true);
  assert.equal(truth.automaticTravel, false);
});
