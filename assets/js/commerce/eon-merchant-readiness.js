/**
 * W349–W350 — merchant and billing boundary, deliberately pre-integration.
 *
 * This module is an owner checklist and source contract. It does not create an
 * account, select a processor, request a payment, open checkout, accept a
 * callback, save customer data, issue a licence, or send a network request.
 */

export const EON_MERCHANT_READINESS_SCHEMA = 'eon.merchant-readiness.v1';
export const EON_MERCHANT_READINESS_VERSION = 1;

export const EON_MERCHANT_READINESS_FLAGS = Object.freeze({
  publicStaticSiteDeployed: false,
  merchantApplicationSubmitted: false,
  processorSelected: false,
  testCredentialsConfigured: false,
  liveCredentialsConfigured: false,
  hostedCheckoutIntegrated: false,
  serverVerifierIntegrated: false,
  webhookReceiverIntegrated: false,
  signedLicenceIssuerIntegrated: false,
  pricingPublished: false,
  subscriptionActive: false,
  packSalesActive: false,
  referralDiscountActive: false,
  cryptoCheckoutActive: false,
  paymentDataReceivedByBrowser: false
});

const REQUIRED_PUBLIC_SURFACES = Object.freeze([
  Object.freeze({ route: '/', purpose: 'truthful product description' }),
  Object.freeze({ route: '/terms', purpose: 'published terms' }),
  Object.freeze({ route: '/privacy', purpose: 'local-first privacy boundary' }),
  Object.freeze({ route: '/legal', purpose: 'product and commercial boundary' }),
  Object.freeze({ route: '/help', purpose: 'reachable support contact' }),
  Object.freeze({ route: '/billing', purpose: 'no-checkout status and future refund/cancellation readiness' })
]);

const BILLING_DATA_ALLOWLIST = Object.freeze([
  'processorOrderReference',
  'processorPaymentReference',
  'processorWebhookEventId',
  'productId',
  'billingStatus',
  'issuedAt',
  'revokedAt',
  'licenceId',
  'supportCaseReference'
]);

const BILLING_DATA_DENYLIST = Object.freeze([
  'chatText',
  'prompt',
  'workspaceProjectContent',
  'assetContent',
  'providerApiKey',
  'vaultPassphrase',
  'walletSecret',
  'privateRealmState',
  'rawCardNumber',
  'cvv',
  'cardExpiry',
  'bankCredential'
]);

export function getEonMerchantReadiness() {
  return Object.freeze({
    schema: EON_MERCHANT_READINESS_SCHEMA,
    version: EON_MERCHANT_READINESS_VERSION,
    lifecycle: 'owner-action-required',
    flags: EON_MERCHANT_READINESS_FLAGS,
    publicSurfaces: REQUIRED_PUBLIC_SURFACES,
    merchantDescription: 'EONAPP is a privacy-first AI productivity and creator-workflow application. Users organise local projects, prepare drafts, export creator assets, and choose their own AI providers. Future revenue may come from optional software membership and official personal-use digital workflow/template packs.',
    prohibitedMerchantDescriptions: Object.freeze(['crypto exchange', 'wallet provider', 'token sale', 'NFT marketplace', 'investment product', 'yield or reward product', 'betting or gaming product', 'referral-income scheme', 'financial advisory']),
    billingBoundary: Object.freeze({
      checkout: 'future-hosted-processor-page-only',
      browserRole: 'never-handles-raw-card-data-or-trusts-client-payment-success',
      allowedRecordClasses: BILLING_DATA_ALLOWLIST,
      forbiddenRecordClasses: BILLING_DATA_DENYLIST,
      workspaceBoundary: 'Chat, Workspace, Vault, assets, prompts, provider keys, Local Relics, and private Realm state stay outside future billing scope.'
    }),
    nextOwnerActions: Object.freeze([
      'Deploy the truthful static site with no payment button.',
      'Create a processor test account and complete the actual merchant/KYB details in its dashboard.',
      'Confirm that the merchant category supports SaaS memberships and personal-use digital packs.',
      'Choose one processor only after written approval and a documented refund/cancellation/support policy.',
      'Do not add any live key or checkout code until the W351 test-mode go decision.'
    ])
  });
}

/** A terminal result for any premature browser checkout request. */
export function createDisabledMerchantCheckoutIntent(productId = '') {
  return Object.freeze({
    schema: EON_MERCHANT_READINESS_SCHEMA,
    status: 'disabled-pending-merchant-and-test-mode-approval',
    productId: String(productId || '').trim().replace(/[^a-z0-9._-]/gi, '').slice(0, 96),
    processor: null,
    networkRequestCreated: false,
    hostedCheckoutOpened: false,
    paymentAccepted: false,
    licenceIssued: false,
    reason: 'No merchant processor, test credentials, hosted checkout, server verifier, webhook receiver, pricing, subscription, or product sale is active.',
    supportRoute: '/billing'
  });
}

export function validateEonMerchantReadiness() {
  const readiness = getEonMerchantReadiness();
  const errors = [];
  if (Object.values(readiness.flags).some(Boolean)) errors.push('Merchant readiness must remain a pre-integration owner checklist.');
  if (!readiness.publicSurfaces.every((surface) => surface.route && surface.purpose)) errors.push('Merchant readiness must list each required public truth surface.');
  if (readiness.billingBoundary.allowedRecordClasses.some((field) => readiness.billingBoundary.forbiddenRecordClasses.includes(field))) errors.push('Billing allowlist and denylist must never overlap.');
  return Object.freeze({ ok: errors.length === 0, errors, schema: EON_MERCHANT_READINESS_SCHEMA });
}

export default Object.freeze({
  EON_MERCHANT_READINESS_SCHEMA,
  EON_MERCHANT_READINESS_VERSION,
  EON_MERCHANT_READINESS_FLAGS,
  getEonMerchantReadiness,
  createDisabledMerchantCheckoutIntent,
  validateEonMerchantReadiness
});
