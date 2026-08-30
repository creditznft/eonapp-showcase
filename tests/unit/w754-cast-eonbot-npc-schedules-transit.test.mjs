import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W754_CAPSULE_FORWARD_AXIS,
  EON_CITY_W754_CAPSULE_ID,
  EON_CITY_W754_SCHEMA,
  EON_CITY_W754_TRAVEL_CHOICES,
  buildEonCityW754CastPlan,
  buildEonCityW754NpcSchedulePlan,
  createEonCityW754NpcScheduleController,
  createEonCityW754TransitController,
  resolveEonCityW754CapsulePose,
  resolveEonCityW754EonbotSafeTarget,
  validateEonCityW754Contract
} from '../../assets/js/city/w754/eon-city-w754-cast-eonbot-npc-transit.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W754 composes one high-detail cast from the maintained W731/W649 authorities', () => {
  const cast = buildEonCityW754CastPlan({ quality: 'high' });
  assert.equal(cast.schema, EON_CITY_W754_SCHEMA);
  assert.equal(cast.slots.length, 12);
  assert.equal(cast.coreRoleCount, 2);
  assert.equal(cast.stationRoleCount, 9);
  assert.equal(cast.ambientRoleCount, 1);
  assert.equal(cast.allStationRolesAssigned, true);
  assert.deepEqual(cast.missingStationIds, []);
  assert.deepEqual(cast.duplicateStationIds, []);
  assert.deepEqual(cast.inactiveAssignments, []);
  assert.equal(cast.requiredSlots.length, 12);
  assert.equal(cast.oneCastAuthority, 'w731-launch-asset-manifest');
  assert.ok(cast.slots.every((entry) => entry.primaryPath.startsWith('/assets/city/w649/')));
  assert.ok(cast.slots.every((entry) => entry.browserVisualProofRequired));
});

test('W754 produces nine staggered bounded NPC schedules without shared collision lanes', () => {
  const plan = buildEonCityW754NpcSchedulePlan();
  assert.equal(plan.scheduleCount, 9);
  assert.equal(plan.uniqueOffsets, true);
  assert.equal(plan.uniqueCollisionLayers, true);
  assert.equal(plan.boundedRoutes, true);
  assert.equal(plan.walkingInPlaceAllowed, false);
  assert.ok(plan.schedules.every((entry) => entry.routeLength > 0.2));
  assert.ok(plan.schedules.every((entry) => entry.minimumStructureClearance >= 0.42));
  assert.ok(plan.schedules.every((entry) => entry.oneNpcPerStationLane));
});

test('W754 NPC controller moves only when position changes and suspends safely', () => {
  let clock = 10_000;
  const plan = buildEonCityW754NpcSchedulePlan();
  const controller = createEonCityW754NpcScheduleController({ now: () => clock, plan });
  const stationId = 'create-forge';
  const first = controller.update(stationId, clock);
  assert.equal(first.ok, true);
  assert.equal(first.walkingInPlace, false);
  const schedule = plan.schedules.find((entry) => entry.stationId === stationId);
  clock += schedule.scheduleOffsetMs + schedule.homeDwellMs + 500;
  const moving = controller.update(stationId, clock);
  assert.equal(moving.ok, true);
  assert.equal(moving.phase, 'walk-terminal');
  assert.equal(moving.moving, true);
  assert.ok(moving.movedDistance > 0);
  assert.equal(moving.animation, 'walk');
  const suspended = controller.update(stationId, clock + 100, { suspended: true });
  assert.equal(suspended.phase, 'suspended');
  assert.equal(suspended.moving, false);
  assert.equal(suspended.animation, 'idle');
  assert.deepEqual(suspended.position, moving.position);
});

test('W754 keeps EONBOT outside the player and camera corridors', () => {
  const safe = resolveEonCityW754EonbotSafeTarget({
    playerPosition: { x: 0, y: 0, z: 0 },
    requestedTarget: { x: 0, y: 4, z: 2.2 },
    cameraPosition: { x: 0, y: 2, z: -6 }
  });
  assert.equal(safe.schema, EON_CITY_W754_SCHEMA);
  assert.ok(safe.distanceFromPlayer >= safe.minimumPlayerClearance);
  assert.ok(safe.distanceFromPlayer <= safe.maximumScoutDistance);
  assert.ok(safe.target.y <= 2.35);
  assert.equal(safe.blocksPlayer, false);
  assert.equal(safe.blocksCamera, false);
  assert.equal(safe.automaticStationActivation, false);
  assert.equal(safe.startsAiWork, false);
  assert.equal(safe.startsVoiceCapture, false);
});

