/** W536 — explicit Google Drive encrypted snapshot contract. */
export const EON_GOOGLE_DRIVE_SNAPSHOT_SCHEMA = 'eonapp.google-drive-encrypted-snapshot.v1';
export const EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const EON_GOOGLE_DRIVE_SNAPSHOT_MIME = 'application/vnd.eonapp.workspace-capsule+json';
export const EON_GOOGLE_DRIVE_SNAPSHOT_APP_PROPERTY = 'eonappEncryptedCapsule';
export const EON_GOOGLE_DRIVE_SNAPSHOT_CONFIG_ROUTE = '/api/public/google-drive';
export const EON_GOOGLE_DRIVE_SNAPSHOT_MAX_BYTES = 8 * 1024 * 1024;

export const W536_GOOGLE_DRIVE_SNAPSHOT_CONTRACT = Object.freeze({
  wave: 'W536',
  schema: EON_GOOGLE_DRIVE_SNAPSHOT_SCHEMA,
  provider: 'Google Drive',
  scope: EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE,
  mode: 'user-confirmed-encrypted-snapshot-not-sync',
  browserTokenStorage: 'memory-only',
  automaticUpload: false,
  automaticRestore: false,
  automaticCrossDeviceSync: false,
  publicConfigRoute: EON_GOOGLE_DRIVE_SNAPSHOT_CONFIG_ROUTE,
  requiredOwnerConfiguration: Object.freeze([
    'Enable Google Drive API in a dedicated or carefully separated Google Cloud project.',
    'Configure Google OAuth branding, support contact, homepage, privacy policy, and Data Access declaration.',
    'Create a browser OAuth web client for Drive snapshots with https://eonapp.ch as an authorized JavaScript origin.',
    'Set only EON_GOOGLE_DRIVE_OAUTH_CLIENT_ID in the Cloudflare Pages production environment; never expose a client secret.',
    'Keep preview unset or use a distinct preview/test client and origin.',
    'Complete controlled consent, upload, list, restore-preview, trash, revoke, device, and policy evidence before public enablement.'
  ]),
  forbidden: Object.freeze([
    'Google Login consent reused for Drive',
    'access or refresh token stored in localStorage, IndexedDB, Capsule, Vault export, logs, analytics, or server storage',
    'background upload',
    'automatic restore',
    'automatic multi-device sync',
    'unencrypted Vault or browser data uploaded',
    'Drive client secret in browser or public configuration',
    'Google Drive enabled on Trust Hub or IPFS gateways'
  ])
});

export function validateW536GoogleDriveSnapshotContract(contract = W536_GOOGLE_DRIVE_SNAPSHOT_CONTRACT) {
  const issues = [];
  if (contract?.wave !== 'W536') issues.push('wave-invalid');
  if (contract?.schema !== EON_GOOGLE_DRIVE_SNAPSHOT_SCHEMA) issues.push('schema-invalid');
  if (contract?.scope !== EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE) issues.push('scope-invalid');
  if (contract?.automaticUpload !== false || contract?.automaticRestore !== false || contract?.automaticCrossDeviceSync !== false) issues.push('automatic-behavior-must-remain-disabled');
  if (contract?.browserTokenStorage !== 'memory-only') issues.push('browser-token-boundary-invalid');
  if (!Array.isArray(contract?.requiredOwnerConfiguration) || contract.requiredOwnerConfiguration.length < 5) issues.push('owner-config-checklist-incomplete');
  if (!Array.isArray(contract?.forbidden) || !contract.forbidden.includes('Google Login consent reused for Drive')) issues.push('identity-separation-missing');
  return Object.freeze(issues);
}
