/**
 * Locked public-product boundary.
 *
 * This is intentionally product truth, not a payment/provider configuration.
 * A value being absent here means it must not be surfaced, hinted, or enabled
 * by a browser route without a new reviewed product decision.
 */
export const EONAPP_PRODUCT_SCOPE_SCHEMA = 'eonapp.product-scope.v2';

export const EONAPP_PRODUCT_SCOPE = Object.freeze({
  schema: EONAPP_PRODUCT_SCOPE_SCHEMA,
  releaseModel: 'local-first-ai-workspace-with-eon-city',
  publicCapabilities: Object.freeze([
    'eonbot-chat',
    'projects-and-library',
    'local-first-workspace-tools',
    'eon-city-workstation',
    'non-financial-research-lab',
    'manual-privacy-safe-sharing',
    'optional-telegram-onboarding-help-updates',
    'dodo-monthly-subscriptions',
    'server-verified-subscription-entitlements',
    'proof-gated-eonkey-feature-unlocks'
  ]),
  retiredCapabilities: Object.freeze([
    'display-ads',
    'rewarded-ads',
    'telegram-reward-mechanics',
    'offerwalls',
    'sponsor-credit-unlocks',
    'trading-execution',
    'prediction-market-stakes',
    'crypto-tokens-wallets',
    'nft-marketplace-resale',
    'referral-reward-payouts',
    'automatic-social-posting'
  ]),
  commerce: Object.freeze({
    merchantOnboarding: 'dodo-payments-verified',
    checkout: 'server-route-live-fail-closed',
    subscriptionEntitlement: 'signed-webhook-ledger-live',
    paymentProvider: 'dodo-payments-live',
    referralReward: 'eonkeys-individual-unlocks-proof-gated'
  }),
  telegram: Object.freeze({
    enabled: true,
    allowedUses: Object.freeze(['onboarding', 'help', 'updates', 'explicit-deep-links']),
    rewardMechanics: false,
    providerSdk: false,
    channelGate: false
  }),
  truth: Object.freeze({
    financialAdvice: false,
    externalExecution: false,
    billingProviderCallbacks: true,
    nonBillingProviderCallbacks: false,
    backgroundPosting: false
  })
});

export function getEonappProductScope() {
  return EONAPP_PRODUCT_SCOPE;
}

export function isRetiredProductCapability(value = '') {
  return EONAPP_PRODUCT_SCOPE.retiredCapabilities.includes(String(value || '').trim());
}

export function getPublicProductScopeSummary() {
  return Object.freeze({
    schema: EONAPP_PRODUCT_SCOPE_SCHEMA,
    releaseModel: EONAPP_PRODUCT_SCOPE.releaseModel,
    activeCapabilityCount: EONAPP_PRODUCT_SCOPE.publicCapabilities.length,
    retiredCapabilityCount: EONAPP_PRODUCT_SCOPE.retiredCapabilities.length,
    commerce: EONAPP_PRODUCT_SCOPE.commerce,
    telegram: EONAPP_PRODUCT_SCOPE.telegram,
    truth: EONAPP_PRODUCT_SCOPE.truth
  });
}