test('W754 capsule pose uses the authored local +X axis and route tangent', () => {
  const poseEast = resolveEonCityW754CapsulePose({ mode: 'ride', from: { x: 0, y: 0, z: 0 }, to: { x: 10, y: 0, z: 0 } }, 0.5);
  assert.equal(poseEast.capsuleId, EON_CITY_W754_CAPSULE_ID);
  assert.equal(poseEast.forwardAxis, '+x');
  assert.equal(poseEast.rotationY, 0);
  assert.deepEqual(poseEast.tangent, { x: 1, z: 0 });
  assert.equal(poseEast.routeDirectionCorrect, true);
  const poseNorth = resolveEonCityW754CapsulePose({ mode: 'ride', from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: 0, z: -10 } }, 0.5);
  assert.equal(poseNorth.rotationY, Number((Math.PI / 2).toFixed(4)));
  assert.deepEqual(poseNorth.tangent, { x: 0, z: -1 });
});

test('W754 transit requires review plus explicit Board or Skip and keeps one receipt authority', () => {
  let clock = 754_000;
  const transit = createEonCityW754TransitController({ now: () => clock });
  const destination = transit.listDestinations().find((entry) => entry.id !== 'orientation-hall');
  assert.ok(destination);
  assert.equal(transit.request(destination.id).reason, 'explicit-user-action-required');
  const review = transit.request(destination.id, { explicitUserAction: true, fromDistrictId: 'orientation-hall' });
  assert.equal(review.ok, true);
  assert.equal(review.reviewRequired, true);
  assert.deepEqual(review.choices, EON_CITY_W754_TRAVEL_CHOICES);
  assert.equal(review.uniqueCapsuleCount, 1);
  assert.equal(transit.confirm(review.token, { explicitUserAction: true, choice: 'invalid' }).reason, 'travel-choice-invalid');
  const confirmed = transit.confirm(review.token, { explicitUserAction: true, choice: 'board' });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.receipt.travelMode, 'ride');
  assert.equal(confirmed.receipt.routeOpened, false);
  assert.equal(confirmed.receipt.workExecuted, false);
  assert.equal(confirmed.receipt.privateDataTransferred, false);
  assert.equal(confirmed.state.uniqueCapsuleCount, 1);
  clock += 2_000;
  const active = transit.update(clock);
  assert.equal(active.capsuleId, EON_CITY_W754_CAPSULE_ID);
  assert.equal(active.automaticTravel, false);
  assert.equal(active.routeOpened, false);
});

test('W754 skip remains a separate explicit accessible choice', () => {
  let clock = 800_000;
  const transit = createEonCityW754TransitController({ now: () => clock });
  const destination = transit.listDestinations().find((entry) => entry.id !== 'orientation-hall');
  const review = transit.request(destination.id, { explicitUserAction: true, fromDistrictId: 'orientation-hall' });
  const skipped = transit.confirm(review.token, { explicitUserAction: true, choice: 'skip' });
  assert.equal(skipped.ok, true);
  assert.equal(skipped.receipt.travelMode, 'skip');
  assert.equal(skipped.receipt.skipRide, true);
  assert.equal(skipped.state.status, 'complete');
  assert.equal(skipped.state.progress, 1);
  assert.equal(skipped.state.automaticTravel, false);
});

test('W754 runtime wiring retires the backwards ambient-only capsule boundary', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const registry = read('assets/js/city/w748/eon-city-w748-interaction-registry.js');
  assert.match(runtime, /EON_CITY_CORE_RUNTIME_SCHEMA = 'eon\.city\.command-centre-runtime\.w75[4-9]\.v1'/);
  assert.match(runtime, /createEonCityW754NpcScheduleController/);
  assert.match(runtime, /resolveEonCityW754EonbotSafeTarget/);
  assert.match(runtime, /createEonCityW754TransitController/);
  assert.match(runtime, /transit\.anchor\.rotation\.y = angle;/);
  assert.doesNotMatch(runtime, /transit\.anchor\.rotation\.y = angle \+ Math\.PI \/ 2/);
  assert.match(runtime, /requestTransit\(/);
  assert.match(runtime, /confirmTransit\(/);
  assert.match(runtime, /uniqueCapsuleCount: 1/);
  assert.match(registry, /Review Board \/ Skip Transit/);
  assert.doesNotMatch(registry, /Transit available in a later wave/);
  assert.equal(EON_CITY_W754_CAPSULE_FORWARD_AXIS, '+x');
  assert.equal(validateEonCityW754Contract().ok, true);
});
