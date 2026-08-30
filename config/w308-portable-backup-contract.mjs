/** W308 source contract — encrypted, user-created portable recovery only. */
export const W308_PORTABLE_BACKUP_CONTRACT = Object.freeze({
  schema: 'eonapp.w308.portable-backup-contract.v1',
  requiredFiles: Object.freeze([
    'assets/js/local-first/local-vault-db-schema.js',
    'assets/js/local-first/eon-local-vault-metadata-store.js',
    'assets/js/local-first/eon-portable-backup.js',
    'assets/js/local-first/eon-encrypted-record-store.js'
  ]),
  forbiddenPatterns: Object.freeze([
    'localStorage.',
    'sessionStorage.',
    'fetch(',
    'XMLHttpRequest',
    'WebSocket',
    'exportKey('
  ]),
  requiredTruth: Object.freeze({
    encryptedEnvelopesOnly: true,
    passphrasePersistence: false,
    directNetwork: false,
    importRequiresExplicitUserConfirmation: true,
    destructiveOverwrite: false,
    automaticCloudSync: false
  })
});
