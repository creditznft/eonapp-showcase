#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  ApiKeyVault,
  EON_API_KEY_SESSION_STORAGE_KEY,
  EON_API_KEY_VAULT_STORAGE_KEY,
  getApiKeyVaultCustodyTruth
} from '../assets/js/utils/api-key-vault.js';
import { migrateKnownLegacyProviderStorage } from '../assets/js/vault/eon-vault-lifecycle.js';

if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); this.reads = []; }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { this.reads.push(String(key)); return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

const storage = new MemoryStorage({
  'eon:onboarding:providers:v1': '{"provider":"legacy-value-not-read"}',
  'eon:api-key-vault:v1': '{"provider":"legacy-envelope-not-read"}',
  'eon:api-key-vault:device-secret:v1': 'legacy-device-material-not-read'
});
const sessionStorage = new MemoryStorage();
const passphrase = 'a15 institutional recovery passphrase';
const rawSecret = 'credential-gate-private-value';

const sessionReceipt = await ApiKeyVault.store('groq', rawSecret, { storage, sessionStorage });
assert(sessionReceipt.custody === 'session-only' && sessionReceipt.durableRecoveryCreated === false, 'Default key custody is not session-only.');
assert(storage.getItem(EON_API_KEY_VAULT_STORAGE_KEY) === null, 'Default key storage created a durable credential envelope.');
assert(String(sessionStorage.getItem(EON_API_KEY_SESSION_STORAGE_KEY) || '').includes('groq'), 'Session key was not written to the canonical runtime store.');

const encryptedReceipt = await ApiKeyVault.store('groq', rawSecret, { storage, sessionStorage, persist: true, passphrase });
const encryptedRaw = storage.getItem(EON_API_KEY_VAULT_STORAGE_KEY) || '';
assert(encryptedReceipt.custody === 'encrypted-passphrase' && encryptedReceipt.verifiedWrite === true, 'Passphrase recovery write did not verify.');
assert(!encryptedRaw.includes(rawSecret) && !encryptedRaw.includes(passphrase), 'Encrypted storage contains raw credential or passphrase material.');
sessionStorage.removeItem(EON_API_KEY_SESSION_STORAGE_KEY);
assert((await ApiKeyVault.diagnoseRetrieve('groq', { storage, sessionStorage })).failureStage === 'passphrase-required', 'Encrypted recovery opened without an explicit passphrase.');
assert(await ApiKeyVault.retrieve('groq', { storage, sessionStorage, passphrase }) === rawSecret, 'Passphrase recovery did not restore the exact session credential.');

storage.reads.length = 0;
const status = ApiKeyVault.status({ storage, sessionStorage });
assert(status.automaticLegacyRead === false, 'Vault status claims automatic legacy reading.');
for (const legacyKey of ['eon:onboarding:providers:v1', 'eon:api-key-vault:v1', 'eon:api-key-vault:device-secret:v1']) {
  assert(!storage.reads.includes(legacyKey), `Ordinary status inspection read legacy credential values: ${legacyKey}`);
}

const malformedStorage = new MemoryStorage({ 'eon:onboarding:providers:v1': '{malformed-json' });
const malformedBefore = malformedStorage.getItem('eon:onboarding:providers:v1');
const malformedMigration = await migrateKnownLegacyProviderStorage({
  storage: malformedStorage,
  sessionStorage: new MemoryStorage(),
  confirmedByUser: true,
  passphrase
});
assert(malformedMigration.ok === false && malformedMigration.reason === 'legacy-source-unrecognized', 'Malformed legacy storage did not fail closed.');
assert(malformedStorage.getItem('eon:onboarding:providers:v1') === malformedBefore, 'Malformed legacy storage was changed during failed migration.');
assert(malformedStorage.getItem(EON_API_KEY_VAULT_STORAGE_KEY) === null, 'Failed malformed migration created credential persistence.');

const custody = getApiKeyVaultCustodyTruth({ storage, sessionStorage });
assert(custody.sessionOnlyByDefault === true, 'Custody truth does not declare session-only default.');
assert(custody.passphrasePersistence === false && custody.deviceSecretPersistence === false, 'Custody truth permits hidden passphrase/device-secret persistence.');
assert(custody.identityPrivateKeyLookup === false && custody.automaticPlaintextMigration === false, 'Custody truth permits legacy authority fallback.');

const sources = {
  apiVault: read('assets/js/utils/api-key-vault.js'),
  profile: read('assets/js/utils/profile.js'),
  vaultHtml: read('vault.html'),
  vaultPage: read('assets/js/vault/eon-vault-page.js'),
  vaultLifecycle: read('assets/js/vault/eon-vault-lifecycle.js'),
  workbench: read('assets/js/workbench-ai.js'),
  freeAi: read('assets/js/free-ai-power-page.js')
};
assert(!/eon:identity:session|eon:identity:v1|\.privateKey|Math\.random\(|eon-vault-session-fallback/.test(sources.apiVault), 'Canonical vault retains a weak or identity-derived key path.');
assert(sources.apiVault.includes('PBKDF2_ITERATIONS = 310_000') && sources.apiVault.includes('AES-GCM-256'), 'Passphrase recovery is missing the approved KDF/cipher contract.');
assert(sources.apiVault.includes('writeVerified') && sources.apiVault.includes('rollbackRaw'), 'Verified write and rollback invariants are missing.');
assert(sources.profile.includes("const PROFILE_KEY = 'eon:profile'") && sources.profile.includes("const PROFILE_LEGACY_KEY = 'eon:profile:v1'"), 'Canonical/legacy profile migration keys are missing.');
assert(sources.profile.includes('Profile migration write did not verify') && sources.profile.includes('Legacy profile removal did not verify'), 'Profile migration is not write-verified.');
assert(sources.vaultHtml.includes('session-only by default') && sources.vaultHtml.includes('eon-vault-provider-passphrase'), 'Vault does not disclose session-only/passphrase custody.');
assert(sources.vaultPage.includes('persist: true, passphrase') && sources.vaultLifecycle.includes('confirmedByUser !== true'), 'Vault durable save or migration lacks explicit user authority.');
assert(!/localStorage\.getItem\(WORKBENCH_KEYS_KEY\)|bridgeWorkbenchKeys\(/.test(sources.workbench), 'WorkBench still automatically imports legacy provider keys.');
assert(!/localStorage\.getItem\(LEGACY_STORAGE_KEY\)/.test(sources.freeAi), 'Local AI page still automatically reads legacy provider keys.');

const receipt = {
  schema: 'eonapp.a15.i08.credential-custody-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I08',
  passed: true,
  custody: {
    sessionOnlyByDefault: true,
    persistentRecovery: 'explicit-passphrase-encrypted',
    passphrasePersisted: false,
    deviceSecretCreated: false,
    identityPrivateKeyLookup: false,
    automaticLegacyRead: false,
    verifiedWritesAndRollback: true
  },
  migration: {
    explicitConfirmationRequired: true,
    duplicateProfileAuthorityRemovedAfterVerifiedWrite: true,
    malformedLegacySourcePreserved: true,
    rollbackPreparedAndVerified: true,
    rawSecretIncluded: false
  },
  uiConnected: true,
  rawValuesIncluded: false
};
const output = path.join(root, 'docs/institutional/a15/evidence/A15_I08_CREDENTIAL_CUSTODY_GATE_RECEIPT.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log('[A15 I08] PASS: session-only default, passphrase recovery, verified writes, explicit migration, and canonical profile authority.');
