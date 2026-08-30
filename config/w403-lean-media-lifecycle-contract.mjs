/** W403 — creator media lifecycle contract. */
export const W403_LEAN_MEDIA_LIFECYCLE_CONTRACT = Object.freeze({
  wave: 'W403',
  canonicalSurface: 'Workspace',
  roles: Object.freeze(['source', 'proxy', 'render-cache', 'final-output', 'export-receipt']),
  storage: 'current-page-memory-only',
  boundaries: Object.freeze({
    mediaBodyStored: false,
    localStorage: false,
    indexedDb: false,
    automaticCloudBackup: false,
    automaticDownload: false,
    finalOutputRequiresExplicitUserSave: true,
    externalDeletionProof: false
  })
});

export function validateW403LeanMediaLifecycleContract(contract = W403_LEAN_MEDIA_LIFECYCLE_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W403' || contract?.canonicalSurface !== 'Workspace') errors.push('W403 canonical scope is invalid.');
  if (JSON.stringify(contract?.roles) !== JSON.stringify(['source', 'proxy', 'render-cache', 'final-output', 'export-receipt'])) errors.push('W403 media roles are invalid.');
  if (contract?.storage !== 'current-page-memory-only') errors.push('W403 persistence must remain page-memory only.');
  const b = contract?.boundaries || {};
  if (b.mediaBodyStored !== false || b.localStorage !== false || b.indexedDb !== false || b.automaticCloudBackup !== false || b.automaticDownload !== false || b.finalOutputRequiresExplicitUserSave !== true || b.externalDeletionProof !== false) errors.push('W403 retention boundary is invalid.');
  return Object.freeze(errors);
}
