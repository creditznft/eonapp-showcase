import {
  EON_CREATOR_EXECUTION_BOUNDARY,
  EON_KEYS_REFERRAL_POLICY,
  EON_SUBSCRIPTION_PLANS
} from '../commerce/eon-commercial-catalog.js';

/**
 * W616B — EON Keys referral unlock catalogue.
 *
 * This is a source contract only. It defines how referrals can unlock real
 * EONAPP capability without creating cash, wallet, crypto, token, NFT,
 * commission, renewal-credit or platform-paid AI obligations. Dodo checkout is active through the server runtime; referral attribution and EONKEY redemption remain proof-gated server-ledger actions.
 */

export const EON_KEYS_CATALOG_SCHEMA = 'eonapp.referrals.eon-keys-catalog.v2';
export const EON_KEYS_CATALOG_VERSION = 2;

export const EON_AI_COST_BOUNDARY = Object.freeze({
  platformPaidHostedGeneration: false,
  defaultGenerationRail: 'user-owned-local-runtime-or-user-owned-provider-key',
  userLocalAiAllowed: true,
  userProviderApiKeyAllowed: true,
  eonappDoesNotSellAiCreditsAtLaunch: true,
  cloudflareGenerationBackend: EON_CREATOR_EXECUTION_BOUNDARY.cloudflareGenerationBackend,
  statement: EON_CREATOR_EXECUTION_BOUNDARY.statement
});

export const EON_SUBSCRIPTION_TIERS = Object.freeze(EON_SUBSCRIPTION_PLANS.map((plan) => Object.freeze({
  ...plan,
  monthlyInr: null,
  dodoProductRequired: plan.id !== 'free',
  trialPublic: plan.billingType === 'subscription',
  trialContextual: false,
  inviteOnlyAtLaunch: false,
  promise: plan.summary
})));

export const EON_KEY_TYPES = Object.freeze([
  Object.freeze({
    id: 'signal',
    label: 'Signal Key',
    earnedBy: 'activated-free-invite',
    summary: 'Earned when an invited new user signs in and saves a first useful project or completes a useful onboarding action.',
    maxMonthlyFreeGrants: 5,
    cashValue: false,
    transferable: false
  }),
  Object.freeze({
    id: 'builder',
    label: 'Builder Key',
    earnedBy: 'retained-paid-referral',
    summary: 'Earned after an invited customer has a successful paid Dodo event and remains actively paid through the 14-day retention check.',
    cashValue: false,
    transferable: false
  }),
  Object.freeze({
    id: 'power',
    label: 'Power Key',
    earnedBy: 'paid-referral-milestone',
    summary: 'Earned for the third retained paid referral in a calendar year and used for selected Power/Max-level individual features, larger limits and premium cosmetics.',
    cashValue: false,
    transferable: false
  }),
  Object.freeze({
    id: 'sponsor',
    label: 'Sponsor Key',
    earnedBy: 'verified-rewarded-sponsor-completion',
    summary: 'Earned from one voluntary rewarded Sponsor Terminal video completion accepted by the server reward-session authority. One verified completion creates one Sponsor Key. Sponsor Keys are consumable and unlock only short-lived, low-cost EONAPP capability or cosmetics; they never grant subscription time, cash, provider credit or platform-funded AI.',
    cashValue: false,
    transferable: false
  })
]);

const freezeUnlock = (unlock) => Object.freeze({
  platformPaidAiCost: false,
  keysRequired: Math.max(1, Math.floor(Number(unlock.keysRequired || 1))),
  durationMinutes: Math.max(0, Math.floor(Number(unlock.durationMinutes || 0))),
  requiresUserLocalOrOwnProviderKey: Boolean(unlock.requiresUserLocalOrOwnProviderKey),
  transferable: false,
  cashValue: false,
  tokenOrNft: false,
  marketplace: false,
  ...unlock
});

