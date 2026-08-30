/** W362 contract: EON App Deck + A-01 canonical action taxonomy. */

export const W362_APP_DECK_ACTION_TAXONOMY_CONTRACT = Object.freeze({
  wave: 'W362',
  title: 'EON App Deck and action-taxonomy foundation',
  publicRoute: '/apps',
  cityMode: 'apps',
  categories: Object.freeze(['workrooms', 'crew', 'connections', 'blueprints']),
  actionClasses: Object.freeze(['read', 'draft', 'write', 'publish', 'spend', 'delete', 'admin']),
  boundaries: Object.freeze({
    localFirst: true,
    connectionBrokerActive: false,
    oauthActive: false,
    backgroundRunnerActive: false,
    providerCallActive: false,
    externalExecutionActive: false,
    paymentsOrEntitlementsActive: false,
    arbitraryThirdPartyCodeInstall: false
  }),
  requiredBehavior: Object.freeze([
    'Apps presents exactly four first-class categories.',
    'Workrooms and AI Crew may prefill foreground EONBOT Chat but never send automatically.',
    'Connections describe future permission scopes without requesting OAuth or storing credentials.',
    'Blueprints prefill a local Automation goal and require a later user click before a workflow draft is saved.',
    'Every future automation effect maps to one locked action class.',
    'Spend, delete, and admin remain blocked in this phase.',
    'App Deck participates in the same local City mode-transition contract.'
  ])
});

export function validateW362AppDeckActionTaxonomyContract() {
  const errors = [];
  const contract = W362_APP_DECK_ACTION_TAXONOMY_CONTRACT;
  if (contract.categories.length !== 4) errors.push('W362 requires exactly four App Deck categories.');
  if (JSON.stringify(contract.actionClasses) !== JSON.stringify(['read', 'draft', 'write', 'publish', 'spend', 'delete', 'admin'])) errors.push('W362 action taxonomy drifted.');
  if (!contract.boundaries.localFirst) errors.push('W362 must remain local-first.');
  for (const [key, value] of Object.entries(contract.boundaries)) {
    if (key === 'localFirst') continue;
    if (value !== false) errors.push(`W362 boundary ${key} must remain false.`);
  }
  return Object.freeze(errors);
}
