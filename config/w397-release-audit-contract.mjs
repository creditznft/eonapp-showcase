/** W397 — final release-audit contract for the current creator/viral foundation. */
export const W397_RELEASE_AUDIT_CONTRACT = Object.freeze({
  wave: 'W397',
  schema: 'eonapp.w397.release-audit-contract.v1',
  status: 'source-candidate-manual-approval-required',
  sourceCertificationOnly: true,
  productionReleaseCertified: false,
  requiredSourceScripts: Object.freeze([
    'lint',
    'test:unit',
    'build',
    'smoke:build',
    'audit:site',
    'launch:readiness',
    'qa:w393a-lean-handover-integrity',
    'qa:w394-city-mobile-hud',
    'qa:w382b-w383b-local-file-viewers',
    'qa:w394b-multilingual-voice',
    'qa:w400-w402-creator-adapter-foundation',
    'qa:w401-asset-provenance',
    'qa:w403-lean-media-lifecycle',
    'qa:w404-city-creator-atrium',
    'qa:w388a1-eon-share-pack',
    'qa:w388a2-remix-cards',
    'qa:w388a3-eonbot-shareable',
    'qa:w395-google-identity-d1-readiness',
    'qa:w396-update-rollback-restore'
  ]),
  manualBlockers: Object.freeze([
    'real-device-city-mobile-proof',
    'cloudflare-d1-and-google-testing-proof',
    'manual-encrypted-backup-recovery-drill',
    'preview-and-production-route-observation',
    'dependency-audit-remediation-decision',
    'human-release-signoff'
  ]),
  inactiveUntilLater: Object.freeze([
    'collection-and-vault-reveal',
    'eon-relay-referral-grants',
    'social-oauth-and-direct-publishing',
    'server-side-social-token-custody',
    'user-owned-cloudflare-deploy',
    'cloud-media-jobs-or-automatic-sync'
  ]),
  boundaries: Object.freeze({
    sourceGreenDoesNotEqualProduction: true,
    manualEvidenceRequired: true,
    liveOAuthRequiredBeforeAccountFeatures: true,
    restoreProofRequiredBeforeCollectionOrRelay: true,
    directPostingRequiresOfficialApproval: true,
    referralRewardsEnabled: false,
    collectionEnabled: false,
    socialConnectorEnabled: false
  })
});

export function validateW397ReleaseAuditContract(contract = W397_RELEASE_AUDIT_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W397') errors.push('W397 wave identifier is invalid.');
  if (contract?.status !== 'source-candidate-manual-approval-required' || contract?.sourceCertificationOnly !== true || contract?.productionReleaseCertified !== false) errors.push('W397 source/production truth is invalid.');
  if (!Array.isArray(contract?.requiredSourceScripts) || contract.requiredSourceScripts.length < 16) errors.push('W397 source suite is incomplete.');
  if (!Array.isArray(contract?.manualBlockers) || contract.manualBlockers.length < 6) errors.push('W397 manual blockers are incomplete.');
  for (const [key, expected] of Object.entries({
    sourceGreenDoesNotEqualProduction: true,
    manualEvidenceRequired: true,
    liveOAuthRequiredBeforeAccountFeatures: true,
    restoreProofRequiredBeforeCollectionOrRelay: true,
    directPostingRequiresOfficialApproval: true,
    referralRewardsEnabled: false,
    collectionEnabled: false,
    socialConnectorEnabled: false
  })) if (contract?.boundaries?.[key] !== expected) errors.push(`W397 boundary mismatch: ${key}.`);
  return Object.freeze(errors);
}