export const EON_KEY_UNLOCK_MENU = Object.freeze([
  freezeUnlock({ id: 'signal-project-slot-30d', keyType: 'signal', label: '+1 project slot for 30 days', category: 'limit', planEquivalent: 'free-plus-bridge', durationDays: 30, featureGroup: 'plus-project-limits' }),
  freezeUnlock({ id: 'signal-template-preview', keyType: 'signal', label: '1 premium template preview', category: 'template', planEquivalent: 'plus', durationDays: 14, featureGroup: 'plus-template-library' }),
  freezeUnlock({ id: 'signal-workflow-preview', keyType: 'signal', label: '1 workflow preview', category: 'workflow', planEquivalent: 'plus', durationDays: 14, featureGroup: 'plus-workflow-packs' }),
  freezeUnlock({ id: 'signal-local-ai-booster', keyType: 'signal', label: '1 local AI setup booster', category: 'ai-workflow', planEquivalent: 'plus', durationDays: 30, featureGroup: 'local-ai-guided-workflows', requiresUserLocalOrOwnProviderKey: true }),
  freezeUnlock({ id: 'signal-own-key-setup-workflow', keyType: 'signal', label: '1 own API-key setup workflow', category: 'ai-workflow', planEquivalent: 'plus', durationDays: 30, featureGroup: 'own-api-key-workflows', requiresUserLocalOrOwnProviderKey: true }),
  freezeUnlock({ id: 'signal-automation-draft', keyType: 'signal', label: '1 basic automation draft slot', category: 'automation', planEquivalent: 'plus', durationDays: 30, featureGroup: 'plus-automation-drafts' }),
  freezeUnlock({ id: 'signal-vault-relic', keyType: 'signal', label: 'Vault Signal Relic', category: 'vault-relic', planEquivalent: 'cosmetic', permanent: true, featureGroup: 'vault-reward-relics' }),
  freezeUnlock({ id: 'signal-city-plaque', keyType: 'signal', label: 'City plaque', category: 'city-cosmetic', planEquivalent: 'cosmetic', permanent: true, featureGroup: 'plus-city-personalization' }),
  freezeUnlock({ id: 'signal-eonbot-skin', keyType: 'signal', label: 'EONBOT visual skin', category: 'cosmetic', planEquivalent: 'cosmetic', permanent: true, featureGroup: 'eonbot-visual-skins' }),
  freezeUnlock({ id: 'signal-profile-badge', keyType: 'signal', label: 'Profile badge', category: 'profile', planEquivalent: 'cosmetic', permanent: true, featureGroup: 'profile-identity' }),

  freezeUnlock({ id: 'builder-project-slots-90d', keyType: 'builder', label: '+3 project slots for 90 days', category: 'limit', planEquivalent: 'plus', durationDays: 90, featureGroup: 'plus-project-limits' }),
  freezeUnlock({ id: 'builder-premium-workflow-pack', keyType: 'builder', label: '1 premium workflow pack', category: 'workflow', planEquivalent: 'studio', permanent: true, featureGroup: 'studio-workflows' }),
  freezeUnlock({ id: 'builder-creator-preset-pack', keyType: 'builder', label: '1 creator preset pack', category: 'creator-preset', planEquivalent: 'studio', permanent: true, featureGroup: 'creator-preset-packs' }),
  freezeUnlock({ id: 'builder-local-ai-workflow', keyType: 'builder', label: '1 advanced local AI workflow', category: 'ai-workflow', planEquivalent: 'studio', durationDays: 30, featureGroup: 'advanced-local-ai-bundles', requiresUserLocalOrOwnProviderKey: true }),
  freezeUnlock({ id: 'builder-own-key-workflow-pack', keyType: 'builder', label: '1 own API-key workflow pack', category: 'ai-workflow', planEquivalent: 'studio', durationDays: 30, featureGroup: 'advanced-own-key-bundles', requiresUserLocalOrOwnProviderKey: true }),
  freezeUnlock({ id: 'builder-automation-pack', keyType: 'builder', label: '1 automation pack', category: 'automation', planEquivalent: 'studio', durationDays: 30, featureGroup: 'power-automation-packs' }),
  freezeUnlock({ id: 'builder-showcase-slot-30d', keyType: 'builder', label: '1 private showcase slot for 30 days', category: 'showcase', planEquivalent: 'studio', durationDays: 30, featureGroup: 'studio-showcase' }),
  freezeUnlock({ id: 'builder-export-kit', keyType: 'builder', label: '1 premium export kit', category: 'export', planEquivalent: 'studio', permanent: true, featureGroup: 'premium-export-kits' }),
  freezeUnlock({ id: 'builder-vault-relic', keyType: 'builder', label: 'Builder Vault Relic', category: 'vault-relic', planEquivalent: 'cosmetic', permanent: true, featureGroup: 'vault-reward-relics' }),
  freezeUnlock({ id: 'builder-city-room-decoration', keyType: 'builder', label: 'City room decoration', category: 'city-cosmetic', planEquivalent: 'studio', permanent: true, featureGroup: 'city-room-skins' }),

  freezeUnlock({ id: 'power-project-slots-90d', keyType: 'power', label: '+10 project slots for 90 days', category: 'limit', planEquivalent: 'power', durationDays: 90, featureGroup: 'power-project-limits' }),
  freezeUnlock({ id: 'power-workflow-packs', keyType: 'power', label: '3 premium workflow packs', category: 'workflow', planEquivalent: 'power', permanent: true, featureGroup: 'power-workflow-bundle' }),
  freezeUnlock({ id: 'power-creator-presets', keyType: 'power', label: '3 creator preset packs', category: 'creator-preset', planEquivalent: 'power', permanent: true, featureGroup: 'creator-preset-packs' }),
  freezeUnlock({ id: 'power-local-ai-bundle', keyType: 'power', label: 'Advanced local AI workflow bundle', category: 'ai-workflow', planEquivalent: 'power', durationDays: 90, featureGroup: 'advanced-local-ai-bundles', requiresUserLocalOrOwnProviderKey: true }),
  freezeUnlock({ id: 'power-own-key-bundle', keyType: 'power', label: 'Advanced own API-key workflow bundle', category: 'ai-workflow', planEquivalent: 'power', durationDays: 90, featureGroup: 'advanced-own-key-bundles', requiresUserLocalOrOwnProviderKey: true }),
  freezeUnlock({ id: 'power-automation-system', keyType: 'power', label: 'Advanced automation system', category: 'automation', planEquivalent: 'power', durationDays: 90, featureGroup: 'power-automation-packs' }),
  freezeUnlock({ id: 'power-showcase-slots', keyType: 'power', label: '3 private showcase slots for 90 days', category: 'showcase', planEquivalent: 'power', durationDays: 90, featureGroup: 'power-showcase' }),
  freezeUnlock({ id: 'power-city-room-skin', keyType: 'power', label: 'Premium City room skin', category: 'city-cosmetic', planEquivalent: 'max', permanent: true, featureGroup: 'max-city-skins' }),
  freezeUnlock({ id: 'power-vault-animation', keyType: 'power', label: 'Premium Vault Reveal animation', category: 'vault-relic', planEquivalent: 'max', permanent: true, featureGroup: 'max-vault-relics' }),
  freezeUnlock({ id: 'power-builder-circle-frame', keyType: 'power', label: 'Founder / Builder Circle profile frame', category: 'profile', planEquivalent: 'max', permanent: true, featureGroup: 'private-builder-circle' }),
  freezeUnlock({ id: 'power-feature-voting', keyType: 'power', label: 'Priority feature voting', category: 'community', planEquivalent: 'power', durationDays: 90, featureGroup: 'feature-voting' }),

  // Rewarded video economics are deliberately conservative: one completed
  // video creates one Sponsor Key, and each key is consumed exactly once.
  // One video may unlock only a short session/cosmetic; stronger temporary
  // capability requires several independent verified completions.
  freezeUnlock({ id: 'sponsor-template-library-15m', keyType: 'sponsor', label: 'Plus Template Library · 15 minutes', category: 'template', planEquivalent: 'plus', keysRequired: 1, durationMinutes: 15, featureGroup: 'plus-template-library' }),
  freezeUnlock({ id: 'sponsor-workflow-pack-30m', keyType: 'sponsor', label: 'Plus Workflow Packs · 30 minutes', category: 'workflow', planEquivalent: 'plus', keysRequired: 2, durationMinutes: 30, featureGroup: 'plus-workflow-packs' }),
  freezeUnlock({ id: 'sponsor-local-ai-guidance-60m', keyType: 'sponsor', label: 'Guided Local/BYOK AI Workflows · 1 hour', category: 'ai-workflow', planEquivalent: 'plus', keysRequired: 3, durationMinutes: 60, featureGroup: 'local-ai-guided-workflows', requiresUserLocalOrOwnProviderKey: true }),
  freezeUnlock({ id: 'sponsor-studio-dashboard-90m', keyType: 'sponsor', label: 'Studio Dashboard Session · 90 minutes', category: 'dashboard', planEquivalent: 'studio', keysRequired: 4, durationMinutes: 90, featureGroup: 'studio-dashboard' }),
  freezeUnlock({ id: 'sponsor-creator-presets-90m', keyType: 'sponsor', label: 'Creator Preset Packs · 90 minutes', category: 'creator-preset', planEquivalent: 'studio', keysRequired: 4, durationMinutes: 90, featureGroup: 'creator-preset-packs' }),
  freezeUnlock({ id: 'sponsor-automation-pack-180m', keyType: 'sponsor', label: 'Power Automation Pack · 3 hours', category: 'automation', planEquivalent: 'power', keysRequired: 6, durationMinutes: 180, featureGroup: 'power-automation-packs' })
]);

