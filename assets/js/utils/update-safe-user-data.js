/**
 * update-safe-user-data.js — W145 Cloudflare update-safe user-data survival proof.
 *
 * Cloudflare Pages deployments replace app files, service-worker caches, and build
 * metadata. They must never wipe user-owned browser state. This module keeps a
 * single registry of protected EONAPP localStorage/IndexedDB domains, builds a
 * redacted manifest, and proves an app-version update preserves NFTs, Vault
 * records, AI API-key vault material, receipts, settings, and private app data.
 */

export const W145_UPDATE_SURVIVAL_SCHEMA = 'eonapp.w145.update-safe-user-data-survival.v1';
export const W145_UPDATE_SURVIVAL_RECEIPT_KEY = 'eon:update-survival-proof:v1';

export const W145_PROTECTED_STORAGE_GROUPS = Object.freeze([
  Object.freeze({
    id: 'ai-api-keys',
    label: 'AI API-key vault',
    required: true,
    secret: true,
    keys: Object.freeze([
      // Current encrypted BYOK Vault. Keep the v1 names below only to preserve
      // existing encrypted records through the safe migration path.
      'eon:api-key-vault:v2',
      'eon:api-key-vault:v1',
      'eon:api-key-vault:salt:v1',
      'eon:api-key-vault:device-secret:v1',
      'eon:workbench:provider-state:v2',
      'eon:ai-provider-health:v1'
    ])
  }),
  Object.freeze({
    id: 'nfts-market-vault',
    label: 'Generated NFTs, Market receipts, and Vault inventory',
    required: true,
    secret: false,
    keys: Object.freeze([
      'eon:market:user-nft-drops:v1',
      'eon:market:starter-vault-receipts:v1',
      'eon:nft-collection:v3',
      'eon:nft:collection:v1',
      'eon:vault:persistence-proof:v1'
    ])
  }),
  Object.freeze({
    id: 'vault-backup-security',
    label: 'Vault backup, restore, and encrypted credentials',
    required: true,
    secret: true,
    keys: Object.freeze([
      'eon:vault:credentials:v1',
      'eon:vault:salt:v1',
      'eon:vault-restore-attempts:v1',
      'eon:vault:recovery-state:v1',
      'eon:vault-backup-last-ipfs:v1'
    ])
  }),
  Object.freeze({
    id: 'collection-visual-records',
    label: 'Collection visual-eligibility records',
    required: true,
    secret: false,
    keys: Object.freeze([
      'eon:collection:eligibility:v1'
    ])
  }),
  Object.freeze({
    id: 'pwa-update-recovery',
    label: 'PWA profile, launch, and update-review records',
    required: true,
    secret: false,
    keys: Object.freeze([
      'eon:pwa:profile-state:v1',
      'eon:pwa:last-launch:v1',
      'eon:pwa:rollout-review:v1',
      'eon:pwa:recovery-rehearsal:v1'
    ])
  }),
  Object.freeze({
    id: 'identity-settings',
    label: 'Profile, realm identity, settings, onboarding, and language',
    required: true,
    secret: false,
    keys: Object.freeze([
      'eon:profile',
      'eon:realm:profile:v2',
      'eon:realm:state:v3',
      // W235 stores only a non-sensitive disabled-program acknowledgement; it is not a capability, credit or entitlement record.
      'eon:access-milestones:preferences:v1',
      'eon:settings:v1',
      'eon:notification-center:v1',
      'eon:connector-consent:v1',
      'eon:lang:preference:v1',
      'eon:lang:v1',
      'eon:onboarding:completed:v1',
      'eon:onboarding:complete:v1'
    ])
  }),
  Object.freeze({
    id: 'chat-projects-workspace',
    label: 'Chat, Projects, Library, Workspace, and EONBOT local records',
    required: true,
    secret: false,
    keys: Object.freeze([
      'eon:chat:threads:v1',
      'eon:chat:active-thread:v1',
      'eon:chat:history:v2',
      'eon:projects:v3',
      'eon:library:v3',
      'eon:artifact-index:v2',
      'eon:eonbot:action-proposals:v1',
      'eon:eonbot:action-receipts:v1',
      'eon:eonbot:vault-return-context:v1',
      'eon:eonbot:job-fabric:v1',
      'eon:collaboration-invites:v1',
      'eon:action-gateway:review-pilot:v1'
    ])
  }),
  Object.freeze({
    id: 'city-preview-work-loop',
    label: 'City state, flagship progress, work missions, preferences, and local preview evidence',
    required: true,
    secret: false,
    keys: Object.freeze([
      'eon:city:world-state:v1',
      // W559: bounded local City pose and public landmark id only; no work context.
      'eon:city:world-state:resume:v1',
      // Canonical Expanse/open-world and progression authorities.
      'eon:city:expanse:w766a:state:v1',
      'eon:city:progression:w659g:v1',
      'eon:city:missions:w737:v2',
      'eon:city:productive-rpg:w624g:v1',
      'eon:city:productive-stations:w751:v1',
      'eon:city:progress-receipts:a15:v1',
      // RT91 flagship session contains only sanitized mission/objective/opaque receipt ids.
      'eon:city:living-frontier-session:rt91:v1',
      // Agent Theatre stores bounded receipt metadata only; the EONBOT job fabric is
      // already protected in chat-projects-workspace and must not be duplicated here.
      'eon:city:genuine-agent-theatre:w624i:v1',
      // Living Nexus continuity is user-visible City history rather than cache state.
      'eon:city:living-nexus:w660p:v1',
      'eon:city:living-nexus:encounters:w660s:v1',
      'eon:city:command-district:v1',
      'eon:city:command-hub:resume:w731:v1',
      'eon:city:3d:local-proof:v1',
      'eon:city:3d:preferences:v1',
      'eon:city:accessibility-device:w624k:v1',
      'eon:city:sensory-preferences:v1',
      'eon:city:quality-preference:v1',
      'eon:city:first-run:w479:v1',
      'eon:city:adaptive-soundscape:v1',
      'eon:city:prepared-actions:v1',
      'eon:city:work-missions:v1',
      'eon:city:preview-evidence:w259:v1',
      'eon:city:project-districts:v1',
      // W564: exact visual-only EONBOT style preference; no entitlement, payment, account, or private Vault content.
      'eon:city:cosmetics:v1'
    ])
  }),
  Object.freeze({
    id: 'automation-workstation',
    label: 'Automation OS, workstation, browser, and device preferences',
    required: true,
    secret: false,
    keys: Object.freeze([
      'eon:automation-os:v3',
      'eon:browser:history:v1',
      'eon:browser:tabs:v1',
      'eon:realm3d:mission-progress:v2',
      'eon:realm3d:audio-preferences:v1'
    ])
  }),
  Object.freeze({
    id: 'legacy-value-preservation',
    label: 'Legacy value-system records preserved if present (retired; never an active entitlement or release prerequisite)',
    required: false,
    legacy: true,
    secret: false,
    keys: Object.freeze([
      'eon:entitlements:v1',
      'eon:pool-points:v1',
      'eon:reward-access:v1',
      'eon:share-attribution:v1',
      'eon:community-trigger:v1'
    ])
  })
]);

