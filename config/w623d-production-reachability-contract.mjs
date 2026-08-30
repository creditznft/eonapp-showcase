/** W623D — production reachability and obsolete-value-system quarantine. */
export const W623D_REACHABILITY_SCHEMA = 'eonapp.production-reachability.w623d.v1';

export const W623D_REQUIRED_REACHABLE_PATHS = Object.freeze([
  'assets/js/commerce/eon-commercial-catalog.js',
  'assets/js/billing/eon-dodo-live-runtime.js',
  'assets/js/referrals/eon-referral-server-runtime.js',
  'assets/js/referrals/eon-keys-catalog.js',
  'assets/js/referrals/eon-feature-unlock-resolver.js',
  'assets/js/collection/eon-vault-reveal-visuals.js',
  'functions/api/billing/checkout.js',
  'functions/api/billing/status.js',
  'functions/api/billing/referral-status.js',
  'functions/api/referrals.js',
  'functions/api/billing/webhooks/dodo.js'
]);

export const W623D_QUARANTINED_PREFIXES = Object.freeze([
  'assets/js/nft-engine/'
]);

export const W623D_QUARANTINED_EXACT_PATHS = Object.freeze([
  'assets/js/utils/market-starter-nfts.js',
  'assets/js/utils/nft-visuals.js',
  'assets/js/utils/credits.js',
  'assets/js/utils/pricing.js',
  'assets/js/utils/ad-sponsored-subscription.js',
  'assets/js/utils/payment-reward-proof.js',
  'assets/js/utils/reward-proof-state.js',
  'assets/js/utils/telegram-growth-rewards.js',
  'assets/js/utils/game-monetization.js',
  'assets/js/commerce/official-commerce-foundation.js',
  'assets/js/commerce/eon-product-license-foundation.js',
  'assets/js/commerce/eon-offer-catalog.js',
  'assets/js/commerce/commercial-decision-gate.js',
  'assets/js/commercial/eon-commercial-decision-gate.js',
  'assets/js/realm-relic/eon-referral-reentry-firewall.js'
]);

export const W623D_ARCHITECTURE_RULES = Object.freeze({
  subscriptionCheckoutRail: 'dodo-payments-only',
  referralRewardRail: 'server-ledger-eonkeys-only',
  eonKeysMayCreateSubscription: false,
  browserInviteMayGrantValue: false,
  cloudflareAiGenerationBackend: false,
  creatorExecutionRails: Object.freeze(['local-runtime', 'user-owned-provider-key']),
  nftWalletTokenEconomyReachable: false,
  historicalModulesMayRemainForMigrationEvidence: true,
  historicalModulesMayShipInProductionGraph: false
});

export function isW623DQuarantinedPath(value = '') {
  const path = String(value || '').replaceAll('\\', '/').replace(/^\.\//, '');
  return W623D_QUARANTINED_EXACT_PATHS.includes(path)
    || W623D_QUARANTINED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function validateW623DReachability({ reachable = [] } = {}) {
  const paths = new Set(reachable.map((value) => String(value || '').replaceAll('\\', '/').replace(/^\.\//, '')));
  const errors = [];
  for (const required of W623D_REQUIRED_REACHABLE_PATHS) if (!paths.has(required)) errors.push(`Required production path is not reachable: ${required}`);
  for (const path of paths) if (isW623DQuarantinedPath(path)) errors.push(`Quarantined legacy path is production-reachable: ${path}`);
  if (W623D_ARCHITECTURE_RULES.eonKeysMayCreateSubscription !== false) errors.push('EONKEYS may not create subscriptions.');
  if (W623D_ARCHITECTURE_RULES.cloudflareAiGenerationBackend !== false) errors.push('Cloudflare AI generation backend must remain disabled.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: W623D_REACHABILITY_SCHEMA });
}
