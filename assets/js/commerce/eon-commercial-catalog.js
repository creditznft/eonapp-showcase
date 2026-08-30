/**
 * W623C — canonical commercial truth for EONAPP.
 *
 * This is the single public-safe catalogue for subscriptions, trials, the
 * local/BYOK AI cost boundary, and the EON Keys referral architecture.
 * Provider product IDs and secrets remain server-side/environment controlled.
 */

export const EON_COMMERCIAL_CATALOG_SCHEMA = 'eonapp.commerce.canonical-catalog.w623c.v1';
export const EON_COMMERCIAL_CATALOG_VERSION = 1;
export const EON_SUBSCRIPTION_TRIAL_DAYS = 7;

const freezePlan = (plan) => {
  const billingType = plan.billingType || (plan.id === 'free' ? 'free' : 'subscription');
  const recurring = billingType === 'subscription';
  return Object.freeze({
  billingType,
  interval: recurring ? 'month' : (billingType === 'one-time' ? 'one-time' : 'none'),
  currency: 'USD',
  trialDays: recurring ? EON_SUBSCRIPTION_TRIAL_DAYS : 0,
  dodoCheckout: plan.id !== 'free',
  ...plan,
  highlights: Object.freeze([...(plan.highlights || [])]),
  featureGroups: Object.freeze([...(plan.featureGroups || [])]),
  limits: Object.freeze({ ...(plan.limits || {}) })
});
};

export const EON_SUBSCRIPTION_PLANS = Object.freeze([
  freezePlan({
    id: 'free',
    label: 'Free',
    monthlyUsd: 0,
    position: 0,
    summary: 'Start with EONBOT, local-first projects, Library, Vault basics, EON City basics and guided AI setup.',
    highlights: ['3 active project slots', 'Local-first EONBOT and Workspace', 'Basic Library, Vault and City access', 'Local AI and BYOK setup guidance'],
    limits: { projectSlots: 3, showcaseSlots: 0, automationDrafts: 1, premiumWorkflowPacks: 0, creatorPresetPacks: 0 },
    featureGroups: ['core-eonbot', 'basic-projects', 'basic-library', 'basic-vault', 'basic-city', 'local-ai-setup-guide', 'own-api-key-basics']
  }),
  freezePlan({
    id: 'plus',
    label: 'Plus',
    monthlyUsd: 4.99,
    position: 1,
    featured: false,
    summary: 'More projects, maintained workflow packs, stronger local/BYOK guidance and better workspace limits.',
    highlights: ['12 active project slots', 'Plus workflow and template packs', 'Guided local AI and BYOK workflows', 'Plus City personalization'],
    limits: { projectSlots: 12, showcaseSlots: 1, automationDrafts: 5, premiumWorkflowPacks: 3, creatorPresetPacks: 1 },
    featureGroups: ['plus-project-limits', 'plus-workflow-packs', 'plus-template-library', 'own-api-key-workflows', 'local-ai-guided-workflows', 'plus-city-personalization']
  }),
  freezePlan({
    id: 'studio',
    label: 'Studio',
    monthlyUsd: 14.99,
    position: 2,
    featured: true,
    summary: 'A creator and business workspace with premium workflow systems, presets, export kits and showcase tools.',
    highlights: ['35 active project slots', 'Creator preset and premium export packs', 'Studio workflow systems and dashboard', 'Studio Vault Relics and City room skins'],
    limits: { projectSlots: 35, showcaseSlots: 3, automationDrafts: 12, premiumWorkflowPacks: 12, creatorPresetPacks: 6 },
    featureGroups: ['studio-workflows', 'creator-preset-packs', 'premium-export-kits', 'studio-dashboard', 'studio-vault-relics', 'city-room-skins']
  }),
  freezePlan({
    id: 'power',
    label: 'Power',
    monthlyUsd: 29.99,
    position: 3,
    featured: false,
    summary: 'Builder-grade capacity, advanced local/BYOK workflow chaining, automation systems and beta access.',
    highlights: ['90 active project slots', 'Advanced local and BYOK workflow bundles', 'Power automation packs', 'Priority beta access and feature voting'],
    limits: { projectSlots: 90, showcaseSlots: 8, automationDrafts: 30, premiumWorkflowPacks: 30, creatorPresetPacks: 15 },
    featureGroups: ['power-project-limits', 'advanced-ai-workflow-chaining', 'advanced-local-ai-bundles', 'advanced-own-key-bundles', 'power-automation-packs', 'priority-beta', 'feature-voting']
  }),
  freezePlan({
    id: 'max',
    label: 'Max',
    monthlyUsd: 49.99,
    position: 4,
    featured: false,
    summary: 'Highest solo limits, the complete maintained workflow library, premium workrooms and flagship City/Vault cosmetics.',
    highlights: ['250 active project slots', 'Max workflow library and workrooms', 'Private Builder Circle identity', 'Premium City and Vault cosmetics'],
    limits: { projectSlots: 250, showcaseSlots: 20, automationDrafts: 90, premiumWorkflowPacks: 60, creatorPresetPacks: 30 },
    featureGroups: ['max-project-limits', 'max-workflow-library', 'max-local-ai-workrooms', 'max-own-key-workrooms', 'private-builder-circle', 'max-vault-relics', 'max-city-skins']
  }),

  freezePlan({
    id: 'pro',
    label: 'Pro',
    monthlyUsd: 99,
    position: 5,
    featured: false,
    billingType: 'subscription',
    summary: 'Professional automation, orchestration, intelligence, AI control and Forge operations on top of the existing EONAPP work surfaces.',
    highlights: ['Professional automation and recurring work', 'Advanced intelligence and AI control', 'Forge/release operations', 'Higher professional workload limits'],
    limits: { projectSlots: 500, showcaseSlots: 40, automationDrafts: 250, premiumWorkflowPacks: 120, creatorPresetPacks: 60 },
    featureGroups: ['pro-professional-automation', 'pro-intelligence', 'pro-ai-control', 'pro-forge-operations']
  }),
  freezePlan({
    id: 'ultra',
    label: 'Ultra',
    monthlyUsd: 199,
    position: 6,
    featured: false,
    billingType: 'subscription',
    summary: 'Scaled parallel work, multi-client operation, batch capacity and larger professional workloads.',
    highlights: ['Scaled parallel EONBOT work', 'Multi-client workspaces', 'Batch AI/work operations', 'Largest recurring professional capacity'],
    limits: { projectSlots: 1200, showcaseSlots: 100, automationDrafts: 750, premiumWorkflowPacks: 240, creatorPresetPacks: 120 },
    featureGroups: ['ultra-parallel-work', 'ultra-multi-client', 'ultra-batch-capacity', 'ultra-professional-scale']
  }),
  freezePlan({
    id: 'ultimate',
    label: 'Ultimate',
    oneTimeUsd: 1299,
    monthlyUsd: null,
    position: 7,
    featured: false,
    billingType: 'one-time',
    summary: 'Permanent access to eligible premium EONAPP software capability. Hosted AI, storage, scheduling and cloud compute remain separately governed.',
    highlights: ['Permanent eligible premium software access', 'No recurring software fee for the Ultimate capability grant', 'Existing local/BYOK rails remain available', 'Hosted capacity remains separately governed'],
    limits: { projectSlots: null, showcaseSlots: null, automationDrafts: null, premiumWorkflowPacks: null, creatorPresetPacks: null },
    featureGroups: ['ultimate-perpetual-software-capability']
  }),
]);

