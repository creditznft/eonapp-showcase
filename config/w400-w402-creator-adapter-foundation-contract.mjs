/** W400/W402 — Creator truth + local/BYOK adapter foundation contract. */
export const W400_W402_CREATOR_ADAPTER_FOUNDATION_CONTRACT = Object.freeze({
  schema: 'eonapp.w400-w402.creator-adapter-foundation-contract.v1',
  waves: Object.freeze(['W400', 'W402']),
  canonicalSurface: 'Workspace',
  executionModes: Object.freeze(['draft-only', 'local-runtime', 'byok-provider']),
  requiredTasks: Object.freeze(['image', 'image-edit', 'image-to-video', 'video', 'music', 'auto-dj', 'radio', 'voice-audio', 'content-package']),
  boundaries: Object.freeze({
    legacyCreatorStudioRoute: false,
    providerCall: false,
    providerKeyInputInCreator: false,
    modelInstaller: false,
    automaticModelDownload: false,
    upload: false,
    publish: false,
    vaultOnlyCredentialBoundary: true,
    mobileFullVideoPromise: false
  })
});

export function validateW400W402CreatorAdapterFoundationContract(contract = W400_W402_CREATOR_ADAPTER_FOUNDATION_CONTRACT) {
  const errors = [];
  if (!Array.isArray(contract?.waves) || !contract.waves.includes('W400') || !contract.waves.includes('W402')) errors.push('Creator adapter waves are incomplete.');
  if (contract?.canonicalSurface !== 'Workspace') errors.push('Creator Engine must stay inside Workspace.');
  if (JSON.stringify(contract?.executionModes) !== JSON.stringify(['draft-only', 'local-runtime', 'byok-provider'])) errors.push('Creator execution modes are invalid.');
  if (!Array.isArray(contract?.requiredTasks) || !['image', 'video', 'image-to-video', 'music', 'auto-dj', 'radio'].every((id) => contract.requiredTasks.includes(id))) errors.push('Creator task set is incomplete.');
  const b = contract?.boundaries || {};
  if (b.legacyCreatorStudioRoute !== false || b.providerCall !== false || b.providerKeyInputInCreator !== false || b.modelInstaller !== false || b.automaticModelDownload !== false || b.upload !== false || b.publish !== false || b.vaultOnlyCredentialBoundary !== true || b.mobileFullVideoPromise !== false) errors.push('Creator safety boundary is invalid.');
  return Object.freeze(errors);
}