export const EON_REFERRAL_REWARD_MATRIX = Object.freeze([
  Object.freeze({
    id: 'invite-click',
    label: 'Invite click or share',
    trigger: 'link-opened-or-shared',
    inviterReward: Object.freeze([]),
    inviteeReward: Object.freeze([]),
    countsAs: 'not-a-qualifying-event',
    immediate: false
  }),
  Object.freeze({
    id: 'activated-free-invite',
    label: 'Useful activation',
    trigger: 'signed-in-invitee-plus-one-allowlisted-useful-milestone',
    countsAs: 'free-activation',
    immediate: true,
    inviterReward: Object.freeze(['1 Signal Key', 'Signal Vault Relic']),
    inviteeReward: Object.freeze(['Welcome Vault Reveal'])
  }),
  Object.freeze({
    id: 'trial-started',
    label: 'Seven-day trial started',
    trigger: 'verified-dodo-trial-start',
    countsAs: 'pending-context-only',
    immediate: false,
    inviterReward: Object.freeze([]),
    inviteeReward: Object.freeze(['normal seven-day plan trial only'])
  }),
  Object.freeze({
    id: 'first-retained-paid',
    label: 'First retained paid referral',
    trigger: 'verified-payment-or-renewal-plus-14-day-retention',
    countsAs: 'paid-referral-1',
    immediate: false,
    inviterReward: Object.freeze(['1 Builder Key', 'Builder Vault Relic']),
    inviteeReward: Object.freeze(['normal paid plan entitlement only'])
  }),
  Object.freeze({
    id: 'second-retained-paid',
    label: 'Second retained paid referral',
    trigger: 'second-verified-payment-or-renewal-plus-14-day-retention-in-calendar-year',
    countsAs: 'paid-referral-2',
    immediate: false,
    inviterReward: Object.freeze(['1 Builder Key', 'Builder Vault Relic']),
    inviteeReward: Object.freeze(['normal paid plan entitlement only'])
  }),
  Object.freeze({
    id: 'third-retained-paid',
    label: 'Third retained paid referral',
    trigger: 'third-verified-payment-or-renewal-plus-14-day-retention-in-calendar-year',
    countsAs: 'paid-referral-3-yearly-cap',
    immediate: false,
    inviterReward: Object.freeze(['1 Power Key', 'Builder Circle Relic']),
    inviteeReward: Object.freeze(['normal paid plan entitlement only'])
  })
]);


