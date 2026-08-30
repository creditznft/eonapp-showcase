/**
 * W616C — locked-feature UX resolver.
 *
 * It gives every premium gate the same honest choices: subscribe through the
 * server-authoritative Dodo route, start the standard trial, review referral
 * EONKEYS, or redeem an earned key after the server ledger enables redemption.
 * It never creates browser-only entitlements or sells generation credits.
 */

import {
  EON_AI_COST_BOUNDARY,
  EON_KEY_UNLOCK_MENU,
  EON_LOCKED_FEATURE_UNLOCK_COPY,
  EON_SUBSCRIPTION_TIERS
} from './eon-keys-catalog.js';
import { getCurrentCapabilitySnapshot, hasEonCapability } from '../capabilities/eon-capability-service.js';

export const EON_LOCKED_FEATURE_RESOLVER_SCHEMA = 'eonapp.referrals.locked-feature-resolver.v1';
export const EON_LOCKED_FEATURE_RESOLVER_VERSION = 1;

const ORDERED_KEY_TYPES = Object.freeze(['signal', 'builder', 'power']);
const PURCHASABLE_TIERS = Object.freeze(EON_SUBSCRIPTION_TIERS.filter((tier) => tier.id !== 'free'));
const RECURRING_PAID_TIERS = Object.freeze(PURCHASABLE_TIERS.filter((tier) => tier.billingType === 'subscription'));

const freezeFeature = (feature) => Object.freeze({
  liveEntitlement: false,
  checkoutActive: false,
  browserUnlockAllowed: false,
  platformPaidAiCost: false,
  requiresUserLocalOrOwnProviderKey: false,
  ...feature
});

