#!/usr/bin/env node
/** W557 source gate — safe same-tab workroom lifecycle, membership truth and consent boundary. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const required = Object.freeze([
  'assets/js/city/eon-city-workroom-overlay.js',
  'assets/js/city/eon-city-membership-map.js',
  'assets/js/city/eon-city-project-district-workspace.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/eon-city-play-station.js',
  'assets/js/notifications/eon-retention-consent.js',
  'assets/js/notifications/eon-notification-center.js',
  'tests/unit/w557-workroom-membership-retention.test.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const files = Object.fromEntries(required.map((relative) => [relative, exists(relative) ? read(relative) : '']));
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

const overlay = files['assets/js/city/eon-city-workroom-overlay.js'];
const membership = files['assets/js/city/eon-city-membership-map.js'];
const projectWorkspace = files['assets/js/city/eon-city-project-district-workspace.js'];
const runtime = files['assets/js/city/eon-city-play-babylon.js'];
const station = files['assets/js/eon-city-play-station.js'];
const retention = files['assets/js/notifications/eon-retention-consent.js'];
const notification = files['assets/js/notifications/eon-notification-center.js'];
const unit = files['tests/unit/w557-workroom-membership-retention.test.mjs'];

need(overlay, /eon\.city\.workroom-overlay\.w557\.v1/, 'workroom-schema-missing');
need(overlay, /getExplorationPose/, 'workroom-pose-capture-missing');
need(overlay, /restoreExplorationPose/, 'workroom-pose-restore-missing');
need(overlay, /pointerLockRestored: false/, 'workroom-pointer-lock-boundary-missing');
need(overlay, /explicit-user-action-required/, 'workroom-explicit-action-boundary-missing');
need(overlay, /remoteNetwork: false/, 'workroom-network-boundary-missing');
forbid(overlay, /(?:fetch|WebSocket|EventSource|localStorage|sessionStorage|indexedDB)\s*[.(]/i, 'workroom-must-not-network-or-persist');

need(runtime, /isPaused\(\)/, 'runtime-paused-state-api-missing');
need(projectWorkspace, /workroomOverlay = null/, 'project-workroom-overlay-integration-missing');
need(projectWorkspace, /id: 'project-console'/, 'project-workroom-id-missing');
need(station, /createEonCityWorkroomOverlay/, 'station-workroom-overlay-import-missing');
need(station, /cityWorkroomOverlays/, 'station-workroom-lifecycle-missing');
need(station, /renderEonCityMembershipMap/, 'station-membership-render-missing');
need(station, /bindEonCityMembershipMap/, 'station-membership-bind-missing');
need(station, /data-eon-play-open-membership/, 'station-membership-action-missing');

need(membership, /eon\.city\.membership-map\.w557\.v1/, 'membership-schema-missing');
need(membership, /subscriptionsOnlyCityMonetization: false/, 'membership-multi-rail-decision-missing');
need(membership, /advertisingOrRewardUnlocks: true/, 'membership-rewarded-access-decision-missing');
need(membership, /rewardedSponsorKeysSubscriptionReplacement: false/, 'membership-reward-not-subscription-boundary-missing');
need(membership, /publicCheckout: true/, 'membership-live-checkout-boundary-missing');
need(membership, /publicPricing: true/, 'membership-live-pricing-boundary-missing');
need(membership, /browserCheckoutGrantsAccess: false/, 'membership-browser-checkout-no-grant-boundary-missing');
need(membership, /localStorageEntitlementAuthority: false/, 'membership-local-entitlement-boundary-missing');
need(membership, /verifiedServerEntitlementRequiredBeforePaidAccess: true/, 'membership-server-entitlement-gate-missing');
need(membership, /coreCityArtificiallyLocked: false/, 'membership-core-city-boundary-missing');
forbid(membership, /(?:fetch|WebSocket|EventSource|localStorage|sessionStorage|indexedDB)\s*[.(]/i, 'membership-must-not-network-or-persist');

need(retention, /eonapp\.retention-consent\.w557\.v1/, 'retention-schema-missing');
need(retention, /googleLoginIsMarketingConsent: false/, 'retention-google-marketing-boundary-missing');
need(retention, /googleLoginIsEmailDeliveryConsent: false/, 'retention-google-email-boundary-missing');
need(retention, /eonbotMaySendWithoutUserChannelConsent: false/, 'retention-eonbot-boundary-missing');
need(notification, /renderEonRetentionConsentNotice/, 'notification-retention-notice-missing');
forbid(retention, /(?:fetch|WebSocket|EventSource|Notification\.requestPermission|PushManager|localStorage|sessionStorage|indexedDB)\s*[.(]/i, 'retention-must-not-deliver-or-persist');

need(unit, /W557 pauses a same-tab Workroom/, 'w557-workroom-unit-missing');
need(unit, /W557 projects the live seven-product City membership map/, 'w557-membership-unit-missing');
need(unit, /W557 keeps Google identity separate/, 'w557-retention-unit-missing');

const CHECK_COUNT = 39;
const report = Object.freeze({ wave: 'W557', ok: errors.length === 0, checks: CHECK_COUNT - errors.length, required: required.length, errors: Object.freeze(errors) });
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w557-workroom-membership-retention-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
