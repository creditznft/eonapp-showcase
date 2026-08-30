import test from 'node:test';
import assert from 'node:assert/strict';
import {
  W576_W590_UNIVERSE_COMPLETION_CONTRACT,
  validateW576W590UniverseCompletionContract
} from '../../config/w576-w590-universe-completion-contract.mjs';
import {
  EON_CITY_DEVICE_REVIEW_MATRIX,
  EON_CITY_EONBOT_MODES,
  EON_CITY_OPERATIONAL_DISTRICTS,
  EON_CITY_UNIVERSE_COMPLETION_WAVES,
  createEonCityUniverseCompletionController,
  getEonCityUniverseCompletionPlan,
  getEonCityW576W590Truth,
  validateEonCityUniverseCompletionPlan
} from '../../assets/js/city/eon-city-universe-completion.js';

test('W576–W590 freezes all fifteen remaining waves in canonical order', () => {
  assert.equal(EON_CITY_UNIVERSE_COMPLETION_WAVES.length, 15);
  assert.deepEqual(EON_CITY_UNIVERSE_COMPLETION_WAVES.map((wave) => wave.id), Array.from({ length: 15 }, (_value, index) => `W${576 + index}`));
  assert.deepEqual(W576_W590_UNIVERSE_COMPLETION_CONTRACT.waves.map((wave) => wave.id), EON_CITY_UNIVERSE_COMPLETION_WAVES.map((wave) => wave.id));
  assert.deepEqual(validateW576W590UniverseCompletionContract(), []);
});

test('useful district, EONBOT and device board models are present without false capabilities', () => {
  const plan = getEonCityUniverseCompletionPlan({ section: 'ai', selectedDistrictId: 'device-lab-docks', selectedModeId: 'builder' });
  assert.equal(EON_CITY_OPERATIONAL_DISTRICTS.length, 6);
  assert.equal(EON_CITY_EONBOT_MODES.length, 4);
  assert.equal(EON_CITY_DEVICE_REVIEW_MATRIX.every((entry) => entry.status === 'not-run'), true);
  assert.equal(plan.selectedDistrict.id, 'device-lab-docks');
  assert.equal(plan.selectedMode.id, 'builder');
  assert.equal(plan.remoteNetwork, false);
  assert.equal(plan.publicMultiplayer, false);
  assert.equal(plan.paymentOrEntitlement, false);
  assert.deepEqual(validateEonCityUniverseCompletionPlan(plan), []);
});

test('the controller supports local review, cancellation, mode choice and non-rewarding useful missions', () => {
  const messages = [];
  const controller = createEonCityUniverseCompletionController({ onStatus: (message) => messages.push(message) });
  const review = controller.openWorkReview('forge-court');
  assert.equal(review.ok, true);
  assert.equal(review.review.routeOpened, false);
  assert.equal(review.review.providerCalled, false);
  assert.equal(controller.cancelWorkReview().ok, true);
  assert.equal(controller.selectMode('companion').mode.id, 'companion');
  const mission = controller.startUsefulMission('review-window', 'review-work');
  assert.equal(mission.mission.reward, 'none');
  assert.equal(controller.completeUsefulMission().mission.complete, true);
  assert.equal(messages.length >= 4, true);
});

test('AI, expedition, gateway and lab operations remain local review operations', () => {
  const controller = createEonCityUniverseCompletionController();
  assert.equal(controller.reviewLocalCapability().status.externalAction, false);
  assert.equal(controller.reviewHostedProviderConsent().status.externalAction, false);
  assert.equal(controller.selectExpedition('quiet-build-garden').expedition.id, 'quiet-build-garden');
  assert.equal(controller.reviewGateway('private-project').gateway.id, 'private-project');
  assert.equal(controller.recordObservation('security', 'not-run', 'human review required').ok, true);
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.observations.length, 1);
  assert.equal(snapshot.gatewayId, 'private-project');
  assert.equal(snapshot.localCapabilityReviewed, true);
  assert.equal(snapshot.hostedProviderReviewOpened, true);
});

test('W576–W590 truth makes source completion distinct from preview, device, OAuth and owner proof', () => {
  assert.deepEqual(getEonCityW576W590Truth(), {
    schema: 'eon.city.universe-completion.w576-w590.v1',
    sourceImplementationComplete: true,
    localReviewPanel: true,
    publicCityAccessBypass: false,
    oauthOrCaptchaAutomation: false,
    credentialCollection: false,
    providerCallFromCity: false,
    microphoneOrAudioActivation: false,
    paymentOrEntitlementActivation: false,
    rewardOrChanceMechanic: false,
    publicMultiplayerClaim: false,
    backgroundNetworkOrTelemetry: false,
    automaticCertification: false,
    automaticProductionApproval: false,
    previewEvidenceProven: false,
    productionEvidenceProven: false,
    deviceEvidenceProven: false,
    oauthEvidenceProven: false,
    ownerApprovalProven: false
  });
});
