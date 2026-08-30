import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_EONBOT_RIG_SCHEMA,
  createEonCityEonbotRigPlan,
  getEonCityEonbotRigQualityOrder,
  getEonCityEonbotRigTruth,
  validateEonCityEonbotRigPlan
} from '../../assets/js/city/eon-city-eonbot-rig.js';
import { inspectW571EonbotRigAndStaging } from '../../scripts/w571-eonbot-rig-and-staging-gate.mjs';

test('W571 defines bounded source-controlled EONBOT rig profiles for Lite, Balanced, and Cinematic', () => {
  assert.deepEqual(getEonCityEonbotRigQualityOrder(), ['lite', 'balanced', 'cinematic']);
  const lite = createEonCityEonbotRigPlan({ quality: 'lite' });
  const balanced = createEonCityEonbotRigPlan({ quality: 'balanced', companionSkinId: 'signal-mist' });
  const cinematic = createEonCityEonbotRigPlan({ quality: 'cinematic', companionSkinId: 'forge-prism' });
  assert.equal(lite.schema, EON_CITY_EONBOT_RIG_SCHEMA);
  assert.equal(lite.rig.originalProcedural, true);
  assert.equal(lite.rig.binaryAssets, false);
  assert.equal(lite.rig.remoteAssets, false);
  assert.equal(lite.rig.finCount, 0);
  assert.equal(lite.rig.stageBeaconCount, 0);
  assert.equal(lite.staging.motionEnabled, false);
  assert.equal(balanced.rig.finCount, 2);
  assert.equal(balanced.rig.orbitRingCount, 2);
  assert.equal(cinematic.rig.finCount, 4);
  assert.equal(cinematic.rig.orbitRingCount, 3);
  assert.equal(cinematic.rig.meshBudget > balanced.rig.meshBudget, true);
  assert.equal(validateEonCityEonbotRigPlan(lite).ok, true);
  assert.equal(validateEonCityEonbotRigPlan(balanced).ok, true);
  assert.equal(validateEonCityEonbotRigPlan(cinematic).ok, true);
});

test('W571 stages the companion in one captions-first safe panel with no voice, work, data, route, or commercial side effect', () => {
  const plan = createEonCityEonbotRigPlan({ quality: 'cinematic' });
  assert.equal(plan.panel.id, 'eonbot-companion-panel');
  assert.equal(plan.panel.opensSameSafePanel, true);
  assert.equal(plan.panel.captionsFirst, true);
  assert.equal(plan.panel.startsVoice, false);
  assert.equal(plan.panel.requestsMicrophone, false);
  assert.equal(plan.panel.startsWork, false);
  assert.equal(plan.panel.opensRoute, false);
  assert.equal(plan.panel.readsPrivateData, false);
  assert.equal(plan.panel.backgroundActivity, false);
  assert.equal(plan.staging.pauseRespected, true);
  assert.equal(plan.staging.reducedEffectsRespected, true);
  assert.equal(plan.subscriptionEntitlementClaimed, false);
  assert.equal(plan.commercialStatus, 'visual-only-no-entitlement');
  const truth = getEonCityEonbotRigTruth({ quality: 'balanced' });
  assert.equal(truth.sameSafePanel, true);
  assert.equal(truth.microphoneRequested, false);
  assert.equal(truth.voiceStarted, false);
  assert.equal(truth.autonomousWorkStarted, false);
  assert.equal(truth.privateDataRead, false);
  assert.equal(truth.routeOpened, false);
  assert.equal(truth.subscriptionEntitlementClaimed, false);
});

test('W571 rejects unsafe extra fields, enlarged budgets, private fields, and false entitlement state', () => {
  const safe = createEonCityEonbotRigPlan({ quality: 'balanced' });
  assert.equal(validateEonCityEonbotRigPlan({ ...safe, projectId: 'private' }).ok, false);
  assert.equal(validateEonCityEonbotRigPlan({ ...safe, rig: { ...safe.rig, meshBudget: 999 } }).ok, false);
  assert.equal(validateEonCityEonbotRigPlan({ ...safe, panel: { ...safe.panel, startsVoice: true } }).ok, false);
  assert.equal(validateEonCityEonbotRigPlan({ ...safe, subscriptionEntitlementClaimed: true }).ok, false);
});

test('W571 source gate keeps rigging and staging local, procedural, bounded, and separate from ambient NPCs', () => {
  const report = inspectW571EonbotRigAndStaging({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 15);
});
