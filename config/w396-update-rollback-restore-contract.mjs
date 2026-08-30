/** W396 — release/update/rollback and restore-proof contract. */
export const W396_UPDATE_ROLLBACK_RESTORE_CONTRACT = Object.freeze({
  wave: 'W396',
  schema: 'eonapp.w396.update-rollback-restore-contract.v1',
  status: 'source-readiness-and-manual-proof-required',
  sourceProofOnly: true,
  releaseCertification: false,
  requiredLanes: Object.freeze([
    'pre-update-local-storage-manifest',
    'cold-start-after-deploy',
    'encrypted-backup-export',
    'encrypted-backup-recovery-drill-into-empty-target',
    'rollback-or-last-known-good-recovery',
    'guest-and-identity-local-work-boundary',
    'redacted-real-browser-evidence'
  ]),
  prohibitedClaims: Object.freeze([
    'automatic cloud backup',
    'automatic cross-device sync',
    'server restore of local work',
    'browser secret export',
    'live release certification',
    'identity account restores local work'
  ]),
  boundaries: Object.freeze({
    userInitiatedBackupOnly: true,
    encryptedBackupOnly: true,
    emptyTargetRecoveryDrill: true,
    destructiveOverwrite: false,
    automaticCloudSync: false,
    googleIdentityIsBackup: false,
    cloudRecoveryOfChatOrVault: false,
    collectionOrReferralRestore: false
  })
});

export function validateW396UpdateRollbackRestoreContract(contract = W396_UPDATE_ROLLBACK_RESTORE_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W396') errors.push('W396 wave identifier is invalid.');
  if (contract?.status !== 'source-readiness-and-manual-proof-required' || contract?.sourceProofOnly !== true || contract?.releaseCertification !== false) errors.push('W396 proof boundary is invalid.');
  if (!Array.isArray(contract?.requiredLanes) || contract.requiredLanes.length < 7) errors.push('W396 manual proof lanes are incomplete.');
  for (const [key, expected] of Object.entries({
    userInitiatedBackupOnly: true,
    encryptedBackupOnly: true,
    emptyTargetRecoveryDrill: true,
    destructiveOverwrite: false,
    automaticCloudSync: false,
    googleIdentityIsBackup: false,
    cloudRecoveryOfChatOrVault: false,
    collectionOrReferralRestore: false
  })) {
    if (contract?.boundaries?.[key] !== expected) errors.push(`W396 boundary mismatch: ${key}.`);
  }
  return Object.freeze(errors);
}
