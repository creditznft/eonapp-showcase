export const W346_REALM_RELIC_COMMERCE_SCHEMA = 'eon.w346.realm-relic-commerce-boundary.v1';

export const W346_REQUIRED_SOURCES = Object.freeze([
  'assets/js/realm-relic/eon-realm-relic-boundary.js',
  'assets/js/commerce/eon-product-license-foundation.js',
  'assets/js/commerce/official-commerce-foundation.js',
  'assets/js/market/eon-market-page.js',
  'assets/js/market/market-private-drop.js',
  'assets/js/realm-studio-page.js',
  'assets/js/realm/realm-state.js',
  'assets/js/capabilities/capability-truth-registry.js'
]);

export const W346_REQUIRED_CAPABILITIES = Object.freeze([
  'realm-local-studio',
  'local-relic-previews',
  'official-personal-licenses',
  'legacy-eonlite-polygon-stack'
]);

export const W346_ACTIVE_SURFACE_FORBIDDEN = Object.freeze([
  /(?:buy now|checkout now|connect wallet|mint now|list for sale|cash out|claim royalties|earn eonlite)/i,
  /(?:payment provider active|token settlement active|user seller marketplace active)/i
]);
