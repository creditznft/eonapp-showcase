import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_LANDMARK_FOCUS_SCHEMA,
  createEonCityLandmarkFocusState,
  getEonCityLandmarkInteractionActions,
  normalizeEonCityLandmarkFocus
} from '../../assets/js/city/eon-city-landmark-focus.js';

test('W556 defines exactly four bounded landmark actions with review-first Quick Open', () => {
  const actions = getEonCityLandmarkInteractionActions();
  assert.deepEqual(actions.map((action) => action.id), ['enter', 'guide', 'quick-open', 'inspect']);
  assert.equal(actions.every((action) => action.localOnly && action.opensRoute === false && action.executesWork === false), true);
  assert.equal(actions.find((action) => action.id === 'quick-open').requiresVisibleReview, true);
});

test('W556 normalizes a local landmark focus without private content or automatic navigation claims', () => {
  const focus = normalizeEonCityLandmarkFocus({ id: ' Command Centre ', source: 'controller', distance: 2.04, radius: 4.6 });
  assert.equal(focus.schema, EON_CITY_LANDMARK_FOCUS_SCHEMA);
  assert.equal(focus.id, 'command-centre');
  assert.equal(focus.source, 'controller');
  assert.equal(focus.nearby, true);
  assert.equal(focus.readsPrivateWork, false);
  assert.equal(focus.remoteNetwork, false);
  assert.equal(focus.opensRoute, false);
  assert.equal(normalizeEonCityLandmarkFocus({ id: '' }), null);
});

test('W556 focus state safely replaces hover with keyboard/controller selection and clears without persistence', () => {
  const state = createEonCityLandmarkFocusState();
  state.focus({ id: 'archive', source: 'hover', distance: 5, radius: 3.8 });
  assert.equal(state.getSnapshot().nearby, false);
  state.focus({ id: 'archive', source: 'keyboard', distance: 2, radius: 3.8 });
  const selected = state.getSnapshot();
  assert.equal(selected.source, 'keyboard');
  assert.equal(selected.nearby, true);
  assert.equal(Object.isFrozen(selected), true);
  assert.equal(state.clear(), null);
  assert.equal(state.getSnapshot(), null);
});
