/**
 * Google Drive backup foundation — decision and UI contract only.
 *
 * This module intentionally contains no OAuth request, token handling, Drive
 * API call, upload, restore, scheduler, or background sync. It exists so the
 * product can explain one clear future path without accidentally treating an
 * identity-only Google session as Drive permission.
 */

export const EON_GOOGLE_DRIVE_BACKUP_SCHEMA = 'eon.google-drive-backup.foundation.v1';
export const EON_GOOGLE_DRIVE_BACKUP_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const EXCLUDED_CONTENT = Object.freeze([
  'API/provider keys and credentials',
  'Vault recovery secrets and encryption material',
  'OAuth sessions, access tokens, refresh tokens, or provider tokens',
  'wallets, payment methods, commercial entitlement state, rewards, referrals, or signed-share payloads',
  'raw media, local model files, browser caches, and unknown browser storage'
]);

const REQUIRED_GATES = Object.freeze([
  'A user starts from the Backup screen and selects Connect Google Drive for encrypted backups.',
  'A separate Drive permission request appears only after that explicit backup action; Google identity consent is never reused.',
  'The browser encrypts the selected allowlisted Capsule snapshot before any provider upload is attempted.',
  'The user reviews the snapshot name, size, and restore guidance before confirming upload.',
  'The connector records no Drive access or refresh token in localStorage, exported Capsules, Vault exports, logs, or analytics.',
  'The user can disconnect/revoke and delete remote backup copies through an explicit provider-facing flow.',
  'Conflict handling, restore preview, offline recovery, error recovery, and physical-device evidence pass before a public launch.'
]);

/**
 * Returns only product truth and a future implementation contract. It never
 * probes Google, reads a sign-in session, or stores a credential.
 */
export function getGoogleDriveBackupFoundationTruth() {
  return Object.freeze({
    schema: EON_GOOGLE_DRIVE_BACKUP_SCHEMA,
    provider: 'Google Drive',
    priority: 'first-approved-cloud-backup-lane',
    state: 'approved-foundation-not-enabled',
    connected: false,
    uploadActive: false,
    automaticUploadActive: false,
    automaticCrossDeviceSyncActive: false,
    automaticRestoreActive: false,
    providerCredentialsStored: false,
    googleIdentityConsentReusable: false,
    requestedScopeWhenEnabled: EON_GOOGLE_DRIVE_BACKUP_SCOPE,
    scopeRule: 'Request only after a user explicitly chooses Google Drive backup; never request this with ordinary Google sign-in.',
    fileAccessRule: 'The intended least-privilege design is access only to encrypted backup files EONAPP creates or the user explicitly selects for EONAPP.',
    backupModeWhenEnabled: 'Explicit encrypted snapshot backup, not background sync.',
    restoreRule: 'The user manually selects an encrypted snapshot, previews a no-values restore plan, then chooses individual changes before applying them.',
    excludedContent: EXCLUDED_CONTENT,
    requiredGates: REQUIRED_GATES,
    userMessage: 'Google Drive backup is planned but not connected. Google sign-in does not grant Drive access.'
  });
}

export function getGoogleDriveBackupLabel() {
  return getGoogleDriveBackupFoundationTruth().userMessage;
}

export function buildGoogleDriveBackupConsentPreview() {
  const truth = getGoogleDriveBackupFoundationTruth();
  return Object.freeze({
    title: 'Google Drive encrypted backup — consent preview',
    state: truth.state,
    scope: truth.requestedScopeWhenEnabled,
    willDo: [
      'Create an encrypted EONAPP backup snapshot in this browser.',
      'Ask for separate Drive permission only after you choose to connect backup storage.',
      'Let you confirm each upload and inspect a restore before any local records change.'
    ],
    willNotDo: [
      'Reuse ordinary Google Login permission for Drive.',
      'Read Gmail, Calendar, Contacts, YouTube, or broad Drive contents.',
      'Copy browser-local work automatically, run background sync, or restore data without your review.'
    ],
    excludedContent: truth.excludedContent
  });
}

export default {
  EON_GOOGLE_DRIVE_BACKUP_SCHEMA,
  EON_GOOGLE_DRIVE_BACKUP_SCOPE,
  getGoogleDriveBackupFoundationTruth,
  getGoogleDriveBackupLabel,
  buildGoogleDriveBackupConsentPreview
};
