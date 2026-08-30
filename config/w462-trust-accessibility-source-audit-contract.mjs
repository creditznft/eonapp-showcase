/** W462.1 contract: source-only consolidation of accessibility, language, voice and security readiness. */
export const W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT = Object.freeze({
  wave: 'W462.1',
  schema: 'eonapp.trust-accessibility-source-audit.w462.1',
  memberSourceGates: Object.freeze(['W271-A0', 'W272-A0', 'W287-A0', 'W394C']),
  sourceOnly: true,
  networkRequestCreated: false,
  browserAutomationRun: false,
  deviceEvidenceCaptured: false,
  accessibilityCertified: false,
  localeContentCertified: false,
  microphonePermissionVerified: false,
  cspEdgeHeaderVerified: false,
  supplyChainApproved: false,
  privacyCopyApproved: false,
  liveReleaseApproved: false,
  requiredFiles: Object.freeze([
    'scripts/w462-trust-accessibility-source-audit.mjs',
    'scripts/w462-trust-accessibility-source-audit-gate.mjs',
    'config/w462-trust-accessibility-source-audit-contract.mjs',
    'tests/unit/w462-trust-accessibility-source-audit.test.mjs',
    'scripts/w271-accessibility-i18n-source-gate.mjs',
    'scripts/w272-security-supplychain-source-gate.mjs',
    'scripts/w287-eonbot-language-voice-gate.mjs',
    'scripts/w394c-language-matrix-gate.mjs'
  ]),
  externalEvidence: Object.freeze([
    'keyboard and screen-reader walkthrough',
    'human locale and RTL content review',
    'real-device microphone permission and typed fallback review',
    'mobile assistive technology review',
    'deployed CSP/network header verification',
    'independent dependency/supply-chain review',
    'privacy, support and public-policy copy approval'
  ])
});

export function validateW462TrustAccessibilitySourceAuditContract(contract = W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT) {
  const errors = [];
  if (contract.wave !== 'W462.1') errors.push('wave-mismatch');
  if (contract.schema !== 'eonapp.trust-accessibility-source-audit.w462.1') errors.push('schema-mismatch');
  if (!Array.isArray(contract.memberSourceGates) || JSON.stringify(contract.memberSourceGates) !== JSON.stringify(['W271-A0', 'W272-A0', 'W287-A0', 'W394C'])) errors.push('member-gates-mismatch');
  const expected = {
    sourceOnly: true,
    networkRequestCreated: false,
    browserAutomationRun: false,
    deviceEvidenceCaptured: false,
    accessibilityCertified: false,
    localeContentCertified: false,
    microphonePermissionVerified: false,
    cspEdgeHeaderVerified: false,
    supplyChainApproved: false,
    privacyCopyApproved: false,
    liveReleaseApproved: false
  };
  for (const [key, value] of Object.entries(expected)) if (contract[key] !== value) errors.push(`boundary-${key}-mismatch`);
  if (!Array.isArray(contract.requiredFiles) || contract.requiredFiles.length < 8) errors.push('required-files-missing');
  if (!Array.isArray(contract.externalEvidence) || contract.externalEvidence.length < 7) errors.push('external-evidence-missing');
  return Object.freeze(errors);
}
