/** W374 — optional Google OAuth Pages Functions source contract. */
export const W374_GOOGLE_OAUTH_PAGES_FUNCTIONS_CONTRACT = Object.freeze({
  schema: 'eonapp.w374.google-oauth-pages-functions-contract.v1',
  requiredFiles: Object.freeze([
    'functions/_shared/eon-auth.js',
    'functions/api/auth/google/start.js',
    'functions/api/auth/google/callback.js',
    'functions/api/auth/session.js',
    'functions/api/auth/logout.js',
    'functions/api/account/delete-request.js',
    'identity/migrations/0001_eon_identity.sql',
    'profile.html',
    'assets/js/profile-page.js',
    'docs/W374_GOOGLE_OAUTH_PAGES_FUNCTIONS_RUNBOOK_2026-06-26.md',
    'docs/CLOUDFLARE_AI_GOOGLE_IDENTITY_SETUP_PROMPT_2026-06-26.md'
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
  requiredSecurityMarkers: Object.freeze([
    'code_challenge_method',
    'S256',
    'state',
    'nonce',
    'RS256',
    '__Host-eon_session',
    'HttpOnly',
    "sameSite: 'Lax'", 
    'identity_ref_hmac'
  ]),
  forbiddenBrowserPatterns: Object.freeze([
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'window.google.accounts',
    'google.accounts.id',
    'localStorage.setItem(\'google',
    'sessionStorage.setItem(\'google'
  ]),
  sourceOnlyTruth: Object.freeze({
    live: false,
    previewConfigured: false,
    productionConfigured: false,
    publicGoogleRollout: false
  })
});
