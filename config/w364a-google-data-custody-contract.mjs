/** W364A — optional Google identity pre-auth data-custody source contract. */
export const W364A_GOOGLE_DATA_CUSTODY_CONTRACT = Object.freeze({
  schema: 'eonapp.w364a.google-data-custody-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/account/eon-account-foundation.js',
    'assets/js/local-first/local-first-boundary.js',
    'assets/js/profile-page.js',
    'profile.html',
    'assets/css/eon-hubs.css',
    'docs/W364A_OPTIONAL_GOOGLE_IDENTITY_LOCAL_DATA_CUSTODY_2026-06-26.md'
  ]),
  requiredProfileIds: Object.freeze([
    'eon-profile-account-foundation',
    'eon-profile-account-backup-warning',
    'sync'
  ]),
  requiredDataExclusions: Object.freeze([
    'Chat text, prompts, or raw AI outputs',
    'Vault contents, API keys, recovery material, passwords, or provider tokens',
    'local projects, files, assets, Realm layouts, or City progress',
    'raw card details or card numbers'
  ]),
  forbiddenBrowserPatterns: Object.freeze([
    'window.google.accounts',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'googleOAuthClientSecret',
    'fetch(',
    'XMLHttpRequest'
  ])
});
