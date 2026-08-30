#!/usr/bin/env node
/** W637 source-only persistence, migration, backup and recovery gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT,
  validateW637PersistenceMigrationRecoveryContract
} from '../config/w637-persistence-migration-recovery-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

function sourceChecks() {
  const contract = validateW637PersistenceMigrationRecoveryContract();
  const localVaultSchema = read('assets/js/local-first/local-vault-db-schema.js');
  const encryptedStore = read('assets/js/local-first/eon-encrypted-record-store.js');
  const portableBackup = read('assets/js/local-first/eon-portable-backup.js');
  const capsule = read('assets/js/local-first/eon-workspace-capsule.js');
  const drive = read('assets/js/local-first/eon-google-drive-snapshot-connector.js');
  const vault = read('assets/js/vault/eon-vault-lifecycle.js');
  const creator = read('assets/js/create/creator-library-store.js');
  const shareIdentity = read('assets/js/utils/share-link-identity.js');
  const quantum = read('assets/js/utils/quantum-safe-keys.js');
  const offline = read('assets/js/utils/offline-storage.js');
  const inventory = W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.indexedDb;
  const inventoryMatches = inventory.every((entry) => {
    const source = entry.database === 'eonapp-local-vault-v1' ? localVaultSchema
      : entry.database === 'eonapp-creator-media-v1' ? creator
        : entry.database === 'eon-share-identity' ? shareIdentity
          : entry.database === 'eonapp-quantum-safe' ? quantum
            : offline;
    return source.includes(entry.database) && source.includes(String(entry.version)) && entry.stores.every((store) => source.includes(store));
  });

  return freeze([
    freeze({ id: 'contract', pass: contract.ok, detail: 'canonical W637 contract' }),
    freeze({ id: 'indexeddb-inventory', pass: inventoryMatches, detail: `${inventory.length} known browser databases` }),
    freeze({ id: 'local-vault-version', pass: /EON_LOCAL_VAULT_DATABASE_VERSION = 2/.test(localVaultSchema) && /ensureLocalVaultObjectStores/.test(localVaultSchema), detail: 'versioned idempotent local-vault stores' }),
    freeze({ id: 'atomic-idb-restore', pass: /putManyIfAbsent/.test(encryptedStore) && /store\.add\(copy\)/.test(encryptedStore) && /transaction\.abort/.test(encryptedStore) && /atomic-restore-conflict/.test(encryptedStore), detail: 'single add-only IndexedDB transaction' }),
    freeze({ id: 'restore-preview', pass: /inspectEncryptedPortableBackupImport/.test(portableBackup) && /reviewedPreviewId/.test(portableBackup) && /reviewed-preview-required/.test(portableBackup), detail: 'reviewed digest-bound preview before write' }),
    freeze({ id: 'conflict-no-write', pass: /if \(preview\.conflicts\.length\)/.test(portableBackup) && /record-conflict-no-overwrite/.test(portableBackup) && /const additions = preview\.adds/.test(portableBackup), detail: 'all conflicts resolved before mutation' }),
    freeze({ id: 'post-write-verification', pass: /post-restore-verification-failed/.test(portableBackup) && /envelopeSame\(stored, envelope\)/.test(portableBackup), detail: 'every imported envelope reread and verified' }),
    freeze({ id: 'post-write-failure-truth', pass: /committed-verification-failed/.test(portableBackup) && /recoveryRequired: true/.test(portableBackup) && /recordsMayHaveBeenWritten/.test(portableBackup), detail: 'committed bytes are never mislabeled as an aborted restore' }),
    freeze({ id: 'integrity-truth', pass: /transport-corruption-detection-not-authenticity/.test(portableBackup), detail: 'SHA digest is not misrepresented as authenticity' }),
    freeze({ id: 'capsule-staging', pass: /local-state-changed-reinspect-required/.test(capsule) && /EON_WORKSPACE_CAPSULE_CONFIRMATION/.test(capsule), detail: 'stage drift and exact confirmation fences' }),
    freeze({ id: 'capsule-journal', pass: /createJournal/.test(capsule) && /restoreExact/.test(capsule) && /atomic-commit-failed-rolled-back/.test(capsule) && /verifyReceipt/.test(capsule), detail: 'encrypted rollback journal and receipt' }),
    freeze({ id: 'capsule-versioning', pass: /EON_WORKSPACE_CAPSULE_VERSION = 2/.test(capsule) && /EON_WORKSPACE_CAPSULE_SUPPORTED_VERSIONS/.test(capsule) && /versions: EON_WORKSPACE_CAPSULE_SUPPORTED_VERSIONS/.test(capsule), detail: 'known versions only' }),
    freeze({ id: 'portable-scope', pass: /isPortableBackupIncludedKey/.test(vault) && /BACKUP_KEY_SENSITIVE_RE/.test(vault) && /unrelated same-origin storage/.test(vault), detail: 'owned allowlist only; secrets and foreign keys preserved' }),
    freeze({ id: 'creator-media-boundary', pass: /mediaPortableInCapsule: false/.test(creator) && /rawMediaInGenericCapsule: false/.test(creator) && /explicitUserAction/.test(creator), detail: 'raw media explicit and nonportable' }),
    freeze({ id: 'drive-consent', pass: /explicit-encrypted-snapshot-not-sync/.test(drive) && /tokenStorage: 'memory-only'/.test(drive) && /automaticUpload: false/.test(drive) && /automaticRestore: false/.test(drive), detail: 'Drive is explicit snapshot, never background sync' }),
    freeze({ id: 'drive-scope', pass: /EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE/.test(drive) && /include_granted_scopes: false/.test(drive) && /prompt: 'consent'/.test(drive), detail: 'separate narrow consent' }),
    freeze({ id: 'production-fence', pass: W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.productionCertified === false, detail: 'real device/Drive/recovery evidence pending' }),
    freeze({ id: 'files', pass: ['config/w637-persistence-migration-recovery-contract.mjs', 'config/w637-persistence-migration-recovery-contract.json', 'tests/unit/w637-persistence-migration-recovery.test.mjs'].every(exists), detail: 'contract and maintained test set' })
  ]);
}

export function inspectW637PersistenceMigrationRecovery({ writeArtifact = false } = {}) {
  const checks = sourceChecks();
  const result = freeze({
    schema: 'eonapp.gate.w637.persistence-migration-recovery.2026-07-11.v1',
    wave: 'W637',
    ok: checks.every((row) => row.pass),
    total: checks.length,
    passed: checks.filter((row) => row.pass).length,
    checks,
    productionCertified: false,
    inventory: W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.indexedDb,
    limitations: W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.externalEvidenceRequired
  });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts/w637-persistence-migration-recovery');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'source-receipt.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const result = inspectW637PersistenceMigrationRecovery({ writeArtifact: true });
  for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id} — ${check.detail}`);
  console.log(`\nW637 persistence/migration/recovery source gate: ${result.passed}/${result.total}`);
  if (!result.ok) process.exitCode = 1;
}
