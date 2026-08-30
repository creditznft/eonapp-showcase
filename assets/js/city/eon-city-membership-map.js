/**
 * W557 / RT92 — EON City access and membership map.
 *
 * The original W557 panel was planning-only. RT92 keeps the same safe same-tab
 * City overlay but projects the canonical live commercial catalogue. The
 * browser never grants paid access: checkout is opened through /billing and
 * paid/Sponsor access remains server-authoritative.
 */
import {
  getEonSubscriptionPlans,
  formatMonthlyPlanPrice
} from '../commerce/eon-commercial-catalog.js';

export const EON_CITY_MEMBERSHIP_MAP_SCHEMA = 'eon.city.membership-map.w557.v1';

const freeze = (value) => Object.freeze(value);
const DISTRICT_BY_TIER = freeze({
  free: 'Arrival & Command District',
  plus: 'Signal Lounge',
  studio: 'Creator Atrium Studio Wing',
  power: 'Strategy Observatory',
  max: 'Horizon Key Gallery',
  pro: 'Professional Command Deck',
  ultra: 'Parallel Operations Deck',
  ultimate: 'Ultimate Software Archive'
});

const DETAIL_BY_TIER = freeze({
  free: 'Core City orientation, local Project access, City Lite fallback, accessibility controls and ordinary local work remain useful without a purchase.',
  plus: 'More project capacity, maintained workflow and template packs, stronger local/BYOK guidance and Plus City personalization.',
  studio: 'Creator and business workrooms with premium workflow systems, presets, export kits, dashboard access and Studio City/Vault presentation features.',
  power: 'Builder-grade project capacity, advanced local/BYOK workflow chaining, automation packs and priority beta participation.',
  max: 'Highest solo recurring limits, the maintained workflow library, premium workrooms and flagship City/Vault presentation features.',
  pro: 'Professional automation, orchestration, intelligence, AI control and Forge operations with higher professional workload limits.',
  ultra: 'Scaled parallel work, multi-client operation, batch capacity and the largest recurring professional workload limits.',
  ultimate: 'One-time perpetual access to eligible premium EONAPP software capability. Hosted AI, storage, scheduling and cloud compute remain separately governed.'
});

const MEMBERSHIP_TIERS = freeze(getEonSubscriptionPlans().map((plan) => freeze({
  id: `eon-${plan.id}`,
  planId: plan.id,
  label: plan.label,
  district: DISTRICT_BY_TIER[plan.id] || 'EON City',
  state: plan.id === 'free' ? 'available-core' : 'available-with-verified-access',
  detail: DETAIL_BY_TIER[plan.id] || plan.summary,
  priceLabel: formatMonthlyPlanPrice(plan),
  availableNow: true,
  purchasable: plan.dodoCheckout === true,
  billingType: plan.billingType,
  requiresVerifiedEntitlement: plan.id !== 'free'
})));

export function getEonCityMembershipMap() {
  return MEMBERSHIP_TIERS;
}

export function getEonCityMembershipTruth() {
  return freeze({
    schema: EON_CITY_MEMBERSHIP_MAP_SCHEMA,
    subscriptionsOnlyCityMonetization: false,
    advertisingOrRewardUnlocks: true,
    rewardedSponsorKeysOptional: true,
    rewardedSponsorKeysSubscriptionReplacement: false,
    publicCheckout: true,
    publicPricing: true,
    localStorageEntitlementAuthority: false,
    verifiedServerEntitlementRequiredBeforePaidAccess: true,
    browserCheckoutGrantsAccess: false,
    coreCityArtificiallyLocked: false,
    coreLocalWorkArtificiallyLocked: false,
    plans: MEMBERSHIP_TIERS.map((tier) => freeze({ id: tier.id, state: tier.state, availableNow: tier.availableNow, purchasable: tier.purchasable, billingType: tier.billingType }))
  });
}

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

