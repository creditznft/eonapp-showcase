/**
 * R4-COMM-03 — solo subscription ladder, price parity and final commercial
 * truth. This is a source-planning contract only. It turns on nothing.
 */
import { R4_COMM02_EON_INVITE, R4_COMM02_FEATURE_FLAGS } from './r4-comm02-global-commerce-contract.mjs';

export const R4_COMM03_SCHEMA = 'eonapp.r4.comm03.solo-pricing.v1';
export const R4_COMM03_VERSION = 1;

export const R4_COMM03_STATUS = Object.freeze({
  publicPricingActive: false,
  checkoutActive: false,
  recurringBillingActive: false,
  oneTimePackSalesActive: false,
  entitlementActive: false,
  providerSelected: false,
  eonInviteActive: false,
  teamPlanActive: false,
  enterprisePlanActive: false,
  sourcePlanningOnly: true
});

/**
 * The fixed INR book is intentionally aligned to a rounded ₹100 per US$ anchor.
 * It is not browser FX conversion and it is not a customer-facing rate claim.
 */
export const R4_COMM03_CURRENCY_POLICY = Object.freeze({
  status: 'planning-only-not-public',
  sourceSnapshot: Object.freeze({
    observedAtUtc: '2026-06-26T06:04:00Z',
    usdToInrReference: 94.6895,
    purpose: 'Sanity-check fixed India price parity only; never use this value at runtime or checkout.'
  }),
  regionalAnchorInrPerUsd: 100,
  targetParityTolerancePercent: 6,
  browserSideFxAllowed: false,
  checkoutRule: 'A chosen provider owns approved local currency, taxes and the final displayed checkout amount. EONAPP never converts a customer price in the browser.',
  reviewRule: 'Review both fixed price books no more than twice each year, or after a sustained material currency/tax/provider-fee change. Never silently rewrite an active subscriber price.'
});

const india = (id, billing, price, extra = {}) => Object.freeze({ id, billing, currency: 'INR', price, ...extra });
const global = (id, billing, price, extra = {}) => Object.freeze({ id, billing, currency: 'USD', price, ...extra });

/**
 * All values are internal planning entries. They are deliberately absent from
 * public checkout and cannot create an entitlement until a later gated wave.
 */
export const R4_COMM03_PRICE_BOOKS = Object.freeze({
  status: 'planned-not-public-not-for-sale',
  annualDiscountRule: 'Annual membership is approximately ten monthly payments, equivalent to about two months free.',
  oneTimePacks: Object.freeze({
    india: Object.freeze([
      india('official-pack-essential', 'one-time', 499),
      india('official-pack-professional', 'one-time', 1499),
      india('official-pack-signature', 'one-time', 2999)
    ]),
    global: Object.freeze([
      global('official-pack-essential', 'one-time', 4.99),
      global('official-pack-professional', 'one-time', 14.99),
      global('official-pack-signature', 'one-time', 29.99)
    ])
  }),
  subscriptions: Object.freeze({
    india: Object.freeze([
      india('eon-free', 'free', 0),
      india('eon-plus', 'monthly', 499),
      india('eon-plus', 'annual', 4999),
      india('eon-studio', 'monthly', 1499),
      india('eon-studio', 'annual', 14999),
      india('eon-power', 'monthly', 2999),
      india('eon-power', 'annual', 29999),
      india('eon-max', 'monthly', 4999),
      india('eon-max', 'annual', 49999)
    ]),
    global: Object.freeze([
      global('eon-free', 'free', 0),
      global('eon-plus', 'monthly', 4.99),
      global('eon-plus', 'annual', 49.99),
      global('eon-studio', 'monthly', 14.99),
      global('eon-studio', 'annual', 149.99),
      global('eon-power', 'monthly', 29.99),
      global('eon-power', 'annual', 299.99),
      global('eon-max', 'monthly', 49.99),
      global('eon-max', 'annual', 499.99)
    ])
  })
});

