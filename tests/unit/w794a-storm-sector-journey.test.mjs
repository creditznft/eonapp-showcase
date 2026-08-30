import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW794AStormSectorJourney } from '../../assets/js/city/w794/eon-expanse-w794a-storm-sector-journey.js';

const activation = {
  activationId: 'future-region-activation:preview:storm-sector',
  regionId: 'storm-sector', packageDigest: 'a'.repeat(64), buildDigest: 'b'.repeat(64), deploymentChannel: 'preview', activatedAt: 10,
  gatewayActivated: true, regionRendered: false, explicitOwnerAction: true, automaticActivation: false, privateContentStored: false
};

test('W794A remains locked until exact gateway activation exists', () => {
  const journey = createEonExpanseW794AStormSectorJourney({ now: () => 1000 });
  assert.equal(journey.getState().status, 'gateway-locked');
  assert.equal(journey.startEnter({ explicitUserAction: true }).ok, false);
  journey.syncActivation(activation);
  assert.equal(journey.getState().status, 'gateway-ready');
});

test('W794A entry and return require explicit user actions and complete through bounded transitions', () => {
  let time = 1000;
  const journey = createEonExpanseW794AStormSectorJourney({ now: () => time, durationMs: 1000 });
  journey.syncActivation(activation);
  assert.equal(journey.startEnter({ explicitUserAction: false }).ok, false);
  assert.equal(journey.startEnter({ explicitUserAction: true, expectedActivationId: activation.activationId }).ok, true);
  time = 1500;
  assert.equal(journey.update().state.status, 'departing');
  time = 2000;
  const entered = journey.update();
  assert.equal(entered.completed, true);
  assert.equal(entered.transition.regionId, 'storm-sector');
  assert.equal(journey.consumeTransition().ok, true);
  assert.equal(journey.getState().status, 'storm-sector-active');
  assert.equal(journey.startReturn({ explicitUserAction: true, expectedActivationId: activation.activationId }).ok, true);
  time = 3000;
  const returned = journey.update();
  assert.equal(returned.transition.regionId, 'signal-frontier');
});

test('W794A never grants XP or travels automatically', () => {
  const journey = createEonExpanseW794AStormSectorJourney({ now: () => 1000 });
  journey.syncActivation(activation);
  const state = journey.getState();
  assert.equal(state.automaticTravel, false);
  assert.equal(state.grantsXp, false);
  assert.equal(state.privateContentStored, false);
});
