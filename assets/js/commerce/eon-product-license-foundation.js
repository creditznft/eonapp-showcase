/**
 * W346-C0 — design-only foundation for future official personal licences.
 *
 * This is deliberately not a checkout, subscription, account system, wallet
 * connection, payment provider adapter, receipt authority, or entitlement
 * issuer. It documents the smallest future boundary needed to sell an official
 * EONAPP pack while keeping chat, projects, assets, provider keys and local
 * work outside the billing system.
 */

export const EON_PRODUCT_LICENSE_FOUNDATION_SCHEMA = 'eon.product-license-foundation.v1';
export const EON_PRODUCT_LICENSE_FOUNDATION_VERSION = 1;

export const EON_PRODUCT_LICENSE_FEATURE_FLAGS = Object.freeze({
  checkoutActive: false,
  paymentProviderActive: false,
  billingAccountActive: false,
  appAccountRequired: false,
  signedLicenceIssuerActive: false,
  clientReceiptAccepted: false,
  automaticEntitlementActive: false,
  tokenBackedLicenceActive: false,
  nftBackedLicenceActive: false,
  walletBoundLicenceActive: false,
  userResaleActive: false,
  affiliateCommissionActive: false,
  payoutActive: false
});

function cleanProductId(value = '') {
  return String(value || '').trim().replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 96);
}

export function getEonProductLicenseFoundation() {
  return Object.freeze({
    schema: EON_PRODUCT_LICENSE_FOUNDATION_SCHEMA,
    version: EON_PRODUCT_LICENSE_FOUNDATION_VERSION,
    lifecycle: 'design-only',
    active: false,
    featureFlags: EON_PRODUCT_LICENSE_FEATURE_FLAGS,
    productModel: Object.freeze({
      issuerOnly: true,
      personalUseLicence: true,
      transferable: false,
      userResaleAllowed: false,
      userMarketplaceAllowed: false,
      walletRequired: false,
      tokenRequired: false,
      nftRequired: false,
      note: 'A future official pack may carry a personal-use licence. It is not a transferable digital asset or a financial product.'
    }),
    dataMinimization: Object.freeze({
      appAccountRequired: false,
      allowedBillingRecords: Object.freeze(['providerOrderReference', 'providerCustomerReference', 'productId', 'status', 'issuedAt', 'revokedAt', 'licenceId']),
      forbiddenBillingRecords: Object.freeze(['chatText', 'prompt', 'projectContent', 'assetContent', 'providerApiKey', 'walletSecret', 'paymentCardData', 'privateCityState']),
      delivery: 'future signed licence record verified locally; a hosted payment processor handles card/UPI entry'
    }),
    recovery: Object.freeze({
      active: false,
      note: 'Future recovery/reissue requires a documented purchase-verification process. The browser must never treat a copied callback, screenshot, or local flag as proof of payment.'
    })
  });
}

/** Fails closed so browser code cannot accidentally start commerce ahead of approval. */
export function createDisabledPersonalLicenceIntent(productId = '') {
  return Object.freeze({
    schema: EON_PRODUCT_LICENSE_FOUNDATION_SCHEMA,
    status: 'disabled',
    productId: cleanProductId(productId),
    networkRequestCreated: false,
    checkoutOpened: false,
    paymentAccepted: false,
    licenceIssued: false,
    entitlementActivated: false,
    reason: 'Official personal licences are not active. No payment, wallet, token, NFT, account, resale, or transfer flow has been created.',
    supportRoute: '/billing'
  });
}

export default Object.freeze({
  EON_PRODUCT_LICENSE_FOUNDATION_SCHEMA,
  EON_PRODUCT_LICENSE_FOUNDATION_VERSION,
  EON_PRODUCT_LICENSE_FEATURE_FLAGS,
  getEonProductLicenseFoundation,
  createDisabledPersonalLicenceIntent
});
