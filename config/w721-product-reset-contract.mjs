const freeze = (value) => Object.freeze(value);

export const EONAPP_W721_PRODUCT_RESET_CONTRACT = freeze({
  schema: 'eonapp.product-reset.w721.2026-07-27.v1',
  strategy: 'hybrid-command-hub',
  promise: 'A familiar AI workspace for real work, plus an optional living 3D Command Hub.',
  permanentRules: freeze([
    '2d-for-productivity',
    '3d-for-presence',
    'one-shared-implementation',
    'familiar-first-magical-second',
    'no-reachable-unfinished-space'
  ]),
  frontend: freeze({
    nexusRuntime: 'retired-from-launch-pages',
    launcher: 'quick-command-orb',
    commandSurface: 'full-screen-2d',
    maxPrimaryActions: 4,
    primaryActions: freeze(['continue', 'new', 'ask-eonbot', 'share'])
  }),
  city: freeze({
    launchModel: 'compact-command-hub',
    threeDimensionalNexusAssetsPreserved: true,
    importantTextOnMeshes: false,
    stationsOpenSharedTwoDimensionalPanels: true,
    openWorldLaunchClaim: false,
    expanseLaunchScope: 'deferred'
  }),
  realm: freeze({
    label: 'My Realm',
    mainNavigationVisible: false,
    freeBuild: false,
    layouts: freeze(['command-loft', 'creator-studio', 'archive-retreat']),
    publicLiveVisits: false,
    shareMode: 'reviewed-read-only-realm-card'
  }),
  themes: freeze(['graphite', 'obsidian', 'ember']),
  forbiddenLaunchClaims: freeze([
    'infinite-world',
    'public-live-realm',
    'multiplayer',
    'fake-autonomous-agent-activity'
  ])
});

export function validateW721ProductResetContract(contract = EONAPP_W721_PRODUCT_RESET_CONTRACT) {
  const errors = [];
  if (contract.strategy !== 'hybrid-command-hub') errors.push('strategy');
  if (contract.frontend?.commandSurface !== 'full-screen-2d') errors.push('full-screen-command-surface');
  if (contract.city?.threeDimensionalNexusAssetsPreserved !== true) errors.push('city-nexus-preservation');
  if (contract.city?.stationsOpenSharedTwoDimensionalPanels !== true) errors.push('shared-panels');
  if (contract.city?.openWorldLaunchClaim !== false) errors.push('open-world-launch-claim');
  if (JSON.stringify(contract.themes) !== JSON.stringify(['graphite', 'obsidian', 'ember'])) errors.push('themes');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}
