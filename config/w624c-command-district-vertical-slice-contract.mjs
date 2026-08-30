export const W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT = Object.freeze({
  schema: 'eonapp.w624c-command-district-vertical-slice.v1',
  canonicalRoute: '/eoncity',
  runtimeOwner: 'assets/js/city/eon-city-runtime-owner.js',
  verticalSlice: 'assets/js/city/eon-city-command-district-vertical-slice.js',
  renderer: 'assets/js/city/eon-city-play-babylon.js',
  station: 'assets/js/eon-city-play-station.js',
  architecture: 'assets/js/city/eon-city-noir-architecture.js',
  preparedActions: 'assets/js/city/city-prepared-action.js',
  requiredDestinationIds: Object.freeze(['agent-theatre', 'creator-portal', 'forge-basilica', 'project-dock', 'archive-canopy', 'signal-sail']),
  requiredRoutes: Object.freeze(['/automations', '/create', '/forge', '/projects', '/library', '/workspace']),
  requiredLandmarkTypes: Object.freeze(['command-loom', 'agent-theatre', 'creator-atrium', 'forge-basilica', 'support-dock', 'archive-canopy', 'signal-sail']),
  firstTenSecondCueCount: 4,
  firstSixtySecondMilestoneCount: 5,
  minimumPathCount: 7,
  minimumCollisionVolumeCount: 7,
  minimumUnstuckPointCount: 6,
  independentScoreGate: 90,
  minimumCategoryScore: 8.5,
  frozenW624bBoundaries: Object.freeze({
    oneHeavyDocument: true,
    oneRuntimeOwner: true,
    stateCount: 11,
    namedStageProgress: true,
    requiredOptionalAssetBoundary: true,
    compatibilityDocumentsStatic: true,
    guestHeavyBoot: false,
    queryStringAccess: false,
    localStorageAccess: false,
    remoteArtRequired: false
  }),
  evidenceBoundary: Object.freeze({
    sourceCanProveArchitecture: true,
    sourceCanProveRouteSafety: true,
    sourceCanProveVisualScore: false,
    physicalDeviceProofRequired: true,
    ownerVisualApprovalRequired: true
  })
});

export function validateW624cCommandDistrictContract(contract = W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT) {
  const errors = [];
  if (contract.canonicalRoute !== '/eoncity') errors.push('canonical-route');
  if (!contract.runtimeOwner.endsWith('eon-city-runtime-owner.js')) errors.push('runtime-owner');
  if (contract.requiredDestinationIds.length !== 6 || new Set(contract.requiredDestinationIds).size !== 6) errors.push('destinations');
  if (contract.requiredRoutes.length !== 6 || contract.requiredRoutes.some((route) => !/^\/[a-z0-9-]+$/.test(route))) errors.push('routes');
  if (contract.firstTenSecondCueCount !== 4 || contract.firstSixtySecondMilestoneCount !== 5) errors.push('journey');
  if (contract.minimumPathCount < 7 || contract.minimumCollisionVolumeCount < 7 || contract.minimumUnstuckPointCount < 6) errors.push('navigation-safety');
  if (contract.independentScoreGate !== 90 || contract.minimumCategoryScore !== 8.5) errors.push('score-gate');
  if (!contract.frozenW624bBoundaries.oneHeavyDocument || !contract.frozenW624bBoundaries.oneRuntimeOwner || contract.frozenW624bBoundaries.stateCount !== 11) errors.push('w624b-freeze');
  if (contract.frozenW624bBoundaries.guestHeavyBoot || contract.frozenW624bBoundaries.queryStringAccess || contract.frozenW624bBoundaries.localStorageAccess || contract.frozenW624bBoundaries.remoteArtRequired) errors.push('access-or-art-boundary');
  if (contract.evidenceBoundary.sourceCanProveVisualScore || !contract.evidenceBoundary.physicalDeviceProofRequired || !contract.evidenceBoundary.ownerVisualApprovalRequired) errors.push('evidence-boundary');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
