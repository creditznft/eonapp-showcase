/** W519 — legacy transport/control quarantine contract. */
export const W519_LEGACY_TRANSPORT_QUARANTINE_SCHEMA = 'eonapp.w519.legacy-transport-control-quarantine.v1';
export const W519_QUARANTINE_ROOT = 'archive/w519-legacy-transport-control';

export const W519_ACTIVE_INVENTORY = Object.freeze([
  Object.freeze({ id: 'portable-workspace-capsule', classification: 'active', paths: Object.freeze(['assets/js/local-first/eon-workspace-capsule.js', 'assets/js/local-first/eon-workspace-capsule-page.js', 'capsule.html']), boundary: 'local-only; no fetch, worker payload, relay, P2P or silent upload' }),
  Object.freeze({ id: 'legacy-backup-aliases', classification: 'migration-only', paths: Object.freeze(['vault-backup.html']), boundary: 'redirect-only compatibility alias to /capsule; no backup/export controls' }),
  Object.freeze({ id: 'network-imports', classification: 'import-only', paths: Object.freeze([]), boundary: 'none are permitted in the active product while W519 is in force' })
]);

export const W519_QUARANTINED_SOURCE_PATHS = Object.freeze([
    'assets/css/eon-sync.css',
    'assets/css/distributed-inference.css',
    'assets/js/eon-sync/eon-sync-backup.js',
    'assets/js/eon-sync/eon-sync-basic-client.js',
    'assets/js/eon-sync/eon-sync-basic-foundation.js',
    'assets/js/eon-sync/eon-sync-basic-merge-recovery.js',
    'assets/js/relay/eon-relay-pilot-contract.js',
    'assets/js/relay/eon-relay-pilot-workspace.js',
    'assets/js/utils/arweave-permanence.js',
    'assets/js/utils/arweave-upload.js',
    'assets/js/utils/ipfs-backup.js',
    'assets/js/utils/cloud-backup-handoff.js',
    'assets/js/utils/ipfs-gateway.js',
    'assets/js/utils/nostr-swap-registry.js',
    'assets/js/utils/p2p-discovery.js',
    'assets/js/utils/p2p-multiplayer.js',
    'assets/js/utils/p2p-nostr.js',
    'assets/js/utils/realmworld-arweave.js',
    'assets/js/utils/realmworld-p2p.js',
    'assets/js/utils/vault-nostr-sync.js',
    'assets/js/utils/iot-control-hub.js',
    'assets/js/utils/distributed-inference.js',
    'assets/js/utils/distributed-inference-policy.js',
    'assets/js/services/DistributedInferenceService_V5.js',
    'assets/js/integration/distributed-inference-integration.js',
    'assets/js/components/ProviderEarningsDashboard.js',
    'assets/js/creator-studio-di-bootstrap.js',
    'assets/js/utils/backend-client.js',
    'assets/js/utils/bounty-board.js',
    'assets/js/utils/subscription.js',
    'DISTRIBUTED_INFERENCE_QUICK_START.js',
    'functions/_shared/eon-relay.js',
    'functions/_shared/eon-sync-basic.js',
    'functions/api/relay/attribution/capture.js',
    'functions/api/relay/claim.js',
    'functions/api/relay/invites/create.js',
    'functions/api/relay/status.js',
    'functions/api/sync/records.js',
    'functions/api/sync/records/tombstone.js',
    'functions/api/sync/status.js',
    'relay/migrations/0001_eon_relay_pilot.sql',
    'sync/migrations/0001_eon_sync_basic.sql',
    'sync/wrangler.sync.example.toml',
    'platform-backend/contracts/eon-sync-basic-foundation.v1.json',
    'scripts/deploy-arweave.mjs',
    'scripts/deploy-ipfs-ipns.mjs',
    'scripts/ipfsLootGatewayClient.js',
    'scripts/w390-w391-collection-relay-gate.mjs',
    'scripts/w391d-relay-tracking-prep-gate.mjs',
    'scripts/w411-sync-basic-foundation-gate.mjs',
    'scripts/w412-sync-basic-transport-gate.mjs',
    'scripts/w415-final-source-readiness-gate.mjs',
    'scripts/w433-sync-basic-merge-recovery-gate.mjs',
    'scripts/w458a-sync-basic-status-proof-gate.mjs',
    'scripts/w458a-sync-basic-status-proof.mjs',
    'config/w390-w391-collection-relay-contract.mjs',
    'config/w391d-relay-tracking-contract.mjs',
    'config/w411-sync-basic-foundation-contract.mjs',
    'config/w412-sync-basic-transport-contract.mjs',
    'config/w415-final-source-readiness-contract.mjs',
    'config/w433-sync-basic-merge-recovery-contract.mjs',
    'config/w458a-sync-basic-status-proof-contract.mjs',
    'tests/unit/backend-client.test.js',
    'tests/unit/distributed-inference-v5.test.js',
    'tests/unit/ipfs-gateway.test.mjs',
    'tests/unit/p2p-nostr.test.js',
    'tests/unit/realmworld-export-rails.test.mjs',
    'tests/unit/realmworld-p2p.test.mjs',
    'tests/unit/w390-w391-collection-relay.test.mjs',
    'tests/unit/w391d-relay-tracking-prep.test.mjs',
    'tests/unit/w411-sync-basic-foundation.test.mjs',
    'tests/unit/w412-sync-basic-transport.test.mjs',
    'tests/unit/w415-final-source-readiness.test.mjs',
    'tests/unit/w433-sync-basic-merge-recovery.test.mjs',
    'tests/unit/w458a-sync-basic-status-proof.test.mjs',
    'tests/e2e/nostr-swap-registry.spec.ts',
    'e2e/flows.spec.js',
  ]);

