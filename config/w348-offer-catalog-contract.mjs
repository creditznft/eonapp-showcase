export const W348_OFFER_CATALOG_SCHEMA = 'eon.w348.offer-catalog.v1';

export const W348_REQUIRED_SOURCES = Object.freeze([
  'assets/js/commerce/eon-offer-catalog.js',
  'assets/js/commerce/billing-commercial-status.js',
  'billing.html',
  'assets/js/capabilities/capability-truth-registry.js'
]);

export const W348_REQUIRED_FALSE_FLAGS = Object.freeze([
  'publicPricingActive',
  'checkoutActive',
  'cardsOrUpiActive',
  'cryptoCheckoutActive',
  'subscriptionActive',
  'oneTimePackSalesActive',
  'paymentProviderActive',
  'billingAccountActive',
  'processorWebhookActive',
  'serverReceiptAuthorityActive',
  'licenseActivationActive',
  'referralDiscountActive',
  'referralCashOrCryptoActive',
  'nftFeatureKeyActive',
  'eonLiteActive',
  'userMarketplaceActive',
  'payoutActive'
]);

export const W348_FORBIDDEN_RUNTIME_TOKENS = Object.freeze([
  'fetch(',
  'PaymentRequest',
  'razorpay.com',
  'cashfree.com',
  'nowpayments',
  'window.Razorpay',
  'window.ethereum'
]);
