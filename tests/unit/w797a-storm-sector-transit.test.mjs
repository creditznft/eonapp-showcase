import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_EXPANSE_W797A_STORM_TRANSIT_NODES,
  createEonExpanseW797AStormTransitController,
  deriveEonExpanseW797AStormTransitView
} from '../../assets/js/city/w797/eon-expanse-w797a-storm-sector-transit.js';
import { EON_EXPANSE_W795A_STORM_MISSIONS, createEonExpanseW795AInitialStormMissionState } from '../../assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js';

const completed = (ids = []) => ({
  ...createEonExpanseW795AInitialStormMissionState(),
  completedObjectiveActions: EON_EXPANSE_W795A_STORM_MISSIONS.filter((mission) => ids.includes(mission.id)).flatMap((mission) => mission.objectives.map((objective) => objective.action))
});

test('W797A exposes four fixed authored Transit nodes and no raw placement', () => {
  const view = deriveEonExpanseW797AStormTransitView({ missionState: completed([]), currentPosition: { x: 928, y: 0.45, z: -180 } });
  assert.equal(EON_EXPANSE_W797A_STORM_TRANSIT_NODES.length, 4);
  assert.equal(view.nodes.length, 4);
  assert.equal(view.rawCoordinatesAccepted, false);
  assert.equal(view.grantsXp, false);
  assert.equal(view.automaticTravel, false);
  assert.deepEqual(view.nodes.filter((entry) => entry.unlocked).map((entry) => entry.id), ['charged-gateway', 'relay-basin']);
});

test('W797A unlocks Stabilizer Ridge and Storm Eye from ordered mission truth', () => {
  const weather = deriveEonExpanseW797AStormTransitView({ missionState: completed(['weather-restoration']) });
  assert.equal(weather.nodes.find((entry) => entry.id === 'stabilizer-ridge').unlocked, true);
  assert.equal(weather.nodes.find((entry) => entry.id === 'storm-eye').unlocked, false);
  const relay = deriveEonExpanseW797AStormTransitView({ missionState: completed(['weather-restoration', 'relay-repair']) });
  assert.equal(relay.nodes.find((entry) => entry.id === 'storm-eye').unlocked, true);
});

test('W797A requires explicit travel and rejects locked or current destinations', () => {
  let clock = 1000;
  const transit = createEonExpanseW797AStormTransitController({ durationMs: 1000, now: () => clock });
  assert.equal(transit.start({ destinationNodeId: 'relay-basin', currentPosition: { x: 928, y: 0.45, z: -180 }, missionState: completed([]) }).reason, 'explicit-user-action-required');
  assert.equal(transit.start({ destinationNodeId: 'storm-eye', currentPosition: { x: 928, y: 0.45, z: -180 }, missionState: completed([]), explicitUserAction: true }).reason, 'storm-transit-node-locked');
  assert.equal(transit.start({ destinationNodeId: 'relay-basin', currentPosition: { x: 990, y: 0.45, z: -158 }, missionState: completed([]), explicitUserAction: true }).reason, 'storm-transit-already-at-destination');
});

test('W797A produces one bounded explicit journey and consumable completion', () => {
  let clock = 1000;
  const transit = createEonExpanseW797AStormTransitController({ durationMs: 1000, now: () => clock });
  const started = transit.start({ destinationNodeId: 'relay-basin', currentPosition: { x: 928, y: 0.45, z: -180 }, missionState: completed([]), explicitUserAction: true });
  assert.equal(started.ok, true);
  clock = 1500;
  const middle = transit.update(clock);
  assert.equal(middle.status, 'active');
  assert.ok(middle.pose.y > 0.45);
  clock = 2000;
  const done = transit.update(clock);
  assert.equal(done.status, 'complete');
  assert.equal(done.transition.destinationNodeId, 'relay-basin');
  assert.equal(done.grantsXp, false);
  const transition = transit.consumeTransition();
  assert.equal(transition.type, 'storm-sector-transit-complete');
  assert.equal(transit.getState().status, 'idle');
});
