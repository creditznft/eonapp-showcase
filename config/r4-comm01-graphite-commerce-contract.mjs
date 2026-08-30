/**
 * R4-COMM-01 — product-default appearance and commercial operating model.
 *
 * This is a governance/configuration contract only. It activates no checkout,
 * merchant, price, subscription, entitlement, referral, ad, processor, or
 * external workflow path.
 */

export const R4_COMM01_SCHEMA = 'eonapp.r4.comm01.graphite-commerce.v2';
export const R4_COMM01_VERSION = 2;

export const R4_COMM01_THEME = Object.freeze({
  productDefault: 'graphite',
  preservedExplicitChoices: Object.freeze(['graphite', 'obsidian', 'ember']),
  legacyImplicitValues: Object.freeze(['', 'classic-eon', 'system']),
  cityRealmPolicy: 'App appearance defaults to Graphite. A Realm or City palette remains a separate local creative preference and is never silently overwritten.',
  rationale: 'Graphite is the calm, neutral, high-contrast default for the chat-first product shell. The product supports dark themes only: Graphite, Obsidian and Ember.'
});

export const R4_COMM01_FEATURE_FLAGS = Object.freeze({
  publicPricingActive: false,
  checkoutActive: false,
  subscriptionActive: false,
  oneTimePackSalesActive: false,
  paymentProviderActive: false,
  entitlementServiceActive: false,
  processorWebhookActive: false,
  referralCommissionActive: false,
  referralDiscountActive: false,
  affiliateProgramActive: false,
  adInventoryActive: false,
  cpaOfferwallActive: false,
  sponsoredDiscoveryActive: false,
  payoutActive: false,
  enterpriseSalesActive: false
});

export const R4_COMM01_MONETISATION_DECISION = Object.freeze({
  launchModel: 'free-core-with-one-optional-membership-and-outcome-pack-licences',
  noAdsInCore: Object.freeze(['EONBOT Chat', 'Workspace', 'Vault', 'Apps', 'EON City', 'Insights & Forecasts']),
  cpaOfferwalls: 'not-approved',
  referral: Object.freeze({
    publicName: 'EON Invite',
    status: 'share-only',
    allowed: Object.freeze(['portable invite link', 'free local cosmetic recognition']),
    prohibited: Object.freeze(['cash', 'crypto', 'points', 'subscription percentage', 'commission', 'payout', 'affiliate income', 'multi-level reward', 'ad-linked value', 'subscription unlock'])
  }),
  processors: Object.freeze({
    primaryCandidate: 'Dodo Payments',
    selectionStatus: 'individual-underwriting-pending',
    fallbackCandidate: null,
    retiredCandidates: Object.freeze(['Razorpay', 'Cashfree', 'PayU', 'NOWPayments']),
    reason: 'Dodo Payments is the single approval-pending merchant-of-record planning candidate. No substitute processor is queued for integration, and no hosted checkout, trial, webhook, entitlement or public price is active before independent approval and lifecycle proof.'
  })
});

/**
 * Planning values only. They are intentionally not imported into public UI,
 * billing pages, checkout code, or entitlement logic. A price becomes usable
 * only after the corresponding deliverables and commercial gates are complete.
 */
