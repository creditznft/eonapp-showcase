/**
 * W619 — Dodo/server entitlement and referral ledger contract.
 *
 * This is the source-level server plan for paid subscriptions and EON Key
 * referral grants. It deliberately does not create Dodo checkout sessions,
 * does not verify a real Dodo signature yet, does not write live ledgers, and
 * does not let the browser grant paid entitlement or EON Keys.
 */

export const W619_DODO_SERVER_LEDGER_SCHEMA = 'eonapp.billing.dodo-server-ledger.w619.v1';
export const W619_DODO_SERVER_LEDGER_VERSION = 1;

export const W619_PAID_TIER_IDS = Object.freeze(['plus', 'studio', 'power', 'max']);
export const W619_FREE_TIER_ID = 'free';
export const W619_RECOGNIZED_PROVIDER_EVENTS = Object.freeze([
  'trial_started',
  'payment_succeeded',
  'subscription_renewed',
  'subscription_cancelled',
  'subscription_expired',
  'payment_refunded',
  'chargeback_opened',
  'chargeback_lost'
]);

export const W619_DODO_ENV_CONTRACT = Object.freeze({
  requiredBeforeCheckout: Object.freeze([
    'EON_BILLING_ROLLOUT',
    'EON_BILLING_DB',
    'DODO_API_KEY',
    'DODO_WEBHOOK_SECRET',
    'DODO_PRODUCT_PLUS',
    'DODO_PRODUCT_STUDIO',
    'DODO_PRODUCT_POWER',
    'DODO_PRODUCT_MAX'
  ]),
  requiredBeforeWebhookProcessing: Object.freeze([
    'EON_BILLING_ROLLOUT',
    'EON_BILLING_DB',
    'DODO_WEBHOOK_SECRET',
    'EON_ENTITLEMENT_SIGNING_KEY'
  ]),
  forbiddenInFrontend: Object.freeze([
    'DODO_API_KEY',
    'DODO_WEBHOOK_SECRET',
    'EON_ENTITLEMENT_SIGNING_KEY',
    'DODO_PRODUCT_PLUS',
    'DODO_PRODUCT_STUDIO',
    'DODO_PRODUCT_POWER',
    'DODO_PRODUCT_MAX'
  ]),
  rolloutValues: Object.freeze(['disabled', 'testing', 'production']),
  productionRequiresExternalProof: true
});

export const W619_RUNTIME_FLAGS = Object.freeze({
  checkoutCreationActive: false,
  dodoWebhookAdapterLive: false,
  publicTrialActivationActive: false,
  entitlementLedgerWriteEnabled: false,
  referralLedgerWriteEnabled: false,
  eonKeyRedemptionActive: false,
  browserEntitlementAccepted: false,
  browserReferralGrantAccepted: false,
  clientCallbackIsPaymentProof: false,
  platformPaidAiCreditsActive: false,
  cashRewardActive: false,
  walletOrCryptoRewardActive: false,
  nftOrTokenRewardActive: false,
  payoutOrCommissionActive: false,
  renewalDiscountRewardActive: false,
  freeMonthRewardActive: false,
  multiLevelReferralActive: false
});

export const W619_ENTITLEMENT_TABLES = Object.freeze({
  billingEvents: Object.freeze({
    name: 'eon_billing_events',
    idempotencyKey: 'provider_event_id',
    columns: Object.freeze([
      'provider_event_id',
      'provider',
      'event_type',
      'provider_customer_ref',
      'provider_subscription_ref',
      'account_id',
      'tier_id',
      'occurred_at',
      'processed_at',
      'payload_hash',
      'processing_status'
    ])
  }),
  entitlements: Object.freeze({
    name: 'eon_entitlements',
    authority: 'server-only',
    columns: Object.freeze([
      'entitlement_id',
      'account_id',
      'tier_id',
      'status',
      'source_provider',
      'source_event_id',
      'provider_subscription_ref',
      'issued_at',
      'renews_at',
      'revoked_at',
      'reason'
    ])
  }),
  referralLedger: Object.freeze({
    name: 'eon_referral_ledger',
    idempotencyKey: 'referral_event_id',
    columns: Object.freeze([
      'referral_event_id',
      'inviter_account_id',
      'invitee_account_id',
      'trigger_event_id',
      'reward_type',
      'reward_status',
      'retention_check_at',
      'processed_at',
      'abuse_cap_year'
    ])
  }),
  eonKeyGrants: Object.freeze({
    name: 'eon_key_grants',
    authority: 'server-only-after-proof',
    columns: Object.freeze([
      'grant_id',
      'account_id',
      'key_type',
      'grant_reason',
      'source_referral_event_id',
      'status',
      'issued_at',
      'expires_at',
      'revoked_at'
    ])
  })
});

