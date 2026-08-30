/** W530 — structural security and OAuth delivery review, deliberately without live authorization or identity activity. */
export const W530_SECURITY_OAUTH_SCHEMA = 'eonapp.w530.security-oauth-structural-review.v1';
export const W530_SECURITY_OAUTH_CONTRACT = Object.freeze({
  wave: 'W530',
  schema: W530_SECURITY_OAUTH_SCHEMA,
  mode: 'source-structural-review-only',
  requiredIdentityScope: 'openid email profile',
  explicitlyDisallowedAtIdentityStart: Object.freeze(['drive', 'gmail', 'calendar', 'contacts', 'youtube']),
  requiredTruth: Object.freeze([
    'identity-explicit-user-action-only',
    'guest-mode-available',
    'google-drive-separate-contextual-consent',
    'no-automatic-sign-in',
    'no-automatic-sync'
  ]),
  pendingExternalEvidence: Object.freeze([
    'authorized-preview-or-production-header-capture',
    'controlled-google-oauth-completion',
    'clean-consent-profile-review',
    'network-disabled-high-impact-action-check'
  ])
});

export function validateW530SecurityOauthContract(contract = W530_SECURITY_OAUTH_CONTRACT) {
  const issues = [];
  if (contract?.schema !== W530_SECURITY_OAUTH_SCHEMA) issues.push('schema-invalid');
  if (contract?.mode !== 'source-structural-review-only') issues.push('mode-invalid');
  if (contract?.requiredIdentityScope !== 'openid email profile') issues.push('identity-scope-invalid');
  if (!Array.isArray(contract?.explicitlyDisallowedAtIdentityStart) || !contract.explicitlyDisallowedAtIdentityStart.includes('drive')) issues.push('drive-separation-missing');
  if (!Array.isArray(contract?.pendingExternalEvidence) || contract.pendingExternalEvidence.length < 4) issues.push('external-evidence-list-incomplete');
  return Object.freeze(issues);
}
