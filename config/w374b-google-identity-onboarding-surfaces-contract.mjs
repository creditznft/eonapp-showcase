export const W374B_GOOGLE_IDENTITY_ONBOARDING_SURFACES_CONTRACT = Object.freeze({
  schema: 'eonapp.w374b.google-identity-onboarding-surfaces-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/account/eon-identity-onboarding.js',
    'assets/js/eon-app-shell.js',
    'assets/js/profile-page.js',
    'chat.html',
    'apps.html',
    'eoncity.html',
    'eoncity-3d.html',
    'realm-studio.html',
    'billing.html',
    'functions/_shared/eon-auth.js',
    'functions/api/auth/google/callback.js',
    'docs/W374B_GOOGLE_IDENTITY_ONBOARDING_SURFACES_2026-06-26.md'
  ]),
  requiredSurfaces: Object.freeze(['chat', 'apps', 'eoncity', 'eoncity/tour', 'eoncity/play', 'realm-studio', 'billing', 'profile']),
  identityOnlyScopes: 'openid email profile',
  forbiddenBrowserTokens: Object.freeze(['GOOGLE_OAUTH_CLIENT_SECRET', 'window.google.accounts', 'google.accounts.id'])
});
