/** W412 — fail-closed Sync Basic transport contract. */
export const W412_SYNC_BASIC_TRANSPORT_CONTRACT = Object.freeze({
  id: 'W412',
  title: 'EON Sync Basic manual-proof transport',
  requiredFiles: Object.freeze([
    'functions/_shared/eon-sync-basic.js',
    'functions/api/sync/status.js',
    'functions/api/sync/records.js',
    'functions/api/sync/records/tombstone.js',
    'sync/migrations/0001_eon_sync_basic.sql',
    'sync/wrangler.sync.example.toml',
    'assets/js/eon-sync/eon-sync-basic-client.js',
    'assets/js/eon-sync/eon-sync-basic-foundation.js',
    'assets/js/eon-app-shell.js',
    'config/w412-sync-basic-transport-contract.mjs',
    'scripts/w412-sync-basic-transport-gate.mjs',
    'tests/unit/w412-sync-basic-transport.test.mjs',
    'docs/W412_SYNC_BASIC_TRANSPORT_2026-06-28.md'
  ]),
  allowedTypes: Object.freeze(['preferences', 'chat-metadata', 'chat-text', 'project-metadata', 'project-text', 'share-remix-metadata']),
  expectedClientTruth: Object.freeze({ importNetworkOnModuleLoad: false, explicitUserActionRequired: true, explicitUploadConsentRequired: true, explicitDeletionConsentRequired: true, automaticUpload: false, backgroundSync: false, automaticMerge: false, automaticDeletion: false, vaultSync: false, apiKeySync: false, liveReleaseApproved: false })
});

export function validateW412SyncBasicTransportContract(contract = W412_SYNC_BASIC_TRANSPORT_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W412') errors.push('W412 identifier is invalid.');
  if (!Array.isArray(contract?.allowedTypes) || contract.allowedTypes.length !== 6) errors.push('W412 must preserve the six approved safe record types.');
  for (const [key, expected] of Object.entries(W412_SYNC_BASIC_TRANSPORT_CONTRACT.expectedClientTruth)) {
    if (contract?.expectedClientTruth?.[key] !== expected) errors.push(`W412 client truth ${key} is invalid.`);
  }
  return Object.freeze(errors);
}
