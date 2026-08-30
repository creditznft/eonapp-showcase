import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  createEonAppW700SignatureFlowController,
  simulateEonAppW700SignatureFlow,
  validateEonAppW700SignatureFlow,
  getEonAppW700SignatureFlowTruth
} from '../../assets/js/nexus/w700/eonapp-w700-signature-flow.js';

test('W700 completes the explicit Pulse to Nexus to City to My Realm return journey', () => {
  const simulation = simulateEonAppW700SignatureFlow();
  assert.equal(simulation.ok, true);
  assert.equal(simulation.state.stage, 'core-returned');
  assert.equal(simulation.validation.ok, true, simulation.validation.errors.join(' | '));
  assert.equal(simulation.state.receipts.length, 11);
  assert.ok(simulation.state.myRealm?.zoneId);
});

test('W700 cannot skip work-object selection or Atlas review before City', () => {
  const controller = createEonAppW700SignatureFlowController({ now: () => 1761350400000 });
  assert.equal(controller.reviewCityHandoff({ sourceSurfaceId: 'projects', explicitUserAction: true }).reason, 'atlas-review-required');
  assert.equal(controller.openNexus({ explicitUserAction: true }).ok, true);
  assert.equal(controller.reviewAtlas({ project: { id: 'p', selected: true }, explicitUserAction: true }).reason, 'work-object-selection-required');
  assert.equal(controller.selectWorkObject({ selectedWorkObject: { id: 'result:1', kind: 'result', label: 'Result' }, project: { id: 'p', selected: true }, explicitUserAction: true }).ok, true);
  assert.equal(controller.reviewCityHandoff({ sourceSurfaceId: 'projects', explicitUserAction: true }).reason, 'atlas-review-required');
});

test('W700 rejects a mismatched physical City work object', () => {
  const controller = createEonAppW700SignatureFlowController({ now: (() => { let n = 1761350400000; return () => n++; })() });
  controller.openNexus({ explicitUserAction: true });
  controller.selectWorkObject({ selectedWorkObject: { id: 'task:1', kind: 'task', label: 'Task' }, project: { id: 'p', selected: true }, explicitUserAction: true });
  controller.reviewAtlas({ project: { id: 'p', selected: true }, explicitUserAction: true });
  controller.reviewCityHandoff({ sourceSurfaceId: 'workspace', explicitUserAction: true });
  controller.confirmCityEntry({ explicitUserAction: true });
  const state = controller.getState();
  const mismatch = controller.inspectWorkObject({ workObjectId: 'task:other', districtId: state.handoff.placement.districtId, stationId: state.handoff.placement.stationId, explicitUserAction: true });
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.reason, 'physical-work-object-mismatch');
});

test('W700 reflects My Realm only from a verified bounded receipt', () => {
  const simulation = simulateEonAppW700SignatureFlow();
  assert.equal(simulation.state.verifiedOutcome.transformation.verifiedBoundedReceipt, true);

  const controller = createEonAppW700SignatureFlowController({ initialState: { ...simulation.state, stage: 'native-action-confirmed', verifiedOutcome: null, myRealm: null, receipts: simulation.state.receipts.slice(0, 8) } });
  const rejected = controller.recordVerifiedOutcome({ receiptId: 'unverified-1', type: 'city.real-work-receipt', verified: false, explicitUserAction: true });
  assert.equal(rejected.reason, 'verified-bounded-receipt-required');
});

test('W700 truth preserves one EONBOT and all explicit boundaries', () => {
  const truth = getEonAppW700SignatureFlowTruth();
  assert.equal(truth.oneEonbot, true);
  assert.equal(truth.atlasRequiredBeforeCity, true);
  assert.equal(truth.sameWorkObjectInCity, true);
  assert.equal(truth.verifiedOutcomeRequired, true);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticExecution, false);
  assert.equal(truth.automaticApproval, false);
});

test('W700 active owners consume the signature-flow authority', () => {
  const sources = [
    ['../../assets/js/nexus/eon-nexus-app-shell.js', /createEonAppW700SignatureFlowController/],
    ['../../assets/js/nexus/eon-nexus-live.js', /onSignatureFlowEvent/],
    ['../../assets/js/city/w659n/eon-city-w659n-product-layer.js', /advanceSignatureCityEntry/],
    ['../../assets/js/city/eon-city-living-nexus-panel.js', /returnCore/]
  ];
  for (const [relative, pattern] of sources) {
    const source = fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
    assert.match(source, pattern, relative);
  }
  const simulation = simulateEonAppW700SignatureFlow();
  assert.equal(validateEonAppW700SignatureFlow(simulation.state).complete, true);
});