export const EON_LOCKED_FEATURE_UNLOCK_COPY = Object.freeze({
  generic: 'Subscribe, start the standard seven-day trial, or use EONKEYS earned from verified referrals to unlock this individual feature or limit.',
  plus: 'This individual feature is included with Plus and higher plans. You can also start the seven-day trial or redeem an eligible Signal/Builder Key for this feature only.',
  studio: 'This individual feature is included with Studio and higher plans. You can also start the seven-day trial or redeem an eligible Builder Key for this feature only.',
  power: 'This individual feature is included with Power and Max. You can also start the seven-day trial or redeem an eligible Power Key for this feature only.',
  max: 'This individual Max-level capability can be used through Max, its seven-day trial, or an eligible Power Key where the unlock menu explicitly lists it.',
  pro: 'This professional capability is included with Pro and higher recurring plans, or eligible Ultimate perpetual software access. Referral and Sponsor Keys do not unlock Pro-level software capability.',
  ultra: 'This scaled professional capability is included with Ultra, or eligible Ultimate perpetual software access. Referral and Sponsor Keys do not unlock Ultra-level software capability.',
  ultimate: 'Ultimate is a one-time perpetual software-capability purchase with no recurring trial. EONKEYS never substitute for the Ultimate licence.',
  ai: 'This AI feature uses your local runtime or your own provider/API key unless a separately governed hosted route is explicitly selected. EONKEYS unlock EONAPP workflow capability only; they do not pay provider bills or grant unlimited generation.'
});

