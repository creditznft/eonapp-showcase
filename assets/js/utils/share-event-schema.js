export const SHARE_RECEIPT_SCHEMA = 'eon.share-receipt.v1';
export const SHARE_REWARD_SCHEMA = 'eon.share-reward.v1';
export const SOCIAL_PROOF_SCHEMA = 'eon.social-proof.v1';

export const SHARE_EVENT_TYPES = Object.freeze([
  'share_attempt', 'link_open', 'unique_visit', 'feature_open', 'telegram_miniapp_open',
  'telegram_channel_verified', 'onboarding_complete', 'proof_action_complete',
  'rewarded_ad_valued', 'subscription_started', 'marketplace_listing_view',
  'marketplace_purchase', 'realm_entered', 'creator_action', 'public_proof_verified', 'reversal'
]);

export const TRUST_LEVELS = Object.freeze({
  share_attempt: 0,
  link_open: 1,
  unique_visit: 2,
  feature_open: 3,
  telegram_miniapp_open: 3,
  realm_entered: 3,
  creator_action: 3,
  onboarding_complete: 4,
  telegram_channel_verified: 4,
  proof_action_complete: 4,
  public_proof_verified: 4,
  rewarded_ad_valued: 5,
  subscription_started: 5,
  marketplace_purchase: 5,
  reversal: 5
});

const FORBIDDEN_FIELDS = new Set(['ip', 'ipAddress', 'rawIp', 'latitude', 'longitude', 'email', 'walletSecret', 'privateKey', 'fingerprint', 'userAgent']);

export function sanitizeShareEventProof(proof = {}) {
  const safe = {};
  for (const [key, value] of Object.entries(proof || {})) {
    if (FORBIDDEN_FIELDS.has(key)) continue;
    if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) safe[key] = typeof value === 'string' ? value.slice(0, 300) : value;
  }
  return safe;
}

export function assertShareEventType(type) {
  if (!SHARE_EVENT_TYPES.includes(type)) throw new Error(`Unsupported share event type: ${type}`);
  return type;
}
