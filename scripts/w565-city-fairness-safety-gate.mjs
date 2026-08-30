#!/usr/bin/env node
/** W565 source gate — City mission fairness, accessibility and consent-first return policy. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-fairness-safety.js',
  'assets/js/city/eon-city-membership-map.js',
  'assets/js/contracts/city/city-work-mission.js',
  'assets/js/notifications/eon-notification-center.js',
  'assets/js/notifications/eon-retention-consent.js',
  'assets/js/eon-city-play-station.js',
  'tests/unit/w565-city-fairness-safety.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const files = Object.fromEntries(required.map((relative) => [relative, exists(relative) ? read(relative) : '']));
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

const fairness = files['assets/js/city/eon-city-fairness-safety.js'];
const membership = files['assets/js/city/eon-city-membership-map.js'];
const mission = files['assets/js/contracts/city/city-work-mission.js'];
const activity = files['assets/js/notifications/eon-notification-center.js'];
const retention = files['assets/js/notifications/eon-retention-consent.js'];
const station = files['assets/js/eon-city-play-station.js'];
const unit = files['tests/unit/w565-city-fairness-safety.test.mjs'];
const runner = files['scripts/run-current-unit-suite.mjs'];

need(fairness, /EON_CITY_FAIRNESS_SAFETY_SCHEMA\s*=\s*'eon\.city\.fairness-safety\.w565\.v1'/, 'fairness-schema-missing');
need(fairness, /usefulFreeCore:/, 'free-core-contract-missing');
need(fairness, /subscriptionsOnlyWhenReleased:/, 'subscription-truth-missing');
need(fairness, /currentCheckoutReleased:/, 'checkout-truth-missing');
need(fairness, /missionOffersOptional:\s*true/, 'optional-mission-boundary-missing');
need(fairness, /missionExpiryPenalty:\s*false/, 'expiry-penalty-boundary-missing');
need(fairness, /missionDismissalPenalty:\s*false/, 'dismissal-penalty-boundary-missing');
need(fairness, /missionReceiptCreatesValue:\s*false/, 'mission-value-boundary-missing');
need(fairness, /missionReceiptCreatesReward:\s*false/, 'mission-reward-boundary-missing');
need(fairness, /missionReceiptCreatesSubscriptionBenefit:\s*false/, 'mission-subscription-boundary-missing');
need(fairness, /missionExpiryDoesNotRemoveCoreAccess:\s*true/, 'mission-core-access-boundary-missing');
need(fairness, /variableRewardMechanic:\s*false/, 'variable-reward-boundary-missing');
need(fairness, /chanceOrLootMechanic:\s*false/, 'chance-boundary-missing');
need(fairness, /rarityOrCollectibleClaim:\s*false/, 'rarity-boundary-missing');
need(fairness, /xpOrStreakPressure:\s*false/, 'streak-boundary-missing');
need(fairness, /payToWinClaim:\s*false/, 'pay-to-win-boundary-missing');
need(fairness, /reducedMotionPenalty:\s*false/, 'reduced-motion-boundary-missing');
need(fairness, /liteModePenalty:\s*false/, 'lite-mode-boundary-missing');
need(fairness, /lowDevicePenalty:\s*false/, 'low-device-boundary-missing');
need(fairness, /pauseOrExitPenalty:\s*false/, 'pause-exit-boundary-missing');
need(fairness, /automaticOutboundNotificationDelivery:\s*retention\.automaticOutboundDelivery\s*===\s*true/, 'automatic-outbound-delivery-boundary-missing');
need(fairness, /optInServiceNotificationSourceReady:\s*activity\.deviceNotificationDelivery\s*===\s*true/, 'opt-in-service-alert-source-boundary-missing');
need(fairness, /browserPushSubscriptionOptInOnly:/, 'push-opt-in-boundary-missing');
need(fairness, /clientDeviceQuietHoursEnforced:/, 'quiet-hours-enforcement-boundary-missing');
need(fairness, /emailOrNewsletterConsentFromGoogle:\s*retention\.googleLoginIsMarketingConsent\s*===\s*true\s*\|\|\s*retention\.googleLoginIsEmailDeliveryConsent\s*===\s*true/, 'google-email-consent-boundary-missing');
need(fairness, /eonbotOutboundWithoutConsent:\s*retention\.eonbotMaySendWithoutUserChannelConsent\s*===\s*true/, 'eonbot-outbound-boundary-missing');
need(fairness, /physicalDeviceProof:\s*false/, 'device-proof-boundary-missing');
need(fairness, /renderEonCityFairnessSafety/, 'fairness-render-missing');
need(fairness, /bindEonCityFairnessSafety/, 'fairness-binder-missing');
need(fairness, /city-fairness-safety/, 'same-tab-workroom-boundary-missing');
forbid(fairness, /(?:fetch|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|Notification\.requestPermission|PushManager)\s*[.(]/i, 'fairness-must-not-store-network-or-prompt');

need(membership, /coreCityArtificiallyLocked:\s*false/, 'membership-free-core-boundary-missing');
need(membership, /publicCheckout:\s*true/, 'membership-live-checkout-boundary-missing');
need(membership, /publicPricing:\s*true/, 'membership-live-pricing-boundary-missing');
need(membership, /rewardedSponsorKeysOptional:\s*true/, 'membership-rewarded-sponsor-boundary-missing');
need(membership, /rewardedSponsorKeysSubscriptionReplacement:\s*false/, 'membership-reward-not-subscription-boundary-missing');
need(membership, /localStorageEntitlementAuthority:\s*false/, 'membership-no-local-entitlement-boundary-missing');
need(mission, /dataScope:\s*'opaque-receipt-only-no-user-content'/, 'mission-opaque-receipt-boundary-missing');
need(activity, /deviceNotificationDelivery:\s*true/, 'activity-device-delivery-source-missing');
need(activity, /clientDeviceQuietHoursEnforced:\s*true/, 'activity-quiet-hours-enforcement-missing');
need(retention, /googleLoginIsMarketingConsent:\s*false/, 'retention-google-marketing-boundary-missing');
need(retention, /automaticOutboundDelivery:\s*false/, 'retention-outbound-boundary-missing');
need(retention, /eonbotMaySendWithoutUserChannelConsent:\s*false/, 'retention-eonbot-boundary-missing');
need(station, /renderEonCityFairnessSafety/, 'station-fairness-render-missing');
need(station, /bindEonCityFairnessSafety/, 'station-fairness-binder-missing');
need(station, /data-eon-play-open-fairness/, 'station-fairness-control-missing');
need(unit, /W565 keeps the useful Free City core/, 'w565-core-unit-missing');
need(unit, /W565 rejects chance, pressure, penalties/, 'w565-boundary-unit-missing');
need(runner, /w565-city-fairness-safety\.test\.mjs/, 'w565-current-suite-registration-missing');

const CHECK_COUNT = 49;
export function inspectW565CityFairnessSafety() {
  return Object.freeze({ wave: 'W565', status: errors.length ? 'fail' : 'pass', checkCount: CHECK_COUNT - errors.length, requiredCount: required.length, errors: Object.freeze([...errors]) });
}
const report = inspectW565CityFairnessSafety();
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w565-city-fairness-safety-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'pass') {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