export const EON_RECURRING_SUBSCRIPTION_PLANS = Object.freeze(EON_SUBSCRIPTION_PLANS.filter((plan) => plan.billingType === 'subscription'));
export const EON_ONE_TIME_PRODUCTS = Object.freeze(EON_SUBSCRIPTION_PLANS.filter((plan) => plan.billingType === 'one-time'));
export const EON_PURCHASABLE_PLANS = Object.freeze(EON_SUBSCRIPTION_PLANS.filter((plan) => plan.dodoCheckout === true));
// Backward-compatible name: paid subscriptions are the six recurring tiers.
export const EON_PAID_SUBSCRIPTION_PLANS = EON_RECURRING_SUBSCRIPTION_PLANS;
export const EON_PAID_TIER_IDS = Object.freeze(EON_PAID_SUBSCRIPTION_PLANS.map((plan) => plan.id));
export const EON_PURCHASABLE_TIER_IDS = Object.freeze(EON_PURCHASABLE_PLANS.map((plan) => plan.id));

export const EON_CREATOR_EXECUTION_BOUNDARY = Object.freeze({
  cloudflareGenerationBackend: false,
  platformHostedImageOrVideoGeneration: false,
  localRuntimeAllowed: true,
  userOwnedProviderKeyAllowed: true,
  promptProxyThroughEonapp: false,
  providerKeyStorageOnEonappServers: false,
  generatedMediaStorageOnEonappServers: false,
  statement: 'EONAPP unlocks creator workflows and app capability. Image, video and other AI generation runs on the user\'s local runtime or directly with a provider account/API key chosen by the user; prompts, provider keys and generated media do not pass through an EONAPP generation backend.'
});

export const EON_KEYS_REFERRAL_POLICY = Object.freeze({
  rewardCurrency: 'EONKEYS',
  subscriptionDiscounts: false,
  subscriptionRenewalCredits: false,
  freeSubscriptionTiers: false,
  wholeTierEntitlements: false,
  cashOrCashEquivalent: false,
  transferable: false,
  resale: false,
  rewardForClickOnly: false,
  rewardForShareOnly: false,
  serverLedgerRequired: true,
  redemptionRequiresSignedServerEntitlement: true,
  unlockScope: 'individual-features-limits-workflows-templates-cosmetics',
  publicGrantStatus: 'server-rollout-controlled',
  statement: 'Referrals can earn non-transferable EONKEYS. EONKEYS unlock selected individual EONAPP features, temporary limits, workflows, templates or cosmetics; they never award a free subscription tier, subscription discount, renewal credit, cash, provider credits or unlimited AI generation.'
});

