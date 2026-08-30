import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_EONBOT_COMPANION_DEFAULT_SKIN,
  EON_CITY_EONBOT_COMPANION_SCHEMA,
  createEonCityEonbotCompanionPlan,
  getEonCityEonbotCompanionSkin,
  getEonCityEonbotCompanionSkins,
  getEonCityEonbotCompanionTruth
} from '../../assets/js/contracts/city/eon-city-eonbot-companion.js';
import { inspectW561EonbotCompanion } from '../../scripts/w561-eonbot-companion-gate.mjs';

test('W561 defines original visual-only EONBOT skins without a subscriber entitlement claim', () => {
  const skins = getEonCityEonbotCompanionSkins();
  assert.equal(skins.length, 3);
  assert.deepEqual(skins.map((skin) => skin.id), ['command-orbit', 'signal-mist', 'forge-prism']);
  for (const skin of skins) {
    assert.equal(skin.visualOnly, true);
    assert.equal(skin.commercialEntitlementRequired, false);
    assert.equal(skin.subscriptionBenefitClaimed, false);
  }
  assert.equal(getEonCityEonbotCompanionSkin('not-a-skin').id, EON_CITY_EONBOT_COMPANION_DEFAULT_SKIN);
  const plan = createEonCityEonbotCompanionPlan({ skinId: 'forge-prism', nearbyLandmarkId: 'command-centre', receiptVisible: true });
  assert.equal(plan.schema, EON_CITY_EONBOT_COMPANION_SCHEMA);
  assert.equal(plan.identity.personClaimed, false);
  assert.equal(plan.identity.providerClaimed, false);
  assert.equal(plan.visual.skinId, 'forge-prism');
  assert.equal(plan.visual.originalProcedural, true);
  assert.equal(plan.visual.binaryAssetRequired, false);
  assert.equal(plan.visual.subscriptionBenefitClaimed, false);
  assert.equal(plan.caption.captionsFirst, true);
  assert.equal(plan.caption.voiceStarted, false);
  assert.equal(plan.caption.microphoneRequested, false);
  assert.equal(plan.caption.kind, 'status-only');
});

test('W561 Lite or reduced-motion companion stays local, captions-first, and non-autonomous', () => {
  const plan = createEonCityEonbotCompanionPlan({ quality: 'lite', reducedMotion: true });
  assert.equal(plan.visual.detail, 'reduced');
  assert.equal(plan.caption.kind, 'reduced-motion');
  assert.equal(plan.behavior.localFormationMotion, true);
  assert.equal(plan.behavior.autonomousNavigation, false);
  assert.equal(plan.behavior.autonomousTask, false);
  assert.equal(plan.behavior.backgroundAgent, false);
  assert.equal(plan.behavior.readsPrivateData, false);
  assert.equal(plan.behavior.readsPrompt, false);
  assert.equal(plan.behavior.readsProject, false);
  assert.equal(plan.behavior.readsVault, false);
  assert.equal(plan.behavior.providerRequestCreated, false);
  assert.equal(plan.behavior.opensRoute, false);
  assert.equal(plan.behavior.approvesWork, false);
  assert.equal(plan.behavior.sendsMessage, false);
  assert.equal(plan.behavior.startsAudio, false);
  assert.equal(plan.behavior.startsMicrophone, false);
  assert.equal(plan.localOnly, true);
  assert.equal(plan.networkRequestCreated, false);
  assert.equal(plan.browserStorageWritten, false);
  assert.equal(plan.privateContentVisible, false);
});

test('W561 source gate and truth remain fail-closed about private data, voice, routing, storage, and subscriptions', () => {
  const gate = inspectW561EonbotCompanion();
  const truth = getEonCityEonbotCompanionTruth();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 24);
  assert.equal(truth.originalProcedural, true);
  assert.equal(truth.autonomousAgent, false);
  assert.equal(truth.backgroundWorkStarted, false);
  assert.equal(truth.providerRequestCreated, false);
  assert.equal(truth.networkRequestCreated, false);
  assert.equal(truth.browserStorageWritten, false);
  assert.equal(truth.privateDataRead, false);
  assert.equal(truth.promptVisible, false);
  assert.equal(truth.projectVisible, false);
  assert.equal(truth.vaultVisible, false);
  assert.equal(truth.microphoneRequested, false);
  assert.equal(truth.voiceStarted, false);
  assert.equal(truth.routeOpened, false);
  assert.equal(truth.subscriptionEntitlementClaimed, false);
  assert.equal(truth.liveVoiceProof, false);
});
