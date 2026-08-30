/**
 * W565 — EON City fairness, safety, accessibility and retention contract.
 *
 * City is a useful visual workspace, not a variable-reward loop or an
 * outbound-retention engine. This module exposes the current source-backed
 * boundaries in one inspectable local panel. It stores nothing, sends
 * nothing, requests no permissions, and never turns a browser preference into
 * membership, payment, account, or delivery authority.
 */
import { getEonCityMembershipTruth } from './eon-city-membership-map.js';
import { getEonNotificationCenterTruth } from '../notifications/eon-notification-center.js';
import { getEonRetentionConsentTruth } from '../notifications/eon-retention-consent.js';

export const EON_CITY_FAIRNESS_SAFETY_SCHEMA = 'eon.city.fairness-safety.w565.v1';

const freeze = (value) => Object.freeze(value);

export const EON_CITY_FAIRNESS_SAFETY_RULES = freeze([
  freeze({ id: 'useful-free-core', title: 'Useful Free core', detail: 'Arrival, map, City Lite fallback, accessibility controls, project-safe Workroom return, core work paths, guide, local activity preferences and visual styles remain useful without a membership.' }),
  freeze({ id: 'optional-route-missions', title: 'Optional route missions', detail: 'Mission cards are local route reminders. Dismissing or letting a stale receipt expire never removes core access, work, safety settings, backups, or account value.' }),
  freeze({ id: 'no-random-value', title: 'No random value loop', detail: 'City does not use chance, loot, rarity, XP, credits, tokens, prizes, streaks, referral pressure, pay-to-win, or fabricated completion events.' }),
  freeze({ id: 'premium-truth', title: 'Paid access truth', detail: 'Paid City/workroom capability follows the canonical EONAPP catalogue and the signed server entitlement. Six recurring subscriptions and Ultimate one-time software access are purchasable through Billing; browser state never grants paid access.' }),
  freeze({ id: 'rewarded-truth', title: 'Sponsored access truth', detail: 'Sponsored Missions are voluntary. Numeric EONKEYS are credited only after a trusted MyLead server postback confirms an eligible conversion, then can be redeemed for bounded temporary feature access. Browser actions never mint; rewards never grant a whole subscription, cash value, hosted AI credit, random loot or pay-to-win progression.' }),
  freeze({ id: 'device-respect', title: 'Device and accessibility respect', detail: 'Lite mode, reduced motion, touch, keyboard, controller, pause, local resume and leaving City are valid choices. No user loses access or value for choosing a safer device profile.' }),
  freeze({ id: 'consent-first-return', title: 'Consent-first return', detail: 'The local Activity Center may show small redacted updates. Optional service-only device alerts and one-time return reminders require a separate explicit opt-in; Google sign-in is never browser-push, email, newsletter or social-message consent.' })
]);

export function getEonCityFairnessSafetyRules() {
  return EON_CITY_FAIRNESS_SAFETY_RULES;
}

