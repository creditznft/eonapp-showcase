/**
 * W355 — referral commercial re-entry remains intentionally blocked.
 *
 * Relic Passport is a free local cosmetic experience, not a referral programme.
 * This module contains no tracking, attribution, conversion, discount, payout,
 * cash, crypto, point, token, wallet, or subscription behaviour.
 */

export const EON_REFERRAL_REENTRY_FIREWALL_SCHEMA = 'eonapp.referral-reentry-firewall.v1';

export function assessEonReferralReentry({
  processorTestModeProven = false,
  refundWindowProven = false,
  abuseControlsProven = false,
  supportOwnerProven = false,
  oneLevelOnly = true,
  cashOrCrypto = false,
  pointsOrToken = false,
  automaticActivationRequested = false
} = {}) {
  const blockers = [];
  if (processorTestModeProven !== true) blockers.push('processor-test-mode-proof-required');
  if (refundWindowProven !== true) blockers.push('refund-window-proof-required');
  if (abuseControlsProven !== true) blockers.push('abuse-controls-proof-required');
  if (supportOwnerProven !== true) blockers.push('support-owner-proof-required');
  if (oneLevelOnly !== true) blockers.push('one-level-cap-required');
  if (cashOrCrypto === true) blockers.push('cash-or-crypto-prohibited');
  if (pointsOrToken === true) blockers.push('points-or-token-prohibited');
  if (automaticActivationRequested === true) blockers.push('automatic-activation-prohibited');
  return Object.freeze({
    schema: EON_REFERRAL_REENTRY_FIREWALL_SCHEMA,
    status: blockers.length ? 'blocked' : 'separate-ceo-decision-required',
    blockers: Object.freeze(blockers),
    referralActive: false,
    attributionTrackingActive: false,
    discountIssued: false,
    cashOrCryptoIssued: false,
    pointsOrTokenIssued: false,
    walletCreated: false,
    payoutCreated: false,
    automaticActivation: false,
    note: blockers.length
      ? 'Referral activation remains blocked. Realm Share Relics remain free local cosmetics only.'
      : 'Even with prerequisites, referral activation needs a separate CEO/legal/security/payment decision and remains inactive.'
  });
}

export function getEonReferralReentryFirewallTruth() {
  return Object.freeze({
    schema: EON_REFERRAL_REENTRY_FIREWALL_SCHEMA,
    referralActive: false,
    attributionTrackingActive: false,
    cashOrCryptoIssued: false,
    pointsOrTokenIssued: false,
    walletCreated: false,
    payoutCreated: false,
    automaticActivation: false,
    relicPassportIsReferral: false
  });
}

export default Object.freeze({
  EON_REFERRAL_REENTRY_FIREWALL_SCHEMA,
  assessEonReferralReentry,
  getEonReferralReentryFirewallTruth
});