export const W145_INDEXEDDB_PROTECTED_DATABASES = Object.freeze([
  Object.freeze({ name: 'eonapp-local-vault-v1', purpose: 'encrypted local-vault envelopes and non-secret KDF metadata' }),
  Object.freeze({ name: 'eonapp-creator-media-v1', purpose: 'optional local Creator media blobs' }),
  Object.freeze({ name: 'eon-share-identity', purpose: 'non-extractable signed-share identity' }),
  Object.freeze({ name: 'eon-offline-db', purpose: 'bounded offline KV, queue and cache metadata' }),
  Object.freeze({ name: 'eonapp-quantum-safe', purpose: 'legacy encrypted provider-key compatibility store' })
]);

export const W145_DEPLOYMENT_INVARIANTS = Object.freeze({
  cloudflarePagesRule: 'A new deployment may replace static assets and service-worker caches, but must not clear localStorage or IndexedDB.',
  noBootClear: true,
  noVersionKeyRewriteOfUserData: true,
  noSecretManifestValues: true,
  backupBeforeRiskyMigration: true,
  preserveAllObservedAppOwnedKeys: true,
  localSimulationIsNotExternalReleaseEvidence: true,
  appOwnedPrefix: 'eon:',
  allowedUpdateWrites: Object.freeze([
    'eon:app-version:v1',
    W145_UPDATE_SURVIVAL_RECEIPT_KEY
  ])
});

