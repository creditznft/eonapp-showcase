/**
 * W226 — Phase 9 commercial go/no-go gate.
 *
 * This is a policy/technical decision registry, not a monetisation engine. It
 * deliberately cannot create an offer, payment, attribution, reward, ledger
 * entry, token action, merchant account, withdrawal, or background request.
 */

export const EON_COMMERCIAL_DECISION_SCHEMA = 'eon.commercial-decision-gate.v1';
export const EON_COMMERCIAL_DECISION_VERSION = 1;

export const EON_COMMERCIAL_ACTIVATION_FLAGS = Object.freeze({
  officialCommerceActive: false,
  officialCatalogActive: false,
  checkoutActive: false,
  paymentProviderActive: false,
  referralAttributionActive: false,
  affiliateProgramActive: false,
  commissionActive: false,
  payoutActive: false,
  rewardCampaignActive: false,
  adIncentiveActive: false,
  tokenProgramActive: false,
  tokenTransferActive: false,
  userSellerMarketplaceActive: false,
  publicRealmStorefrontActive: false
});

export const EON_COMMERCIAL_NON_NEGOTIABLES = Object.freeze([
  'Signed invites are invitations, not a reward, commission, payout, or ownership claim.',
  'No value is created for clicks, page visits, generic sharing, idle activity, ad views, or browser-local attribution.',
  'Official commerce cannot rely on a client callback; verified server order, receipt, delivery, reversal, and support evidence are required.',
  'A future affiliate program may be one level only, server verified, reversal-aware, and clearly disclosed. Its active rate is zero until approved.',
  'No withdrawal, wallet custody, token transfer, or user-to-user seller flow can be enabled by a frontend change.',
  'Token research remains archived until independently verified contract, role, treasury, policy, and specialist-review evidence exists.'
]);

const FUTURE_GATE_REQUIREMENTS = Object.freeze({
  officialCommerce: Object.freeze([
    'Merchant/publisher identity, terms, official catalog, price, rights, delivery, support, refund/dispute policy, and verified server receipts.',
    'Verified processor/server callback handling, replay protection, reconciliation, and production browser/device proof.',
    'No customer payment request until the full flow has an explicit launch decision.'
  ]),
  affiliate: Object.freeze([
    'One-level only; no click, share, view, activity, or multi-level reward.',
    'Server-side attribution, order verification, pending/eligible/payable/paid/reversed ledger, fraud controls, and appeal process.',
    'Written eligibility, maximum rate, reversal window, disclosure, tax, and payout policy approved before any active rate is displayed.'
  ]),
  token: Object.freeze([
    'Verified contract address, chain ID, explorer source, bytecode, deploy evidence, roles, treasury, mint/burn policy, and independent security review.',
    'Written legal, tax, AML/KYC, consumer, payment-provider, and advertising review for the actual flow and jurisdictions served.',
    'No mining, conversion, airdrop, investment, liquidity, withdrawal, or referral-token copy before a written go decision.'
  ]),
  publicRealm: Object.freeze([
    'Server account, handle validation, anti-impersonation controls, terms, public-data allowlist, report/takedown path, versioning, and audit trail.',
    'Official EONAPP catalog only until a separately reviewed seller/onboarding/dispute system exists.'
  ])
});

function safeActionName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 48) || 'unknown';
}

function inactiveDecision(id, label, reason, requirements) {
  return Object.freeze({
    id,
    label,
    status: 'no-go',
    active: false,
    activeRatePercent: 0,
    reversalWindowDays: null,
    networkRequestCreated: false,
    storageWriteCreated: false,
    reason,
    requirements: Object.freeze([...requirements])
  });
}

export function getCommercialDecisionRegistry() {
  return Object.freeze({
    schema: EON_COMMERCIAL_DECISION_SCHEMA,
    version: EON_COMMERCIAL_DECISION_VERSION,
    lifecycle: 'decision-gate-only',
    activation: EON_COMMERCIAL_ACTIVATION_FLAGS,
    decisions: Object.freeze([
      inactiveDecision('official-commerce', 'Official catalog & checkout', 'No live merchant, checkout, receipt, delivery, refund, dispute, or server reconciliation proof is active.', FUTURE_GATE_REQUIREMENTS.officialCommerce),
      inactiveDecision('realm-affiliate', 'Realm attribution & affiliate', 'Signed links are invitations only. No tracked attribution, commission, rate, eligibility, payout, or cash-out is active.', FUTURE_GATE_REQUIREMENTS.affiliate),
      inactiveDecision('rewards-ads', 'Rewards & ad incentives', 'Reward campaigns and ad incentives remain disabled. Sharing or activity never unlocks value.', FUTURE_GATE_REQUIREMENTS.affiliate),
      inactiveDecision('eon-lite-token', 'Archived token research', 'No verified live token program, transfer, conversion, mining, airdrop, or withdrawal proof exists in this release.', FUTURE_GATE_REQUIREMENTS.token),
      inactiveDecision('user-marketplace', 'User seller marketplace', 'User selling and public Realm storefront commerce are not part of V1.', FUTURE_GATE_REQUIREMENTS.publicRealm)
    ]),
    nonNegotiables: EON_COMMERCIAL_NON_NEGOTIABLES,
    publicCopy: Object.freeze({
      invite: 'Invite links help people discover EONAPP. They do not create a reward, affiliate commission, payout, ownership right, or commercial account.',
      commerce: 'No checkout, purchase, receipt, delivery, referral commission, payout, token settlement, or user selling is active.',
      futureDisclosure: 'A future paid or benefit-linked promotion may require clear disclosure of the material connection; no such program is active now.'
    })
  });
}

/** Terminal response for any premature activation attempt. */
export function requestCommercialActivation(action = '') {
  const decision = getCommercialDecisionRegistry();
  return Object.freeze({
    schema: decision.schema,
    action: safeActionName(action),
    allowed: false,
    status: 'no-go',
    networkRequestCreated: false,
    storageWriteCreated: false,
    ledgerEntryCreated: false,
    tokenActionCreated: false,
    reason: 'Commercial activation is blocked by the W226 decision gate. It requires a separate written go decision and server-side evidence.'
  });
}

export function getCommercialPublicStatus() {
  const registry = getCommercialDecisionRegistry();
  return Object.freeze({
    schema: registry.schema,
    active: false,
    activeRatePercent: 0,
    message: registry.publicCopy.commerce,
    inviteMessage: registry.publicCopy.invite,
    decisionCount: registry.decisions.length,
    decisions: registry.decisions.map(({ id, label, status, active, reason }) => Object.freeze({ id, label, status, active, reason }))
  });
}
