/**
 * EON fair-free feature unlock economy
 * ------------------------------------
 * Central policy for temporary ad/social unlocks, subscription access, and
 * lifetime utility NFT passes. This module is intentionally value-only: ad
 * credit is derived from provider reward value, never raw IP/country/device data.
 */

export const FEATURE_UNLOCK_SCHEMA = 'eon.feature-unlock-economy.w71.v1';

export const UNLOCK_PAYMENT_RAILS = Object.freeze({
  temporaryAd: 'provider-confirmed-ad-value',
  temporarySocial: 'verified-social-performance',
  subscription: 'active-plan',
  lifetimeNft: 'utility-nft-pass-with-accumulated-credits'
});

export const FORBIDDEN_REWARD_STORAGE_FIELDS = Object.freeze([
  'ip',
  'rawIp',
  'country',
  'geo',
  'city',
  'region',
  'userAgent',
  'fingerprint',
  'deviceFingerprint',
  'uid',
  'telegramId',
  'telegram_id',
  'sessionId',
  'session_id',
  'email',
  'walletAddress'
]);

export const FEATURE_UNLOCK_CATALOG = Object.freeze({
  ai_chat_burst: {
    label: 'AI Chat Burst',
    category: 'ai',
    temporary: { adCredits: 1, socialCredits: 1, durationDays: 1, usageLimit: 25 },
    subscriptionPlan: 'supporter',
    lifetimeNft: { adCredits: 140, socialCredits: 70, totalCredits: 180, minAdEvents: 35, minSocialActions: 12, stablePriceCents: 2500, lifetime: true }
  },
  voice_mode: {
    label: 'Voice Mode',
    category: 'ai',
    temporary: { adCredits: 2, socialCredits: 2, durationDays: 1, usageLimit: 12 },
    subscriptionPlan: 'supporter',
    lifetimeNft: { adCredits: 180, socialCredits: 90, totalCredits: 240, minAdEvents: 45, minSocialActions: 15, stablePriceCents: 3000, lifetime: true }
  },
  nft_generator_pro: {
    label: 'NFT Generator Pro',
    category: 'creator',
    temporary: { adCredits: 3, socialCredits: 3, durationDays: 1, usageLimit: 8 },
    subscriptionPlan: 'core',
    lifetimeNft: { adCredits: 260, socialCredits: 130, totalCredits: 360, minAdEvents: 65, minSocialActions: 20, stablePriceCents: 5000, lifetime: true }
  },
  realm_builder: {
    label: 'Realm Builder',
    category: 'realm',
    temporary: { adCredits: 3, socialCredits: 3, durationDays: 3, usageLimit: 5 },
    subscriptionPlan: 'core',
    lifetimeNft: { adCredits: 320, socialCredits: 160, totalCredits: 440, minAdEvents: 80, minSocialActions: 24, stablePriceCents: 7000, lifetime: true }
  },
  private_workstation: {
    label: 'Private 3D Workstation',
    category: 'realm',
    temporary: { adCredits: 4, socialCredits: 4, durationDays: 3, usageLimit: 10 },
    subscriptionPlan: 'pro',
    lifetimeNft: { adCredits: 420, socialCredits: 210, totalCredits: 600, minAdEvents: 100, minSocialActions: 30, stablePriceCents: 10000, lifetime: true }
  },
  vault_pro: {
    label: 'Vault Pro',
    category: 'vault',
    temporary: { adCredits: 2, socialCredits: 2, durationDays: 7, usageLimit: 20 },
    subscriptionPlan: 'core',
    lifetimeNft: { adCredits: 240, socialCredits: 120, totalCredits: 320, minAdEvents: 60, minSocialActions: 18, stablePriceCents: 5000, lifetime: true }
  },
  creator_export: {
    label: 'Creator Export',
    category: 'creator',
    temporary: { adCredits: 2, socialCredits: 2, durationDays: 7, usageLimit: 5 },
    subscriptionPlan: 'core',
    lifetimeNft: { adCredits: 220, socialCredits: 110, totalCredits: 300, minAdEvents: 55, minSocialActions: 18, stablePriceCents: 4500, lifetime: true }
  },
  trade_research: {
    label: 'Research Lab',
    category: 'research',
    temporary: { adCredits: 3, socialCredits: 3, durationDays: 1, usageLimit: 15 },
    subscriptionPlan: 'pro',
    lifetimeNft: { adCredits: 300, socialCredits: 150, totalCredits: 420, minAdEvents: 75, minSocialActions: 22, stablePriceCents: 7000, lifetime: true }
  },
  ai_cockpit_pro: {
    label: 'AI Cockpit Pro',
    category: 'ai',
    temporary: { adCredits: 2, socialCredits: 2, durationDays: 1, usageLimit: 18 },
    subscriptionPlan: 'core',
    lifetimeNft: { adCredits: 240, socialCredits: 120, totalCredits: 330, minAdEvents: 55, minSocialActions: 18, stablePriceCents: 5000, lifetime: true }
  },
  workbench_pro: {
    label: 'Workbench Pro',
    category: 'builder',
    temporary: { adCredits: 3, socialCredits: 3, durationDays: 1, usageLimit: 10 },
    subscriptionPlan: 'core',
    lifetimeNft: { adCredits: 280, socialCredits: 140, totalCredits: 380, minAdEvents: 70, minSocialActions: 20, stablePriceCents: 6000, lifetime: true }
  },
  code_maker_pro: {
    label: 'Code Maker Pro',
    category: 'builder',
    temporary: { adCredits: 2, socialCredits: 2, durationDays: 1, usageLimit: 8 },
    subscriptionPlan: 'core',
    lifetimeNft: { adCredits: 260, socialCredits: 130, totalCredits: 360, minAdEvents: 65, minSocialActions: 20, stablePriceCents: 5500, lifetime: true }
  },
  video_studio_pro: {
    label: 'Video Studio Pro',
    category: 'creator',
    temporary: { adCredits: 4, socialCredits: 4, durationDays: 1, usageLimit: 4 },
    subscriptionPlan: 'creator',
    lifetimeNft: { adCredits: 420, socialCredits: 210, totalCredits: 600, minAdEvents: 100, minSocialActions: 30, stablePriceCents: 10000, lifetime: true }
  },
  music_studio_pro: {
    label: 'Music Studio Pro',
    category: 'creator',
    temporary: { adCredits: 4, socialCredits: 4, durationDays: 1, usageLimit: 5 },
    subscriptionPlan: 'creator',
    lifetimeNft: { adCredits: 380, socialCredits: 190, totalCredits: 540, minAdEvents: 95, minSocialActions: 28, stablePriceCents: 9000, lifetime: true }
  },
  browser_automation: {
    label: 'Browser Automation',
    category: 'ai',
    temporary: { adCredits: 3, socialCredits: 3, durationDays: 1, usageLimit: 8 },
    subscriptionPlan: 'pro',
    lifetimeNft: { adCredits: 320, socialCredits: 160, totalCredits: 440, minAdEvents: 80, minSocialActions: 24, stablePriceCents: 7000, lifetime: true }
  },
  tool_exports: {
    label: 'Tool Exports',
    category: 'tools',
    temporary: { adCredits: 2, socialCredits: 2, durationDays: 7, usageLimit: 10 },
    subscriptionPlan: 'core',
    lifetimeNft: { adCredits: 220, socialCredits: 110, totalCredits: 300, minAdEvents: 55, minSocialActions: 16, stablePriceCents: 4500, lifetime: true }
  },
  reward_boosts: {
    label: 'Reward Boosts',
    category: 'rewards',
    temporary: { adCredits: 1, socialCredits: 2, durationDays: 1, usageLimit: 5 },
    subscriptionPlan: 'supporter',
    lifetimeNft: { adCredits: 180, socialCredits: 110, totalCredits: 260, minAdEvents: 45, minSocialActions: 18, stablePriceCents: 3000, lifetime: true }
  },
  onboarding_boost: {
    label: 'Starter Boost',
    category: 'onboarding',
    temporary: { adCredits: 1, socialCredits: 1, durationDays: 7, usageLimit: 6 },
    subscriptionPlan: 'supporter',
    lifetimeNft: { adCredits: 140, socialCredits: 80, totalCredits: 220, minAdEvents: 35, minSocialActions: 12, stablePriceCents: 2500, lifetime: true }
  }
});