export const W145_REMAINING_PHASES_AFTER_COMPLETION = Object.freeze([
  Object.freeze({ id: 'W143', title: 'Legal/billing/trust/support final copy', status: 'pending', focus: 'Final public trust wording across billing, support, legal, refund, privacy, and wallet-risk surfaces.' }),
  Object.freeze({ id: 'W144', title: 'Final enterprise certification', status: 'pending', focus: 'One release-candidate gate that proves routes, build, copy, persistence, and support surfaces.' }),
  Object.freeze({ id: 'W146', title: 'EON City high-end AAA graphics expansion', status: 'recommended-extra', focus: 'Ultra/Neon desktop-only lighting, hero NPC skins, richer district architecture, photo-mode screenshots, and cinematic depth without hurting mobile.' }),
  Object.freeze({ id: 'W147', title: 'EON City NPC voice/proximity/social pass', status: 'recommended-extra', focus: 'NPC proximity voice, speech bubbles, route guidance, station work loops, and safer owner/visitor privacy boundaries.' }),
  Object.freeze({ id: 'W148', title: 'EON City all-device visual proof lab', status: 'recommended-extra', focus: 'Screenshot and performance proof for low mobile, mid laptop, high desktop, and reduced-motion modes.' })
]);

const SECRET_KEY_RE = /api-key|device-secret|credential|password|salt|token|jwt|private|secret/i;

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const item of Object.values(value)) freezeDeep(item);
  return value;
}

function safeString(value = '') {
  if (value == null) return '';
  return String(value);
}

