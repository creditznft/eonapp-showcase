import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EONAPP_W702_CANONICAL_WORK_STATE_SCHEMA,
  createEonAppW702CanonicalWorkState,
  createEonAppW702CanonicalWorkStateController,
  getEonAppW702CanonicalWorkStateTruth,
  projectEonAppW702CanonicalWorkState,
  reduceEonAppW702CanonicalWorkState,
  validateEonAppW702CanonicalWorkState
} from '../../assets/js/runtime/w702/eonapp-w702-canonical-work-state.js';

test('W702 creates one bounded private-by-default foreground state', () => {
  const state = createEonAppW702CanonicalWorkState({
    conversation: { id: 'chat:1', label: 'Launch room', messageCount: 4 },
    project: { id: 'project:1', label: 'EONAPP', taskCount: 3, artefactCount: 2 },
    cityLocation: { districtId: 'command-centre', x: 4.25, z: -9.5 }
  }, { now: 100 });
  assert.equal(state.schema, EONAPP_W702_CANONICAL_WORK_STATE_SCHEMA);
  assert.equal(state.project.id, 'project:1');
  assert.equal(state.conversation.privateByDefault, true);
  assert.equal(state.privatePayloadStored, false);
  assert.equal(state.automaticNavigation, false);
  assert.equal(state.automaticExecution, false);
  assert.equal(Object.isFrozen(state), true);
});

test('W702 reducer requires explicit user action and preserves existing context', () => {
  const initial = createEonAppW702CanonicalWorkState({ project: { id: 'project:1', label: 'EONAPP' }, revision: 7 }, { now: 100 });
  const rejected = reduceEonAppW702CanonicalWorkState(initial, { type: 'select-work-object', payload: { id: 'result:1' } }, { now: 101 });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.reason, 'explicit-user-action-required');
  assert.equal(rejected.state.revision, 7);

  const accepted = reduceEonAppW702CanonicalWorkState(initial, {
    type: 'select-work-object',
    payload: { id: 'result:1', kind: 'result', label: 'Verified build' },
    explicitUserAction: true
  }, { now: 102 });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.state.revision, 8);
  assert.equal(accepted.state.project.id, 'project:1');
  assert.equal(accepted.state.selectedWorkObject.id, 'result:1');
});

test('W702 rejects secret-bearing input instead of copying it into a second store', () => {
  const result = reduceEonAppW702CanonicalWorkState({}, {
    type: 'set-provider-route',
    payload: { providerId: 'mistral', apiKey: 'must-not-copy' },
    explicitUserAction: true
  }, { now: 200 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'secret-material-rejected');
  const validation = validateEonAppW702CanonicalWorkState({ token: 'must-not-copy' });
  assert.equal(validation.ok, false);
  assert.deepEqual(validation.errors, ['secret-material']);
});

test('W702 projects the same revision into Projects, Atlas, NEXUS and City', () => {
  const state = createEonAppW702CanonicalWorkState({ revision: 3, project: { id: 'p1' }, selectedWorkObject: { id: 'task:9' } }, { now: 300 });
  const projections = ['projects', 'atlas', 'nexus', 'city'].map((surface) => projectEonAppW702CanonicalWorkState(state, surface));
  assert.deepEqual(projections.map((entry) => entry.revision), [3, 3, 3, 3]);
  assert.ok(projections.every((entry) => entry.project.id === 'p1'));
  assert.ok(projections.every((entry) => entry.selectedWorkObject.id === 'task:9'));
  assert.ok(projections.every((entry) => entry.automaticNavigation === false));
});

test('W702 truth contract makes non-actions explicit', () => {
  const truth = getEonAppW702CanonicalWorkStateTruth();
  assert.equal(truth.oneCanonicalForegroundState, true);
  assert.equal(truth.readsStorage, false);
  assert.equal(truth.writesStorage, false);
  assert.equal(truth.startsProvider, false);
  assert.equal(truth.approvesAutomatically, false);
});


test('W702 controller owns one in-memory revision and notifies every surface adapter', () => {
  let clock = 400;
  const observed = [];
  const controller = createEonAppW702CanonicalWorkStateController({
    initialState: { project: { id: 'p1' } },
    now: () => ++clock,
    onChange: (state, event) => observed.push({ revision: state.revision, type: event.type })
  });
  const unsubscribe = controller.subscribe((state) => observed.push({ revision: state.revision, type: 'subscriber' }));
  const result = controller.dispatch({ type: 'select-task', payload: { id: 'task:1' }, explicitUserAction: true });
  assert.equal(result.ok, true);
  assert.equal(controller.getState().revision, 1);
  assert.equal(controller.getProjection('atlas').task.id, 'task:1');
  assert.deepEqual(observed, [{ revision: 1, type: 'select-task' }, { revision: 1, type: 'subscriber' }]);
  unsubscribe();
  assert.equal(controller.getTruth().persistsState, false);
  assert.equal(controller.getTruth().startsSideEffects, false);
});
