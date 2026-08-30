export const W347_REALM_SHARE_RELIC_PASSPORT_SCHEMA = 'eon.w347.realm-share-relic-passport.v1';

export const W347_REQUIRED_SOURCES = Object.freeze([
  'assets/js/realm-relic/eon-realm-relic-passport.js',
  'assets/js/realm-relic/eon-realm-relic-boundary.js',
  'assets/js/realm-studio-page.js',
  'assets/js/referral-landing-page.js',
  'assets/js/capabilities/capability-truth-registry.js',
  'realm-studio.html',
  'assets/css/realm-studio.css'
]);

export const W347_REQUIRED_TRUTH = Object.freeze({
  localCollectionActive: true,
  network: false,
  cloudSync: false,
  referralConversionTracking: false,
  visitorTracking: false,
  purchaseRequired: false,
  paidFeatureEntitlement: false,
  subscriptionEntitlement: false,
  walletRequired: false,
  mintActive: false,
  transferAllowed: false,
  saleAllowed: false,
  resaleAllowed: false,
  royaltyProgramActive: false,
  cashOrCryptoValue: false,
  automaticRewardValue: false
});

export const W347_FORBIDDEN_RUNTIME_TOKENS = Object.freeze([
  'fetch(',
  'XMLHttpRequest',
  'WebSocket',
  'sendBeacon(',
  'PaymentRequest',
  'ethereum.request',
  'window.ethereum'
]);
