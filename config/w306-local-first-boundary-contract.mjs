/** W306 + W364A source contract — guest-first local work with an optional, minimal future Google identity. */
export const W306_LOCAL_FIRST_BOUNDARY_CONTRACT = Object.freeze({
  schema: 'eonapp.w306.local-first-boundary-contract.v2',
  requiredFiles: Object.freeze([
    'assets/js/local-first/local-first-boundary.js',
    'assets/js/account/eon-account-foundation.js',
    'assets/js/utils/eon-accounts-manager.js',
    'assets/js/onboarding-page.js',
    'assets/js/eon-pwa-manager.js',
    'assets/js/local-first/eon-local-encrypted-export.js',
    'assets/js/capabilities/capability-truth-registry.js',
    'config/w303-legacy-salvage-manifest.json'
  ]),
  retiredModuleMarker: 'EON_LEGACY_ACCOUNT_ATTACHMENTS_RETIRED',
  forbiddenActivePatterns: Object.freeze([
    'window.google.accounts',
    'startGoogleSignIn',
    'EONAccountsManager',
    'googleOAuthClientSecret',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'eon_google_oauth_client_secret'
  ]),
  requiredCapabilityIds: Object.freeze([
    'legacy-google-one-tap',
    'google-identity-sign-in',
    'legacy-browser-account-attachments',
    'cloud-workspace-control-plane'
  ]),
  requiredLegacyIds: Object.freeze([
    'eon-accounts-manager',
    'distribution-automation-rails'
  ]),
  localFirstLanguage: Object.freeze([
    'optional Google sign-in',
    'does not back up local',
    'encrypted portable backup',
    'no automatic cross-device sync'
  ])
});