/** Returns the explicit current product boundary; it is not a billing or delivery status API. */
export function getEonCityFairnessSafetyTruth() {
  const membership = getEonCityMembershipTruth();
  const activity = getEonNotificationCenterTruth();
  const retention = getEonRetentionConsentTruth();
  return freeze({
    schema: EON_CITY_FAIRNESS_SAFETY_SCHEMA,
    usefulFreeCore: membership.coreCityArtificiallyLocked === false && membership.coreLocalWorkArtificiallyLocked === false,
    subscriptionsOnlyWhenReleased: membership.subscriptionsOnlyCityMonetization === true,
    paidAccessLive: membership.publicCheckout === true && membership.publicPricing === true && membership.verifiedServerEntitlementRequiredBeforePaidAccess === true,
    rewardedSponsorKeysOptional: membership.rewardedSponsorKeysOptional === true,
    rewardedSponsorKeysSubscriptionReplacement: membership.rewardedSponsorKeysSubscriptionReplacement === true,
    currentCheckoutReleased: membership.publicCheckout === true,
    currentPricingReleased: membership.publicPricing === true,
    localStorageEntitlementAuthority: membership.localStorageEntitlementAuthority === true,
    missionOffersOptional: true,
    missionExpiryPenalty: false,
    missionDismissalPenalty: false,
    missionReceiptCreatesValue: false,
    missionReceiptCreatesReward: false,
    missionReceiptCreatesSubscriptionBenefit: false,
    missionExpiryDoesNotRemoveCoreAccess: true,
    missionRetryRequiresNewVisibleRouteChoice: true,
    variableRewardMechanic: false,
    chanceOrLootMechanic: false,
    rarityOrCollectibleClaim: false,
    xpOrStreakPressure: false,
    payToWinClaim: false,
    advertisementOrRewardUnlock: membership.advertisingOrRewardUnlocks === true,
    reducedMotionPenalty: false,
    liteModePenalty: false,
    lowDevicePenalty: false,
    pauseOrExitPenalty: false,
    browserPermissionPrompt: activity.browserPermissionPromptOnLoad === true || retention.browserPermissionPrompt === true,
    automaticOutboundNotificationDelivery: retention.automaticOutboundDelivery === true,
    optInServiceNotificationSourceReady: activity.deviceNotificationDelivery === true && String(activity.serverDelivery || '').includes('source-ready'),
    browserPushSubscriptionOptInOnly: retention.browserPushSubscription === 'explicit-opt-in-only' && activity.remotePushSubscription === 'optional-when-server-vapid-configured',
    emailOrNewsletterConsentFromGoogle: retention.googleLoginIsMarketingConsent === true || retention.googleLoginIsEmailDeliveryConsent === true,
    socialMessageConsentFromGoogle: retention.googleLoginIsSocialMessageConsent === true,
    eonbotOutboundWithoutConsent: retention.eonbotMaySendWithoutUserChannelConsent === true,
    localActivityCenterAvailable: activity.inAppCenter === true && activity.localBrowserStorage === true,
    clientDeviceQuietHoursEnforced: activity.clientDeviceQuietHoursEnforced === true,
    publicMultiplayerClaimed: false,
    socialDirectMessageAutomation: retention.socialDirectMessageAutomation === true,
    physicalDeviceProof: false,
    liveBillingProof: false,
    liveOutboundDeliveryProof: false
  });
}

/** Evaluates only source-backed truth flags. A future implementation must make this fail before it broadens City behavior. */
export function validateEonCityFairnessSafety(truth = getEonCityFairnessSafetyTruth()) {
  const source = truth && typeof truth === 'object' ? truth : {};
  const violations = [];
  if (source.schema !== EON_CITY_FAIRNESS_SAFETY_SCHEMA) violations.push('fairness-schema-invalid');
  const requiredTrue = ['usefulFreeCore', 'paidAccessLive', 'currentCheckoutReleased', 'currentPricingReleased', 'rewardedSponsorKeysOptional', 'advertisementOrRewardUnlock', 'missionOffersOptional', 'missionExpiryDoesNotRemoveCoreAccess', 'missionRetryRequiresNewVisibleRouteChoice', 'localActivityCenterAvailable', 'optInServiceNotificationSourceReady', 'browserPushSubscriptionOptInOnly', 'clientDeviceQuietHoursEnforced'];
  const requiredFalse = ['subscriptionsOnlyWhenReleased', 'rewardedSponsorKeysSubscriptionReplacement', 'localStorageEntitlementAuthority', 'missionExpiryPenalty', 'missionDismissalPenalty', 'missionReceiptCreatesValue', 'missionReceiptCreatesReward', 'missionReceiptCreatesSubscriptionBenefit', 'variableRewardMechanic', 'chanceOrLootMechanic', 'rarityOrCollectibleClaim', 'xpOrStreakPressure', 'payToWinClaim', 'reducedMotionPenalty', 'liteModePenalty', 'lowDevicePenalty', 'pauseOrExitPenalty', 'browserPermissionPrompt', 'automaticOutboundNotificationDelivery', 'emailOrNewsletterConsentFromGoogle', 'socialMessageConsentFromGoogle', 'eonbotOutboundWithoutConsent', 'publicMultiplayerClaimed', 'socialDirectMessageAutomation', 'liveBillingProof', 'liveOutboundDeliveryProof'];
  for (const key of requiredTrue) if (source[key] !== true) violations.push(`${key}-must-be-true`);
  for (const key of requiredFalse) if (source[key] !== false) violations.push(`${key}-must-be-false`);
  return freeze({ schema: EON_CITY_FAIRNESS_SAFETY_SCHEMA, ok: violations.length === 0, violations: freeze(violations), localOnly: true, networkRequestCreated: false, browserStorageWritten: false });
}

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

