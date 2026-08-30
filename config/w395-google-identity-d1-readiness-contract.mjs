/**
 * W395 — Google Identity + D1 deployment-readiness contract.
 *
 * This contract certifies source and operator prerequisites only. It must never
 * be interpreted as a live OAuth, D1, Preview, production, backup, recovery,
 * referral, entitlement, or connector certification.
 */
export const W395_GOOGLE_IDENTITY_D1_READINESS_CONTRACT = Object.freeze({
  wave: 'W395',
  schema: 'eonapp.w395.google-identity-d1-readiness-contract.v1',
  status: 'source-and-operator-ready-only',
  sourceProofOnly: true,
  liveProofRequired: true,
  requiredFiles: Object.freeze([
    'functions/_shared/eon-auth.js',
    'functions/api/auth/google/start.js',
    'functions/api/auth/google/callback.js',
    'functions/api/auth/session.js',
    'functions/api/auth/logout.js',
    'functions/api/account/delete-request.js',
    'identity/migrations/0001_eon_identity.sql',
    'identity/wrangler.identity.example.toml',
    'docs/W395_GOOGLE_IDENTITY_D1_DEPLOYMENT_READINESS_2026-06-28.md',
    'docs/GOOGLE_IDENTITY_ENVIRONMENT_TEMPLATE_2026-06-26.txt',
    'profile.html',
    'assets/js/profile-page.js'
  ]),
  requiredEnvironmentNames: Object.freeze([
    'APP_ORIGIN',
    'GOOGLE_REDIRECT_URI',
    'EON_AUTH_ROLLOUT',
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'EON_AUTH_SUBJECT_PEPPER',
    'EON_SESSION_SIGNING_KEY',
    'EON_OAUTH_FLOW_SIGNING_KEY',
    'EON_IDENTITY_DB'
  ]),
  requiredRoutes: Object.freeze([
    'GET /api/auth/google/start',
    'GET /api/auth/google/callback',
    'GET /api/auth/session',
    'POST /api/auth/logout',
    'POST /api/account/delete-request'
  ]),
  requiredManualProofLanes: Object.freeze([
    'dedicated-production-and-preview-d1-bindings',
    'migration-applied-separately-to-each-identity-database',
    'google-testing-user-sign-in',
    'profile-session-logout-delete-proof',
    'guest-mode-and-local-work-preservation-proof',
    'redacted-preview-and-production-route-proof'
  ]),
  forbiddenClaims: Object.freeze([
    'live OAuth configured',
    'Google Login public',
    'automatic cloud backup',
    'automatic cross-device sync',
    'browser token storage',
    'local work uploaded',
    'referral reward enabled',
    'social token storage enabled'
  ]),
  boundaries: Object.freeze({
    guestFirst: true,
    identityOnlyScopes: Object.freeze(['openid', 'email', 'profile']),
    previewGoogleLoginEnabled: false,
    automaticCloudBackup: false,
    automaticCrossDeviceSync: false,
    localWorkInD1: false,
    browserOAuthSecretStorage: false,
    accountBackedCollection: false,
    referralRewards: false,
    socialTokenStorage: false
  })
});

export function validateW395GoogleIdentityD1ReadinessContract(contract = W395_GOOGLE_IDENTITY_D1_READINESS_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W395') errors.push('W395 wave identifier is invalid.');
  if (contract?.status !== 'source-and-operator-ready-only' || contract?.sourceProofOnly !== true || contract?.liveProofRequired !== true) errors.push('W395 source/live proof boundary is invalid.');
  if (!Array.isArray(contract?.requiredFiles) || contract.requiredFiles.length < 8) errors.push('W395 required source set is incomplete.');
  if (!Array.isArray(contract?.requiredEnvironmentNames) || !contract.requiredEnvironmentNames.includes('EON_IDENTITY_DB') || !contract.requiredEnvironmentNames.includes('GOOGLE_OAUTH_CLIENT_SECRET')) errors.push('W395 environment contract is incomplete.');
  if (JSON.stringify(contract?.boundaries?.identityOnlyScopes) !== JSON.stringify(['openid', 'email', 'profile'])) errors.push('W395 must remain identity-only.');
  for (const [key, expected] of Object.entries({
    guestFirst: true,
    previewGoogleLoginEnabled: false,
    automaticCloudBackup: false,
    automaticCrossDeviceSync: false,
    localWorkInD1: false,
    browserOAuthSecretStorage: false,
    accountBackedCollection: false,
    referralRewards: false,
    socialTokenStorage: false
  })) {
    if (contract?.boundaries?.[key] !== expected) errors.push(`W395 boundary mismatch: ${key}.`);
  }
  if (!Array.isArray(contract?.requiredManualProofLanes) || contract.requiredManualProofLanes.length < 6) errors.push('W395 manual proof lanes are incomplete.');
  return Object.freeze(errors);
}
