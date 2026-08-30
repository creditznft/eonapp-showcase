/** W367 — optional Three.js Spatial Command Space contract. */
export const W367_SPATIAL_COMMAND_SPACE_CONTRACT = Object.freeze({
  wave: 'W367',
  schema: 'eonapp.w367.spatial-command-space-contract.v1',
  route: Object.freeze({ canonical: '/eoncity/tour', legacyAlias: '/eoncity/3d', fallback: '/eoncity/lite', immersiveHandoff: '/eoncity/play' }),
  presentation: Object.freeze({
    title: 'EON City Spatial Command Space',
    cameraPresets: Object.freeze(['arrival', 'command-centre', 'skyline']),
    renderer: 'Three.js optional local renderer',
    commandGuide: 'EONBOT guide avatar only; it does not claim that work is running.'
  }),
  truthRules: Object.freeze({
    localOnly: true,
    remoteAssets: false,
    remoteTelemetry: false,
    storesUserContent: false,
    privateDataInRenderer: false,
    fakeAgentActivity: false,
    visibleReviewBeforeNativeHandoff: true,
    automaticNavigation: false,
    automaticExecution: false,
    cloudflareRequired: false
  }),
  evidence: Object.freeze({
    sourceGateIsNotVisualProof: true,
    requiresLaterBrowserProof: true,
    requiresLaterDeviceAndGpuProof: true,
    requiresLaterProductionRouteProof: true
  })
});

export function validateW367SpatialCommandSpaceContract() {
  const errors = [];
  const rules = W367_SPATIAL_COMMAND_SPACE_CONTRACT.truthRules;
  if (!W367_SPATIAL_COMMAND_SPACE_CONTRACT.presentation.cameraPresets.includes('command-centre')) errors.push('Command Centre camera preset is required.');
  if (!rules.localOnly || rules.remoteAssets || rules.remoteTelemetry || rules.storesUserContent || rules.privateDataInRenderer) errors.push('Spatial Command Space must preserve its local renderer boundary.');
  if (rules.fakeAgentActivity || !rules.visibleReviewBeforeNativeHandoff || rules.automaticNavigation || rules.automaticExecution) errors.push('Spatial Command Space review and agent truth rules are incomplete.');
  return errors;
}