export function getEonSubscriptionPlans() {
  return EON_SUBSCRIPTION_PLANS;
}

export function getEonPaidSubscriptionPlans() {
  return EON_PAID_SUBSCRIPTION_PLANS;
}

export function getEonSubscriptionPlan(tierId = '') {
  const id = String(tierId || '').trim().toLowerCase();
  return EON_SUBSCRIPTION_PLANS.find((plan) => plan.id === id) || null;
}

export function formatMonthlyPlanPrice(planOrId = '') {
  const plan = typeof planOrId === 'string' ? getEonSubscriptionPlan(planOrId) : planOrId;
  if (!plan) return '';
  if (plan.id === 'free') return 'Free';
  if (plan.billingType === 'one-time') return `$${Number(plan.oneTimeUsd).toLocaleString('en-US')} one time`;
  return `$${Number(plan.monthlyUsd).toFixed(plan.monthlyUsd < 50 ? 2 : 0)}/month`;
}

export function getEonCommercialPublicSummary() {
  return Object.freeze({
    schema: EON_COMMERCIAL_CATALOG_SCHEMA,
    subscriptionCheckout: 'active-when-server-status-confirms',
    paymentProcessor: 'Dodo Payments hosted checkout',
    trialDays: EON_SUBSCRIPTION_TRIAL_DAYS,
    paidPlans: EON_PAID_SUBSCRIPTION_PLANS,
    purchasablePlans: EON_PURCHASABLE_PLANS,
    oneTimeProducts: EON_ONE_TIME_PRODUCTS,
    creatorBoundary: EON_CREATOR_EXECUTION_BOUNDARY,
    referralPolicy: EON_KEYS_REFERRAL_POLICY
  });
}

export function validateEonCommercialCatalog() {
  const errors = [];
  const expectedPrices = Object.freeze({ plus: 4.99, studio: 14.99, power: 29.99, max: 49.99, pro: 99, ultra: 199 });
  const ids = EON_SUBSCRIPTION_PLANS.map((plan) => plan.id);
  if (new Set(ids).size !== ids.length) errors.push('Subscription plan ids must be unique.');
  if (EON_PAID_SUBSCRIPTION_PLANS.length !== 6) errors.push('Exactly six recurring paid subscription plans are required.');
  const ultimate = getEonSubscriptionPlan('ultimate');
  if (!ultimate || ultimate.billingType !== 'one-time' || ultimate.oneTimeUsd !== 1299 || ultimate.trialDays !== 0) errors.push('Ultimate must be a $1,299 one-time perpetual software product with no subscription trial.');
  for (const [id, expected] of Object.entries(expectedPrices)) {
    const plan = getEonSubscriptionPlan(id);
    if (!plan) errors.push(`Missing plan: ${id}.`);
    else if (plan.monthlyUsd !== expected) errors.push(`${id} price must be $${expected.toFixed(2)}.`);
    if (plan && plan.trialDays !== 7) errors.push(`${id} must use the configured seven-day trial.`);
  }
  if (EON_KEYS_REFERRAL_POLICY.subscriptionDiscounts !== false) errors.push('Referral subscription discounts must remain disabled.');
  if (EON_KEYS_REFERRAL_POLICY.subscriptionRenewalCredits !== false) errors.push('Referral renewal credits must remain disabled.');
  if (EON_KEYS_REFERRAL_POLICY.freeSubscriptionTiers !== false || EON_KEYS_REFERRAL_POLICY.wholeTierEntitlements !== false) errors.push('EONKEYS must not award full subscription tiers.');
  if (EON_CREATOR_EXECUTION_BOUNDARY.cloudflareGenerationBackend !== false || EON_CREATOR_EXECUTION_BOUNDARY.platformHostedImageOrVideoGeneration !== false) errors.push('EONAPP must not claim a Cloudflare/server-side image or video generation backend.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: EON_COMMERCIAL_CATALOG_SCHEMA, version: EON_COMMERCIAL_CATALOG_VERSION });
}

export default Object.freeze({
  EON_COMMERCIAL_CATALOG_SCHEMA,
  EON_COMMERCIAL_CATALOG_VERSION,
  EON_SUBSCRIPTION_TRIAL_DAYS,
  EON_SUBSCRIPTION_PLANS,
  EON_RECURRING_SUBSCRIPTION_PLANS,
  EON_ONE_TIME_PRODUCTS,
  EON_PURCHASABLE_PLANS,
  EON_PAID_SUBSCRIPTION_PLANS,
  EON_PAID_TIER_IDS,
  EON_PURCHASABLE_TIER_IDS,
  EON_CREATOR_EXECUTION_BOUNDARY,
  EON_KEYS_REFERRAL_POLICY,
  getEonSubscriptionPlans,
  getEonPaidSubscriptionPlans,
  getEonSubscriptionPlan,
  formatMonthlyPlanPrice,
  getEonCommercialPublicSummary,
  validateEonCommercialCatalog
});