function fingerprint(value = '') {
  const text = safeString(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function storageToMap(storage = globalThis.localStorage) {
  const map = {};
  if (!storage) return map;
  if (typeof storage === 'object' && typeof storage.getItem !== 'function') return { ...storage };
  try {
    for (let index = 0; index < Number(storage.length || 0); index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      map[key] = storage.getItem(key);
    }
  } catch {
    // Storage may be blocked in some privacy modes. Return best effort.
  }
  return map;
}

function readFromStorage(storage, key) {
  if (!storage) return null;
  if (typeof storage.getItem === 'function') {
    try { return storage.getItem(key); } catch { return null; }
  }
  return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
}

function writeToStorage(storage, key, value) {
  if (!storage) return;
  if (typeof storage.setItem === 'function') {
    try { storage.setItem(key, String(value)); } catch {}
    return;
  }
  storage[key] = String(value);
}

function hasStorageKey(map, key) {
  return Object.prototype.hasOwnProperty.call(map, key);
}

function classifyKey(key, groupSecret = false) {
  return groupSecret || SECRET_KEY_RE.test(key) ? 'secret-redacted' : 'user-data-redacted';
}

function rowForKey(map, key, group) {
  const present = hasStorageKey(map, key);
  const raw = present ? safeString(map[key]) : '';
  return Object.freeze({
    key,
    groupId: group.id,
    present,
    required: Boolean(group.required),
    secret: Boolean(group.secret || SECRET_KEY_RE.test(key)),
    classification: classifyKey(key, group.secret),
    bytes: raw.length,
    fingerprint: present ? fingerprint(raw) : null
  });
}

const W145_UNCLASSIFIED_APP_OWNED_GROUP = Object.freeze({
  id: 'unclassified-app-owned',
  label: 'Observed app-owned key not yet classified in the explicit registry',
  required: true,
  legacy: false,
  secret: false,
  keys: Object.freeze([])
});

function knownGroupForKey(key) {
  return W145_PROTECTED_STORAGE_GROUPS.find((group) => group.keys.includes(key)) || null;
}

function collectProtectedRows(map) {
  return W145_PROTECTED_STORAGE_GROUPS.flatMap((group) => group.keys.map((key) => rowForKey(map, key, group)));
}

function collectTrackedRows(map) {
  const rows = collectProtectedRows(map);
  const knownKeys = new Set(rows.map((row) => row.key));
  const observedDynamicRows = Object.keys(map)
    .filter((key) => key.startsWith(W145_DEPLOYMENT_INVARIANTS.appOwnedPrefix) && !knownKeys.has(key))
    .sort()
    .map((key) => rowForKey(map, key, knownGroupForKey(key) || W145_UNCLASSIFIED_APP_OWNED_GROUP));
  return [...rows, ...observedDynamicRows];
}

function groupRows(rows) {
  return W145_PROTECTED_STORAGE_GROUPS.map((group) => {
    const groupKeySet = new Set(group.keys);
    const ownRows = rows.filter((row) => groupKeySet.has(row.key));
    const presentRows = ownRows.filter((row) => row.present);
    return Object.freeze({
      id: group.id,
      label: group.label,
      required: Boolean(group.required),
      secret: Boolean(group.secret),
      keyCount: ownRows.length,
      presentCount: presentRows.length,
      missingKeys: ownRows.filter((row) => !row.present).map((row) => row.key),
      presentKeys: presentRows.map((row) => row.key),
      totalBytes: presentRows.reduce((sum, row) => sum + Number(row.bytes || 0), 0),
      ok: true
    });
  });
}

export function summarizeW145ProtectedStorage(storage = globalThis.localStorage) {
  const map = storageToMap(storage);
  const rows = collectProtectedRows(map);
  const trackedRows = collectTrackedRows(map);
  const groups = groupRows(rows);
  const appOwnedKeys = Object.keys(map).filter((key) => key.startsWith(W145_DEPLOYMENT_INVARIANTS.appOwnedPrefix));
  const unclassifiedAppOwnedRows = trackedRows.filter((row) => row.groupId === W145_UNCLASSIFIED_APP_OWNED_GROUP.id && row.present);
  return freezeDeep({
    schema: `${W145_UPDATE_SURVIVAL_SCHEMA}.storage-summary`,
    checkedAt: new Date().toISOString(),
    storageKeyCount: Object.keys(map).length,
    appOwnedKeyCount: appOwnedKeys.length,
    explicitProtectedKeyCount: rows.length,
    protectedKeyCount: trackedRows.length,
    protectedKeysPresent: trackedRows.filter((row) => row.present).length,
    unclassifiedAppOwnedKeyCount: unclassifiedAppOwnedRows.length,
    unclassifiedAppOwnedKeys: unclassifiedAppOwnedRows.map((row) => row.key),
    groups,
    rows,
    trackedRows,
    indexedDbProtected: W145_INDEXEDDB_PROTECTED_DATABASES,
    invariants: W145_DEPLOYMENT_INVARIANTS,
    ok: groups.every((group) => group.ok)
  });
}

export function buildW145UpdateSurvivalManifest(beforeStorage = {}, afterStorage = beforeStorage, options = {}) {
  const beforeMap = storageToMap(beforeStorage);
  const afterMap = storageToMap(afterStorage);
  const beforeRows = collectTrackedRows(beforeMap);
  const afterRows = collectTrackedRows(afterMap);
  const afterByKey = new Map(afterRows.map((row) => [row.key, row]));
  const presentBefore = beforeRows.filter((row) => row.present);
  const comparisonRows = presentBefore.map((beforeRow) => {
    const afterRow = afterByKey.get(beforeRow.key) || rowForKey(afterMap, beforeRow.key, { id: beforeRow.groupId, required: true, secret: beforeRow.secret, keys: [beforeRow.key] });
    const byteExact = afterRow.present && afterRow.bytes === beforeRow.bytes && afterRow.fingerprint === beforeRow.fingerprint;
    return Object.freeze({
      key: beforeRow.key,
      groupId: beforeRow.groupId,
      secret: beforeRow.secret,
      presentBefore: beforeRow.present,
      presentAfter: afterRow.present,
      bytesBefore: beforeRow.bytes,
      bytesAfter: afterRow.bytes,
      fingerprintBefore: beforeRow.fingerprint,
      fingerprintAfter: afterRow.fingerprint,
      byteExact
    });
  });
  const preservedRows = comparisonRows.filter((row) => row.byteExact);
  const lostRows = comparisonRows.filter((row) => !row.presentAfter);
  const changedRows = comparisonRows.filter((row) => row.presentAfter && !row.byteExact);
  const allowedWrites = new Set(W145_DEPLOYMENT_INVARIANTS.allowedUpdateWrites);
  const newAppKeys = Object.keys(afterMap).filter((key) => key.startsWith('eon:') && !hasStorageKey(beforeMap, key));
  const unexpectedNewAppKeys = newAppKeys.filter((key) => !allowedWrites.has(key));
  const groupSummaries = W145_PROTECTED_STORAGE_GROUPS.map((group) => {
    const own = comparisonRows.filter((row) => row.groupId === group.id);
    return Object.freeze({
      id: group.id,
      label: group.label,
      totalSeededKeys: own.length,
      preservedKeys: own.filter((row) => row.byteExact).length,
      lostKeys: own.filter((row) => !row.presentAfter).map((row) => row.key),
      changedKeys: own.filter((row) => row.presentAfter && !row.byteExact).map((row) => row.key),
      ok: own.every((row) => row.byteExact)
    });
  });
  const unclassifiedRows = comparisonRows.filter((row) => row.groupId === W145_UNCLASSIFIED_APP_OWNED_GROUP.id);
  const unclassifiedSummary = Object.freeze({
    id: W145_UNCLASSIFIED_APP_OWNED_GROUP.id,
    totalObservedKeys: unclassifiedRows.length,
    preservedKeys: unclassifiedRows.filter((row) => row.byteExact).length,
    lostKeys: unclassifiedRows.filter((row) => !row.presentAfter).map((row) => row.key),
    changedKeys: unclassifiedRows.filter((row) => row.presentAfter && !row.byteExact).map((row) => row.key),
    ok: unclassifiedRows.every((row) => row.byteExact)
  });
  const afterSummary = summarizeW145ProtectedStorage(afterMap);
  const ok = Boolean(
    comparisonRows.length === presentBefore.length
    && lostRows.length === 0
    && changedRows.length === 0
    && unexpectedNewAppKeys.length === 0
    && afterSummary.ok
  );
  return freezeDeep({
    schema: W145_UPDATE_SURVIVAL_SCHEMA,
    proofVersion: 'w145-cloudflare-update-safe-user-data-survival',
    evidenceScope: 'local-simulated-storage-transition',
    externalDeploymentEvidence: false,
    checkedAt: options.checkedAt || new Date().toISOString(),
    simulatedFrom: String(options.simulatedFrom || 'previous-cloudflare-build').slice(0, 80),
    simulatedTo: String(options.simulatedTo || 'next-cloudflare-build').slice(0, 80),
    reason: String(options.reason || 'cloudflare-update-survival-proof').slice(0, 100),
    deploymentInvariants: W145_DEPLOYMENT_INVARIANTS,
    before: {
      storageKeyCount: Object.keys(beforeMap).length,
      protectedKeysPresent: presentBefore.length,
      appOwnedKeyCount: Object.keys(beforeMap).filter((key) => key.startsWith('eon:')).length
    },
    after: {
      storageKeyCount: Object.keys(afterMap).length,
      protectedKeysPresent: afterRows.filter((row) => row.present).length,
      appOwnedKeyCount: Object.keys(afterMap).filter((key) => key.startsWith('eon:')).length
    },
    groupSummaries,
    unclassifiedSummary,
    comparisonRows,
    preservedKeyCount: preservedRows.length,
    lostKeys: lostRows.map((row) => row.key),
    changedKeys: changedRows.map((row) => row.key),
    newAppKeys,
    unexpectedNewAppKeys,
    indexedDbPolicy: {
      protectedDatabases: W145_INDEXEDDB_PROTECTED_DATABASES,
      deleteDatabaseForbiddenDuringUpdate: true,
      migrationRequiresBackupFirst: true
    },
    secretsRedacted: comparisonRows.every((row) => row.secret ? !safeString(row.fingerprintBefore).includes('proof_secret') : true),
    afterSummary,
    ok
  });
}

export function assertW145UpdateSurvivalManifest(manifest) {
  if (!manifest || manifest.schema !== W145_UPDATE_SURVIVAL_SCHEMA) {
    throw new Error('Invalid W145 update-safe user-data survival manifest');
  }
  if (!manifest.ok) {
    throw new Error('W145 update-safe user-data survival failed: protected user data was lost or changed');
  }
  return manifest;
}

export function seedW145ProofStorage(storage = globalThis.localStorage, options = {}) {
  const prefix = String(options.prefix || 'w145-proof');
  const seeded = {};
  for (const group of W145_PROTECTED_STORAGE_GROUPS) {
    group.keys.forEach((key, index) => {
      const value = group.secret
        ? `${prefix}:encrypted-secret-placeholder:${group.id}:${index}:ciphertext-not-plain`
        : JSON.stringify({ schema: `${W145_UPDATE_SURVIVAL_SCHEMA}.seed`, group: group.id, key, index, value: `${prefix}-${index}` });
      writeToStorage(storage, key, value);
      seeded[key] = value;
    });
  }
  return freezeDeep({ schema: `${W145_UPDATE_SURVIVAL_SCHEMA}.seed`, seededKeyCount: Object.keys(seeded).length, seededKeys: Object.keys(seeded) });
}

export function simulateCloudflareAppUpdate(storage = globalThis.localStorage, options = {}) {
  const before = storageToMap(storage);
  writeToStorage(storage, 'eon:app-version:v1', String(options.nextVersion || 'w145-simulated-cloudflare-update'));
  const after = storageToMap(storage);
  return buildW145UpdateSurvivalManifest(before, after, {
    reason: options.reason || 'simulated-cloudflare-pages-update',
    simulatedFrom: options.previousVersion || 'w141-npc-device-quality',
    simulatedTo: options.nextVersion || 'w145-update-survival-proof'
  });
}

export function recordW145UpdateSurvivalReceipt(storage = globalThis.localStorage, options = {}) {
  const manifest = options.manifest || simulateCloudflareAppUpdate(storage, options);
  assertW145UpdateSurvivalManifest(manifest);
  const receipt = {
    schema: W145_UPDATE_SURVIVAL_SCHEMA,
    type: 'cloudflare-update-survival-receipt',
    recordedAt: new Date().toISOString(),
    ok: manifest.ok,
    preservedKeyCount: manifest.preservedKeyCount,
    protectedGroupCount: W145_PROTECTED_STORAGE_GROUPS.length,
    evidenceScope: manifest.evidenceScope,
    externalDeploymentEvidence: false,
    simulatedFrom: manifest.simulatedFrom,
    simulatedTo: manifest.simulatedTo,
    manifest
  };
  writeToStorage(storage, W145_UPDATE_SURVIVAL_RECEIPT_KEY, JSON.stringify(receipt));
  return freezeDeep(receipt);
}

export function getW145UpdateSurvivalStatus(storage = globalThis.localStorage) {
  const summary = summarizeW145ProtectedStorage(storage);
  let receipt = null;
  try {
    receipt = JSON.parse(readFromStorage(storage, W145_UPDATE_SURVIVAL_RECEIPT_KEY) || 'null');
  } catch {
    receipt = null;
  }
  const validReceipt = receipt && receipt.schema === W145_UPDATE_SURVIVAL_SCHEMA ? receipt : null;
  return freezeDeep({
    ...summary,
    receipt: validReceipt,
    done: Boolean(validReceipt?.ok),
    externalDeploymentEvidence: false,
    label: validReceipt?.ok
      ? `${Number(validReceipt.preservedKeyCount || 0)} protected keys survived local simulation; real update/rollback evidence is still required`
      : `${summary.protectedKeysPresent} protected keys detected; run export/restore/update proof`
  });
}

export function getW145RemainingPhaseSummary() {
  return freezeDeep({
    schema: `${W145_UPDATE_SURVIVAL_SCHEMA}.remaining-phases`,
    generatedAt: new Date().toISOString(),
    dataSurvivalDone: true,
    dataSurvivalLocalStaticDone: true,
    dataSurvivalExternalEvidenceRequired: true,
    dataSurvivalReleaseReady: false,
    completedPhase: 'W145',
    phases: W145_REMAINING_PHASES_AFTER_COMPLETION
  });
}

export default {
  W145_UPDATE_SURVIVAL_SCHEMA,
  W145_UPDATE_SURVIVAL_RECEIPT_KEY,
  W145_PROTECTED_STORAGE_GROUPS,
  W145_INDEXEDDB_PROTECTED_DATABASES,
  W145_DEPLOYMENT_INVARIANTS,
  W145_REMAINING_PHASES_AFTER_COMPLETION,
  W145_UNCLASSIFIED_APP_OWNED_GROUP,
  summarizeW145ProtectedStorage,
  buildW145UpdateSurvivalManifest,
  assertW145UpdateSurvivalManifest,
  seedW145ProofStorage,
  simulateCloudflareAppUpdate,
  recordW145UpdateSurvivalReceipt,
  getW145UpdateSurvivalStatus,
  getW145RemainingPhaseSummary
};
