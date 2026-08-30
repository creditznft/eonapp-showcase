/**
 * RT92 professional capability presentation model.
 *
 * This adapts the premium capability registry into the SAME access-state
 * vocabulary used by existing real-surface lock cards. It opens no checkout and
 * grants no entitlement; purchase controls remain centralized in Billing.
 */
import { listEonPremiumCapabilities } from './eon-premium-capability-registry.js';
import { resolveEonPremiumAccessState } from './eon-premium-access-state.js';

export const EON_PREMIUM_PREVIEW_MODEL_SCHEMA = 'eonapp.premium-preview-model.rt92.v2';
export const EON_PREMIUM_LIVE_COMMERCIAL_AVAILABILITY = Object.freeze({ pro: true, ultra: true, ultimate: true });
const freeze = (value) => Object.freeze(value);

function tierLabel(tier = '') {
  if (tier === 'pro') return 'Pro';
  if (tier === 'ultra') return 'Ultra';
  if (tier === 'ultimate') return 'Ultimate';
  return '';
}

export function buildEonPremiumPreviewModel({ surface = '', subscriptionTierId = 'free', perpetualLicenses = [], commercialAvailability = EON_PREMIUM_LIVE_COMMERCIAL_AVAILABILITY, usageByCapability = {}, limitByCapability = {} } = {}) {
  const capabilities = listEonPremiumCapabilities({ surface });
  return freeze(capabilities.map((capability) => {
    const access = resolveEonPremiumAccessState(capability, {
      subscriptionTierId,
      perpetualLicenses,
      commercialAvailability,
      currentUsage: usageByCapability?.[capability.id],
      limit: limitByCapability?.[capability.id]
    });
    return freeze({
      id: capability.id,
      label: capability.label,
      canonicalSurface: capability.canonicalSurface,
      canonicalRoutes: capability.canonicalRoutes,
      state: access.state,
      softwareAccess: access.softwareAccess,
      requiredTier: access.requiredTier,
      requiredTierLabel: tierLabel(access.requiredTier),
      purchaseAvailable: access.purchaseAvailable,
      preview: access.preview,
      tryOnceEligible: access.tryOnceEligible,
      capacitySeparateFromCapability: access.capacitySeparateFromCapability,
      hostedCapacityIncluded: false,
      checkoutHref: '',
      liveGrantAction: false,
      commercialStatus: 'production-live'
    });
  }));
}

export function validateEonPremiumPreviewModel() {
  const errors = [];
  const localAi = buildEonPremiumPreviewModel({ surface: 'local-ai', subscriptionTierId: 'max' });
  if (!localAi.length) errors.push('Local AI premium preview model must expose registry capabilities.');
  for (const card of localAi) {
    if (card.checkoutHref || card.liveGrantAction) errors.push(`${card.id} must keep checkout/grant authority centralized in Billing.`);
    if (card.hostedCapacityIncluded) errors.push(`${card.id} must not imply hosted capacity.`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_PREMIUM_PREVIEW_MODEL_SCHEMA, cardCount: localAi.length });
}

export default freeze({ EON_PREMIUM_PREVIEW_MODEL_SCHEMA, EON_PREMIUM_LIVE_COMMERCIAL_AVAILABILITY, buildEonPremiumPreviewModel, validateEonPremiumPreviewModel });