const FEATURE_ALIASES = Object.freeze({
  chat: 'ai_chat_burst',
  ai: 'ai_chat_burst',
  voice: 'voice_mode',
  nft: 'nft_generator_pro',
  generator: 'nft_generator_pro',
  realm: 'realm_builder',
  eoncity: 'private_workstation',
  workstation: 'private_workstation',
  vault: 'vault_pro',
  export: 'creator_export',
  trade: 'trade_research',
  cockpit: 'ai_cockpit_pro',
  workbench: 'workbench_pro',
  builder: 'workbench_pro',
  code: 'code_maker_pro',
  codemaker: 'code_maker_pro',
  browser: 'browser_automation',
  video: 'video_studio_pro',
  music: 'music_studio_pro',
  tools: 'tool_exports',
  reward: 'reward_boosts',
  rewards: 'reward_boosts',
  onboarding: 'onboarding_boost',
  starter: 'onboarding_boost'
});

function normalizeFeatureId(featureId = 'ai_chat_burst') {
  const raw = String(featureId || 'ai_chat_burst').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const id = FEATURE_ALIASES[raw] || raw;
  return FEATURE_UNLOCK_CATALOG[id] ? id : 'ai_chat_burst';
}

function clampNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function clampInt(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return Math.floor(clampNumber(value, min, max));
}