export const R4_COMM03_SOLO_TIER_DESIGN = Object.freeze([
  Object.freeze({
    id: 'eon-free',
    state: 'active-local',
    price: Object.freeze({ INR: 0, USD: 0 }),
    purpose: 'Generous local-first EONAPP core: Apps, Workspace, 32 official Blueprints, 16 approval-first workflows, Insights desks, exports, backups and safety controls.',
    neverLock: Object.freeze(['ordinary local work', 'exports', 'backup guidance', 'safety controls', 'basic project records', 'artificial AI-message quotas'])
  }),
  Object.freeze({
    id: 'eon-plus',
    state: 'planned-not-for-sale',
    price: Object.freeze({ INR: 499, USD: 4.99, annualINR: 4999, annualUSD: 49.99 }),
    purpose: 'Maintained Plus Pack Library: versioned professional outcome systems, update notes and migration notes.',
    inclusionBoundary: 'Only complete maintained Packs. No basic local tool, no ad-free toggle, no cloud backup claim and no hosted-model quota.',
    activationGate: Object.freeze(['At least 24 maintained Plus Pack deliverables.', 'At least six fully built and browser-reviewed Pack workrooms.', 'Provider-approved test-mode billing lifecycle, cancellation and reversal proof.', 'AI-first self-service guidance plus an exception route for paid-access, privacy, security and unresolved billing failures.'])
  }),
  Object.freeze({
    id: 'eon-studio',
    state: 'planned-not-for-sale',
    price: Object.freeze({ INR: 1499, USD: 14.99, annualINR: 14999, annualUSD: 149.99 }),
    purpose: 'Plus plus deeper solo creator, business and research operating systems with reusable local dashboards and advanced workroom sets.',
    inclusionBoundary: 'No shared-team claim, no managed AI credit, no cloud sync promise and no priority-human-support promise.',
    activationGate: Object.freeze(['Studio Pack catalogue exists separately from Plus.', 'Each Studio Pack has inputs, deliverables, review checkpoints, version notes and a local handoff.', 'Evidence shows repeat usage beyond one-time Pack purchases.'])
  }),
  Object.freeze({
    id: 'eon-power',
    state: 'planned-not-for-sale',
    price: Object.freeze({ INR: 2999, USD: 29.99, annualINR: 29999, annualUSD: 299.99 }),
    purpose: 'Studio plus the full current non-Signature single-user Official Pack library and advanced cross-workroom operating systems.',
    inclusionBoundary: 'No financial advice, live market data, broker connection, trading execution, team governance, cloud storage or human account manager.',
    activationGate: Object.freeze(['At least 36 maintained premium single-user Packs.', 'Cross-workroom systems are browser and mobile reviewed.', 'Subscription grant, cancellation, refund and dispute reversal proof is complete.'])
  }),
  Object.freeze({
    id: 'eon-max',
    state: 'designed-not-for-sale',
    price: Object.freeze({ INR: 4999, USD: 49.99, annualINR: 49999, annualUSD: 499.99 }),
    purpose: 'All-access individual catalogue: Power plus all current Signature Packs and a clearly labelled stable-preview Pack stream while the membership remains active.',
    inclusionBoundary: 'EON Max is a solo product only. It is not Enterprise, Team, priority support, unlimited hosted AI, financial intelligence, cloud backup or a governance package.',
    activationGate: Object.freeze(['At least 50 maintained premium single-user Packs.', 'A documented 12-month Pack release and migration cadence.', 'Full licence, cancellation, renewal, refund and dispute reversal proof.', 'No paid claim appears until the exact included catalogue exists.'])
  })
]);

export const R4_COMM03_ORGANISATION_SCOPE = Object.freeze({
  decision: 'Not in the current product or pricing roadmap.',
  excluded: Object.freeze(['EON Team', 'EON Scale', 'Enterprise', 'per-seat pricing', 'organisation roles', 'SSO', 'contractual account management', 'human service-level promises']),
  revisitOnlyWhen: 'A future, separately governed team product exists with real collaboration, roles, data controls, billing administration and accountable operations.'
});

export const R4_COMM03_EON_INVITE_BOUNDARY = Object.freeze({
  status: R4_COMM02_EON_INVITE.status,
  principle: 'A future single-level coupon or capped access extension may be a customer promotion. It remains inactive and may never become a referral-income, affiliate, revenue-share, payout or multi-level program.',
  currentActivation: false
});

