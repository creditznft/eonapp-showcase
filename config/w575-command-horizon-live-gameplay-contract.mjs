/** W575 — Command Horizon authored vertical-slice and live-gameplay proof contract. */
export const W575_COMMAND_HORIZON_LIVE_GAMEPLAY_SCHEMA = 'eon.city.command-horizon.live-gameplay.w575.v1';

const freeze = (value) => Object.freeze(value);

export const W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT = freeze({
  id: 'W575',
  schema: W575_COMMAND_HORIZON_LIVE_GAMEPLAY_SCHEMA,
  title: 'Command Horizon vertical-slice review and Codex live-gameplay proof',
  canonicalRoute: '/eoncity',
  requiredRegionIds: freeze(['arrival-gate', 'command-district', 'creator-atrium', 'forge-bay']),
  requiredControlGroupIds: freeze([
    'city-lifecycle',
    'wayfinding-and-district-review',
    'companion-and-work-review',
    'visual-accessibility-and-sound-boundary',
    'local-validation-and-proof-boundary'
  ]),
  requiredFiles: freeze([
    'assets/js/city/eon-city-command-horizon-proof-manifest.js',
    'config/w575-command-horizon-live-gameplay-contract.mjs',
    'scripts/w575-command-horizon-live-gameplay-gate.mjs',
    'tests/unit/w575-command-horizon-live-gameplay.test.mjs',
    'e2e/w575-command-horizon-live-gameplay.spec.js',
    'docs/W575_COMMAND_HORIZON_VERTICAL_SLICE_AND_LIVE_GAMEPLAY_PROOF_BOARD_2026-07-03.md',
    'docs/CODEX_W575_COMMAND_HORIZON_DEEP_GAMEPLAY_RUNBOOK_2026-07-03.md'
  ]),
  accessLanes: freeze([
    freeze({
      id: 'public-entry',
      title: 'Public/guest entry lane',
      requiresGoogleSession: false,
      purpose: 'Verify truthful entry, no premature heavy renderer boot, and clear access guidance.',
      identityBypassAllowed: false,
      heavyCityRequired: false
    }),
    freeze({
      id: 'authenticated-preview',
      title: 'Authenticated preview gameplay lane',
      requiresGoogleSession: true,
      purpose: 'Verify the post-login City only after a human has completed the normal Google/EONAPP sign-in flow.',
      identityBypassAllowed: false,
      heavyCityRequired: true
    })
  ]),
  proofRequirements: freeze({
    manualGoogleSignInRequired: true,
    captchaAutomationForbidden: true,
    credentialsInRepositoryForbidden: true,
    publicTestBypassForbidden: true,
    previewOnlyBeforeProduction: true,
    screenshotEvidenceRequired: true,
    screenRecordingRequired: true,
    consoleAndPageErrorLogRequired: true,
    failedNetworkRequestLogRequired: true,
    noAutomaticCertification: true,
    noAutomaticLaunchApproval: true
  }),
  sourceTruth: freeze({
    localSourceContractOnly: true,
    liveGameplayProven: false,
    previewDeploymentProven: false,
    productionDeploymentProven: false,
    physicalDeviceProven: false,
    oauthFlowProven: false,
    externalTelemetryCreated: false,
    remoteTestBypassCreated: false
  })
});

export function validateW575CommandHorizonLiveGameplayContract(contract = W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W575') errors.push('w575-id-invalid');
  if (contract?.schema !== W575_COMMAND_HORIZON_LIVE_GAMEPLAY_SCHEMA) errors.push('w575-schema-invalid');
  if (contract?.canonicalRoute !== '/eoncity') errors.push('w575-route-invalid');
  if (JSON.stringify(contract?.requiredRegionIds) !== JSON.stringify(W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.requiredRegionIds)) errors.push('w575-regions-invalid');
  if (JSON.stringify(contract?.requiredControlGroupIds) !== JSON.stringify(W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.requiredControlGroupIds)) errors.push('w575-control-groups-invalid');
  if (!Array.isArray(contract?.accessLanes) || contract.accessLanes.length !== 2) errors.push('w575-access-lanes-invalid');
  const publicLane = contract?.accessLanes?.find((lane) => lane.id === 'public-entry');
  const authenticatedLane = contract?.accessLanes?.find((lane) => lane.id === 'authenticated-preview');
  if (!publicLane || publicLane.requiresGoogleSession !== false || publicLane.identityBypassAllowed !== false || publicLane.heavyCityRequired !== false) errors.push('w575-public-lane-invalid');
  if (!authenticatedLane || authenticatedLane.requiresGoogleSession !== true || authenticatedLane.identityBypassAllowed !== false || authenticatedLane.heavyCityRequired !== true) errors.push('w575-authenticated-lane-invalid');
  const requiredProofTruth = W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.proofRequirements;
  for (const [key, expected] of Object.entries(requiredProofTruth)) {
    if (contract?.proofRequirements?.[key] !== expected) errors.push(`w575-proof-${key}-invalid`);
  }
  for (const [key, expected] of Object.entries(W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.sourceTruth)) {
    if (contract?.sourceTruth?.[key] !== expected) errors.push(`w575-source-truth-${key}-invalid`);
  }
  return freeze(errors);
}
