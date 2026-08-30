import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEonExpanseW766HGuidance, createEonExpanseW766HTransitJourney, validateEonExpanseW766HPrimaryRoutes } from '../../assets/js/city/w766/eon-expanse-w766h-playability-core.js';
const EON_EXPANSE_W766B_ZONES = [{id:'gateway-overlook',x:0,z:10},{id:'beacon-fields',x:-42,z:-32},{id:'archive-ruins',x:42,z:-48},{id:'transit-scar',x:-12,z:-88},{id:'horizon-vault',x:18,z:-132}];

test('objective guidance provides target, distance and near interaction prompt', () => {
  const board = { activeMission: { currentObjective: 'scan-beacon-one', guidance: { label: 'Scan Beacon One.' } }, completion: { campaignComplete: false } };
  const far = buildEonExpanseW766HGuidance(board, { x: 0, z: 0 });
  assert.equal(far.active, true); assert.equal(far.target.zoneId, 'beacon-fields'); assert.match(far.prompt, /m$/);
  const near = buildEonExpanseW766HGuidance(board, { x: -42, z: -32 });
  assert.equal(near.nearTarget, true); assert.match(near.prompt, /^Interact:/);
});

test('primary authored route chain passes browser-world clearance budget', () => {
  const result = validateEonExpanseW766HPrimaryRoutes({ zones: EON_EXPANSE_W766B_ZONES, maxGap: 90, minWidth: 5.2 });
  assert.equal(result.ok, true); assert.equal(result.segmentCount, 4);
  assert.equal(validateEonExpanseW766HPrimaryRoutes({ zones: EON_EXPANSE_W766B_ZONES, maxGap: 20, minWidth: 5.2 }).ok, false);
});

test('regional transit journey interpolates and completes without teleport-only state', () => {
  const journey = createEonExpanseW766HTransitJourney({ durationMs: 1000 });
  assert.equal(journey.begin({ x: 0, y: 0.15, z: 0 }, { x: 20, y: 0.15, z: -40 }, 100).ok, true);
  const middle = journey.update(600); assert.equal(middle.status, 'active'); assert.ok(middle.pose.y > 0.15); assert.ok(middle.pose.x > 0 && middle.pose.x < 20);
  const complete = journey.update(1100); assert.equal(complete.status, 'complete'); assert.equal(Math.round(complete.pose.x), 20); assert.equal(Math.round(complete.pose.z), -40);
});