export const W519_FAMILY_INVENTORY = Object.freeze([
  Object.freeze({ id: 'sync-d1-scaffolding', classification: 'future-quarantine', match: /(?:eon-sync|sync-basic|functions\/api\/sync|sync\/migrations)/i }),
  Object.freeze({ id: 'relay-and-attribution', classification: 'future-quarantine', match: /(?:eon-relay|functions\/api\/relay|relay\/migrations)/i }),
  Object.freeze({ id: 'p2p-nostr-gun-webrtc', classification: 'future-quarantine', match: /(?:p2p|nostr|distributed-inference|backend-client|bounty-board)/i }),
  Object.freeze({ id: 'ipfs-arweave-permanence', classification: 'future-quarantine', match: /(?:ipfs|arweave)/i }),
  Object.freeze({ id: 'hardware-control', classification: 'future-quarantine', match: /(?:iot-control)/i }),
  Object.freeze({ id: 'historical-records', classification: 'retired', match: /^(?:docs|EVIDENCE|NEXT_CHAT|CANONICAL_HANDOVER|release-evidence)\// }),
]);

export const W519_ACTIVE_ENTRYPOINTS = Object.freeze([
  'index.html', 'chat.html', 'assets/js/eon-workspace-pages.js', 'assets/js/creator-studio-addons-deferred.js',
  'assets/js/device/eon-device-check.js', 'assets/js/local-first/eon-workspace-capsule.js', 'sw.js', 'public/sw.js'
]);

export const W519_ACTIVE_DENYLIST = Object.freeze([
  'eon-relay-pilot', 'eon-sync-trigger', 'eon-offline-sync', '/api/relay/', '/api/sync/',
  'distributed-inference-integration', 'p2p-nostr', 'ipfs-gateway', 'arweave-upload', 'iot-control-hub'
]);

export const W519_BUILD_DENYLIST = Object.freeze([
  'eon-relay-pilot', 'eon-sync-basic', '/api/relay/', '/api/sync/', 'eon-sync-trigger',
  'distributed-inference-integration', 'p2p-nostr', 'ipfs-gateway', 'arweave-upload', 'iot-control-hub',
  'navigator.bluetooth', 'navigator.usb', 'wss://'
]);

// W659G Live Voice uses one explicit-user-action WebRTC call through the
// paired loopback-only EON Local Bridge. This is an audio provider session,
// not the retired peer-to-peer relay/sync transport family quarantined by W519.
export const W519_APPROVED_WEBRTC_SOURCE_PATHS = Object.freeze([
  'assets/js/chat/eon-live-voice-realtime.js'
]);

export const W519_RETIRED_PACKAGE_SCRIPTS = Object.freeze([
  'qa:w390-w391-collection-relay', 'qa:w391d-relay-tracking-prep', 'qa:w411-sync-basic-foundation',
  'qa:w412-sync-basic-transport', 'qa:w415-final-source-readiness', 'qa:w433-sync-basic-merge-recovery',
  'qa:w458a-sync-basic-status-proof'
]);

export function validateW519LegacyTransportQuarantineContract(contract = {
  schema: W519_LEGACY_TRANSPORT_QUARANTINE_SCHEMA, active: W519_ACTIVE_INVENTORY, quarantined: W519_QUARANTINED_SOURCE_PATHS
}) {
  const errors = [];
  if (contract?.schema !== W519_LEGACY_TRANSPORT_QUARANTINE_SCHEMA) errors.push('schema-invalid');
  if (!Array.isArray(contract?.active) || !contract.active.some((entry) => entry.classification === 'active')) errors.push('active-inventory-missing');
  if (!Array.isArray(contract?.quarantined) || contract.quarantined.length < 70) errors.push('quarantine-inventory-incomplete');
  const seen = new Set();
  for (const relative of contract?.quarantined || []) {
    if (!relative || seen.has(relative)) errors.push(`quarantine-path-invalid:${relative || 'missing'}`);
    seen.add(relative);
  }
  return Object.freeze(errors);
}
