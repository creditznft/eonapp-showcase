/** W413/W414 — finite Signal Expeditions and remaining Living Creator Metropolis districts. */
export const W413_W414_CITY_EXPEDITIONS_METROPOLIS_CONTRACT = Object.freeze({
  id: 'W413-W414',
  title: 'Signal Expeditions + Living Creator Metropolis completion',
  requiredFiles: Object.freeze([
    'assets/js/city/eon-signal-expeditions.js',
    'assets/js/city/eon-city-metropolis-districts.js',
    'assets/js/city/eon-city-play-babylon.js',
    'assets/js/eon-city-play-station.js',
    'assets/js/share/eon-output-share-handoff.js',
    'assets/js/share/eon-remix-card.js',
    'assets/css/eon-city-play.css',
    'config/w413-w414-city-expeditions-metropolis-contract.mjs',
    'scripts/w413-w414-city-expeditions-metropolis-gate.mjs',
    'tests/unit/w413-w414-city-expeditions-metropolis.test.mjs',
    'docs/W413_W414_CITY_EXPEDITIONS_METROPOLIS_2026-06-28.md'
  ]),
  requiredTemplateIds: Object.freeze(['campaign-media-district', 'forge-build-citadel', 'video-cinematic-studio', 'automation-data-observatory']),
  requiredDistrictIds: Object.freeze(['signal-tower', 'automation-observatory', 'archive-gardens']),
  expectedExpeditionTruth: Object.freeze({ localOnly: true, browserSessionOnly: true, finiteTemplates: true, authoredSetPieces: true, projectRead: false, projectWrite: false, providerRequest: false, externalExecution: false, directPublishing: false, socialConnection: false, collaborationPresence: false, tracking: false, referralReward: false, wallet: false, payment: false, remoteAssetDownload: false, finalVisualCertification: false }),
  expectedMetropolisTruth: Object.freeze({ localOnly: true, routesUserSelected: true, automaticNavigation: false, socialPosting: false, socialOAuth: false, automationExecution: false, projectRead: false, projectWrite: false, collectionGrant: false, reward: false, wallet: false, payment: false, tracking: false, remoteAssets: false, finalVisualCertification: false })
});

export function validateW413W414Contract(contract = W413_W414_CITY_EXPEDITIONS_METROPOLIS_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W413-W414') errors.push('W413/W414 identifier is invalid.');
  if (!Array.isArray(contract?.requiredTemplateIds) || contract.requiredTemplateIds.length !== 4) errors.push('W413 requires exactly four finite expedition templates.');
  if (!Array.isArray(contract?.requiredDistrictIds) || contract.requiredDistrictIds.length !== 3) errors.push('W414 requires exactly three remaining Metropolis districts.');
  for (const [key, expected] of Object.entries(W413_W414_CITY_EXPEDITIONS_METROPOLIS_CONTRACT.expectedExpeditionTruth)) {
    if (contract?.expectedExpeditionTruth?.[key] !== expected) errors.push(`W413 truth ${key} is invalid.`);
  }
  for (const [key, expected] of Object.entries(W413_W414_CITY_EXPEDITIONS_METROPOLIS_CONTRACT.expectedMetropolisTruth)) {
    if (contract?.expectedMetropolisTruth?.[key] !== expected) errors.push(`W414 truth ${key} is invalid.`);
  }
  return Object.freeze(errors);
}
