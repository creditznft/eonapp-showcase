/** W466 — release evidence matrix contract for the post-retirement product. */
export const W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT = Object.freeze({
  wave: 'W466',
  schema: 'eon.release.production-evidence.w466.v1',
  sourceOnly: true,
  canonicalRoutes: Object.freeze(['/', '/eoncity', '/insights']),
  sourceValidationMustPass: Object.freeze([
    'lint',
    'w449ProductionCleanroom',
    'w450DodoApprovalReadiness',
    'w451LegacyInventoryAndCleanupHandoff',
    'w452CanonicalRouteQuality',
    'w453ToW462SourceGates',
    'currentUnitSuite',
    'productionBuild',
    'distCleanroom',
    'buildSmoke',
    'siteAudit',
    'launchReadiness',
    'secretScan'
  ]),
  coreExternalEvidence: Object.freeze([
    'cloudflareDeployment',
    'cityAndRouteEdgeProof',
    'telegramAndResearchEdgeProof',
    'googleIdentityLifecycleProof',
    'syncStatusAndTwoDeviceRecoveryProof',
    'cityDesktopAndroidIosProof',
    'pwaInstallUpdateRollbackDataSurvivalProof',
    'activityCenterLifecycleProof',
    'accessibilityLocaleVoiceSecurityProof',
    'legacyQuarantineSecondProof',
    'humanGoNoGoReview'
  ]),
  commercialExternalEvidence: Object.freeze([
    'dodoMerchantUnderwritingApproval',
    'dodoApprovedCataloguePolicyTaxSupportProof',
    'dodoHostedCheckoutAndWebhookLifecycleProof',
    'dodoTrialRenewalRefundDisputeRecoveryProof',
    'commercialHumanGoReview'
  ]),
  boundaries: Object.freeze({
    productionReleaseApproved: false,
    commercialActivationApproved: false,
    browserOrDeviceProofGeneratedBySource: false,
    paymentOrTrialActivatedBySource: false,
    deploymentPerformedBySource: false,
    legacyDeletionPerformedBySource: false
  })
});

export function validateW466ProductionReleaseEvidenceContract(contract = W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT) {
  const issues = [];
  if (contract?.wave !== 'W466' || contract?.schema !== 'eon.release.production-evidence.w466.v1') issues.push('w466-identity-invalid');
  if (contract?.sourceOnly !== true) issues.push('w466-must-remain-source-only');
  if (!Array.isArray(contract?.canonicalRoutes) || contract.canonicalRoutes.join(',') !== '/,/eoncity,/insights') issues.push('w466-canonical-routes-invalid');
  if (!Array.isArray(contract?.sourceValidationMustPass) || contract.sourceValidationMustPass.length < 10) issues.push('w466-source-validation-set-incomplete');
  if (!Array.isArray(contract?.coreExternalEvidence) || contract.coreExternalEvidence.length < 10) issues.push('w466-core-evidence-set-incomplete');
  if (!Array.isArray(contract?.commercialExternalEvidence) || contract.commercialExternalEvidence.length < 5) issues.push('w466-commercial-evidence-set-incomplete');
  for (const [key, expected] of Object.entries(W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT.boundaries)) {
    if (contract?.boundaries?.[key] !== expected) issues.push(`w466-boundary-invalid:${key}`);
  }
  return Object.freeze(issues);
}