export const W619_REFERRAL_RULES = Object.freeze({
  liveNow: false,
  rail: 'non-transferable-eon-keys-and-feature-cosmetics-only',
  oneLevelOnly: true,
  retentionDaysBeforePaidMilestone: 14,
  maxPaidReferralRewardsPerInviterPerYear: 3,
  stacking: false,
  inviteeCouponServerOnly: true,
  browserQueryParamCannotGrant: true,
  prohibitedRewards: Object.freeze(['cash', 'upi', 'paypal', 'wallet', 'crypto', 'token', 'nft', 'commission', 'payout', 'free_month', 'renewal_discount', 'gift_card', 'lottery'])
});

export const W619_BILLING_API_SURFACES = Object.freeze([
  Object.freeze({ route: '/api/billing/status', method: 'GET', live: true, behavior: 'public-safe disabled status; no private billing record' }),
  Object.freeze({ route: '/api/billing/checkout', method: 'POST', live: false, behavior: 'fail-closed checkout preparation; no Dodo session creation' }),
  Object.freeze({ route: '/api/billing/webhooks/dodo', method: 'POST', live: false, behavior: 'placeholder endpoint; real Dodo adapter disabled until external signature proof' }),
  Object.freeze({ route: '/api/billing/referral-status', method: 'GET', live: true, behavior: 'public-safe disabled server-ledger status; no grant' })
]);

export function getW619DodoServerLedgerPlan() {
  return Object.freeze({
    schema: W619_DODO_SERVER_LEDGER_SCHEMA,
    version: W619_DODO_SERVER_LEDGER_VERSION,
    lifecycle: 'server-ledger-foundation-non-live',
    paidTierIds: W619_PAID_TIER_IDS,
    freeTierId: W619_FREE_TIER_ID,
    runtimeFlags: W619_RUNTIME_FLAGS,
    environment: W619_DODO_ENV_CONTRACT,
    recognizedProviderEvents: W619_RECOGNIZED_PROVIDER_EVENTS,
    tables: W619_ENTITLEMENT_TABLES,
    referralRules: W619_REFERRAL_RULES,
    apiSurfaces: W619_BILLING_API_SURFACES,
    currentDecision: 'disabled-until-dodo-checkout-webhook-entitlement-ledger-cloudflare-and-browser-proof',
    codexProofRequired: Object.freeze([
      'Cloudflare Pages Functions deploy proof with bindings present and secrets redacted',
      'Dodo product-id checklist outside frontend source',
      'Dodo hosted checkout proof only after server adapter exists',
      'Signed webhook proof using provider-documented verification, payload redacted',
      'D1 idempotency proof for duplicate payment/refund/cancel events',
      'Referral retention and yearly-abuse-cap proof before EON Key grants',
      'CEO paid-activation on/off note'
    ])
  });
}

