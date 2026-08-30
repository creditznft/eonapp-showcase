/** W458.1 contract: optional deploy-time status boundary only. */
export const W458A_SYNC_BASIC_STATUS_PROOF_CONTRACT = Object.freeze({
  wave: 'W458.1',
  schema: 'eonapp.sync-basic-status-proof.w458.1.v1',
  endpoint: '/api/sync/status',
  method: 'GET',
  httpsOnly: true,
  defaultMode: 'dry-run',
  requestCookieIncluded: false,
  recordUploadCreated: false,
  tombstoneCreated: false,
  responseBodyStored: false,
  manualDeviceProofRequired: true,
  liveReleaseApproved: false,
  requiredFiles: Object.freeze([
    'scripts/w458a-sync-basic-status-proof.mjs',
    'config/w458a-sync-basic-status-proof-contract.mjs',
    'functions/api/sync/status.js',
    'functions/_shared/eon-sync-basic.js',
    'sync/wrangler.sync.example.toml',
    'tests/unit/w458a-sync-basic-status-proof.test.mjs'
  ])
});

export function validateW458ASyncBasicStatusProofContract(contract = W458A_SYNC_BASIC_STATUS_PROOF_CONTRACT) {
  const errors = [];
  if (contract.wave !== 'W458.1') errors.push('wave-mismatch');
  if (contract.schema !== 'eonapp.sync-basic-status-proof.w458.1.v1') errors.push('schema-mismatch');
  if (contract.endpoint !== '/api/sync/status' || contract.method !== 'GET') errors.push('endpoint-mismatch');
  for (const key of ['httpsOnly', 'requestCookieIncluded', 'recordUploadCreated', 'tombstoneCreated', 'responseBodyStored', 'manualDeviceProofRequired', 'liveReleaseApproved']) {
    const expected = key === 'httpsOnly' || key === 'manualDeviceProofRequired';
    if (contract[key] !== expected) errors.push(`boundary-${key}-mismatch`);
  }
  return Object.freeze(errors);
}