export const EON_LOCKED_FEATURES = Object.freeze([
  freezeFeature({
    id: 'project-slots-plus',
    label: 'More active projects',
    requiredTier: 'plus',
    featureGroup: 'plus-project-limits',
    category: 'limit',
    userBenefit: 'Lift the Free project ceiling without changing the user\'s saved work.',
    keyHint: 'Use a Signal Key for a temporary project slot or a Builder Key for a larger project boost.'
  }),
  freezeFeature({
    id: 'premium-template-library',
    label: 'Premium template library',
    requiredTier: 'plus',
    featureGroup: 'plus-template-library',
    category: 'template',
    userBenefit: 'Unlock premium project starters, content structures and launch templates.',
    keyHint: 'Signal Keys can preview templates; Builder Keys can unlock stronger packs.'
  }),
  freezeFeature({
    id: 'own-api-key-workflows',
    label: 'Own API-key workflow systems',
    requiredTier: 'plus',
    featureGroup: 'own-api-key-workflows',
    category: 'ai-workflow',
    requiresUserLocalOrOwnProviderKey: true,
    userBenefit: 'Run richer EONAPP workflows around the user\'s own provider/API key.',
    keyHint: 'Use a Signal or Builder Key to unlock own-key workflow guidance and packs.'
  }),
  freezeFeature({
    id: 'local-ai-guided-workflows',
    label: 'Local AI guided workflows',
    requiredTier: 'plus',
    featureGroup: 'local-ai-guided-workflows',
    category: 'ai-workflow',
    requiresUserLocalOrOwnProviderKey: true,
    userBenefit: 'Use EONAPP\'s higher-level workflow scaffolding around local AI runtimes such as Ollama, LM Studio or Jan.',
    keyHint: 'Use a Signal or Builder Key to unlock local-AI setup boosters and workflow packs.'
  }),
  freezeFeature({
    id: 'creator-preset-packs',
    label: 'Creator preset packs',
    requiredTier: 'studio',
    featureGroup: 'creator-preset-packs',
    category: 'creator-preset',
    userBenefit: 'Unlock premium creator presets for posts, offers, events, landing pages and launch materials.',
    keyHint: 'Builder Keys and Power Keys can unlock creator preset packs without a subscription.'
  }),
  freezeFeature({
    id: 'studio-workflow-systems',
    label: 'Studio workflow systems',
    requiredTier: 'studio',
    featureGroup: 'studio-workflows',
    category: 'workflow',
    userBenefit: 'Unlock maintained creator/business workflow systems and premium project lanes.',
    keyHint: 'Use a Builder Key for a Studio feature pass or a premium workflow pack.'
  }),
  freezeFeature({
    id: 'premium-export-kits',
    label: 'Premium export kits',
    requiredTier: 'studio',
    featureGroup: 'premium-export-kits',
    category: 'export',
    userBenefit: 'Export cleaner handoffs, launch docs, creator packs and client-ready outputs.',
    keyHint: 'Builder Keys can unlock premium export kits.'
  }),
  freezeFeature({
    id: 'private-showcase-slots',
    label: 'Private showcase slots',
    requiredTier: 'studio',
    featureGroup: 'studio-showcase',
    category: 'showcase',
    userBenefit: 'Create private approved previews and showcase slots without exposing raw project data.',
    keyHint: 'Builder and Power Keys can unlock private showcase slots for limited periods.'
  }),
  freezeFeature({
    id: 'advanced-local-ai-bundles',
    label: 'Advanced local AI workflow bundles',
    requiredTier: 'power',
    featureGroup: 'advanced-local-ai-bundles',
    category: 'ai-workflow',
    requiresUserLocalOrOwnProviderKey: true,
    userBenefit: 'Unlock advanced local-AI chaining, setup guidance and power workflows around the user\'s own machine.',
    keyHint: 'Builder Keys can unlock one advanced workflow; Power Keys can unlock larger local-AI bundles.'
  }),
  freezeFeature({
    id: 'advanced-own-key-bundles',
    label: 'Advanced own API-key workflow bundles',
    requiredTier: 'power',
    featureGroup: 'advanced-own-key-bundles',
    category: 'ai-workflow',
    requiresUserLocalOrOwnProviderKey: true,
    userBenefit: 'Unlock power workflows that organize, route and reuse the user\'s own provider/API-key capability.',
    keyHint: 'Builder Keys and Power Keys can unlock own-key workflow bundles.'
  }),
  freezeFeature({
    id: 'power-automation-packs',
    label: 'Power automation packs',
    requiredTier: 'power',
    featureGroup: 'power-automation-packs',
    category: 'automation',
    userBenefit: 'Unlock stronger automation drafts, repeatable flows and builder-grade workflow packs.',
    keyHint: 'Builder Keys can unlock one automation pack; Power Keys can unlock advanced automation systems.'
  }),
  freezeFeature({
    id: 'max-local-ai-workrooms',
    label: 'Max local AI workrooms',
    requiredTier: 'max',
    featureGroup: 'max-local-ai-workrooms',
    category: 'feature-pass',
    requiresUserLocalOrOwnProviderKey: true,
    userBenefit: 'Unlock selected Max-level local/API-key workroom capability without turning it into platform-paid AI usage.',
    keyHint: 'Power Keys can unlock selected Max-level passes and workroom capability.'
  }),
  freezeFeature({
    id: 'max-city-and-vault-skins',
    label: 'Max City and Vault cosmetics',
    requiredTier: 'max',
    featureGroup: 'max-city-skins',
    category: 'city-cosmetic',
    userBenefit: 'Unlock premium City skins, Vault animations and Builder Circle identity as bonus status cosmetics.',
    keyHint: 'Power Keys can unlock premium City/Vault cosmetic rewards.'
  }),

  freezeFeature({
    id: 'pro-project-orchestration',
    label: 'Professional project orchestration',
    requiredTier: 'pro',
    featureGroup: 'premium:professional-project-orchestration',
    category: 'professional-workflow',
    eonKeyEligible: false,
    userBenefit: 'Coordinate professional projects across EONAPP work surfaces with the Pro software capability layer.',
    keyHint: 'This professional capability is subscription/perpetual-license only; referral and Sponsor Keys do not unlock it.'
  }),
  freezeFeature({
    id: 'pro-local-ai-autopilot',
    label: 'Local AI Autopilot',
    requiredTier: 'pro',
    featureGroup: 'premium:local-ai-autopilot',
    category: 'ai-control',
    eonKeyEligible: false,
    requiresUserLocalOrOwnProviderKey: true,
    userBenefit: 'Use Pro software control around local or user-owned AI providers without turning EONKEYS into provider-funded AI credit.',
    keyHint: 'This professional capability is subscription/perpetual-license only; referral and Sponsor Keys do not unlock it.'
  }),
  freezeFeature({
    id: 'ultra-client-workspaces',
    label: 'Client workspaces and context separation',
    requiredTier: 'ultra',
    featureGroup: 'premium:client-workspaces',
    category: 'professional-workspace',
    eonKeyEligible: false,
    userBenefit: 'Operate multiple professional client contexts with Ultra-level software capability.',
    keyHint: 'This scaled professional capability is subscription/perpetual-license only; EONKEYS do not unlock the tier.'
  }),
  freezeFeature({
    id: 'ultra-batch-ai-operations',
    label: 'Batch AI operations',
    requiredTier: 'ultra',
    featureGroup: 'premium:batch-ai-operations',
    category: 'ai-control',
    eonKeyEligible: false,
    requiresUserLocalOrOwnProviderKey: true,
    userBenefit: 'Coordinate larger batches of AI work while hosted/provider capacity remains separately governed.',
    keyHint: 'This scaled professional capability is subscription/perpetual-license only; EONKEYS do not fund provider usage.'
  }),
]);