/**
 * Converts Monetag/provider estimated value into local ad credits. The app should
 * prefer provider-confirmed postback value over country/IP guesses. One verified
 * low-value view still gives at least one temporary credit, but lifetime NFT
 * passes require many events and accumulated value.
 */
export function estimateAdCreditsFromProviderValue(input = {}) {
  const estimatedPrice = clampNumber(input.estimated_price ?? input.estimatedPrice ?? input.valueUsd ?? input.price, 0, 100);
  const rewardEventType = String(input.reward_event_type || input.rewardEventType || 'rewarded_view').trim().toLowerCase();
  const multiplier = rewardEventType.includes('complete') || rewardEventType.includes('valued') ? 1.2 : 1;
  if (estimatedPrice <= 0) return 1;
  return Math.max(1, Math.floor(estimatedPrice * 100 * multiplier));
}

export function sanitizeProviderRewardReceipt(input = {}) {
  const receipt = {
    schema: 'eon.provider-value-receipt.v1',
    provider: String(input.provider || input.network || 'monetag').trim().toLowerCase().slice(0, 40),
    ymid: String(input.ymid || input.YMID || '').trim().slice(0, 96),
    rewardEventType: String(input.reward_event_type || input.rewardEventType || 'rewarded_view').trim().slice(0, 80),
    estimatedPrice: clampNumber(input.estimated_price ?? input.estimatedPrice ?? input.valueUsd ?? 0, 0, 100),
    currency: String(input.currency || 'USD').trim().toUpperCase().slice(0, 8),
    adCredits: estimateAdCreditsFromProviderValue(input),
    receivedAt: Number.isFinite(Number(input.receivedAt)) ? Number(input.receivedAt) : 0
  };
  return Object.freeze(receipt);
}

export function assertNoForbiddenRewardFields(record = {}) {
  const keys = new Set(Object.keys(record || {}));
  const forbidden = FORBIDDEN_REWARD_STORAGE_FIELDS.filter((field) => keys.has(field));
  return {
    ok: forbidden.length === 0,
    forbidden
  };
}

export function getFeatureUnlockRule(featureId = 'ai_chat_burst') {
  const id = normalizeFeatureId(featureId);
  return Object.freeze({ id, ...FEATURE_UNLOCK_CATALOG[id] });
}

export function buildTemporaryUnlockQuote(featureId = 'ai_chat_burst', method = 'ad') {
  const rule = getFeatureUnlockRule(featureId);
  const temporary = rule.temporary;
  const viaSocial = String(method || '').toLowerCase().includes('social') || String(method || '').toLowerCase().includes('share');
  return Object.freeze({
    schema: FEATURE_UNLOCK_SCHEMA,
    featureId: rule.id,
    featureLabel: rule.label,
    mode: viaSocial ? 'temporary-social' : 'temporary-ad',
    creditsRequired: viaSocial ? temporary.socialCredits : temporary.adCredits,
    durationDays: temporary.durationDays,
    usageLimit: temporary.usageLimit,
    message: viaSocial
      ? `Share and verify activity to unlock ${rule.label} temporarily.`
      : `Watch a verified rewarded ad to unlock ${rule.label} temporarily.`
  });
}

