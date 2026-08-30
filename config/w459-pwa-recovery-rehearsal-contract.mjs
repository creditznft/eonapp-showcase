/** W459.1 contract: a redacted local rehearsal, never an actual recovery operation. */
export const W459_PWA_RECOVERY_REHEARSAL_CONTRACT = Object.freeze({
  wave: 'W459.1',
  status: 'manual-redacted-local-rehearsal-source-only',
  storageKey: 'eon:pwa:recovery-rehearsal:v1',
  requiredSteps: Object.freeze(['backup-check', 'update-check', 'reopen-check', 'rollback-check']),
  rawVaultValueRead: false,
  rawKeyNameStored: false,
  backupCreated: false,
  restoreApplied: false,
  serviceWorkerUpdateApplied: false,
  rollbackApplied: false,
  browserPermissionRequested: false,
  networkRequestCreated: false,
  recoveryCertified: false,
  productionDeviceProof: false
});

export function validateW459PwaRecoveryRehearsalContract(contract = W459_PWA_RECOVERY_REHEARSAL_CONTRACT) {
  const issues = [];
  if (contract?.wave !== 'W459.1') issues.push('wave-mismatch');
  if (contract?.status !== 'manual-redacted-local-rehearsal-source-only') issues.push('status-mismatch');
  if (!Array.isArray(contract?.requiredSteps) || contract.requiredSteps.length !== 4) issues.push('step-contract-incomplete');
  if (contract?.rawVaultValueRead !== false || contract?.rawKeyNameStored !== false) issues.push('redaction-boundary-violated');
  if (contract?.backupCreated !== false || contract?.restoreApplied !== false || contract?.serviceWorkerUpdateApplied !== false || contract?.rollbackApplied !== false) issues.push('operation-boundary-violated');
  if (contract?.browserPermissionRequested !== false || contract?.networkRequestCreated !== false || contract?.recoveryCertified !== false || contract?.productionDeviceProof !== false) issues.push('external-proof-boundary-violated');
  return Object.freeze(issues);
}
