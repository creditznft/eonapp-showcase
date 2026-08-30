/** W373 — identity account operations source contract. */
export const W373_IDENTITY_ACCOUNT_OPERATIONS_CONTRACT = Object.freeze({
  schema: 'eonapp.w373.identity-account-operations-contract.v2',
  requiredFiles: Object.freeze([
    'identity/migrations/0001_eon_identity.sql',
    'functions/_shared/eon-auth.js',
    'functions/api/account/delete-request.js',
    'assets/js/profile-page.js',
    'profile.html',
    'docs/W373_IDENTITY_ACCOUNT_OPERATIONS_CONTRACT_2026-06-26.md'
  ]),
  requiredD1Tables: Object.freeze([
    'eon_identity_accounts',
    'eon_identity_sessions'
  ]),
  localDataNeverUploaded: Object.freeze([
    'Chat',
    'Vault',
    'projects',
    'files',
    'Realm',
    'City progress',
    'provider keys'
  ]),
  requiredProfileIds: Object.freeze([
    'eon-profile-account-foundation',
    'eon-profile-delete-account',
    'eon-profile-account-backup-warning'
  ]),
  prohibitedSchemaColumns: Object.freeze([
    'email TEXT',
    'access_token',
    'refresh_token',
    'google_subject TEXT',
    'chat_text',
    'vault_data',
    'provider_key',
    'card_number'
  ]),
  accountDeleteConfirmation: 'DELETE_EON_ACCOUNT',
  nextWave: 'W374 — Google OAuth Pages Functions and controlled Google Testing-mode proof.'
});