function tierPosition(tierId = '') {
  const tier = EON_SUBSCRIPTION_TIERS.find((entry) => entry.id === String(tierId || '').trim().toLowerCase());
  return Number.isFinite(tier?.position) ? tier.position : 999;
}

function getTier(tierId = '') {
  return EON_SUBSCRIPTION_TIERS.find((entry) => entry.id === String(tierId || '').trim().toLowerCase()) || null;
}

function normalizeKeyInventory(keyInventory = {}) {
  const entries = ORDERED_KEY_TYPES.map((keyType) => [keyType, Math.max(0, Number.parseInt(keyInventory?.[keyType] ?? 0, 10) || 0)]);
  return Object.freeze(Object.fromEntries(entries));
}

function uniqById(items = []) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    output.push(item);
  }
  return output;
}

function unlockScore(feature, unlock) {
  let score = 0;
  if (unlock.featureGroup === feature.featureGroup) score += 8;
  if (unlock.category === feature.category) score += 4;
  if (unlock.planEquivalent === feature.requiredTier) score += 3;
  if (tierPosition(unlock.planEquivalent) >= tierPosition(feature.requiredTier)) score += 2;
  if (feature.requiresUserLocalOrOwnProviderKey && unlock.requiresUserLocalOrOwnProviderKey) score += 4;
  if (unlock.category === 'feature-pass') score += 1;
  return score;
}

export function getLockedFeature(featureId = '') {
  return EON_LOCKED_FEATURES.find((feature) => feature.id === String(featureId || '').trim()) || null;
}

export function getLockedFeatures() {
  return EON_LOCKED_FEATURES;
}

export function getKeyUnlocksForLockedFeature(featureOrId = '', { limit = 5 } = {}) {
  const feature = typeof featureOrId === 'string' ? getLockedFeature(featureOrId) : featureOrId;
  if (!feature || feature.eonKeyEligible === false) return Object.freeze([]);
  const direct = EON_KEY_UNLOCK_MENU
    .map((unlock) => Object.freeze({ ...unlock, matchScore: unlockScore(feature, unlock) }))
    .filter((unlock) => unlock.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || ORDERED_KEY_TYPES.indexOf(a.keyType) - ORDERED_KEY_TYPES.indexOf(b.keyType));
  const output = uniqById(direct).slice(0, Math.max(1, Number.parseInt(limit, 10) || 5));
  return Object.freeze(output);
}

