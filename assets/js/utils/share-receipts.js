import { canonicalize, sha256Base64Url } from './share-link-codec.js';
import { readShareAttribution } from './share-attribution.js';
import { assertShareEventType, sanitizeShareEventProof, SHARE_RECEIPT_SCHEMA, TRUST_LEVELS } from './share-event-schema.js';
import { createShareScopedVisitorPseudonym } from './share-visitor-identity.js';

export async function createShareReceipt(eventType, options = {}) {
  assertShareEventType(eventType);
  const attribution = options.attribution || readShareAttribution() || {};
  const shareId = String(options.shareId || attribution.shareId || 'direct');
  const occurredAt = Number(options.occurredAt || Date.now());
  const receiptBase = {
    schema: SHARE_RECEIPT_SCHEMA,
    version: 1,
    shareId,
    rootReferralId: String(options.rootReferralId || attribution.rootReferralId || '').slice(0, 96),
    parentShareId: String(options.parentShareId || attribution.parentShareId || '').slice(0, 128),
    campaignId: String(options.campaignId || attribution.campaignId || '').slice(0, 96),
    missionCode: String(options.missionCode || attribution.missionCode || '').slice(0, 24),
    eventType,
    trustLevel: Number(options.trustLevel ?? TRUST_LEVELS[eventType] ?? 0),
    visitorPseudonym: await createShareScopedVisitorPseudonym(shareId),
    occurredAt,
    proof: sanitizeShareEventProof({ action: eventType, source: 'local-eonapp', ...(options.proof || {}) })
  };
  const eventId = await sha256Base64Url(canonicalize(receiptBase));
  return { ...receiptBase, eventId, signature: String(options.signature || '') };
}

export async function createRewardKey(eventId, rewardPolicyId, beneficiaryId) {
  return sha256Base64Url(`${eventId}:${rewardPolicyId}:${beneficiaryId}`);
}
