// Public-safe example: local-first Vault direction, not production keystore code.
export function buildVaultStoragePolicy({ encrypted, hasBackup }) {
  return {
    secretStorage: 'device-local-first',
    encrypted: Boolean(encrypted),
    backupRecommendation: hasBackup
      ? 'verify-restore-on-second-device'
      : 'create-encrypted-export-before-upgrade',
    serverCustody: 'not-default'
  };
}
