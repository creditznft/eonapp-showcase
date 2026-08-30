import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_WORKROOM_OVERLAY_SCHEMA,
  createEonCityWorkroomOverlay
} from '../../assets/js/city/eon-city-workroom-overlay.js';
import {
  EON_CITY_MEMBERSHIP_MAP_SCHEMA,
  getEonCityMembershipMap,
  getEonCityMembershipTruth,
  renderEonCityMembershipMap
} from '../../assets/js/city/eon-city-membership-map.js';
import {
  EON_RETENTION_CONSENT_SCHEMA,
  EON_RETENTION_CHANNELS,
  getEonRetentionConsentTruth,
  renderEonRetentionConsentNotice
} from '../../assets/js/notifications/eon-retention-consent.js';

function createRuntime() {
  const calls = [];
  let paused = false;
  const pose = Object.freeze({ player: Object.freeze({ x: 4, y: 0, z: -3, heading: 1.2 }), camera: Object.freeze({ alpha: .3, beta: 1.1, radius: 9, target: Object.freeze({ x: 4, y: 1.2, z: -3 }) }), controller: Object.freeze({ mode: 'third-person', pointerLookEnabled: true }) });
  return {
    calls,
    getExplorationPose() { calls.push('capture'); return pose; },
    restoreExplorationPose(value) { calls.push(['restore', value]); return value; },
    isPaused() { return paused; },
    pause() { calls.push('pause'); paused = true; },
    resume() { calls.push('resume'); paused = false; }
  };
}

test('W557 pauses a same-tab Workroom, restores the exact City pose, and never restores pointer lock', () => {
  const runtime = createRuntime();
  const overlay = createEonCityWorkroomOverlay({ runtime });
  assert.equal(overlay.getSnapshot().schema, EON_CITY_WORKROOM_OVERLAY_SCHEMA);
  assert.equal(overlay.open({ id: 'project-console' }).error, 'explicit-user-action-required');
  const opened = overlay.open({ id: 'project-console', explicitUserAction: true });
  assert.equal(opened.ok, true);
  assert.equal(opened.poseCaptured, true);
  assert.equal(opened.pausedByOverlay, true);
  assert.equal(overlay.getSnapshot().activeId, 'project-console');
  assert.deepEqual(runtime.calls.slice(0, 2), ['capture', 'pause']);
  const closed = overlay.close({ explicitUserAction: true });
  assert.equal(closed.ok, true);
  assert.equal(closed.poseRestored, true);
  assert.equal(closed.pointerLockRestored, false);
  assert.equal(runtime.calls.some((call) => Array.isArray(call) && call[0] === 'restore'), true);
  assert.equal(runtime.calls.includes('resume'), true);
  assert.equal(overlay.getSnapshot().active, false);
  assert.equal(overlay.getSnapshot().remoteNetwork, false);
});

test('W557 respects an already-paused City instead of resuming it unexpectedly', () => {
  const runtime = createRuntime();
  runtime.pause();
  const overlay = createEonCityWorkroomOverlay({ runtime });
  const opened = overlay.open({ id: 'membership-map', explicitUserAction: true });
  assert.equal(opened.ok, true);
  assert.equal(opened.pausedByOverlay, false);
  overlay.close({ explicitUserAction: true });
  assert.equal(runtime.calls.includes('resume'), false);
});

test('W557 projects the live seven-product City membership map while keeping entitlement server-authoritative', () => {
  const tiers = getEonCityMembershipMap();
  assert.equal(tiers.map((tier) => tier.id).join(','), 'eon-free,eon-plus,eon-studio,eon-power,eon-max,eon-pro,eon-ultra,eon-ultimate');
  assert.equal(tiers.find((tier) => tier.id === 'eon-free').availableNow, true);
  assert.equal(tiers.filter((tier) => tier.id !== 'eon-free').every((tier) => tier.availableNow === true && tier.requiresVerifiedEntitlement === true), true);
  const truth = getEonCityMembershipTruth();
  assert.equal(truth.schema, EON_CITY_MEMBERSHIP_MAP_SCHEMA);
  assert.equal(truth.subscriptionsOnlyCityMonetization, false);
  assert.equal(truth.advertisingOrRewardUnlocks, true);
  assert.equal(truth.rewardedSponsorKeysOptional, true);
  assert.equal(truth.rewardedSponsorKeysSubscriptionReplacement, false);
  assert.equal(truth.publicCheckout, true);
  assert.equal(truth.publicPricing, true);
  assert.equal(truth.localStorageEntitlementAuthority, false);
  assert.equal(truth.browserCheckoutGrantsAccess, false);
  const markup = renderEonCityMembershipMap();
  assert.equal(markup.includes('six recurring subscriptions plus Ultimate one-time software access'), true);
  assert.equal(markup.includes('Open Plans &amp; Billing'), true);
  assert.equal(markup.includes('Not on sale.'), false);
  assert.equal(markup.includes('data-eon-play-subscribe'), false);
});

test('W557 keeps Google identity separate from email, push and social-message consent', () => {
  const truth = getEonRetentionConsentTruth();
  assert.equal(truth.schema, EON_RETENTION_CONSENT_SCHEMA);
  assert.equal(truth.googleLoginIsMarketingConsent, false);
  assert.equal(truth.googleLoginIsEmailDeliveryConsent, false);
  assert.equal(truth.googleLoginIsSocialMessageConsent, false);
  assert.equal(truth.googleLoginIsBrowserPushConsent, false);
  assert.equal(truth.eonbotMaySendWithoutUserChannelConsent, false);
  assert.equal(EON_RETENTION_CHANNELS.find((channel) => channel.id === 'in-app-activity').state, 'released-local-only');
  assert.equal(EON_RETENTION_CHANNELS.find((channel) => channel.id === 'browser-push-service').state, 'source-ready-opt-in');
  assert.equal(EON_RETENTION_CHANNELS.filter((channel) => !['in-app-activity', 'browser-push-service'].includes(channel.id)).every((channel) => channel.state === 'not-released'), true);
  const markup = renderEonRetentionConsentNotice();
  assert.equal(markup.includes('never enrols you'), true);
  assert.equal(/mailto:|Notification\.requestPermission|PushManager|fetch\s*\(/.test(markup), false);
});
