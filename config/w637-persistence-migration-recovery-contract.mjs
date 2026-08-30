/** W637 — source-only persistence, migration, backup and recovery contract. */
const freeze = (value) => Object.freeze(value);

export const W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT = freeze({
  schema: 'eonapp.persistence-migration-recovery.w637.v1',
  wave: 'W637',
  sourceCertified: true,
  productionCertified: false,
  localStorage: freeze({
    ownerRule: 'only EONAPP-owned keys are managed',
    portableRule: 'only W476 allowlisted non-secret workspace keys enter an encrypted Capsule',
    excluded: freeze(['provider credentials', 'OAuth/session state', 'wallet/payment state', 'signed referral/reward state', 'raw creator media', 'unknown same-origin keys']),
    updateRule: 'static deployments never clear localStorage or IndexedDB'
  }),
  indexedDb: freeze([
    freeze({ database: 'eonapp-local-vault-v1', version: 2, stores: freeze(['encrypted-records', 'vault-metadata']), owner: 'encrypted local vault', portable: 'encrypted-envelope backup only', deleteMode: 'explicit local action' }),
    freeze({ database: 'eonapp-creator-media-v1', version: 1, stores: freeze(['media']), owner: 'explicitly saved Creator media', portable: 'excluded from generic Capsule', deleteMode: 'explicit asset deletion' }),
    freeze({ database: 'eon-share-identity', version: 1, stores: freeze(['keys']), owner: 'local signing identity', portable: 'excluded', deleteMode: 'local identity lifecycle' }),
    freeze({ database: 'eon-offline-db', version: 2, stores: freeze(['kv', 'queue', 'offline-cache']), owner: 'TTL local cache and review-first queue', portable: 'excluded unless separately allowlisted', deleteMode: 'expiry or explicit local action' }),
    freeze({ database: 'eonapp-quantum-safe', version: 1, stores: freeze(['eon:quantum:v1']), owner: 'encrypted provider-key compatibility store', portable: 'excluded', deleteMode: 'credential lifecycle' })
  ]),
  migrations: freeze({
    localVault: freeze({ currentVersion: 2, supportedFrom: freeze([0, 1, 2]), upgradeTransaction: 'IndexedDB versionchange transaction', forwardVersionRule: 'fail closed' }),
    workspaceCapsule: freeze({ currentVersion: 2, readableVersions: freeze([1, 2]), unknownVersionRule: 'reject before staging' }),
    portableBackup: freeze({ currentVersion: 1, readableVersions: freeze([1]), unknownVersionRule: 'reject before inspection' })
  }),
  restore: freeze({
    inspectBeforeWrite: true,
    reviewedPreviewIdRequired: true,
    localDriftRequiresReinspection: true,
    defaultMerge: 'add-only',
    overwrite: false,
    indexedDbMode: 'single add-only transaction',
    capsuleMode: 'encrypted rollback journal plus integrity receipt',
    interruptedRestore: 'rollback-only unless a verified receipt proves commit',
    postWriteVerification: true,
    postVerificationFailureTruth: 'committed-verification-failed requires recovery'
  }),
  drive: freeze({
    mode: 'explicit encrypted snapshot, not sync',
    scope: 'drive.file',
    accessTokenStorage: 'memory-only',
    automaticUpload: false,
    automaticRestore: false,
    automaticCrossDeviceSync: false
  }),
  integrityTruth: freeze({
    portableBackupDigest: 'transport corruption detection, not authenticity',
    capsule: 'AES-GCM authenticated encryption plus canonical envelope digest',
    plaintextSecretExport: false
  }),
  externalEvidenceRequired: freeze([
    'real browser update and rollback data-survival rehearsal',
    'real corrupted IndexedDB and quota-pressure recovery evidence',
    'real interrupted Capsule restore and recovery evidence',
    'real Google Drive consent upload list download inspect restore and revoke evidence',
    'real cross-device recovery with separate browser profiles',
    'owner verification that deletion and revocation remove only intended records'
  ])
});

export function validateW637PersistenceMigrationRecoveryContract(value = W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT) {
  const databases = Array.isArray(value?.indexedDb) ? value.indexedDb : [];
  const checks = freeze({
    schema: value?.schema === 'eonapp.persistence-migration-recovery.w637.v1',
    sourceCertified: value?.sourceCertified === true,
    productionFence: value?.productionCertified === false,
    inventory: databases.length === 5 && new Set(databases.map((entry) => entry.database)).size === databases.length,
    versions: databases.every((entry) => Number.isInteger(entry.version) && entry.version > 0 && Array.isArray(entry.stores) && entry.stores.length > 0),
    restore: value?.restore?.inspectBeforeWrite === true && value?.restore?.reviewedPreviewIdRequired === true && value?.restore?.overwrite === false && value?.restore?.postWriteVerification === true && /requires recovery/.test(String(value?.restore?.postVerificationFailureTruth || '')),
    driveFence: value?.drive?.accessTokenStorage === 'memory-only' && value?.drive?.automaticUpload === false && value?.drive?.automaticRestore === false && value?.drive?.automaticCrossDeviceSync === false,
    integrityTruth: value?.integrityTruth?.plaintextSecretExport === false && /not authenticity/.test(String(value?.integrityTruth?.portableBackupDigest || '')),
    evidenceFence: Array.isArray(value?.externalEvidenceRequired) && value.externalEvidenceRequired.length >= 6
  });
  return freeze({ ok: Object.values(checks).every(Boolean), checks });
}

export const W637_INDEXEDDB_INVENTORY = freeze(
  W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.indexedDb.map((entry) => freeze({
    name: entry.database,
    version: entry.version,
    stores: entry.stores,
    owner: entry.owner,
    portable: entry.portable,
    deleteMode: entry.deleteMode
  }))
);

export function getW637PersistenceRecoveryTruth() {
  const validation = validateW637PersistenceMigrationRecoveryContract();
  return freeze({
    schema: W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.schema,
    wave: W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.wave,
    sourceCertified: validation.ok,
    productionCertified: false,
    indexedDbInventory: W637_INDEXEDDB_INVENTORY,
    restore: W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.restore,
    drive: W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.drive,
    externalEvidenceRequired: W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.externalEvidenceRequired
  });
}

