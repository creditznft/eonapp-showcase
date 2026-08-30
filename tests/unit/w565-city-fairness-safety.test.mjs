import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_FAIRNESS_SAFETY_SCHEMA,
  getEonCityFairnessSafetyRules,
  getEonCityFairnessSafetyTruth,
  renderEonCityFairnessSafety,
  validateEonCityFairnessSafety
} from '../../assets/js/city/eon-city-fairness-safety.js';
import { inspectW565CityFairnessSafety } from '../../scripts/w565-city-fairness-safety-gate.mjs';

test('W565 keeps the useful Free City core, optional missions, live paid access and bounded Sponsor Keys honest', () => {
  const rules = getEonCityFairnessSafetyRules();
  assert.deepEqual(rules.map((rule) => rule.id), [
    'useful-free-core',
    'optional-route-missions',
    'no-random-value',
    'premium-truth',
    'rewarded-truth',
    'device-respect',
    'consent-first-return'
  ]);
  const truth = getEonCityFairnessSafetyTruth();
  assert.equal(truth.schema, EON_CITY_FAIRNESS_SAFETY_SCHEMA);
  assert.equal(truth.usefulFreeCore, true);
  assert.equal(truth.subscriptionsOnlyWhenReleased, false);
  assert.equal(truth.paidAccessLive, true);
  assert.equal(truth.rewardedSponsorKeysOptional, true);
  assert.equal(truth.rewardedSponsorKeysSubscriptionReplacement, false);
  assert.equal(truth.currentCheckoutReleased, true);
  assert.equal(truth.currentPricingReleased, true);
  assert.equal(truth.localStorageEntitlementAuthority, false);
  assert.equal(truth.missionOffersOptional, true);
  assert.equal(truth.missionExpiryPenalty, false);
  assert.equal(truth.missionDismissalPenalty, false);
  assert.equal(truth.missionReceiptCreatesValue, false);
  assert.equal(truth.missionReceiptCreatesReward, false);
  assert.equal(truth.missionReceiptCreatesSubscriptionBenefit, false);
  assert.equal(truth.missionExpiryDoesNotRemoveCoreAccess, true);
  assert.equal(truth.missionRetryRequiresNewVisibleRouteChoice, true);
});

test('W565 rejects chance, pressure, penalties, unconsented delivery, and unsupported live claims', () => {
  const truth = getEonCityFairnessSafetyTruth();
  for (const key of [
    'variableRewardMechanic', 'chanceOrLootMechanic', 'rarityOrCollectibleClaim', 'xpOrStreakPressure', 'payToWinClaim',
    'reducedMotionPenalty', 'liteModePenalty', 'lowDevicePenalty', 'pauseOrExitPenalty',
    'browserPermissionPrompt', 'automaticOutboundNotificationDelivery', 'emailOrNewsletterConsentFromGoogle',
    'socialMessageConsentFromGoogle', 'eonbotOutboundWithoutConsent', 'publicMultiplayerClaimed', 'socialDirectMessageAutomation',
    'liveBillingProof', 'liveOutboundDeliveryProof'
  ]) assert.equal(truth[key], false, `${key} must remain false`);
  assert.equal(truth.advertisementOrRewardUnlock, true);
  assert.equal(truth.localActivityCenterAvailable, true);
  assert.equal(truth.optInServiceNotificationSourceReady, true);
  assert.equal(truth.browserPushSubscriptionOptInOnly, true);
  assert.equal(truth.clientDeviceQuietHoursEnforced, true);
  assert.equal(validateEonCityFairnessSafety(truth).ok, true);
  const unsafe = { ...truth, chanceOrLootMechanic: true, automaticOutboundNotificationDelivery: true };
  const invalid = validateEonCityFairnessSafety(unsafe);
  assert.equal(invalid.ok, false);
  assert.ok(invalid.violations.includes('chanceOrLootMechanic-must-be-false'));
  assert.ok(invalid.violations.includes('automaticOutboundNotificationDelivery-must-be-false'));
});

test('W565 renders a read-only fair-play panel without checkout, delivery controls, or unrequested permissions', () => {
  const markup = renderEonCityFairnessSafety();
  assert.equal(markup.includes('Your pace stays yours'), true);
  assert.equal(markup.includes('data-eon-play-open-fairness'), false);
  assert.equal(markup.includes('data-eon-play-close-fairness'), true);
  assert.equal(markup.includes('data-eon-play-subscribe'), false);
  assert.equal(markup.includes('Notification.requestPermission'), false);
  assert.equal(markup.includes('PushManager'), false);
  assert.equal(markup.includes('mailto:'), false);
  assert.equal(/(?:fetch|WebSocket|EventSource)\s*\(/.test(markup), false);
});

test('W565 source gate stays fail-closed about coercion, entitlement, delivery, and accessibility penalties', () => {
  const report = inspectW565CityFairnessSafety();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 37);
});
