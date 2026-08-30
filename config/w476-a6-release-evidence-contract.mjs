/** W476-A6 — release-system evidence boundary. */
export const W476_A6_RELEASE_EVIDENCE_SCHEMA = 'eonapp.w476.a6.release-evidence.v1';

export const W476_A6_RELEASE_EVIDENCE_CONTRACT = Object.freeze({
  schema: W476_A6_RELEASE_EVIDENCE_SCHEMA,
  wave: 'W476-A6',
  sourceOnly: true,
  requiredSourceEvidence: Object.freeze([
    'apiSurfaceContract',
    'apiNegativeTestMatrix',
    'cspCollectorValidation',
    'cspReportingEndpointHeaders',
    'packageLockSbom',
    'productionDependencyInventory',
    'externalOriginInventory',
    'rawAuditCommandSupport',
    'releaseEvidenceBoard'
  ]),
  requiredExternalEvidence: Object.freeze([
    'deployedFunctionMethodAndNegativeMatrix',
    'productionCspSyntheticViolationAndRedactionProof',
    'productionCspReportingEndpointHeaderProof',
    'productionNetworkOriginInventoryAndHumanReview',
    'productionBrowserConsoleAndCspReview',
    'productionLocalAiRuntimeCspCorsProof',
    'productionUpdateRollbackAndUserDataSurvivalProof',
    'physicalDeviceBrowserMatrix',
    'humanReleaseOwnerApproval'
  ]),
  boundaries: Object.freeze({
    productionReleaseApproved: false,
    paymentActivationApproved: false,
    dodoActivationApproved: false,
    browserProofGeneratedBySource: false,
    deploymentPerformedBySource: false,
    cspReportPayloadRetained: false,
    localImageVideoAdapterClaimed: false
  })
});

export function validateW476A6ReleaseEvidenceContract(contract = W476_A6_RELEASE_EVIDENCE_CONTRACT) {
  const issues = [];
  if (contract?.schema !== W476_A6_RELEASE_EVIDENCE_SCHEMA) issues.push('schema-invalid');
  if (contract?.wave !== 'W476-A6') issues.push('wave-invalid');
  if (contract?.sourceOnly !== true) issues.push('source-only-boundary-invalid');
  if (!Array.isArray(contract?.requiredSourceEvidence) || contract.requiredSourceEvidence.length < 9) issues.push('source-evidence-incomplete');
  if (!Array.isArray(contract?.requiredExternalEvidence) || contract.requiredExternalEvidence.length < 9) issues.push('external-evidence-incomplete');
  for (const [key, expected] of Object.entries(W476_A6_RELEASE_EVIDENCE_CONTRACT.boundaries)) {
    if (contract?.boundaries?.[key] !== expected) issues.push(`boundary-invalid:${key}`);
  }
  return Object.freeze(issues);
}
