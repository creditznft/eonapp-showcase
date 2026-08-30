/** W535 — fresh local product/release truth board. It is deliberately not a launch certificate. */
export const W535_RELEASE_TRUTH_SCHEMA = 'eonapp.w535.release-truth-reaudit.v1';
export const W535_ALLOWED_BOARD_STATES = Object.freeze(['READY_FOR_OWNER_DEVICE_CHECK', 'LIMITED_PREVIEW_ONLY', 'BLOCKED']);
export const W535_RELEASE_TRUTH_CONTRACT = Object.freeze({
  wave: 'W535',
  schema: W535_RELEASE_TRUTH_SCHEMA,
  allowedBoardStates: W535_ALLOWED_BOARD_STATES,
  sourceChecks: Object.freeze(['W519', 'W525A', 'W525B', 'W527', 'W528', 'W529', 'W530', 'W533', 'W534']),
  externalEvidenceRequired: Object.freeze([
    'authorized-review-branch-ci',
    'approved-preview-or-production-target',
    'android-device-pwa-check',
    'iphone-or-ipad-pwa-check',
    'controlled-google-oauth-completion',
    'google-drive-consent-upload-restore-proof',
    'trust-hub-corrected-cid-and-gateway-check',
    'owner-go-limited-preview-or-no-go'
  ]),
  prohibitedClaims: Object.freeze(['production-certified', 'physical-device-proven', 'cloud-backup-active', 'trust-hub-published'])
});

export function validateW535ReleaseTruthContract(contract = W535_RELEASE_TRUTH_CONTRACT) {
  const issues = [];
  if (contract?.schema !== W535_RELEASE_TRUTH_SCHEMA) issues.push('schema-invalid');
  if (!Array.isArray(contract?.allowedBoardStates) || !contract.allowedBoardStates.includes('LIMITED_PREVIEW_ONLY')) issues.push('board-states-invalid');
  if (!Array.isArray(contract?.externalEvidenceRequired) || contract.externalEvidenceRequired.length < 6) issues.push('external-evidence-list-incomplete');
  if (!Array.isArray(contract?.prohibitedClaims) || !contract.prohibitedClaims.includes('production-certified')) issues.push('prohibited-claims-incomplete');
  return Object.freeze(issues);
}