export const R4_COMM01_PLANNED_CATALOG = Object.freeze([
  Object.freeze({
    id: 'eon-free', lifecycle: 'active-local', billing: 'free', plannedPriceUsdReference: 0,
    audience: 'everyone',
    value: 'All active local-first core workflows, official Blueprints, manual/CSV insight desks, exports, backup guidance, and safety tools.'
  }),
  ...['eon-plus', 'eon-studio', 'eon-power', 'eon-max'].map((id) => Object.freeze({
    id, lifecycle: 'planned-not-for-sale', billing: 'monthly-or-annual',
    plannedPriceUsdReference: 'not-finalized-within-49.99-monthly-cap',
    audience: 'individual users after maintained paid-tier value and billing operations are actually proved',
    gate: 'Do not sell or display an exact price until merchant approval, approved catalogue/policies, hosted checkout, signed webhook, entitlement, cancellation/refund and support lifecycle proof are complete.',
    value: 'Future maintained membership value only. No hosted AI usage quota, financial product, token, wallet, reward or automatic external action is included.'
  })),
  Object.freeze({
    id: 'official-outcome-packs', lifecycle: 'planned-not-for-sale', billing: 'one-time-personal-licence',
    plannedPriceUsdReference: 'not-finalized',
    audience: 'users who need one complete maintained result system without a membership',
    gate: 'Every pack must contain maintained templates, workflow mapping, review checkpoints, version notes, support scope and a personal-use licence. It is never trial-eligible until separately approved.',
    value: 'Complete professional outcome systems, not tiny prompt cards and not individual feature unlocks.'
  }),
  Object.freeze({
    id: 'eon-business', lifecycle: 'future-specification-only', billing: 'per-seat-monthly-or-annual',
    plannedPriceUsdReference: 'not-finalized', audience: 'small teams',
    gate: 'No sale before team workspaces, roles, shared packs, billing administration, audit trail, data controls and support operations are actually built and proved.',
    value: 'A future team-safe workspace. This is not a launch tier.'
  }),
  Object.freeze({
    id: 'eon-enterprise', lifecycle: 'future-contact-sales-only', billing: 'custom',
    plannedPriceUsdReference: 'not-finalized', audience: 'organisations needing governance',
    gate: 'No public price before SSO, audit controls, contractual support, deployment/data options and enterprise operations exist.',
    value: 'Future governed deployment and support; not currently offered.'
  })
]);

export const R4_COMM01_BLUEPRINT_COLLECTION_STANDARD = Object.freeze({
  freeCoreTarget: 32,
  proPackTarget: 24,
  familyTargets: Object.freeze([
    'Business operations',
    'Creator systems',
    'Builder and product',
    'Research and decisions',
    'Events and hospitality',
    'Career and personal systems'
  ]),
  requiredFields: Object.freeze(['outcome', 'inputs', 'deliverables', 'review checkpoints', 'workflow handoff', 'action classification', 'privacy boundary', 'version', 'change notes']),
  rule: 'No premium Blueprint exists as a single prompt. A paid pack must be a maintained, versioned system with multiple practical deliverables.'
});

export function validateR4Comm01Contract() {
  const errors = [];
  if (R4_COMM01_THEME.productDefault !== 'graphite') errors.push('R4-COMM-01 requires Graphite as the app default.');
  if (Object.values(R4_COMM01_FEATURE_FLAGS).some(Boolean)) errors.push('R4-COMM-01 must not activate commercial functionality.');
  if (R4_COMM01_MONETISATION_DECISION.referral.prohibited.includes('subscription percentage') === false) errors.push('Subscription-percentage referrals must remain prohibited.');
  if (R4_COMM01_MONETISATION_DECISION.processors.primaryCandidate !== 'Dodo Payments') errors.push('Dodo Payments must remain the single approval-pending merchant candidate.');
  if (R4_COMM01_MONETISATION_DECISION.processors.selectionStatus !== 'individual-underwriting-pending') errors.push('Dodo merchant selection must remain explicitly approval-pending.');
  if (R4_COMM01_MONETISATION_DECISION.processors.fallbackCandidate !== null) errors.push('No fallback processor may be queued while Dodo approval is pending.');
  if (R4_COMM01_PLANNED_CATALOG.some((entry) => entry.lifecycle === 'active-paid')) errors.push('No paid catalogue entry may be active in R4-COMM-01.');
  if (R4_COMM01_PLANNED_CATALOG.find((entry) => entry.id === 'eon-free')?.plannedPriceUsdReference !== 0) errors.push('The active core must remain free.');
  const paidTiers = R4_COMM01_PLANNED_CATALOG.filter((entry) => ['eon-plus', 'eon-studio', 'eon-power', 'eon-max'].includes(entry.id));
  if (paidTiers.length !== 4 || paidTiers.some((entry) => entry.plannedPriceUsdReference !== 'not-finalized-within-49.99-monthly-cap')) errors.push('The paid-tier price envelope must remain non-public and capped at the approved planning ceiling.');
  return Object.freeze(errors);
}
