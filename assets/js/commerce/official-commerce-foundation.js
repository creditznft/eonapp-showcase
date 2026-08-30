import { getEonProductLicenseFoundation } from './eon-product-license-foundation.js';

/**
 * W225 / W346-C0 — official commerce foundation contract.
 *
 * This file describes the required server truth for future EONAPP-issued
 * catalog items. It intentionally does not create a catalog listing, checkout,
 * provider request, order, receipt, delivery, affiliate ledger, or payout.
 */

export const OFFICIAL_COMMERCE_FOUNDATION_SCHEMA = 'eon.official-commerce-foundation.v1';
export const OFFICIAL_COMMERCE_FOUNDATION_VERSION = 1;

export const OFFICIAL_COMMERCE_FEATURE_FLAGS = Object.freeze({
  officialCatalogPublished: false,
  checkoutActive: false,
  paymentProviderActive: false,
  clientSidePaymentSuccessAccepted: false,
  serverReceiptAuthorityActive: false,
  deliveryActivationActive: false,
  refundsWorkflowActive: false,
  disputeWorkflowActive: false,
  affiliateAttributionActive: false,
  affiliateCommissionActive: false,
  payoutActive: false,
  userSellerMarketplaceActive: false,
  tokenSettlementActive: false,
  productLicenseActive: false
});

export const OFFICIAL_COMMERCE_SERVER_SCHEMA = Object.freeze({
  billingSubject: Object.freeze(['billingSubjectId', 'providerCustomerReference', 'status', 'createdAt']),
  realmPublication: Object.freeze(['realmId', 'accountId', 'manifestVersion', 'status', 'reportPath', 'publishedAt']),
  catalogItem: Object.freeze(['catalogItemId', 'issuer', 'title', 'rightsSummary', 'deliveryType', 'status', 'version']),
  order: Object.freeze(['orderId', 'accountId', 'catalogItemId', 'status', 'createdAt', 'verifiedAt', 'receiptId']),
  receipt: Object.freeze(['receiptId', 'orderId', 'issuer', 'deliveryStatus', 'createdAt', 'reversalStatus']),
  attribution: Object.freeze(['attributionId', 'shareId', 'realmId', 'orderId', 'status', 'createdAt']),
  ledger: Object.freeze(['ledgerEntryId', 'orderId', 'attributionId', 'state', 'createdAt', 'reversedAt']),
  productLicense: Object.freeze(['licenseId', 'orderId', 'productId', 'status', 'issuedAt', 'revokedAt', 'signatureVersion'])
});

function cleanId(value = '', fallback = '') {
  const text = String(value || '').trim().replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 96);
  return text || fallback;
}

export function getOfficialCommerceFoundation() {
  return Object.freeze({
    schema: OFFICIAL_COMMERCE_FOUNDATION_SCHEMA,
    version: OFFICIAL_COMMERCE_FOUNDATION_VERSION,
    lifecycle: 'design-only',
    flags: OFFICIAL_COMMERCE_FEATURE_FLAGS,
    merchant: Object.freeze({
      role: 'EONAPP merchant/publisher for future official items',
      active: false,
      merchantIdentityPublished: false
    }),
    catalog: Object.freeze({
      active: false,
      items: Object.freeze([]),
      issuerOnly: true,
      userSellerMarketplaceActive: false
    }),
    productLicense: getEonProductLicenseFoundation(),
    receipt: Object.freeze({
      active: false,
      serverAuthorityRequired: true,
      clientCallbackIsNotProof: true
    }),
    delivery: Object.freeze({
      active: false,
      serverVerificationRequired: true
    }),
    support: Object.freeze({
      route: '/help',
      billingRoute: '/billing',
      activePaymentDisputeFlow: false,
      note: 'No payment or dispute flow is active because official commerce is not active.'
    }),
    futureServerSchema: OFFICIAL_COMMERCE_SERVER_SCHEMA
  });
}

/** No catalog item is publishable from the browser in this release. */
export function validateOfficialCatalogDraft(draft = {}) {
  const candidate = draft && typeof draft === 'object' ? draft : {};
  const errors = [];
  if (Object.keys(candidate).length > 0) errors.push('Official catalog drafts cannot be published or validated client-side while commerce is disabled.');
  return Object.freeze({
    ok: errors.length === 0,
    errors,
    active: false,
    status: 'official-catalog-disabled'
  });
}

/** A deliberate terminal response prevents accidental browser-side checkout wiring. */
export function createDisabledCheckoutIntent(catalogItemId = '') {
  return Object.freeze({
    schema: OFFICIAL_COMMERCE_FOUNDATION_SCHEMA,
    status: 'disabled',
    attempted: false,
    catalogItemId: cleanId(catalogItemId),
    networkRequestCreated: false,
    clientPaymentAccepted: false,
    receiptCreated: false,
    deliveryCreated: false,
    reason: 'Official checkout is not active. Do not send payment details, funds, wallet data, or secrets.',
    supportRoute: '/help',
    billingRoute: '/billing'
  });
}

export function getOfficialCommercePublicSummary() {
  const foundation = getOfficialCommerceFoundation();
  return Object.freeze({
    schema: foundation.schema,
    active: false,
    catalogPublished: false,
    checkoutActive: false,
    message: 'Official catalog, checkout, receipts, delivery, personal licences, affiliate commission, payout, token settlement, and user selling are not active.'
  });
}
