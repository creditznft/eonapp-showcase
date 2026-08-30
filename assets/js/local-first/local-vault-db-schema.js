/**
 * W308 — shared IndexedDB schema for the local vault.
 *
 * The database stores encrypted envelopes plus a tiny non-secret profile
 * (salt + algorithm metadata). It never stores passphrases, CryptoKeys,
 * plaintext workspace records, accounts, or any remote endpoint state.
 */

export const EON_LOCAL_VAULT_DATABASE_NAME = 'eonapp-local-vault-v1';
export const EON_LOCAL_VAULT_DATABASE_VERSION = 2;
export const EON_LOCAL_VAULT_ENCRYPTED_RECORDS_STORE = 'encrypted-records';
export const EON_LOCAL_VAULT_METADATA_STORE = 'vault-metadata';

export function ensureLocalVaultObjectStores(database) {
  if (!database?.objectStoreNames?.contains) throw new Error('Local vault database upgrade target is invalid.');
  if (!database.objectStoreNames.contains(EON_LOCAL_VAULT_ENCRYPTED_RECORDS_STORE)) {
    database.createObjectStore(EON_LOCAL_VAULT_ENCRYPTED_RECORDS_STORE, { keyPath: 'recordId' });
  }
  if (!database.objectStoreNames.contains(EON_LOCAL_VAULT_METADATA_STORE)) {
    database.createObjectStore(EON_LOCAL_VAULT_METADATA_STORE, { keyPath: 'id' });
  }
}

export function getLocalVaultDbSchemaTruth() {
  return Object.freeze({
    database: EON_LOCAL_VAULT_DATABASE_NAME,
    version: EON_LOCAL_VAULT_DATABASE_VERSION,
    encryptedRecordsOnly: true,
    metadataIsNonSecret: true,
    directNetwork: false,
    localStorage: false,
    passphrasePersistence: false,
    keyPersistence: false
  });
}
