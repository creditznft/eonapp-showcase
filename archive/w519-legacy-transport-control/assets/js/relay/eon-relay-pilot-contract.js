/**
 * W391A/B/C — EON Relay pilot contract.
 *
 * A future direct-referral appreciation model. It is disabled by design and
 * produces no code, link, reward, entitlement, notification or database write.
 */
export const EON_RELAY_SCHEMA = 'eonapp.relay.pilot.v1';
export const EON_RELAY_ROLLOUT = 'disabled';
export const EON_RELAY_MAX_VERIFIED_GRANTS = 3;

const freeze = (value) => Object.freeze(value);

export const EON_RELAY_REQUIREMENTS = freeze([
  'new-invitee-identity',
  'public-safe-referral-attribution',
  'meaningful-creator-activation',
  'later-return-or-second-meaningful-action',
  'server-side-abuse-review',
  'explicit-grant-reversal-path',
  'legal-and-support-policy-signoff'
]);

export const EON_RELAY_PROHIBITIONS = freeze([
  'cash', 'payout', 'commission', 'coupon', 'discount', 'subscription-time',
  'ai-credit', 'token', 'crypto', 'nft', 'sale', 'transfer', 'downline',
  'click-reward', 'signup-only-reward', 'share-only-reward', 'auto-grant'
]);

export function getEonRelayPilotTruth() {
  return freeze({
    schema: EON_RELAY_SCHEMA,
    rollout: EON_RELAY_ROLLOUT,
    enabled: false,
    directReferralOnly: true,
    verifiedActivationOnly: true,
    maxVerifiedGrantsPerInviter: EON_RELAY_MAX_VERIFIED_GRANTS,
    requirements: EON_RELAY_REQUIREMENTS,
    prohibitions: EON_RELAY_PROHIBITIONS,
    createsInviteLink: false,
    createsGrant: false,
    queriesDatabase: false,
    storesIpAddress: false,
    storesDeviceFingerprint: false,
    needsDedicatedRelayDatabase: true,
    requiredBinding: 'EON_RELAY_DB',
    activationPrerequisites: freeze([
      'w395-production-testing-proof',
      'w396-empty-target-recovery-proof',
      'w397-human-release-signoff',
      'relay-legal-packet-approved',
      'relay-abuse-review-and-kill-switch-proven'
    ])
  });
}

export function validateRelayCandidate(candidate = {}) {
  const source = candidate && typeof candidate === 'object' ? candidate : {};
  const reasons = [];
  if (EON_RELAY_ROLLOUT !== 'enabled') reasons.push('relay-disabled');
  if (source.event !== 'verified-activation') reasons.push('activation-not-verified');
  if (!Number.isInteger(source.verifiedGrantCount) || source.verifiedGrantCount < 0 || source.verifiedGrantCount >= EON_RELAY_MAX_VERIFIED_GRANTS) reasons.push('grant-cap-or-count-invalid');
  if (source.hasCashValue || source.hasTransfer || source.isSignupOnly || source.isClickOnly || source.isShareOnly) reasons.push('non-financial-direct-activation-boundary-failed');
  return freeze({ ok: false, reasons: freeze(reasons.length ? reasons : ['relay-disabled']), grantCreated: false });
}

export default freeze({ EON_RELAY_SCHEMA, EON_RELAY_ROLLOUT, EON_RELAY_MAX_VERIFIED_GRANTS, getEonRelayPilotTruth, validateRelayCandidate });
