import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arbitrateEonExpanseW767BLabels,
  buildEonExpanseW767BGroundCircuitRoute,
  createEonExpanseW767BGuideController
} from '../../assets/js/city/w766/eon-expanse-w767b-guidance-director.js';

test('W767B ground circuit route is bounded and points toward the active target', () => {
  const route = buildEonExpanseW767BGroundCircuitRoute({ player: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0.2, z: -60 }, spacing: 2, maxSegments: 12 });
  assert.equal(route.active, true);
  assert.equal(route.points.length, 12);
  assert.equal(Math.round(route.length), 60);
  assert.ok(route.points.every((entry) => entry.z < 0 && entry.z > -60));
  assert.ok(route.points.at(-1).progress < 1);
});

test('W767B label arbitration keeps one objective and at most two visible nearby interactions', () => {
  const result = arbitrateEonExpanseW767BLabels([
    { id: 'objective', distance: 14, visible: true, inFront: true, primaryObjective: true },
    { id: 'near-a', distance: 3, visible: true, inFront: true },
    { id: 'near-b', distance: 5, visible: true, inFront: true },
    { id: 'hidden', distance: 2, visible: false },
    { id: 'occluded', distance: 1, visible: true, occluded: true },
    { id: 'far', distance: 30, visible: true }
  ]);
  assert.deepEqual(result.selected.map((entry) => entry.id), ['objective', 'near-a', 'near-b']);
  assert.equal(result.primaryCount, 1);
  assert.equal(result.nearbyCount, 2);
});

test('W767B guide controller requires explicit action and leads EONBOT ahead without teleporting to the objective', () => {
  let clock = 1000;
  const controller = createEonExpanseW767BGuideController({ now: () => clock, durationMs: 10000 });
  const guidance = { active: true, objective: 'reach-beacon-one', target: { x: -42, y: 2.5, z: -32 }, distance: 52 };
  assert.equal(controller.request(guidance).ok, false);
  assert.equal(controller.request(guidance, { explicitUserAction: true }).ok, true);
  const state = controller.update(guidance, { x: 0, y: 0, z: 0 }, clock);
  assert.equal(state.active, true);
  assert.equal(state.status, 'guiding');
  assert.ok(Math.hypot(state.leadTarget.x, state.leadTarget.z) <= 5.3);
  clock += 11000;
  assert.equal(controller.update(guidance, { x: 0, y: 0, z: 0 }, clock).status, 'expired');
});
