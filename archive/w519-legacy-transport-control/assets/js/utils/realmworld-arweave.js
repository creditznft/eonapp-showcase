import { buildRealmWorldArweaveManifest } from './realmworld-generator.js';

export const REALMWORLD_BUNDLE_SCHEMA = 'eon.realmworld.storage-bundle.v1';

function byteSize(value = {}) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function safeSlug(value = '') {
  return String(value || 'realm')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'realm';
}

export function validateRealmWorldSnapshotForPublicExport(snapshot = {}) {
  const errors = [];
  const warnings = [];
  if (!snapshot || typeof snapshot !== 'object') errors.push('Missing snapshot object.');
  if (snapshot.schema !== 'eon.realmworld.snapshot.v1') errors.push('Unsupported snapshot schema.');
  if (snapshot.safety?.chat !== false) errors.push('Public snapshot must disable chat.');
  if (snapshot.safety?.uploads !== false) errors.push('Public snapshot must disable uploads.');
  if (Number(snapshot.safety?.maxPeers || 0) > 4) errors.push('Public ghost visits must allow at most 4 peers.');
  if (snapshot.renderer?.cloudflareWorkerRequired) errors.push('RealmWorld export must not require a Cloudflare Worker.');
  if (snapshot.renderer?.centralGameServerRequired) errors.push('RealmWorld export must not require a central game server.');
  if (!Array.isArray(snapshot.monuments) || snapshot.monuments.length === 0) warnings.push('Snapshot has no monuments.');
  if (!Array.isArray(snapshot.portals) || snapshot.portals.length === 0) warnings.push('Snapshot has no portals.');
  const size = byteSize(snapshot);
  if (size > 450000) warnings.push('Snapshot is large; keep public bundles lightweight for mobile visitors.');
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    byteSize: size,
    maxRecommendedBytes: 450000
  };
}

export function buildRealmWorldStorageBundle(snapshot = {}, options = {}) {
  const username = safeSlug(snapshot.owner?.username || snapshot.id || 'realm');
  const validation = validateRealmWorldSnapshotForPublicExport(snapshot);
  const manifest = buildRealmWorldArweaveManifest(snapshot);
  return {
    schema: REALMWORLD_BUNDLE_SCHEMA,
    createdAt: options.now || new Date().toISOString(),
    realmId: snapshot.id || username,
    realmType: snapshot.realmType || 'personal-local-realm',
    storageRail: snapshot.officialRealm ? 'bundled-app-release' : 'arweave-export-ready',
    uploadPerformedHere: false,
    requiresCloudflareWorker: false,
    requiresCentralGameServer: false,
    validation,
    files: [
      {
        path: manifest.path || `realms/${username}/realmworld.snapshot.json`,
        contentType: 'application/json',
        bytes: validation.byteSize,
        role: 'realm-snapshot'
      },
      {
        path: `realms/${username}/README.txt`,
        contentType: 'text/plain',
        bytes: 220,
        role: 'human-instructions'
      }
    ],
    tags: manifest.tags,
    snapshot
  };
}

export function buildRealmWorldExportChecklist(snapshot = {}) {
  const validation = validateRealmWorldSnapshotForPublicExport(snapshot);
  return {
    schema: 'eon.realmworld.export-checklist.v1',
    okToExport: validation.ok,
    steps: [
      { id: 'validate-safety', label: 'Validate no chat, no uploads, max 4 ghost peers', done: validation.errors.length === 0 },
      { id: 'download-json', label: 'Download snapshot JSON from this browser', done: false },
      { id: 'upload-arweave', label: 'Upload snapshot/media bundle to Arweave or Irys outside the game runtime', done: false },
      { id: 'copy-txid', label: 'Copy permanent transaction ID into NFT/land metadata', done: false },
      { id: 'test-gateway', label: 'Open the gateway URL on mobile and verify no server polling', done: false }
    ],
    validation,
    note: snapshot.officialRealm
      ? 'EON City is bundled in the app and does not need Arweave. This checklist is mainly for personal/public user realms.'
      : 'This is an export plan only. The browser game does not upload automatically or call a backend.'
  };
}
