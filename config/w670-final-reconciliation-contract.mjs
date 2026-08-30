const freeze = (value) => Object.freeze(value);

export const W670_FINAL_RECONCILIATION_SCHEMA = 'eonapp.w670.final-reconciliation-contract.v1';

export const W670_FINAL_RECONCILIATION_CONTRACT = freeze({
  schema: W670_FINAL_RECONCILIATION_SCHEMA,
  wave: 'W670',
  baseCandidateSha: '752b2cf193bb716aade81cce7b6af38fedf6286f',
  product: 'EONAPP + EON NEXUS + EONCITY',
  sourceState: 'final-source-certification-before-owner-gameplay',
  requiredSourceRepairs: freeze([
    'identity-coherent-home-copy',
    'identity-coherent-city-profile-control',
    'maintained-suite-manifest-alignment',
    'diverse-rendered-expanse-grammar',
    'flagship-nexus-source-preservation',
    'artifact-free-build-and-production-verification'
  ]),
  worldDiversityMinimums: freeze({
    regionArchetypes: 18,
    streetProfiles: 18,
    terrainProfiles: 10,
    publicSpaceProfiles: 10,
    skylineProfiles: 10,
    buildingForms: 70,
    landmarkTypes: 14,
    gameplayPurposes: 14,
    sampledArchetypes: 16,
    sampledStreetProfiles: 16,
    sampledTerrainProfiles: 10,
    sampledPublicSpaces: 10,
    sampledSkylineProfiles: 10,
    uniqueVariationSignatures: 2000
  }),
  truthBoundaries: freeze({
    localFirstCopyRequired: true,
    signedInControlsMustNotSaySignIn: true,
    noPrivatePromptOrFileProjection: true,
    noAutomaticNavigation: true,
    noAutomaticWorkExecution: true,
    noAutomatedOwnerScore: true,
    ownerGameplayRecordingStillRequired: true,
    githubActionsArtifactsAllowed: false
  }),
  releaseGates: freeze({
    focusedW670: true,
    maintainedUnitSuite: true,
    permanentPredeploy: true,
    productionBuild: true,
    buildSmoke: true,
    siteAudit: true,
    liveProvenance: true,
    authenticatedCityAccess: true,
    ownerGameplayRecording: 'pending-after-source-and-live-gates'
  })
});

export function validateW670FinalReconciliationContract(value = W670_FINAL_RECONCILIATION_CONTRACT) {
  const errors = [];
  if (value?.schema !== W670_FINAL_RECONCILIATION_SCHEMA || value?.wave !== 'W670') errors.push('identity');
  if (!/^[a-f0-9]{40}$/i.test(String(value?.baseCandidateSha || ''))) errors.push('base-candidate');
  if (!Array.isArray(value?.requiredSourceRepairs) || value.requiredSourceRepairs.length < 6) errors.push('repair-matrix');
  const minimums = value?.worldDiversityMinimums || {};
  for (const [key, expected] of Object.entries(W670_FINAL_RECONCILIATION_CONTRACT.worldDiversityMinimums)) {
    if (Number(minimums[key]) < Number(expected)) errors.push(`minimum:${key}`);
  }
  const boundaries = value?.truthBoundaries || {};
  for (const [key, expected] of Object.entries(W670_FINAL_RECONCILIATION_CONTRACT.truthBoundaries)) {
    if (boundaries[key] !== expected) errors.push(`boundary:${key}`);
  }
  if (value?.releaseGates?.ownerGameplayRecording !== 'pending-after-source-and-live-gates') errors.push('owner-proof-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default W670_FINAL_RECONCILIATION_CONTRACT;