export function renderEonCityMembershipMap() {
  const cards = MEMBERSHIP_TIERS.map((tier) => `<article class="eon-play-membership-tier" data-eon-play-membership-tier="${escapeHtml(tier.id)}"><p class="eon-play-kicker">${escapeHtml(tier.planId === 'free' ? 'Core access' : tier.billingType === 'one-time' ? 'One-time software access' : 'Subscription access')}</p><h3>${escapeHtml(tier.label)} · ${escapeHtml(tier.district)}</h3><p>${escapeHtml(tier.detail)}</p><small>${escapeHtml(tier.priceLabel)}${tier.requiresVerifiedEntitlement ? ' · access requires the signed server entitlement.' : ' · available without a purchase.'}</small></article>`).join('');
  return `<section class="eon-play-command-deck-panel eon-play-membership-panel" data-eon-play-membership-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-membership-title"><div class="eon-play-command-deck-card"><p class="eon-play-kicker">EON City · Plans &amp; access</p><h2 id="eon-play-membership-title">Workroom value, never pressure</h2><p>Core City remains useful without a purchase. Paid access uses the same canonical EONAPP catalogue as Billing: six recurring subscriptions plus Ultimate one-time software access. Voluntary Sponsored Mission EONKEYS are a separate bounded temporary feature-unlock rail and never replace a subscription.</p><div class="eon-play-command-deck-grid eon-play-membership-grid">${cards}</div><p class="eon-play-command-deck-note">Purchases are created only by EONAPP's server and completed in Dodo Payments hosted checkout. Browser state cannot grant paid access. Open Billing to review a plan, trial and lifecycle terms before checkout.</p><a class="eon-play-primary-link" href="/billing" data-eon-play-open-billing>Open Plans &amp; Billing</a><button type="button" data-eon-play-close-membership>Return to City</button></div></section>`;
}

/** Binds the access panel to an explicit local City action. */
export function bindEonCityMembershipMap(root, { workroomOverlay = null, onStatus = () => {} } = {}) {
  const panel = root?.querySelector?.('[data-eon-play-membership-panel]');
  const openButtons = Array.from(root?.querySelectorAll?.('[data-eon-play-open-membership]') || []);
  const close = panel?.querySelector?.('[data-eon-play-close-membership]');
  if (!panel || !close || !openButtons.length) return () => {};
  let lastOpen = openButtons[0] || null;

  const show = (trigger = null) => {
    if (trigger?.matches?.('[data-eon-play-open-membership]')) lastOpen = trigger;
    const result = workroomOverlay?.open?.({ id: 'membership-map', explicitUserAction: true });
    if (result && result.ok !== true) {
      onStatus('Plans & access could not open safely. City was not changed.');
      return;
    }
    panel.hidden = false;
    close.focus({ preventScroll: true });
    onStatus('Plans & access is open. Billing is server-authoritative; this City panel cannot grant an entitlement.');
  };
  const hide = () => {
    panel.hidden = true;
    const result = workroomOverlay?.close?.({ explicitUserAction: true, reason: 'membership-map-close' });
    lastOpen?.focus?.({ preventScroll: true });
    if (result?.ok !== false) onStatus('Returned to City. Viewing plans did not change any entitlement.');
  };
  const onOpen = (event) => show(event.currentTarget);
  const onPanelClick = (event) => { if (event.target === panel) hide(); };
  openButtons.forEach((button) => button.addEventListener('click', onOpen));
  close.addEventListener('click', hide);
  panel.addEventListener('click', onPanelClick);
  return () => {
    if (!panel.hidden) {
      panel.hidden = true;
      try { workroomOverlay?.close?.({ explicitUserAction: true, reason: 'membership-map-unbind' }); } catch {}
    }
    openButtons.forEach((button) => button.removeEventListener('click', onOpen));
    close.removeEventListener('click', hide);
    panel.removeEventListener('click', onPanelClick);
  };
}