/** Renders a read-only local policy panel; it does not change preferences or start delivery. */
export function renderEonCityFairnessSafety() {
  const rules = getEonCityFairnessSafetyRules();
  return `<section class="eon-play-command-deck-panel eon-play-fairness-panel" data-eon-play-fairness-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-fairness-title"><div class="eon-play-command-deck-card"><p class="eon-play-kicker">W565 · Fair Play &amp; return controls</p><h2 id="eon-play-fairness-title">Your pace stays yours</h2><p>City is a visual workstation and a private/curated social-space foundation. Paid capability and voluntary Sponsored Mission EONKEYS must remain transparent, bounded and server-authoritative—not pressure users through streaks, scarcity, random rewards, or unrequested messages.</p><div class="eon-play-command-deck-grid">${rules.map((rule) => `<article data-eon-play-fairness-rule="${escapeHtml(rule.id)}"><h3>${escapeHtml(rule.title)}</h3><p>${escapeHtml(rule.detail)}</p></article>`).join('')}</div><p class="eon-play-command-deck-note">This panel does not change subscription, payment, Sponsored Mission EONKEY balance, mission state, local activity preferences, account data, or delivery consent. Activity Center preferences stay local. Service-only device alerts are separate explicit opt-in and remain live-device-proof gated; marketing/news delivery is not released.</p><button type="button" data-eon-play-close-fairness>Return to City</button></div></section>`;
}

/** Uses the existing same-tab Workroom lifecycle so Fair Play never competes with active City controls. */
export function bindEonCityFairnessSafety(root, { workroomOverlay = null, onStatus = () => {} } = {}) {
  const panel = root?.querySelector?.('[data-eon-play-fairness-panel]');
  const openButtons = Array.from(root?.querySelectorAll?.('[data-eon-play-open-fairness]') || []);
  const close = panel?.querySelector?.('[data-eon-play-close-fairness]');
  if (!panel || !openButtons.length || !close || !workroomOverlay?.open || !workroomOverlay?.close) return () => {};
  let lastOpen = openButtons[0] || null;
  let overlayOpen = false;
  const report = (message) => { try { onStatus(String(message || '')); } catch {} };
  const show = (event) => {
    if (event?.currentTarget instanceof HTMLElement) lastOpen = event.currentTarget;
    const result = workroomOverlay.open({ id: 'city-fairness-safety', explicitUserAction: true });
    if (!result?.ok) { report('Close the current City panel before opening Fair Play & return controls.'); return; }
    overlayOpen = true;
    panel.hidden = false;
    close.focus({ preventScroll: true });
    report('Fair Play & return controls are open locally. Nothing about membership, activity delivery, or consent changed.');
  };
  const hide = () => {
    panel.hidden = true;
    if (overlayOpen) workroomOverlay.close({ explicitUserAction: true, reason: 'city-fairness-safety-close' });
    overlayOpen = false;
    lastOpen?.focus?.({ preventScroll: true });
    report('Returned to City. Your pace, local preferences, membership, and delivery consent were not changed.');
  };
  const onPanelClick = (event) => { if (event.target === panel) hide(); };
  openButtons.forEach((button) => button.addEventListener('click', show));
  close.addEventListener('click', hide);
  panel.addEventListener('click', onPanelClick);
  return () => {
    openButtons.forEach((button) => button.removeEventListener('click', show));
    close.removeEventListener('click', hide);
    panel.removeEventListener('click', onPanelClick);
    try { if (overlayOpen) workroomOverlay.close({ explicitUserAction: true, reason: 'city-fairness-safety-dispose' }); } catch {}
  };
}