export function decideW619PaidActivation(input = {}) {
  const blockers = [];
  const warnings = [];
  const wantsPaid = input.enablePaidActivation === true || input.ceoPaidActivation === true;
  const wantsReferral = input.enableReferralGrants === true || input.ceoReferralActivation === true;

  if (!input.sourceQaPassed) blockers.push('W619 source QA must pass.');
  if (!input.browserProofPassed) blockers.push('W618F browser/mobile proof must pass before paid activation.');
  if (!input.cloudflareDeployProof) blockers.push('Cloudflare Pages Functions deploy proof is required.');

  if (wantsPaid) {
    if (!input.dodoProductProof) blockers.push('Dodo product ids/prices must be verified outside frontend source.');
    if (!input.dodoCheckoutProof) blockers.push('Dodo hosted checkout proof is required.');
    if (!input.dodoWebhookSignatureProof) blockers.push('Provider-documented Dodo webhook signature proof is required.');
    if (!input.entitlementLedgerProof) blockers.push('Server entitlement ledger idempotency proof is required.');
  } else {
    warnings.push('Paid activation remains off; public billing surfaces must say checkout/trials are disabled.');
  }

  if (wantsReferral) {
    if (!input.referralLedgerProof) blockers.push('Server referral ledger proof is required before live EON Key grants.');
    if (!input.referralRetentionProof) blockers.push('14-day retained-paid-referral proof is required before paid milestone grants.');
    if (!input.referralAbuseCapProof) blockers.push('Referral yearly cap and duplicate-grant proof is required.');
  } else {
    warnings.push('Referral/EON Key live grants remain off; browser invite links cannot grant value.');
  }

  return Object.freeze({
    schema: W619_DODO_SERVER_LEDGER_SCHEMA,
    decision: blockers.length ? 'blocked' : 'eligible-for-owner-review',
    blockers: Object.freeze(blockers),
    warnings: Object.freeze(warnings),
    paidActivationRequested: wantsPaid,
    referralActivationRequested: wantsReferral
  });
}

export function validateW619DodoServerLedgerContract() {
  const plan = getW619DodoServerLedgerPlan();
  const errors = [];
  const flagEntries = Object.entries(plan.runtimeFlags);
  for (const [flag, value] of flagEntries) if (value !== false) errors.push(`Runtime flag must remain false in W619 source: ${flag}`);
  for (const tier of W619_PAID_TIER_IDS) if (!['plus', 'studio', 'power', 'max'].includes(tier)) errors.push(`Unexpected paid tier id: ${tier}`);
  for (const envName of plan.environment.forbiddenInFrontend) if (!/^DODO_|^EON_ENTITLEMENT_/.test(envName)) errors.push(`Unexpected frontend-forbidden secret name: ${envName}`);
  if (plan.referralRules.liveNow !== false) errors.push('Referral rules must remain non-live.');
  if (plan.referralRules.retentionDaysBeforePaidMilestone < 14) errors.push('Paid referral retention check must be at least 14 days.');
  if (plan.referralRules.maxPaidReferralRewardsPerInviterPerYear > 3) errors.push('Yearly paid referral cap cannot exceed 3 for launch.');
  const forbidden = JSON.stringify(plan).toLowerCase();
  const blockedPatterns = [
    /cash\s*back/,
    /wallet\s+balance/,
    /crypto\s+payout/,
    /commission\s+payout/,
    /passive\s+income/,
    /guaranteed\s+profit/
  ];
  for (const pattern of blockedPatterns) {
    if (pattern.test(forbidden)) errors.push(`Forbidden commercial/reward claim matched: ${pattern.source}`);
  }
  if (!plan.apiSurfaces.some((surface) => surface.route === '/api/billing/webhooks/dodo' && surface.live === false)) errors.push('Dodo webhook surface must be present but non-live.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: W619_DODO_SERVER_LEDGER_SCHEMA, checks: 24 });
}

export default Object.freeze({
  W619_DODO_SERVER_LEDGER_SCHEMA,
  W619_DODO_SERVER_LEDGER_VERSION,
  W619_PAID_TIER_IDS,
  W619_RUNTIME_FLAGS,
  W619_DODO_ENV_CONTRACT,
  W619_ENTITLEMENT_TABLES,
  W619_REFERRAL_RULES,
  W619_BILLING_API_SURFACES,
  getW619DodoServerLedgerPlan,
  decideW619PaidActivation,
  validateW619DodoServerLedgerContract
});
