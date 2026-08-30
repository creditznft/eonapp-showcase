/**
 * W378 — release-safe Cloudflare Google Identity and Codex handover contract.
 *
 * This source contract does NOT configure Cloudflare, create D1 databases,
 * inject secrets, activate Google Login, or deploy. It verifies only that the
 * repository contains an honest, current, secret-free operator handover and
 * that CI/Preview/Production source checks cannot skip the newest program
 * boundaries before a deployment is attempted.
 */

export const W378_CLOUDFLARE_CODEX_READINESS_SCHEMA = 'eonapp.w378.cloudflare-codex-readiness.v1';

export const W378_CLOUDFLARE_CODEX_READINESS_CONTRACT = Object.freeze({
  schema: W378_CLOUDFLARE_CODEX_READINESS_SCHEMA,
  requiredFiles: Object.freeze([
    'config/w378-cloudflare-codex-readiness-contract.mjs',
    'scripts/w378-cloudflare-codex-readiness-gate.mjs',
    'tests/unit/w378-cloudflare-codex-readiness.test.mjs',
    'docs/W378_CLOUDFLARE_GOOGLE_AUTH_AND_CODEX_HANDOFF_2026-06-26.md',
    'docs/CLOUDFLARE_AI_W378_GOOGLE_AUTH_SETUP_PROMPT_2026-06-26.md',
    'docs/CODEX_W378_MERGE_PREVIEW_PRODUCTION_HANDOFF_2026-06-26.md',
    'CURRENT_HANDOFF_2026-06-26/R4_W378_START_HERE.md',
    'CURRENT_HANDOFF_2026-06-26/R4_W378_CONTINUATION_PROMPT.md',
    'CURRENT_HANDOFF_2026-06-26/R4_W378_FULL_SOURCE_HANDOVER_STATUS.md',
    'docs/W374_GOOGLE_OAUTH_PAGES_FUNCTIONS_RUNBOOK_2026-06-26.md',
    'docs/GOOGLE_IDENTITY_CLOUDFLARE_SETUP_PLAN_2026-06-26.md',
    'docs/GOOGLE_IDENTITY_OPERATOR_STATUS_2026-06-26.md',
    'identity/migrations/0001_eon_identity.sql',
    'functions/_shared/eon-auth.js',
    '.github/workflows/ci.yml',
    '.github/workflows/preview.yml',
    '.github/workflows/deploy.yml'
  ]),
  requiredPackageScripts: Object.freeze([
    'qa:w378-cloudflare-codex-readiness',
    'qa:r4-current-program'
  ]),
  requiredRuntimeNames: Object.freeze([
    'EON_IDENTITY_DB',
    'APP_ORIGIN',
    'GOOGLE_REDIRECT_URI',
    'EON_AUTH_ROLLOUT',
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'EON_AUTH_SUBJECT_PEPPER',
    'EON_SESSION_SIGNING_KEY',
    'EON_OAUTH_FLOW_SIGNING_KEY'
  ]),
  requiredPublicMarkers: Object.freeze([
    'openid email profile',
    'https://eonapp.ch/api/auth/google/callback',
    'guest-first',
    'not a backup',
    'EON_AUTH_ROLLOUT=testing',
    'eonapp-identity-prod',
    'eonapp-identity-preview',
    'identity/migrations/0001_eon_identity.sql',
    'No payment, checkout, subscription, entitlement, referral benefit, provider connection, ad, CPA or payout code was activated.'
  ]),
  requiredDeploymentWorkflowMarkers: Object.freeze([
    'npm run qa:r4-current-program',
    'wrangler pages deploy dist --project-name=eonapp-ch',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID'
  ]),
  forbiddenActivationMarkers: Object.freeze([
    'EON_AUTH_ROLLOUT=public',
    'EON_AUTH_ROLLOUT = public',
    'GOOGLE_OAUTH_CLIENT_SECRET=<real',
    'EON_SESSION_SIGNING_KEY=<real',
    'EON_OAUTH_FLOW_SIGNING_KEY=<real',
    'EON_AUTH_SUBJECT_PEPPER=<real',
    'merchant approved',
    'checkout is live',
    'payment provider selected',
    'activate referral'
  ]),
  sourceOnly: true,
  cloudflareConfigurationApplied: false,
  googleOAuthLiveProven: false,
  paymentsActivated: false
});
