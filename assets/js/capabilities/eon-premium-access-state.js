/**
 * RT92 Premium foundation — reusable feature access-state resolver.
 *
 * This is deliberately separate from checkout. It describes capability
 * availability while Billing and the signed server entitlement remain the only
 * authorities that can create or confirm paid access.
 */
import { getEonPremiumCapability, getEonPremiumSoftwareTier } from './eon-premium-capability-registry.js';

export const EON_PREMIUM_ACCESS_STATE_SCHEMA = 'eonapp.premium-access-state.rt92.v1';
export const EON_PREMIUM_ACCESS_STATES = Object.freeze([
  'INCLUDED',
  'AVAILABLE',
  'PREVIEW',
  'PRO',
  'ULTRA',
  'ULTIMATE',
  'LIMIT_REACHED'
]);

const LIVE_SUBSCRIPTION_ORDER = Object.freeze(['free', 'plus', 'studio', 'power', 'max', 'pro', 'ultra']);
const LIVE_RANK = new Map(LIVE_SUBSCRIPTION_ORDER.map((id, index) => [id, index]));
const freeze = (value) => Object.freeze(value);

function cleanTier(value = '') {
  const tier = String(value || '').trim().toLowerCase();
  return LIVE_RANK.has(tier) ? tier : 'free';
}

function normalizedLicenses(value = []) {
  const source = Array.isArray(value) ? value : [];
  return freeze([...new Set(source.map((entry) => String(entry || '').trim().toLowerCase()).filter(Boolean))]);
}

function hasSubscriptionAccess(currentTier = 'free', requiredTier = '') {
  if (!requiredTier) return true;
  const normalizedRequiredTier = String(requiredTier || '').trim().toLowerCase();
  if (!LIVE_RANK.has(normalizedRequiredTier)) return false;
  return (LIVE_RANK.get(cleanTier(currentTier)) ?? 0) >= (LIVE_RANK.get(normalizedRequiredTier) ?? Number.MAX_SAFE_INTEGER);
}

function tierSellable(tierId = '', commercialAvailability = {}) {
  return commercialAvailability?.[tierId] === true;
}

/**
 * Resolve one premium capability without granting access in the browser.
 *
 * subscriptionTierId supports the live recurring ladder through Pro/Ultra.
 * perpetualLicenses is intentionally a separate axis so an Ultimate licence
 * never masquerades as cloud capacity or a recurring subscription.
 */
export function resolveEonPremiumAccessState(capabilityOrId = '', options = {}) {
  const capability = typeof capabilityOrId === 'string' ? getEonPremiumCapability(capabilityOrId) : capabilityOrId;
  if (!capability) return freeze({ ok: false, state: 'PREVIEW', reason: 'unknown-capability', capability: null });

  const subscriptionTierId = cleanTier(options.subscriptionTierId || options.tierId || 'free');
  const perpetualLicenses = normalizedLicenses(options.perpetualLicenses);
  const hasUltimate = perpetualLicenses.includes('ultimate');
  const subscriptionAccess = capability.universal || hasSubscriptionAccess(subscriptionTierId, capability.minimumSubscriptionTier);
  const perpetualAccess = capability.ultimateEligible === true && hasUltimate;
  const softwareAccess = capability.universal || subscriptionAccess || perpetualAccess;
  const usage = Math.max(0, Number(options.currentUsage) || 0);
  const limit = Number(options.limit);
  const hasFiniteLimit = Number.isFinite(limit) && limit >= 0;
  const limitReached = softwareAccess && hasFiniteLimit && usage >= limit;

  let state = 'INCLUDED';
  let requiredTier = '';
  let purchaseAvailable = false;
  let preview = false;

  if (limitReached) {
    state = 'LIMIT_REACHED';
  } else if (softwareAccess) {
    state = capability.universal ? 'INCLUDED' : 'AVAILABLE';
  } else {
    requiredTier = capability.minimumSubscriptionTier || (capability.ultimateEligible ? 'ultimate' : '');
    const requiredSellable = requiredTier ? tierSellable(requiredTier, options.commercialAvailability || {}) : false;
    if (capability.previewBeforePurchase !== false && !requiredSellable) {
      state = 'PREVIEW';
      preview = true;
    } else if (requiredTier === 'pro') {
      state = 'PRO';
      purchaseAvailable = requiredSellable;
    } else if (requiredTier === 'ultra') {
      state = 'ULTRA';
      purchaseAvailable = requiredSellable;
    } else {
      state = 'ULTIMATE';
      purchaseAvailable = tierSellable('ultimate', options.commercialAvailability || {});
    }
  }

  return freeze({
    ok: true,
    schema: EON_PREMIUM_ACCESS_STATE_SCHEMA,
    state,
    capability,
    subscriptionTierId,
    perpetualLicenses,
    softwareAccess,
    accessSource: capability.universal ? 'universal' : subscriptionAccess ? 'subscription' : perpetualAccess ? 'ultimate-perpetual-license' : 'none',
    requiredTier,
    requiredTierDefinition: requiredTier ? getEonPremiumSoftwareTier(requiredTier) : null,
    purchaseAvailable,
    preview,
    tryOnceEligible: !softwareAccess && capability.tryOnceEligible === true,
    limit: hasFiniteLimit ? limit : null,
    currentUsage: usage,
    capacitySeparateFromCapability: true,
    hostedCapacityIncludedByThisResolver: false,
    dodoEntitlementGrantedByThisResolver: false
  });
}

export function validateEonPremiumAccessStateResolver() {
  const errors = [];
  const universal = resolveEonPremiumAccessState('work-queue-overview', { subscriptionTierId: 'free' });
  if (!universal.ok || universal.state !== 'INCLUDED' || !universal.softwareAccess) errors.push('Universal Work Queue must be included for Free.');

  const proLocked = resolveEonPremiumAccessState('local-ai-autopilot', { subscriptionTierId: 'max', commercialAvailability: { pro: true, ultra: true, ultimate: true } });
  if (!proLocked.ok || proLocked.state !== 'PRO' || proLocked.purchaseAvailable !== true || proLocked.softwareAccess) errors.push('Live Pro capability must remain locked for Max while reporting Billing availability.');

  const pro = resolveEonPremiumAccessState('local-ai-autopilot', { subscriptionTierId: 'pro' });
  if (!pro.softwareAccess || pro.accessSource !== 'subscription' || pro.state !== 'AVAILABLE') errors.push('Pro subscription access resolution failed.');

  const ultimate = resolveEonPremiumAccessState('client-workspaces', { subscriptionTierId: 'free', perpetualLicenses: ['ultimate'] });
  if (!ultimate.softwareAccess || ultimate.accessSource !== 'ultimate-perpetual-license' || ultimate.hostedCapacityIncludedByThisResolver) errors.push('Ultimate must unlock software capability without hosted capacity.');

  const limited = resolveEonPremiumAccessState('parallel-eonbot-work', { subscriptionTierId: 'ultra', currentUsage: 4, limit: 4 });
  if (limited.state !== 'LIMIT_REACHED' || !limited.softwareAccess) errors.push('Capacity exhaustion must not revoke software capability.');

  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_PREMIUM_ACCESS_STATE_SCHEMA });
}

export default freeze({
  EON_PREMIUM_ACCESS_STATE_SCHEMA,
  EON_PREMIUM_ACCESS_STATES,
  resolveEonPremiumAccessState,
  validateEonPremiumAccessStateResolver
});
