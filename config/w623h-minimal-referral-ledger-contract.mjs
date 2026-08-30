/** W623H — minimal server authority for active referral rewards. */
export const W623H_MINIMAL_REFERRAL_SCHEMA = 'eonapp.referrals.w623h-minimal-authority.v1';

export const W623H_MINIMAL_REFERRAL_CONTRACT = Object.freeze({
  schema: W623H_MINIMAL_REFERRAL_SCHEMA,
  monetization: 'separate-commercial-rails',
  ordinaryAdvertisingOutsideReferral: true,
  rewardedSponsorKeysOutsideReferral: true,
  referralClickRewards: false,
  referralAdViewRewards: false,
  serverBinding: 'EON_REFERRALS_DB',
  legacyFallbackBinding: 'EON_BILLING_DB',
  existingDatabaseUsed: true,
  newDatabaseRequired: false,
  newSecretRequired: false,
  cronRequired: false,
  queueRequired: false,
  linkRegistryRequired: false,
  rawSignedTokenStored: false,
  identityBindingProof: 'fresh-p256-proof-of-possession',
  identityChallengeTtlMinutes: 10,
  identitiesPerAccountCap: 5,
  clickTracking: false,
  impressionTracking: false,
  socialPostTracking: false,
  privacySafeMeasurement: 'ledger-derived-aggregates-only',
  levels: 1,
  freeActivation: Object.freeze({ key: 'signal', monthlyInviterCap: 5, requiresSignedInInvitee: true, requiresUsefulMilestone: true }),
  paidRetentionDays: 14,
  yearlyPaidReferralCap: 3,
  paidProgression: Object.freeze(['builder', 'builder', 'power']),
  trialStartReward: false,
  reversalEvents: Object.freeze(['refund', 'cancellation', 'expiry', 'payment-failure', 'dispute', 'entitlement-revocation']),
  serverStores: Object.freeze(['short-lived-binding-challenge', 'referral-account-binding', 'one-level-invite-association', 'qualifying-event', 'key-grant', 'key-unlock', 'digital-reward-receipt']),
  localOnly: Object.freeze(['signed-public-link', 'generated-content', 'share-card', 'campaign-draft', 'social-destination-choice']),
  excludedRewards: Object.freeze(['cash', 'payout', 'commission', 'subscription', 'discount', 'renewal-credit', 'provider-credit', 'wallet', 'token', 'nft', 'unlimited-ai'])
});

export function validateW623hMinimalReferralContract() {
  const c = W623H_MINIMAL_REFERRAL_CONTRACT;
  const errors = [];
  if (c.monetization !== 'separate-commercial-rails' || !c.ordinaryAdvertisingOutsideReferral || !c.rewardedSponsorKeysOutsideReferral || c.referralClickRewards || c.referralAdViewRewards) errors.push('Referral rewards must remain separate from ordinary ads, rewarded Sponsor Keys, clicks and ad views.');
  if (c.serverBinding !== 'EON_REFERRALS_DB' || c.legacyFallbackBinding !== 'EON_BILLING_DB' || !c.existingDatabaseUsed || c.newDatabaseRequired || c.newSecretRequired || c.cronRequired || c.queueRequired) errors.push('Referral authority must prefer the existing dedicated referral D1, retain only a temporary billing fallback, and add no secret, cron or queue.');
  if (c.linkRegistryRequired || c.rawSignedTokenStored || c.clickTracking || c.impressionTracking || c.socialPostTracking) errors.push('Signed links must remain stateless and public sharing must not be tracked.');
  if (c.privacySafeMeasurement !== 'ledger-derived-aggregates-only') errors.push('Growth measurement must use existing qualified ledger aggregates only.');
  if (c.identityBindingProof !== 'fresh-p256-proof-of-possession' || c.identityChallengeTtlMinutes > 10 || c.identitiesPerAccountCap !== 5) errors.push('Identity binding must prove private-key possession with a short-lived challenge.');
  if (c.levels !== 1 || c.paidRetentionDays < 14 || c.yearlyPaidReferralCap !== 3) errors.push('One-level, retention and cap rules drifted.');
  if (JSON.stringify(c.paidProgression) !== JSON.stringify(['builder', 'builder', 'power']) || c.trialStartReward) errors.push('Paid progression must be Builder, Builder, Power with no trial-start reward.');
  if (!c.reversalEvents.includes('refund') || !c.reversalEvents.includes('dispute')) errors.push('Refund and dispute reversal are mandatory.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: W623H_MINIMAL_REFERRAL_SCHEMA, checks: 17 });
}
