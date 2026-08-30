/** W433 contract: review-first Sync Basic merge/recovery source foundation. */
export const W433_SYNC_BASIC_MERGE_RECOVERY_CONTRACT = Object.freeze({
  schema: 'eonapp.w433.sync-basic-merge-recovery-contract.v1',
  wave: 'W433',
  status: 'source-review-foundation',
  predecessor: Object.freeze(['W411 local schema', 'W412 explicit transport', 'W145 update-safe data survival']),
  allowedTypes: Object.freeze(['preferences', 'chat-metadata', 'chat-text', 'project-metadata', 'project-text', 'share-remix-metadata']),
  requiredDecisions: Object.freeze(['import-required', 'replace-local-review', 'conflict-copy-review', 'delete-local-review', 'identical', 'retain-local-only']),
  requiredProofBeforeLive: Object.freeze([
    'Real two-device account/session proof on supported browsers',
    'Explicit user review, import, deletion and conflict-copy interactions',
    'Application-specific commit adapters with rollback and recovery',
    'Offline edit, reconnect, conflict, deletion and browser-clear recovery evidence',
    'Update/rollback evidence coupled to W145 protected-data survival',
    'External transport, D1 identity/index and privacy/security review'
  ]),
  prohibitedClaims: Object.freeze([
    'Google identity equals Sync',
    'automatic merge or background upload',
    'browser storage mutation from merge planning',
    'secure Vault Sync',
    'production cross-device Sync certification'
  ]),
  truth: Object.freeze({
    liveSync: false,
    networkTransport: false,
    browserStorageWrite: false,
    automaticMerge: false,
    deviceProof: false,
    secureVaultSync: false
  })
});

export function validateW433SyncBasicMergeRecoveryContract(contract = W433_SYNC_BASIC_MERGE_RECOVERY_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W433') errors.push('wave-must-be-w433');
  if (contract?.status !== 'source-review-foundation') errors.push('status-must-remain-source-foundation');
  if (!Array.isArray(contract?.allowedTypes) || contract.allowedTypes.length !== 6) errors.push('safe-sync-type-set-required');
  if (!Array.isArray(contract?.requiredDecisions) || contract.requiredDecisions.length < 6) errors.push('review-decision-set-required');
  if (contract?.truth?.liveSync || contract?.truth?.networkTransport || contract?.truth?.browserStorageWrite || contract?.truth?.automaticMerge || contract?.truth?.deviceProof || contract?.truth?.secureVaultSync) errors.push('truth-boundary-must-remain-false');
  if (!Array.isArray(contract?.requiredProofBeforeLive) || contract.requiredProofBeforeLive.length < 5) errors.push('external-proof-requirements-required');
  return Object.freeze(errors);
}