export function buildLifetimeNftQuote(featureId = 'ai_chat_burst') {
  const rule = getFeatureUnlockRule(featureId);
  return Object.freeze({
    schema: FEATURE_UNLOCK_SCHEMA,
    featureId: rule.id,
    featureLabel: rule.label,
    mode: 'lifetime-utility-nft',
    lifetime: true,
    adCreditsRequired: rule.lifetimeNft.adCredits,
    socialCreditsRequired: rule.lifetimeNft.socialCredits,
    totalCreditsRequired: rule.lifetimeNft.totalCredits,
    minVerifiedAdEvents: rule.lifetimeNft.minAdEvents,
    minVerifiedSocialActions: rule.lifetimeNft.minSocialActions,
    stablePriceCents: rule.lifetimeNft.stablePriceCents,
    nftUtilityClass: `${rule.category}-lifetime-pass`,
    warning: 'One ad view or one social share can never mint or unlock a lifetime NFT pass.'
  });
}

export function canClaimTemporaryUnlock({ featureId = 'ai_chat_burst', method = 'ad', adCredits = 0, socialCredits = 0 } = {}) {
  const quote = buildTemporaryUnlockQuote(featureId, method);
  const balance = quote.mode === 'temporary-social' ? clampInt(socialCredits) : clampInt(adCredits);
  return Object.freeze({
    ok: balance >= quote.creditsRequired,
    quote,
    balance,
    missingCredits: Math.max(0, quote.creditsRequired - balance)
  });
}

export function canMintLifetimeNftPass({ featureId = 'ai_chat_burst', adCredits = 0, socialCredits = 0, verifiedAdEvents = 0, verifiedSocialActions = 0, paid = false } = {}) {
  const quote = buildLifetimeNftQuote(featureId);
  const adBalance = clampInt(adCredits);
  const socialBalance = clampInt(socialCredits);
  const totalBalance = adBalance + socialBalance;
  const paidAccess = Boolean(paid);
  const creditOk = totalBalance >= quote.totalCreditsRequired
    && adBalance >= Math.ceil(quote.adCreditsRequired * 0.5)
    && socialBalance >= Math.ceil(quote.socialCreditsRequired * 0.25);
  const eventOk = clampInt(verifiedAdEvents) >= quote.minVerifiedAdEvents
    || clampInt(verifiedSocialActions) >= quote.minVerifiedSocialActions
    || (clampInt(verifiedAdEvents) >= Math.ceil(quote.minVerifiedAdEvents * 0.65)
      && clampInt(verifiedSocialActions) >= Math.ceil(quote.minVerifiedSocialActions * 0.5));
  const ok = paidAccess || (creditOk && eventOk);
  return Object.freeze({
    ok,
    quote,
    paidAccess,
    balances: { adCredits: adBalance, socialCredits: socialBalance, totalCredits: totalBalance, verifiedAdEvents: clampInt(verifiedAdEvents), verifiedSocialActions: clampInt(verifiedSocialActions) },
    missing: {
      totalCredits: Math.max(0, quote.totalCreditsRequired - totalBalance),
      adCreditsFloor: Math.max(0, Math.ceil(quote.adCreditsRequired * 0.5) - adBalance),
      socialCreditsFloor: Math.max(0, Math.ceil(quote.socialCreditsRequired * 0.25) - socialBalance),
      adEvents: Math.max(0, quote.minVerifiedAdEvents - clampInt(verifiedAdEvents)),
      socialActions: Math.max(0, quote.minVerifiedSocialActions - clampInt(verifiedSocialActions))
    },
    reason: ok ? 'eligible' : 'lifetime_nft_requires_accumulated_verified_value'
  });
}

