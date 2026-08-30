/**
 * EONAPP W196 — Vault security truth and safe local-device diagnostics.
 *
 * This module deliberately reports only key names and state. It never reads,
 * renders, exports, or transmits raw API keys, recovery phrases, wallet data,
 * or exchange credentials.
 */
import { ApiKeyVault } from '../utils/api-key-vault.js';
import { getEonPwaState } from '../eon-pwa-manager.js';
import { getVaultAccountBoundary, getVaultMigrationState } from './eon-vault-lifecycle.js';

export const EON_VAULT_SECURITY_SCHEMA = 'eon.vault.security-truth.v1';

const SENSITIVE_KEY_RE = /(api[-_:]?key|secret|token|password|mnemonic|seed|private[-_:]?key|exchange|wallet)/i;
const LEGACY_PLAINTEXT_KEY_RE = /^(eon:onboarding:providers:v1|eon:(?:api|provider)[-_:]?(?:keys?|credentials?):v\d+)$/i;
const SAFE_STORAGE_KEYS = new Set([
  'eon:api-key-vault:v2',
  'eon:api-key-vault:v1',
  'eon:api-key-vault:salt:v1',
  'eon:api-key-vault:device-secret:v1',
  'eon:trading-lab:w104:v1',
  'eon:vault:migration-receipt:v1',
  'eon:vault:restore-receipt:v2',
  'eon:vault:clear-receipt:v1'
]);

function safeStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function listKeyNames(storage = null) {
  const target = safeStorage(storage);
  if (!target || typeof target.length !== 'number') return [];
  const names = [];
  for (let index = 0; index < target.length; index += 1) names.push(String(target.key(index) || ''));
  return names.filter(Boolean).sort();
}

/** Returns a names-only audit. Values are intentionally never read. */
export function inspectVaultStorageNames(options = {}) {
  const names = listKeyNames(options.storage);
  const legacyPlaintextCandidates = names.filter((key) => LEGACY_PLAINTEXT_KEY_RE.test(key));
  const sensitiveNamedRecords = names.filter((key) => SENSITIVE_KEY_RE.test(key));
  const encryptedVaultRecords = names.filter((key) => SAFE_STORAGE_KEYS.has(key));
  return {
    schema: EON_VAULT_SECURITY_SCHEMA,
    inspectedAt: new Date().toISOString(),
    storageAvailable: Boolean(safeStorage(options.storage)),
    totalNamedRecords: names.length,
    encryptedVaultRecords,
    sensitiveNamedRecordCount: sensitiveNamedRecords.length,
    legacyPlaintextCandidateKeys: legacyPlaintextCandidates,
    valuesRead: false,
    crossDeviceSync: false
  };
}

export function getVaultSecurityTruth(options = {}) {
  const apiVault = typeof ApiKeyVault?.status === 'function'
    ? ApiKeyVault.status({ storage: options.storage, sessionStorage: options.sessionStorage })
    : { hasEncryptedEntries: false, providers: [], plaintextStorageDisabled: false };
  const storage = inspectVaultStorageNames(options);
  const pwa = getEonPwaState({ storage: options.storage });
  const migration = getVaultMigrationState({ storage: options.storage });
  const boundary = getVaultAccountBoundary({ storage: options.storage });
  const legacyWarning = storage.legacyPlaintextCandidateKeys.length > 0 || migration.pendingLegacySourceCount > 0;
  return {
    schema: EON_VAULT_SECURITY_SCHEMA,
    apiVault: {
      encryptedEntries: apiVault.hasEncryptedEntries === true,
      providerNames: Array.isArray(apiVault.encryptedProviders) ? apiVault.encryptedProviders.slice(0, 24) : [],
      plaintextStorageDisabled: apiVault.plaintextStorageDisabled === true,
      passphraseEncryptedRecovery: Array.isArray(apiVault.encryptedProviders) && apiVault.encryptedProviders.length > 0,
      sessionOnlyByDefault: apiVault.sessionOnlyByDefault === true,
      passphrasePersisted: apiVault.passphrasePersisted === true,
      deviceBoundEncryption: false,
      legacyIdentityDecryptFallback: false
    },
    storage,
    migration,
    accountBoundary: boundary,
    pwa: {
      sync: pwa.sync,
      crossDeviceSync: false,
      standalone: pwa.standalone === true
    },
    notices: [
      'EONAPP does not display raw API keys, seed phrases, passwords, wallet recovery material, or exchange credentials in this dashboard.',
      'Provider keys are session-only by default. Optional browser recovery requires a separate passphrase that EONAPP never stores.',
      'Cross-device sync is not active. Back up only through an explicit encrypted export when you understand the recovery process.',
      'Google Login does not grant Google Drive access. The planned Drive backup connector will require its own explicit permission and will never export API keys or recovery material.',
      boundary.restoreRule,
      migration.recommendedAction
    ],
    needsLegacyReview: legacyWarning,
    legacyReviewMessage: legacyWarning
      ? 'A legacy provider-storage source was found. Use the secure migration before relying on this browser as a long-term secret store.'
      : 'No known legacy plaintext provider-storage source was found in this browser profile.'
  };
}

export function createSafeVaultBackupSummary() {
  const apiVault = ApiKeyVault.status();
  return {
    schema: 'eon.vault.safe-backup-summary.v1',
    exportedAt: new Date().toISOString(),
    includesRawSecrets: false,
    includesDeviceRecoverySecret: false,
    encryptedProviderEntryCount: Array.isArray(apiVault.encryptedProviders) ? apiVault.encryptedProviders.length : 0,
    note: 'This summary does not include raw keys or a device recovery secret. Full encrypted export remains an explicit advanced action.'
  };
}