export function getEonSubscriptionTiers() {
  return EON_SUBSCRIPTION_TIERS;
}

export function getEonKeyTypes() {
  return EON_KEY_TYPES;
}

export function getEonUnlockMenu({ keyType = '' } = {}) {
  const normalized = String(keyType || '').trim().toLowerCase();
  return normalized ? EON_KEY_UNLOCK_MENU.filter((unlock) => unlock.keyType === normalized) : EON_KEY_UNLOCK_MENU;
}

export function getEonReferralRewardMatrix() {
  return EON_REFERRAL_REWARD_MATRIX;
}

export function getTierUnlockPaths(tierId = '') {
  const tier = EON_SUBSCRIPTION_TIERS.find((entry) => entry.id === String(tierId || '').trim().toLowerCase());
  if (!tier) return Object.freeze({ tier: null, unlocks: Object.freeze([]) });
  const groups = new Set(tier.featureGroups);
  const unlocks = EON_KEY_UNLOCK_MENU.filter((unlock) => groups.has(unlock.featureGroup) || unlock.planEquivalent === tier.id);
  return Object.freeze({ tier, unlocks: Object.freeze(unlocks) });
}

export function validateEonKeysCatalog() {
  const errors = [];
  const keyIds = new Set(EON_KEY_TYPES.map((key) => key.id));
  const tierIds = new Set(EON_SUBSCRIPTION_TIERS.map((tier) => tier.id));
  const forbidden = /cash|commission|crypto|token|nft|wallet|payout|withdraw|transferable|resale|lottery|jackpot|spin|lootbox|subscription discount|renewal credit|free subscription|free month/i;

  if (EON_AI_COST_BOUNDARY.platformPaidHostedGeneration !== false) errors.push('EONAPP platform-paid hosted generation must remain false for this launch plan.');
  if (!EON_AI_COST_BOUNDARY.userLocalAiAllowed || !EON_AI_COST_BOUNDARY.userProviderApiKeyAllowed) errors.push('Local AI and own-provider API-key rails must be explicit.');
  if (EON_SUBSCRIPTION_TIERS.filter((tier) => tier.billingType === 'subscription').some((tier) => tier.trialPublic !== true || tier.trialDays !== 7)) errors.push('Every recurring paid tier must expose the standard seven-day Dodo trial.');
  if (EON_SUBSCRIPTION_TIERS.filter((tier) => tier.billingType !== 'subscription').some((tier) => tier.trialPublic === true || tier.trialDays !== 0)) errors.push('Free and one-time products must not advertise a recurring subscription trial.');
  if (EON_KEYS_REFERRAL_POLICY.subscriptionDiscounts || EON_KEYS_REFERRAL_POLICY.subscriptionRenewalCredits || EON_KEYS_REFERRAL_POLICY.freeSubscriptionTiers || EON_KEYS_REFERRAL_POLICY.wholeTierEntitlements) errors.push('EONKEYS must never create subscription discounts, renewal credits or whole-tier entitlements.');

  for (const unlock of EON_KEY_UNLOCK_MENU) {
    if (!keyIds.has(unlock.keyType)) errors.push(`Unlock ${unlock.id} uses an unknown key type.`);
    if (unlock.platformPaidAiCost !== false) errors.push(`Unlock ${unlock.id} implies platform-paid AI cost.`);
    if (unlock.cashValue || unlock.transferable || unlock.tokenOrNft || unlock.marketplace) errors.push(`Unlock ${unlock.id} creates a value/transfer boundary problem.`);
    if (forbidden.test(`${unlock.id} ${unlock.label} ${unlock.category}`)) errors.push(`Unlock ${unlock.id} uses forbidden value language.`);
    if (unlock.category === 'feature-pass') errors.push(`Unlock ${unlock.id} is a whole-tier feature pass; EONKEYS must unlock individual features or limits only.`);
    if (unlock.category === 'ai-workflow' && unlock.requiresUserLocalOrOwnProviderKey !== true) errors.push(`AI workflow unlock ${unlock.id} must require local AI or the user's own API key.`);
    if (unlock.keyType === 'sponsor') {
      if (unlock.permanent === true || Number(unlock.durationDays || 0) > 0 || Number(unlock.durationMinutes || 0) <= 0) errors.push(`Sponsor unlock ${unlock.id} must be short-lived and non-permanent.`);
      if (Number(unlock.durationMinutes || 0) > 240) errors.push(`Sponsor unlock ${unlock.id} exceeds the four-hour rewarded-access ceiling.`);
      if (Number(unlock.keysRequired || 0) < 1 || Number(unlock.keysRequired || 0) > 6) errors.push(`Sponsor unlock ${unlock.id} must cost between one and six Sponsor Keys.`);
    }
  }

  for (const tier of EON_SUBSCRIPTION_TIERS.filter((entry) => ['plus', 'studio', 'power', 'max'].includes(entry.id))) {
    const paths = getTierUnlockPaths(tier.id).unlocks;
    if (!tierIds.has(tier.id)) errors.push(`Tier ${tier.id} missing from tier registry.`);
    if (!paths.length) errors.push(`Tier ${tier.id} has no EON Key unlock path.`);
  }

  for (const row of EON_REFERRAL_REWARD_MATRIX) {
    const text = `${row.label} ${(row.inviterReward || []).join(' ')} ${(row.inviteeReward || []).join(' ')}`;
    if (forbidden.test(text)) errors.push(`Referral row ${row.id} uses forbidden value language.`);
  }

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: EON_KEYS_CATALOG_SCHEMA, version: EON_KEYS_CATALOG_VERSION });
}

export default Object.freeze({
  EON_KEYS_CATALOG_SCHEMA,
  EON_KEYS_CATALOG_VERSION,
  EON_AI_COST_BOUNDARY,
  EON_SUBSCRIPTION_TIERS,
  EON_KEY_TYPES,
  EON_KEY_UNLOCK_MENU,
  EON_REFERRAL_REWARD_MATRIX,
  EON_LOCKED_FEATURE_UNLOCK_COPY,
  getEonSubscriptionTiers,
  getEonKeyTypes,
  getEonUnlockMenu,
  getEonReferralRewardMatrix,
  getTierUnlockPaths,
  validateEonKeysCatalog
});