export function buildFeatureUnlockMenu(featureId = 'ai_chat_burst') {
  const rule = getFeatureUnlockRule(featureId);
  return Object.freeze({
    schema: FEATURE_UNLOCK_SCHEMA,
    featureId: rule.id,
    featureLabel: rule.label,
    options: [
      buildTemporaryUnlockQuote(rule.id, 'ad'),
      buildTemporaryUnlockQuote(rule.id, 'social'),
      Object.freeze({ mode: 'subscription', plan: rule.subscriptionPlan, message: `Subscribe to unlock ${rule.label} as part of a monthly bundle.` }),
      buildLifetimeNftQuote(rule.id)
    ],
    policy: Object.freeze({
      temporaryCanUseSingleAdOrShare: true,
      lifetimeNftRequiresAccumulation: true,
      noPaidSubscriptionFromSocialProofAlone: true,
      providerValueOnlyForAdCredits: true,
      noRawIpOrCountryStorage: true
    })
  });
}

export function buildNftPassPurchasePolicy(featureId = 'ai_chat_burst') {
  const quote = buildLifetimeNftQuote(featureId);
  return Object.freeze({
    schema: 'eon.utility-nft-purchase-policy.v1',
    featureId: quote.featureId,
    nftUtilityClass: quote.nftUtilityClass,
    lifetime: true,
    paymentPaths: [
      { id: 'verified-value-credits', label: 'Accumulate ad/social credits', quote },
      { id: 'subscription-path', label: 'Use subscription instead', note: 'Monthly access without lifetime ownership.' },
      { id: 'direct-purchase', label: 'Direct purchase', stablePriceCents: quote.stablePriceCents }
    ],
    disallowed: ['single_ad_lifetime_unlock', 'single_share_lifetime_unlock', 'country_claimed_reward_boost', 'ip_based_reward_storage']
  });
}


export function normalizeFeatureUnlockId(featureId = 'ai_chat_burst') {
  return normalizeFeatureId(featureId);
}

export function buildTemporaryUnlockRecord({ featureId = 'ai_chat_burst', method = 'ad', now = Date.now() } = {}) {
  const quote = buildTemporaryUnlockQuote(featureId, method);
  const issuedAt = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const expiresAt = issuedAt + quote.durationDays * 24 * 60 * 60 * 1000;
  return Object.freeze({
    schema: 'eon.feature-temporary-pass.v1',
    featureId: quote.featureId,
    featureLabel: quote.featureLabel,
    mode: quote.mode,
    method: quote.mode === 'temporary-social' ? 'social' : 'ad',
    creditsSpent: quote.creditsRequired,
    usageLimit: quote.usageLimit,
    remainingUses: quote.usageLimit,
    issuedAt,
    expiresAt,
    passId: `temp-${quote.featureId}-${issuedAt.toString(36)}`
  });
}

export function isTemporaryUnlockActive(record = {}, now = Date.now()) {
  if (!record || typeof record !== 'object') return false;
  const entry = /** @type {any} */ (record);
  const expiresAt = Number(entry.expiresAt || 0);
  const remainingUses = Number(entry.remainingUses ?? entry.usageLimit ?? 0);
  return Number.isFinite(expiresAt) && expiresAt > Number(now || Date.now()) && remainingUses > 0;
}

export function getActiveTemporaryUnlock(balance = {}, featureId = 'ai_chat_burst', now = Date.now()) {
  const id = normalizeFeatureId(featureId);
  const record = balance?.temporaryUnlocks?.[id];
  return isTemporaryUnlockActive(record, now) ? Object.freeze(record) : null;
}

export function hasLifetimeNftPass(balance = {}, featureId = 'ai_chat_burst') {
  const id = normalizeFeatureId(featureId);
  const pass = balance?.lifetimePasses?.[id];
  return Boolean(pass && typeof pass === 'object' && pass.lifetime !== false && !pass.revokedAt);
}

export function canAccessFeature({ featureId = 'ai_chat_burst', balance = {}, activePlanId = 'free', now = Date.now() } = {}) {
  const rule = getFeatureUnlockRule(featureId);
  const temporary = getActiveTemporaryUnlock(balance, rule.id, now);
  const lifetime = hasLifetimeNftPass(balance, rule.id);
  const subscribed = ['supporter', 'starter', 'core', 'pro', 'creator', 'business'].includes(String(activePlanId || '').toLowerCase());
  return Object.freeze({
    ok: Boolean(temporary || lifetime || subscribed),
    featureId: rule.id,
    featureLabel: rule.label,
    access: temporary ? 'temporary' : lifetime ? 'lifetime-nft' : subscribed ? 'subscription' : 'locked',
    temporary,
    lifetime,
    subscribed
  });
}
