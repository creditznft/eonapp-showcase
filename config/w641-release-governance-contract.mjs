/** W641 — immutable candidate, Preview proof and owner-authorized production promotion. */
const freeze = (value) => Object.freeze(value);

export const W641_CANDIDATE_PROVENANCE_SCHEMA = 'eonapp.release-candidate-provenance.w641.v1';
export const W641_PREVIEW_RECEIPT_SCHEMA = 'eonapp.preview-deployment-receipt.w641.v1';
export const W641_OWNER_GO_SCHEMA = 'eonapp.owner-launch-authorization.w641.v1';
export const W641_ENVIRONMENT_PROTECTION_SCHEMA = 'eonapp.github-environment-protection.w641.v1';
export const W641_CANDIDATE_MANIFEST_SCHEMA = 'eonapp.release-candidate-manifest.w641.v1';
export const W641_REQUIRED_REHEARSAL_DOMAINS = freeze([
  'routes', 'account', 'projects', 'forge', 'automations', 'city', 'creator', 'billing', 'referral', 'backup-recovery', 'incidents-rollback'
]);
export const W641_REQUIRED_CORE_LANES = freeze(['billing', 'local-creator']);
export const W641_OPTIONAL_GATED_LANES = freeze(['referral', 'direct-provider', 'companion']);

export const W641_RELEASE_GOVERNANCE_CONTRACT = freeze({
  schema: 'eonapp.release-governance-lock.w641.v1',
  wave: 'W641',
  productionTrigger: 'workflow-dispatch-only',
  exactArtifactPromotion: true,
  sourceRebuildInPreview: false,
  sourceRebuildInProduction: false,
  ordinaryCiCanDeployProduction: false,
  requiredInputs: freeze([
    'candidate provenance',
    'candidate manifest',
    'permanent predeploy PASS receipt',
    'W638 evidence index',
    'W639 freeze manifest and complete rehearsal board',
    'Preview deployment receipt',
    'owner GO authorization receipt',
    'GitHub production environment protection receipt',
    'previous successful production deployment ID'
  ]),
  failClosedRules: freeze({
    candidateDigestMustMatch: true,
    sourceFingerprintMustMatch: true,
    commitShaMustMatch: true,
    previewDigestMustMatch: true,
    evidenceIndexDigestMustMatch: true,
    freezeDigestMustMatch: true,
    allElevenDomainsMustPass: true,
    coreEvidenceLanesMustPass: true,
    optionalLanesRequireExplicitClosedGate: true,
    ownerDecisionMustBeGo: true,
    authorizationMustNotBeExpired: true,
    productionEnvironmentMustRequireReview: true,
    rollbackTargetMustBeRecorded: true
  })
});

export function validateW641ReleaseGovernanceContract(value = W641_RELEASE_GOVERNANCE_CONTRACT) {
  const checks = freeze({
    identity: value?.schema === 'eonapp.release-governance-lock.w641.v1' && value?.wave === 'W641',
    manualOnly: value?.productionTrigger === 'workflow-dispatch-only' && value?.ordinaryCiCanDeployProduction === false,
    immutable: value?.exactArtifactPromotion === true && value?.sourceRebuildInPreview === false && value?.sourceRebuildInProduction === false,
    inputs: Array.isArray(value?.requiredInputs) && value.requiredInputs.length >= 9,
    digests: value?.failClosedRules?.candidateDigestMustMatch === true && value?.failClosedRules?.previewDigestMustMatch === true && value?.failClosedRules?.evidenceIndexDigestMustMatch === true && value?.failClosedRules?.freezeDigestMustMatch === true,
    domains: value?.failClosedRules?.allElevenDomainsMustPass === true && W641_REQUIRED_REHEARSAL_DOMAINS.length === 11,
    lanes: value?.failClosedRules?.coreEvidenceLanesMustPass === true && value?.failClosedRules?.optionalLanesRequireExplicitClosedGate === true,
    owner: value?.failClosedRules?.ownerDecisionMustBeGo === true && value?.failClosedRules?.authorizationMustNotBeExpired === true,
    environment: value?.failClosedRules?.productionEnvironmentMustRequireReview === true && value?.failClosedRules?.rollbackTargetMustBeRecorded === true
  });
  return freeze({ ok: Object.values(checks).every(Boolean), checks });
}
