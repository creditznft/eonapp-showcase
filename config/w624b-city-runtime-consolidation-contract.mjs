export const W624B_CITY_RUNTIME_CONSOLIDATION_CONTRACT = Object.freeze({
  schema: 'eonapp.w624b-city-runtime-consolidation.v1',
  canonicalRoute: '/eoncity',
  accessRoute: '/api/city/access',
  runtimeOwner: 'assets/js/city/eon-city-runtime-owner.js',
  heavyStation: 'assets/js/eon-city-play-station.js',
  heavyRenderer: 'assets/js/city/eon-city-play-babylon.js',
  artBible: 'assets/js/city/eon-city-art-bible.js',
  stateMachine: 'assets/js/city/eon-city-runtime-state-machine.js',
  assetManifest: 'assets/js/city/eon-city-runtime-asset-manifest.js',
  compatibilityDocuments: Object.freeze(['eoncity-play.html', 'eoncity-3d.html', 'eoncity-lite.html']),
  stateOrder: Object.freeze(['idle', 'checking-access', 'preview', 'loading-shell', 'loading-core', 'core-ready', 'streaming-detail', 'ready', 'degraded', 'recoverable-error', 'disposed']),
  requiredRecoveryCases: Object.freeze([
    'cold-boot', 'warm-boot', 'refresh-during-load', 'logout', 'session-expiry',
    'failed-optional-asset', 'failed-required-asset', 'webgl-context-loss',
    'low-memory-downgrade', 'background-foreground-resume', 'clean-disposal', 're-entry'
  ]),
  truth: Object.freeze({
    oneProductionBabylonBootOwner: true,
    compatibilityDocumentsMountRenderer: false,
    guestCanBootHeavyRenderer: false,
    queryStringCanGrantAccess: false,
    localStorageCanGrantAccess: false,
    timerBasedLoadingProgress: false,
    remoteArtRequired: false,
    sourceTestsCertifyVisualQuality: false
  })
});

export function validateW624bCityRuntimeContract(contract = W624B_CITY_RUNTIME_CONSOLIDATION_CONTRACT) {
  const errors = [];
  if (contract.canonicalRoute !== '/eoncity') errors.push('canonical-route');
  if (!contract.runtimeOwner.endsWith('eon-city-runtime-owner.js')) errors.push('runtime-owner');
  if (contract.stateOrder.length !== 11 || contract.stateOrder[0] !== 'idle' || contract.stateOrder.at(-1) !== 'disposed') errors.push('state-order');
  if (contract.requiredRecoveryCases.length < 12) errors.push('recovery-cases');
  if (!contract.truth.oneProductionBabylonBootOwner || contract.truth.compatibilityDocumentsMountRenderer) errors.push('owner-boundary');
  if (contract.truth.timerBasedLoadingProgress || contract.truth.remoteArtRequired || contract.truth.sourceTestsCertifyVisualQuality) errors.push('truth-boundary');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
