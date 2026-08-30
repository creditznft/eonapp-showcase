export const W411_SYNC_BASIC_FOUNDATION_CONTRACT = Object.freeze({
  wave: 'W411',
  schema: 'eonapp.w411.sync-basic-foundation-contract.v1',
  sourceOnly: true,
  enabled: false,
  googleLoginIsSync: false,
  automaticUpload: false,
  requiredRecordFields: Object.freeze(['id', 'type', 'updatedAt', 'version', 'originDeviceId', 'deletedAt', 'contentHash']),
  allowedTypes: Object.freeze(['preferences', 'chat-metadata', 'chat-text', 'project-metadata', 'project-text', 'share-remix-metadata']),
  excludedScope: Object.freeze(['Vault', 'API keys', 'raw media', 'model binaries', 'browser caches']),
  userSafeguards: Object.freeze({ explicitOptIn: true, mergeChoiceBeforeImport: true, textConflictCopy: true, deletionTombstone: true }),
  cloudActivation: Object.freeze({ syncEndpoint: false, d1Index: false, r2BlobStore: false, secureVaultSync: false, backgroundSync: false })
});

export function validateW411SyncBasicFoundationContract(contract = W411_SYNC_BASIC_FOUNDATION_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W411' || contract?.schema !== 'eonapp.w411.sync-basic-foundation-contract.v1') errors.push('W411 identity is invalid.');
  if (contract?.sourceOnly !== true || contract?.enabled !== false || contract?.googleLoginIsSync !== false || contract?.automaticUpload !== false) errors.push('W411 activation boundary is invalid.');
  if (!Array.isArray(contract?.requiredRecordFields) || contract.requiredRecordFields.join(',') !== 'id,type,updatedAt,version,originDeviceId,deletedAt,contentHash') errors.push('W411 record schema fields are invalid.');
  if (!Array.isArray(contract?.allowedTypes) || contract.allowedTypes.length !== 6 || !contract.allowedTypes.includes('chat-text') || !contract.allowedTypes.includes('project-text')) errors.push('W411 safe type set is invalid.');
  if (!Array.isArray(contract?.excludedScope) || !contract.excludedScope.includes('Vault') || !contract.excludedScope.includes('API keys')) errors.push('W411 exclusions are invalid.');
  if (contract?.userSafeguards?.explicitOptIn !== true || contract?.userSafeguards?.mergeChoiceBeforeImport !== true || contract?.userSafeguards?.textConflictCopy !== true || contract?.userSafeguards?.deletionTombstone !== true) errors.push('W411 user safeguards are invalid.');
  for (const [key, value] of Object.entries(contract?.cloudActivation || {})) if (value !== false) errors.push(`W411 cloud activation is not locked: ${key}.`);
  return Object.freeze(errors);
}
