/**
 * W443 — commercial/reward/provider decision gate.
 *
 * This is a truth registry and hard hold. It does not produce credits, rewards,
 * referrals, ad calls, Telegram actions, commerce, wallets, payments, tracking
 * or commerce activation. Each area remains blocked until its named independent
 * legal, policy, consent, provider and support evidence exists.
 */
export const EON_COMMERCIAL_DECISION_GATE_SCHEMA = 'eon.commercial.decision-gate.w443.v1';
export const EON_COMMERCIAL_DECISION_AREAS = Object.freeze([
  Object.freeze({ id: 'rewards', label: 'Rewards and Vault Reveals', status: 'hold', prerequisites: Object.freeze(['eligibility-policy', 'consent', 'abuse-controls', 'support-reversal', 'data-survival-proof']) }),
  Object.freeze({ id: 'telegram', label: 'Telegram access and Mini App', status: 'hold', prerequisites: Object.freeze(['production-session-proof', 'channel-membership-proof', 'privacy-review', 'support-path']) }),
  Object.freeze({ id: 'ads', label: 'Advertising and sponsor boosts', status: 'hold', prerequisites: Object.freeze(['provider-contract', 'user-consent', 'sensitive-surface-exclusions', 'postback-proof', 'abuse-controls']) }),
  Object.freeze({ id: 'payments', label: 'Payments and paid access', status: 'hold', prerequisites: Object.freeze(['merchant-eligibility', 'tax-policy', 'refund-support', 'provider-webhook-proof', 'privacy-review']) }),
  Object.freeze({ id: 'referrals', label: 'Referrals and Relay', status: 'hold', prerequisites: Object.freeze(['identity-proof', 'consent', 'server-ledger', 'anti-abuse', 'reversal-support', 'commercial-review']) }),
  Object.freeze({ id: 'marketplace', label: 'Marketplace, trading, and transfers', status: 'hold', prerequisites: Object.freeze(['asset-policy', 'ownership-model', 'wallet-safety', 'support-policy', 'legal-review']) })
]);
const freeze = (value) => Object.freeze(value);
const safeId = (value) => String(value || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);

export function getEonCommercialDecisionSnapshot() {
  return freeze({ schema: EON_COMMERCIAL_DECISION_GATE_SCHEMA, areas: freeze(EON_COMMERCIAL_DECISION_AREAS.map((area) => freeze({ ...area, activationAllowed: false, productionProofAttached: false, userEntitlementCreated: false, providerRequestCreated: false }))), activationAllowed: false, localOnly: true });
}

export function requestEonCommercialActivation(areaId = '', { explicitUserAction = false } = {}) {
  const area = EON_COMMERCIAL_DECISION_AREAS.find((item) => item.id === safeId(areaId));
  return freeze({ ok: false, error: explicitUserAction === true ? 'commercial-decision-gate-not-cleared' : 'explicit-user-action-required', areaId: area?.id || safeId(areaId), activationAllowed: false, providerRequestCreated: false, paymentCreated: false, adCallCreated: false, rewardCreated: false, referralCreated: false, walletActionCreated: false });
}

export function getEonCommercialDecisionTruth() {
  return freeze({ schema: EON_COMMERCIAL_DECISION_GATE_SCHEMA, decisionRegistry: true, rewardsLive: false, telegramLive: false, adsLive: false, paymentsLive: false, referralsLive: false, marketplaceLive: false, automaticCommercialActivation: false, providerPostbackProof: false, userEntitlementCreated: false, productionCommercialProof: false });
}
