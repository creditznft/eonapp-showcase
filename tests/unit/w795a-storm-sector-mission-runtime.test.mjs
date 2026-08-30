import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_EXPANSE_W795A_STORM_MISSIONS,
  createEonExpanseW795AInitialStormMissionState,
  createEonExpanseW795AStormMissionRuntime,
  sanitizeEonExpanseW795AStormMissionState
} from '../../assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js';

test('W795A defines three ordered authored mission families', () => {
  assert.equal(EON_EXPANSE_W795A_STORM_MISSIONS.length, 3);
  assert.deepEqual(EON_EXPANSE_W795A_STORM_MISSIONS.map((m) => m.id), ['weather-restoration', 'relay-repair', 'storm-rescue']);
  assert.equal(EON_EXPANSE_W795A_STORM_MISSIONS.flatMap((m) => m.objectives).length, 9);
});

test('W795A requires explicit ordered interactions and unique receipts', () => {
  let tick = 100;
  const runtime = createEonExpanseW795AStormMissionRuntime({ now: () => ++tick });
  assert.equal(runtime.recordAction('storm-weather-array-reviewed', { receiptId: 'storm:test:1' }).reason, 'explicit-user-action-required');
  assert.equal(runtime.recordAction('storm-relay-console-reviewed', { explicitUserAction: true, receiptId: 'storm:test:2' }).reason, 'storm-objective-out-of-order');
  const first = runtime.recordAction('storm-weather-array-reviewed', { explicitUserAction: true, receiptId: 'storm:test:1' });
  assert.equal(first.ok, true);
  assert.equal(runtime.recordAction('storm-weather-array-calibrated', { explicitUserAction: true, receiptId: 'storm:test:1' }).reason, 'storm-mission-receipt-already-processed');
});

test('W795A completes only after all nine canonical actions', () => {
  const runtime = createEonExpanseW795AStormMissionRuntime({ initialState: createEonExpanseW795AInitialStormMissionState(), now: () => 500 });
  const actions = EON_EXPANSE_W795A_STORM_MISSIONS.flatMap((mission) => mission.objectives.map((objective) => objective.action));
  actions.forEach((action, index) => assert.equal(runtime.recordAction(action, { explicitUserAction: true, receiptId: `storm:receipt:${index}` }).ok, true));
  assert.equal(runtime.getState().regionCompleted, true);
  assert.equal(runtime.getView().completedMissionCount, 3);
  assert.equal(runtime.getState().awardsXp, false);
});

test('W795A prunes forged, private and out-of-order persisted state', () => {
  const base = createEonExpanseW795AInitialStormMissionState();
  const restored = sanitizeEonExpanseW795AStormMissionState({ ...base, completedObjectiveActions: ['storm-relay-console-reviewed', 'storm-weather-array-reviewed'], processedReceiptIds: ['ok:receipt', '../bad'], privateContentStored: { prompt: 'secret' }, regionCompleted: true });
  assert.deepEqual(restored.completedObjectiveActions, ['storm-weather-array-reviewed']);
  assert.equal(restored.regionCompleted, false);
  assert.equal(restored.privateContentStored, false);
});
