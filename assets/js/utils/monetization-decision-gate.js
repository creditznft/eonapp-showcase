/**
 * W215 single source of truth for public monetization state.
 * Changing this module alone is not enough to enable a provider: a future
 * campaign must also pass legal/trust review, provider approval, callback
 * verification, abuse controls, and a separately reviewed deployment.
 */
export const MONETIZATION_DECISION = Object.freeze({
  version: 'commercial-retirement-v1',
  mode: 'retired',
  active: false,
  publicOfferwall: false,
  rewardedAds: false,
  referralRewards: false,
  revenueShare: false,
  payouts: false,
  subscriptionsFromRewards: false,
  callbackAcceptance: false,
  reason: 'Advertising, offerwalls, reward unlocks, Telegram reward mechanics and referral payouts are retired. Sharing does not create money, points, access, attribution, payouts or revenue share.',
  futurePrerequisites: Object.freeze([]),
});

export function isMonetizationActive() {
  return false;
}

export function getMonetizationPublicStatus() {
  return { ...MONETIZATION_DECISION };
}

export function assertNoActiveMonetization() {
  return { ok: false, code: 'monetization_disabled', decision: MONETIZATION_DECISION };
}