function find(entries, id, billing) {
  return entries.find((entry) => entry.id === id && entry.billing === billing);
}

function withinParity(inr, usd) {
  if (usd === 0) return inr === 0;
  const implied = inr / usd;
  const diff = Math.abs(implied - R4_COMM03_CURRENCY_POLICY.regionalAnchorInrPerUsd);
  return (diff / R4_COMM03_CURRENCY_POLICY.regionalAnchorInrPerUsd) * 100 <= R4_COMM03_CURRENCY_POLICY.targetParityTolerancePercent;
}

export function validateR4Comm03Contract() {
  const errors = [];
  if (Object.values(R4_COMM03_STATUS).filter((value) => typeof value === 'boolean' && value !== true).length < 8) errors.push('R4-COMM-03 must keep all commercial activation flags false.');
  if (R4_COMM03_STATUS.sourcePlanningOnly !== true) errors.push('R4-COMM-03 must remain source-planning-only.');
  if (Object.values(R4_COMM02_FEATURE_FLAGS).some(Boolean)) errors.push('R4-COMM-03 inherits the inactive R4-COMM-02 boundary.');
  if (R4_COMM03_CURRENCY_POLICY.browserSideFxAllowed !== false) errors.push('Browser-side FX conversion must stay banned.');
  if (R4_COMM03_PRICE_BOOKS.status !== 'planned-not-public-not-for-sale') errors.push('Price books must stay internal planning values.');

  const expectedMonthly = [
    ['eon-plus', 4.99, 499],
    ['eon-studio', 14.99, 1499],
    ['eon-power', 29.99, 2999],
    ['eon-max', 49.99, 4999]
  ];
  for (const [id, usd, inr] of expectedMonthly) {
    const globalEntry = find(R4_COMM03_PRICE_BOOKS.subscriptions.global, id, 'monthly');
    const indiaEntry = find(R4_COMM03_PRICE_BOOKS.subscriptions.india, id, 'monthly');
    if (globalEntry?.price !== usd || indiaEntry?.price !== inr) errors.push(`${id} monthly parity entry is invalid.`);
    if (!withinParity(indiaEntry?.price, globalEntry?.price)) errors.push(`${id} monthly INR/USD values fall outside the declared parity tolerance.`);
  }
  const expectedAnnual = [
    ['eon-plus', 49.99, 4999],
    ['eon-studio', 149.99, 14999],
    ['eon-power', 299.99, 29999],
    ['eon-max', 499.99, 49999]
  ];
  for (const [id, usd, inr] of expectedAnnual) {
    const globalEntry = find(R4_COMM03_PRICE_BOOKS.subscriptions.global, id, 'annual');
    const indiaEntry = find(R4_COMM03_PRICE_BOOKS.subscriptions.india, id, 'annual');
    if (globalEntry?.price !== usd || indiaEntry?.price !== inr) errors.push(`${id} annual parity entry is invalid.`);
    if (!withinParity(indiaEntry?.price, globalEntry?.price)) errors.push(`${id} annual INR/USD values fall outside the declared parity tolerance.`);
  }
  if (R4_COMM03_SOLO_TIER_DESIGN.find((tier) => tier.id === 'eon-max')?.state !== 'designed-not-for-sale') errors.push('EON Max must remain designed, not for sale.');
  if (!R4_COMM03_SOLO_TIER_DESIGN.find((tier) => tier.id === 'eon-max')?.activationGate.some((gate) => gate.includes('50 maintained premium single-user Packs'))) errors.push('EON Max needs a high-value catalogue gate.');
  if (R4_COMM03_ORGANISATION_SCOPE.excluded.includes('Enterprise') === false) errors.push('Enterprise must remain outside the current roadmap.');
  if (R4_COMM03_EON_INVITE_BOUNDARY.currentActivation !== false || R4_COMM03_EON_INVITE_BOUNDARY.status !== 'planned-not-active-provider-approval-required') errors.push('EON Invite must remain inactive.');
  return Object.freeze(errors);
}
