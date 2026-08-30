/** W401 — local creator asset provenance contract. */
export const W401_ASSET_PROVENANCE_CONTRACT = Object.freeze({
  wave: 'W401',
  canonicalSurface: 'Workspace',
  sourceTypes: Object.freeze(['user-owned', 'licensed', 'public-domain', 'provider-generated', 'permission-granted', 'unknown']),
  persistence: 'current-page-memory-only',
  boundaries: Object.freeze({
    upload: false,
    remoteLookup: false,
    rightsVerification: false,
    fairUseClaim: false,
    publicationApproval: false,
    exportRequiresUserAction: true
  })
});

export function validateW401AssetProvenanceContract(contract = W401_ASSET_PROVENANCE_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W401' || contract?.canonicalSurface !== 'Workspace') errors.push('W401 canonical scope is invalid.');
  if (JSON.stringify(contract?.sourceTypes) !== JSON.stringify(['user-owned', 'licensed', 'public-domain', 'provider-generated', 'permission-granted', 'unknown'])) errors.push('W401 source types are invalid.');
  if (contract?.persistence !== 'current-page-memory-only') errors.push('W401 persistence must remain page-memory only.');
  const b = contract?.boundaries || {};
  if (b.upload !== false || b.remoteLookup !== false || b.rightsVerification !== false || b.fairUseClaim !== false || b.publicationApproval !== false || b.exportRequiresUserAction !== true) errors.push('W401 safety boundaries are invalid.');
  return Object.freeze(errors);
}