export function getSubscribeOptionsForLockedFeature(featureOrId = '', { checkoutActive = false } = {}) {
  const feature = typeof featureOrId === 'string' ? getLockedFeature(featureOrId) : featureOrId;
  if (!feature) return Object.freeze([]);
  const minPosition = tierPosition(feature.requiredTier);
  return Object.freeze(PURCHASABLE_TIERS
    .filter((tier) => tier.position >= minPosition)
    .map((tier) => Object.freeze({
      type: 'subscribe',
      tierId: tier.id,
      label: `Choose ${tier.label}`,
      description: tier.promise,
      monthlyUsd: tier.monthlyUsd,
      enabled: checkoutActive === true,
      href: `/billing?plan=${encodeURIComponent(tier.id)}`,
      reason: checkoutActive ? 'Dodo hosted checkout is available from the Billing page.' : 'Checkout remains disabled until the server billing-status route confirms the production configuration.'
    })));
}

export function getTrialOptionsForLockedFeature(featureOrId = '', { checkoutActive = false } = {}) {
  const feature = typeof featureOrId === 'string' ? getLockedFeature(featureOrId) : featureOrId;
  if (!feature) return Object.freeze([]);
  const tier = getTier(feature.requiredTier);
  if (!tier || tier.billingType !== 'subscription' || Number(tier.trialDays || 0) <= 0) return Object.freeze([]);
  return Object.freeze([Object.freeze({
    type: 'trial',
    tierId: tier.id,
    label: `Start ${tier.trialDays}-day ${tier.label} trial`,
    enabled: checkoutActive === true,
    trialPublic: true,
    trialContextual: false,
    href: `/billing?plan=${encodeURIComponent(tier.id)}`,
    reason: checkoutActive ? 'The standard trial starts through Dodo hosted checkout.' : 'Trial checkout remains disabled until the server confirms billing readiness.'
  })]);
}

