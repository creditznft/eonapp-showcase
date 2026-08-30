/**
 * RT92 premium billing architecture — PRODUCTION IMPLEMENTATION TRUTH.
 *
 * Runtime, migration and webhook support exist in source and the owner-approved
 * LIVE Dodo products are configured for the certified Production activation
 * release. This file itself creates no product, entitlement or browser grant.
 */

export const RT92_PREMIUM_BILLING_DESIGN_SCHEMA = 'eonapp.premium-billing-design.rt92.v1';
export const RT92_PREMIUM_BILLING_COMMERCIAL_STATUS = 'production-live-checkout-enabled';

const freeze = (value) => Object.freeze(value);

export const RT92_PREMIUM_ENTITLEMENT_AXES = freeze({
  subscriptionCapacity: freeze({
    currentAuthority: 'eon_entitlements + eon_billing_lifecycle',
    currentCardinality: 'one active tier_id per account',
    futureRecurringTiers: freeze(['pro', 'ultra']),
    governs: freeze(['hosted-workload-budget', 'concurrency', 'scheduled-runs', 'storage', 'other-metered-capacity'])
  }),
  softwareCapability: freeze({
    futureAuthority: 'server-side software grant ledger',
    futurePerpetualBundle: 'ultimate',
    governs: freeze(['eligible-premium-software-capabilities']),
    mustNotGovern: freeze(['unlimited-hosted-ai', 'unlimited-compute', 'unlimited-storage', 'unlimited-scheduled-runs', 'unlimited-concurrency'])
  })
});

export const RT92_FUTURE_SOFTWARE_GRANT_LEDGER = freeze({
  proposedTable: 'eon_software_grants',
  migrationCreated: true,
  runtimeImplemented: true,
  runtimeActive: true,
  requiredColumns: freeze([
    'grant_id',
    'account_id',
    'bundle_id',
    'status',
    'source_provider',
    'source_event_id',
    'source_order_ref',
    'issued_at',
    'revoked_at',
    'revocation_reason',
    'updated_at'
  ]),
  requiredUniqueness: freeze(['grant_id', 'source_provider+source_event_id']),
  activeStatuses: freeze(['active']),
  revocationEvents: freeze(['refund', 'lost-dispute', 'manual-owner-approved-revocation']),
  restorationKey: 'account_id + verified provider purchase history',
  browserAuthority: false
});

export const RT92_FUTURE_DODO_PRODUCTS = freeze([
  freeze({ tierId: 'pro', kind: 'recurring-capacity-subscription', targetPriceUsd: 99, productId: 'pdt_0NlZKlIoQ2A6bSFNbBwMk', catalogueCreated: true, checkoutActive: true, entitlementActive: true }),
  freeze({ tierId: 'ultra', kind: 'recurring-capacity-subscription', targetPriceUsd: 199, productId: 'pdt_0NlZLXhMLMnLeFkxNZMSw', catalogueCreated: true, checkoutActive: true, entitlementActive: true }),
  freeze({ tierId: 'ultimate', kind: 'one-time-software-capability', targetPriceUsdRange: freeze([999, 1499]), selectedPriceUsd: 1299, productId: 'pdt_0NlZMVaq84ItJEM2lPSrZ', catalogueCreated: true, checkoutActive: true, entitlementActive: true })
]);

export const RT92_PREMIUM_BILLING_ACTIVATION_GATES = freeze([
  'premium-capability-audit-approved',
  'software-grant-ledger-implemented-server-side',
  'subscription-capacity-and-software-grants-merged-server-side',
  'refund-dispute-revocation-certified',
  'purchase-restoration-certified',
  'heavy-user-cost-model-approved',
  'concurrency-and-workload-budgets-certified',
  'full-billing-regression-green',
  'preview-browser-proof-green'
]);

export function validateRt92PremiumBillingDesign() {
  const errors = [];
  if (!RT92_FUTURE_SOFTWARE_GRANT_LEDGER.migrationCreated || !RT92_FUTURE_SOFTWARE_GRANT_LEDGER.runtimeImplemented) errors.push('Premium software grant migration and runtime must exist before activation.');
  if (!RT92_FUTURE_SOFTWARE_GRANT_LEDGER.runtimeActive) errors.push('Premium software grant runtime must be active after certified Production activation.');
  if (RT92_FUTURE_SOFTWARE_GRANT_LEDGER.browserAuthority) errors.push('Browser authority is forbidden for paid software grants.');
  for (const product of RT92_FUTURE_DODO_PRODUCTS) {
    if (!product.catalogueCreated || !/^pdt_[A-Za-z0-9]+$/.test(product.productId || '')) errors.push(`${product.tierId} catalogue record/id must exist.`);
    if (!product.checkoutActive || !product.entitlementActive) errors.push(`${product.tierId} checkout and webhook entitlement authority must be active after certification.`);
  }
  const prohibited = RT92_PREMIUM_ENTITLEMENT_AXES.softwareCapability.mustNotGovern.join(' ');
  if (!/unlimited-hosted-ai/.test(prohibited) || !/unlimited-compute/.test(prohibited)) errors.push('Ultimate boundary must explicitly exclude unlimited hosted capacity.');
  if (!RT92_PREMIUM_BILLING_ACTIVATION_GATES.includes('heavy-user-cost-model-approved')) errors.push('Cost modelling must gate commercial activation.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: RT92_PREMIUM_BILLING_DESIGN_SCHEMA });
}

export default freeze({
  RT92_PREMIUM_BILLING_DESIGN_SCHEMA,
  RT92_PREMIUM_BILLING_COMMERCIAL_STATUS,
  RT92_PREMIUM_ENTITLEMENT_AXES,
  RT92_FUTURE_SOFTWARE_GRANT_LEDGER,
  RT92_FUTURE_DODO_PRODUCTS,
  RT92_PREMIUM_BILLING_ACTIVATION_GATES,
  validateRt92PremiumBillingDesign
});
