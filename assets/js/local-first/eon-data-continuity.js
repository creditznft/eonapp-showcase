/**
 * EONAPP data-continuity truth model.
 *
 * This is deliberately descriptive, not a connector. It makes the current
 * local-first boundary explicit so UI cannot imply that sign-in, PWA install,
 * a manual storage handoff, or a secondary device has already become sync.
 * No network request, credential storage, provider discovery, upload, or
 * restore is performed here.
 */
import { getGoogleDriveBackupFoundationTruth } from './eon-google-drive-backup-foundation.js';

export const EON_DATA_CONTINUITY_SCHEMA = 'eonapp.data-continuity.v2';

const LIVE_LANES = Object.freeze([
  Object.freeze({
    id: 'local-browser-profile',
    label: 'This browser profile',
    state: 'live',
    detail: 'EONAPP work remains local to the current browser profile by default.'
  }),
  Object.freeze({
    id: 'encrypted-capsule',
    label: 'Encrypted Portable Workspace Capsule',
    state: 'live-manual',
    detail: 'A user downloads an encrypted file, then explicitly inspects and restores selected records on another device.'
  }),
  Object.freeze({
    id: 'encrypted-vault-export',
    label: 'Encrypted Vault export',
    state: 'live-manual',
    detail: 'A user-controlled encrypted export/import path preserves only allowlisted EONAPP records and keeps unrelated browser storage untouched.'
  }),
  Object.freeze({
    id: 'manual-user-storage',
    label: 'Your private storage choice',
    state: 'live-manual',
    detail: 'After an encrypted download, you may manually place the file in storage you control and keep one offline copy.'
  })
]);

const NOT_ACTIVE = Object.freeze([
  Object.freeze({ id: 'automatic-cross-device-sync', label: 'Automatic multi-device sync', reason: 'not active' }),
  Object.freeze({ id: 'automatic-cloud-upload', label: 'Automatic cloud upload', reason: 'not active' }),
  Object.freeze({ id: 'managed-recovery-vault', label: 'Managed recovery cloud', reason: 'not active' }),
  Object.freeze({ id: 'provider-connected-backup', label: 'Provider-connected backup', reason: 'not active in this build' }),
  Object.freeze({ id: 'advanced-user-owned-mirror', label: 'Advanced user-owned encrypted mirror', reason: 'design-only; separate opt-in review required' })
]);

function futureConnectorOrder() {
  const googleDrive = getGoogleDriveBackupFoundationTruth();
  return Object.freeze([
    Object.freeze({
      id: 'google-drive',
      label: 'Google Drive encrypted backup',
      phase: googleDrive.state,
      rule: 'Approved as the first cloud-backup connector. It remains disabled until a separate Drive consent, encrypted snapshot upload, restore preview, revocation flow, and device evidence are complete.'
    }),
    Object.freeze({
      id: 'onedrive',
      label: 'OneDrive encrypted backup',
      phase: 'future-explicit-consent',
      rule: 'Second connector only after the Google Drive lane is proven. It requires separate least-privilege consent, encrypted snapshots, conflict design, revocation, and recovery proof.'
    })
  ]);
}

const EXCLUDED_FROM_PORTABLE_CONTINUITY = Object.freeze([
  'API/provider keys and credentials',
  'Vault recovery secrets and encryption material',
  'OAuth sessions or provider tokens',
  'wallets, payment methods, commercial entitlement state, rewards or referral material',
  'raw media, local model files, browser caches and unknown browser storage'
]);

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freezeDeep);
  return Object.freeze(value);
}

/** Public, safe-to-render continuity truth. This never enumerates storage keys or reads user values. */
export function getEonDataContinuityTruth() {
  const googleDrive = getGoogleDriveBackupFoundationTruth();
  return freezeDeep({
    schema: EON_DATA_CONTINUITY_SCHEMA,
    localFirst: true,
    automaticCrossDeviceSyncActive: false,
    automaticCloudUploadActive: false,
    managedRecoveryVaultActive: false,
    providerConnectedBackupActive: false,
    providerCredentialsStoredForBackup: false,
    currentRecoveryPath: 'user-confirmed encrypted Capsule or Vault export/import',
    conflictPolicy: 'No background merge exists. A restore is inspected first and requires explicit per-record conflict choices.',
    liveLanes: LIVE_LANES,
    notActive: NOT_ACTIVE,
    futureConnectorOrder: futureConnectorOrder(),
    googleDriveBackup: googleDrive,
    excludedFromPortableContinuity: EXCLUDED_FROM_PORTABLE_CONTINUITY,
    manualStorageGuidance: 'Keep the passphrase separate from the encrypted file. You may manually store the file in private Google Drive or another storage location you control, but keep one offline copy and test a restore before relying on it.',
    updateEvidence: 'Local storage survival is source-tested; physical-device, real PWA-update, real provider upload, and real cross-device recovery evidence remain separate.'
  });
}

export function getEonDataContinuityLabel() {
  return 'Manual encrypted continuity is active. Automatic multi-device sync and Google Drive connection are not active.';
}

export default {
  EON_DATA_CONTINUITY_SCHEMA,
  getEonDataContinuityTruth,
  getEonDataContinuityLabel
};