export function resolveLockedFeature(featureId = '', {
  keyInventory = {},
  commercialActive = false,
  checkoutActive = commercialActive,
  referralGrantsActive = false,
  keyRedemptionActive = false,
  capabilitySnapshot = null
} = {}) {
  const feature = getLockedFeature(featureId);
  if (!feature) return Object.freeze({ ok: false, feature: null, reason: 'unknown-locked-feature' });
  const tier = getTier(feature.requiredTier);
  let effectiveSnapshot = capabilitySnapshot;
  if (!effectiveSnapshot) {
    try { effectiveSnapshot = getCurrentCapabilitySnapshot(); } catch { effectiveSnapshot = null; }
  }
  const accessActive = hasEonCapability(feature.featureGroup, effectiveSnapshot);
  const inventory = normalizeKeyInventory(keyInventory);
  const keyUnlocks = getKeyUnlocksForLockedFeature(feature);
  const useKeyOptions = keyUnlocks.map((unlock) => Object.freeze({
    type: 'use-key',
    unlockId: unlock.id,
    keyType: unlock.keyType,
    label: `Use ${unlock.keyType} key: ${unlock.label}`,
    enabled: inventory[unlock.keyType] > 0 && keyRedemptionActive === true,
    inventory: inventory[unlock.keyType],
    reason: inventory[unlock.keyType] > 0
      ? (keyRedemptionActive ? 'The server ledger can redeem this key for the named individual unlock.' : 'A key is available, but server-ledger redemption has not been enabled for this surface yet.')
      : `Earn a ${unlock.keyType} key from an eligible verified referral.`
  }));
  const referOption = keyUnlocks.length > 0 ? Object.freeze({
    type: 'refer',
    label: referralGrantsActive ? 'Invite users to earn EONKEYS' : 'Review referral & EONKEYS',
    enabled: true,
    href: '/eon-keys',
    reason: referralGrantsActive ? 'Eligible referral events are verified by the server ledger.' : 'Sharing is available; EONKEY grants remain proof-gated until the referral ledger is certified.'
  }) : null;
  const primaryCopy = EON_LOCKED_FEATURE_UNLOCK_COPY[feature.requiredTier] || EON_LOCKED_FEATURE_UNLOCK_COPY.generic;
  const aiCopy = feature.requiresUserLocalOrOwnProviderKey ? EON_LOCKED_FEATURE_UNLOCK_COPY.ai : '';
  return Object.freeze({
    ok: true,
    schema: EON_LOCKED_FEATURE_RESOLVER_SCHEMA,
    commercialActive: checkoutActive === true,
    checkoutActive: checkoutActive === true,
    referralGrantsActive: referralGrantsActive === true,
    keyRedemptionActive: keyRedemptionActive === true,
    feature,
    requiredTier: tier,
    accessActive,
    accessSource: accessActive ? (effectiveSnapshot?.unlocks?.some((unlock) => unlock.featureGroup === feature.featureGroup) ? 'eonkey-unlock' : 'subscription-plan') : 'locked',
    capabilityTierId: effectiveSnapshot?.tierId || 'free',
    copy: Object.freeze({ primary: primaryCopy, ai: aiCopy, generic: EON_LOCKED_FEATURE_UNLOCK_COPY.generic }),
    actions: Object.freeze({
      subscribe: getSubscribeOptionsForLockedFeature(feature, { checkoutActive }),
      trial: getTrialOptionsForLockedFeature(feature, { checkoutActive }),
      refer: referOption,
      useKey: Object.freeze(useKeyOptions)
    }),
    aiBoundary: EON_AI_COST_BOUNDARY,
    liveGrantActive: keyRedemptionActive === true
  });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function renderActionButtons(actions = {}) {
  const renderChoice = (action, attrs = '') => action.enabled && action.href
    ? `<a class="eon-key-action" ${attrs} href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`
    : `<button type="button" class="eon-key-action" ${attrs} disabled aria-disabled="true">${escapeHtml(action.label)}</button>`;
  const subscribe = (actions.subscribe || []).slice(0, 2).map((action) => renderChoice(action, `data-eon-lock-action="subscribe" data-tier="${escapeHtml(action.tierId)}"`)).join('');
  const trial = (actions.trial || []).slice(0, 1).map((action) => renderChoice(action, `data-eon-lock-action="trial" data-tier="${escapeHtml(action.tierId)}"`)).join('');
  const useKey = (actions.useKey || []).slice(0, 2).map((action) => `<button type="button" class="eon-key-action" data-eon-lock-action="use-key" data-key-type="${escapeHtml(action.keyType)}" data-unlock-id="${escapeHtml(action.unlockId)}" ${action.enabled ? '' : 'disabled aria-disabled="true"'}>${escapeHtml(action.label)}</button>`).join('');
  const refer = actions.refer ? `<a class="eon-key-action" data-eon-lock-action="refer" href="${escapeHtml(actions.refer.href || '/eon-keys')}">${escapeHtml(actions.refer.label)}</a>` : '';
  return `${subscribe}${trial}${useKey}${refer}`;
}

export function renderLockedFeatureCta(featureId = '', options = {}) {
  const resolution = resolveLockedFeature(featureId, options);
  if (!resolution.ok) return '<section class="eon-key-lock-card" data-eon-lock-state="unknown"><p>Unknown locked feature.</p></section>';
  const { feature, requiredTier, copy, actions } = resolution;
  if (resolution.accessActive) {
    return `<section class="eon-key-lock-card is-available" data-eon-lock-feature="${escapeHtml(feature.id)}" data-required-tier="${escapeHtml(requiredTier?.id || '')}" data-eon-lock-state="available"><p class="eon-key-kicker">Available · verified capability</p><h3>${escapeHtml(feature.label)}</h3><p>${escapeHtml(feature.userBenefit)}</p><p><strong>Available through your ${escapeHtml(resolution.accessSource === 'eonkey-unlock' ? 'active EONKEY unlock' : `${resolution.capabilityTierId} plan`)}.</strong></p></section>`;
  }
  const actionReasons = [
    ...(actions.subscribe || []).slice(0, 1).map((action) => action.reason),
    ...(actions.trial || []).slice(0, 1).map((action) => action.reason),
    ...(actions.useKey || []).slice(0, 2).map((action) => action.reason),
    actions.refer?.reason
  ].filter(Boolean);
  return `<section class="eon-key-lock-card" data-eon-lock-feature="${escapeHtml(feature.id)}" data-required-tier="${escapeHtml(requiredTier?.id || '')}" data-commercial-active="${resolution.commercialActive ? 'true' : 'false'}"><p class="eon-key-kicker">Locked feature · ${escapeHtml(requiredTier?.label || 'Premium')}</p><h3>${escapeHtml(feature.label)}</h3><p>${escapeHtml(feature.userBenefit)}</p><p><strong>${escapeHtml(copy.primary)}</strong></p>${copy.ai ? `<p class="eon-key-muted">${escapeHtml(copy.ai)}</p>` : ''}<div class="eon-key-actions">${renderActionButtons(actions)}</div><details><summary>Availability details</summary><ul>${actionReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}</ul></details></section>`;
}

export function validateLockedFeatureResolver() {
  const errors = [];
  const forbidden = /cashback|wallet balance|crypto payout|free month|renewal discount|paid AI credit|lootbox|jackpot|spin/i;
  const tierIds = new Set(EON_SUBSCRIPTION_TIERS.map((tier) => tier.id));
  for (const feature of EON_LOCKED_FEATURES) {
    if (!tierIds.has(feature.requiredTier) || feature.requiredTier === 'free') errors.push(`Feature ${feature.id} has invalid required tier.`);
    if (feature.platformPaidAiCost !== false) errors.push(`Feature ${feature.id} implies platform-paid AI cost.`);
    if (feature.browserUnlockAllowed !== false) errors.push(`Feature ${feature.id} allows browser-only unlock.`);
    const resolution = resolveLockedFeature(feature.id, { keyInventory: { signal: 1, builder: 1, power: 1 }, checkoutActive: true });
    if (!resolution.ok) errors.push(`Feature ${feature.id} does not resolve.`);
    if (!Array.isArray(resolution.actions.subscribe) || resolution.actions.subscribe.length < 1) errors.push(`Feature ${feature.id} missing subscribe action.`);
    const requiredTier = getTier(feature.requiredTier);
    if (requiredTier?.billingType === 'subscription') {
      if (!Array.isArray(resolution.actions.trial) || resolution.actions.trial.length < 1) errors.push(`Feature ${feature.id} missing recurring trial action.`);
    } else if (Array.isArray(resolution.actions.trial) && resolution.actions.trial.length > 0) {
      errors.push(`Feature ${feature.id} exposes a trial for a non-subscription product.`);
    }
    if (feature.eonKeyEligible !== false) {
      if (!resolution.actions.refer) errors.push(`Feature ${feature.id} missing referral action.`);
      if (!Array.isArray(resolution.actions.useKey) || resolution.actions.useKey.length < 1) errors.push(`Feature ${feature.id} missing EON Key action.`);
      if (getKeyUnlocksForLockedFeature(feature).length < 1) errors.push(`Feature ${feature.id} has no EON Key unlock path.`);
    } else if ((resolution.actions.useKey || []).length > 0) {
      errors.push(`Paid-only feature ${feature.id} unexpectedly exposes EON Key redemption.`);
    }
    if (feature.requiresUserLocalOrOwnProviderKey && !resolution.copy.ai) errors.push(`AI feature ${feature.id} missing local/own-key copy.`);
    if (forbidden.test(JSON.stringify(resolution))) errors.push(`Feature ${feature.id} contains forbidden reward language.`);
  }
  for (const tier of RECURRING_PAID_TIERS) {
    const features = EON_LOCKED_FEATURES.filter((feature) => feature.requiredTier === tier.id);
    if (features.length < 2) errors.push(`Tier ${tier.id} needs at least two locked feature examples.`);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: EON_LOCKED_FEATURE_RESOLVER_SCHEMA, version: EON_LOCKED_FEATURE_RESOLVER_VERSION, featureCount: EON_LOCKED_FEATURES.length });
}

export default Object.freeze({
  EON_LOCKED_FEATURE_RESOLVER_SCHEMA,
  EON_LOCKED_FEATURE_RESOLVER_VERSION,
  EON_LOCKED_FEATURES,
  getLockedFeature,
  getLockedFeatures,
  getKeyUnlocksForLockedFeature,
  getSubscribeOptionsForLockedFeature,
  getTrialOptionsForLockedFeature,
  resolveLockedFeature,
  renderLockedFeatureCta,
  validateLockedFeatureResolver
});
