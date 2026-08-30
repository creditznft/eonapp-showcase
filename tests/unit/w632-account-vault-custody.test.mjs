import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildW632CustodySummary,
  evaluateAccountVaultSeparation,
  findForbiddenWalletLanguage,
  loadW632CustodyState,
  prepareRecoveryReview,
  prepareSessionAction,
  registerCredentialMetadata,
  validateW632AccountVaultContract
} from '../../assets/js/account/eon-account-vault-custody.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key), map };
}

test('W632 validates the account and Vault custody source contract', () => {
  const report = validateW632AccountVaultContract();
  assert.equal(report.ok, true);
  assert.equal(report.passed, 8);
});

test('W632 rejects credential values and accepts metadata only', () => {
  const storage = memoryStorage();
  const blocked = registerCredentialMetadata({ provider: 'fal', apiKey: 'secret' }, { storage });
  assert.equal(blocked.ok, false);
  const accepted = registerCredentialMetadata({ id: 'cred1', provider: 'fal', label: 'Creator key', custody: 'os-keychain', fingerprintSuffix: 'A1B2' }, { storage });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.metadata.secretIncluded, false);
  assert.equal(accepted.metadata.exportable, false);
});

test('W632 never treats identity as backup or automatic sync', () => {
  const truth = evaluateAccountVaultSeparation();
  assert.equal(truth.accountIdentityIsBackup, false);
  assert.equal(truth.automaticCrossDeviceSync, false);
  assert.equal(truth.localWorkDeletedOnLogout, false);
});

test('W632 logout and delete account actions are review-first preparations', () => {
  const storage = memoryStorage();
  assert.equal(prepareSessionAction('logout', { storage, explicitUserAction: true, confirmed: false }).ok, false);
  const prepared = prepareSessionAction('delete-account', { storage, explicitUserAction: true, confirmed: true });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.preparedOnly, true);
  assert.equal(prepared.serverRequestSent, false);
  assert.equal(prepared.localWorkDeleted, false);
});

test('W632 recovery starts with preview and never auto-restores', () => {
  const storage = memoryStorage();
  const result = prepareRecoveryReview({ backupId: 'backup_1', source: 'encrypted-capsule', stage: 'preview', conflictCount: 2 }, { storage, explicitUserAction: true });
  assert.equal(result.ok, true);
  assert.equal(result.restoreApplied, false);
  assert.equal(result.review.automaticRestore, false);
  assert.equal(result.review.destructiveWriteApplied, false);
});

test('W632 custody state persists metadata and recovery reviews separately', () => {
  const storage = memoryStorage();
  registerCredentialMetadata({ id: 'cred2', provider: 'replicate', custody: 'secure-companion' }, { storage });
  prepareRecoveryReview({ backupId: 'backup_2', source: 'local-export' }, { storage, explicitUserAction: true });
  const state = loadW632CustodyState({ storage });
  assert.equal(state.credentials.length, 1);
  assert.equal(state.recoveryReviews.length, 1);
  assert.equal(buildW632CustodySummary({ storage }).credentialMetadataCount, 1);
});

test('W632 identifies retired wallet language without interpreting it as a credential', () => {
  const matches = findForbiddenWalletLanguage('Connect wallet and pay gas fee');
  assert.deepEqual(matches, ['connect wallet', 'gas fee']);
});

test('W632 detects sensitive browser credential input shapes', () => {
  const truth = evaluateAccountVaultSeparation({ browserCredentialInput: { nested: { access_token: 'x' } } });
  assert.equal(truth.browserCredentialInputBlocked, true);
  assert.equal(truth.providerSecretReadableByUi, false);
});
