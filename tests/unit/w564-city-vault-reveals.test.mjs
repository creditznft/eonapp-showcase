import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_VAULT_REVEALS_SCHEMA,
  EON_CITY_VAULT_REVEALS_STORAGE_KEY,
  applyEonCityVaultReveal,
  clearEonCityVaultRevealInventory,
  createEonCityVaultRevealInventory,
  getEonCitySelectedCompanionSkinId,
  getEonCityVaultRevealCatalogue,
  getEonCityVaultRevealTruth,
  normalizeEonCityVaultRevealInventory,
  prepareEonCityVaultReveal,
  readEonCityVaultRevealInventory
} from '../../assets/js/contracts/city/eon-city-vault-reveals.js';
import { collectLocalEncryptedExportRecords, restoreLocalEncryptedExportPayload } from '../../assets/js/local-first/eon-local-encrypted-export.js';
import { collectEonAppOwnedStorage, isEonAppBackupEligibleKey } from '../../assets/js/vault/eon-vault-lifecycle.js';
import { W145_PROTECTED_STORAGE_GROUPS } from '../../assets/js/utils/update-safe-user-data.js';
import { inspectW564CityVaultReveals } from '../../scripts/w564-city-vault-reveals-gate.mjs';

function memoryStorage(seed = {}) {
  const records = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return {
    get length() { return records.size; },
    key(index) { return [...records.keys()][index] || null; },
    getItem(key) { return records.has(String(key)) ? records.get(String(key)) : null; },
    setItem(key, value) { records.set(String(key), String(value)); },
    removeItem(key) { records.delete(String(key)); },
    toObject() { return Object.fromEntries(records.entries()); }
  };
}

test('W564 exposes exact, visual-only companion styles in the Free City core without chance or commercial claims', () => {
  const catalogue = getEonCityVaultRevealCatalogue();
  assert.deepEqual(catalogue.map((item) => item.id), ['command-orbit', 'signal-mist', 'forge-prism']);
  for (const item of catalogue) {
    assert.equal(item.visualOnly, true);
    assert.equal(item.includedInFreeCore, true);
    assert.equal(item.deterministicReveal, true);
    assert.equal(item.randomChance, false);
    assert.equal(item.rarityClaimed, false);
    assert.equal(item.commercialEntitlementRequired, false);
    assert.equal(item.subscriptionBenefitClaimed, false);
    assert.equal(item.transferable, false);
    assert.equal(item.ownershipClaimed, false);
    assert.equal(item.marketListingCreated, false);
    assert.equal(item.walletOrTokenCreated, false);
  }
  const inventory = createEonCityVaultRevealInventory({ now: 1719878400000 });
  assert.equal(inventory.schema, EON_CITY_VAULT_REVEALS_SCHEMA);
  assert.equal(inventory.selectedCosmeticId, 'command-orbit');
  assert.deepEqual(inventory.reviewedCosmeticIds, []);
  assert.equal(inventory.localOnly, true);
  assert.equal(inventory.automaticCrossDeviceSync, false);
  const truth = getEonCityVaultRevealTruth();
  assert.equal(truth.deterministicReveals, true);
  assert.equal(truth.randomChance, false);
  assert.equal(truth.paidUnlockCreated, false);
  assert.equal(truth.subscriptionEntitlementChecked, false);
  assert.equal(truth.commercialOfferShown, false);
  assert.equal(truth.nftCreated, false);
  assert.equal(truth.walletOrTokenCreated, false);
});

test('W564 requires an explicit exact-result review before saving a local selection', () => {
  const storage = memoryStorage();
  assert.equal(prepareEonCityVaultReveal('signal-mist').error, 'explicit-user-action-required');
  const prepared = prepareEonCityVaultReveal('signal-mist', { explicitUserAction: true });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.reveal.cosmetic.id, 'signal-mist');
  assert.equal(prepared.reveal.confirmationRequired, true);
  assert.equal(prepared.reveal.exactResultVisibleBeforeConfirmation, true);
  assert.equal(prepared.reveal.randomChance, false);
  assert.equal(prepared.reveal.paidUnlockCreated, false);
  assert.equal(applyEonCityVaultReveal('signal-mist', { storage }).error, 'explicit-user-action-required');

  const selected = applyEonCityVaultReveal('signal-mist', { explicitUserAction: true, storage, now: 1719878400000 });
  assert.equal(selected.ok, true);
  assert.equal(selected.cosmetic.id, 'signal-mist');
  assert.equal(selected.localOnly, true);
  assert.equal(selected.networkRequestCreated, false);
  assert.equal(selected.automaticCrossDeviceSync, false);
  assert.equal(selected.subscriptionEntitlementChecked, false);
  assert.equal(getEonCitySelectedCompanionSkinId({ storage }), 'signal-mist');
  assert.equal(readEonCityVaultRevealInventory({ storage }).stored, true);

  const persisted = JSON.parse(storage.getItem(EON_CITY_VAULT_REVEALS_STORAGE_KEY));
  assert.deepEqual(Object.keys(persisted).sort(), [
    'automaticCrossDeviceSync',
    'commercialEntitlementRequired',
    'localOnly',
    'marketListingCreated',
    'ownershipClaimed',
    'randomChance',
    'rarityClaimed',
    'reviewedCosmeticIds',
    'schema',
    'selectedCosmeticId',
    'subscriptionBenefitClaimed',
    'transferable',
    'updatedAt',
    'version',
    'walletOrTokenCreated'
  ].sort());
  assert.equal(JSON.stringify(persisted).includes('prompt'), false);
  assert.equal(JSON.stringify(persisted).includes('private-project'), false);
});

test('W564 normalizes tampered stored data and rejects unknown or foreign cosmetic fields', () => {
  const normalized = normalizeEonCityVaultRevealInventory({
    schema: EON_CITY_VAULT_REVEALS_SCHEMA,
    version: 999,
    updatedAt: '2026-07-03T00:00:00.000Z',
    selectedCosmeticId: 'forge-prism',
    reviewedCosmeticIds: ['forge-prism', 'fake-skin', 'signal-mist', 'forge-prism'],
    prompt: 'private prompt must not survive',
    privateProject: 'private-project-77',
    providerCredential: 'credential-value',
    wallet: 'wallet-value',
    token: 'token-value',
    rarity: 'legendary',
    paid: true
  }, { now: 1719878400000 });
  assert.equal(normalized.selectedCosmeticId, 'forge-prism');
  assert.deepEqual(normalized.reviewedCosmeticIds, ['forge-prism', 'signal-mist']);
  const text = JSON.stringify(normalized);
  for (const forbidden of ['private prompt', 'private-project-77', 'credential-value', 'wallet-value', 'token-value', 'legendary']) {
    assert.equal(text.includes(forbidden), false);
  }
  assert.equal(normalized.randomChance, false);
  assert.equal(normalized.rarityClaimed, false);
  assert.equal(normalizeEonCityVaultRevealInventory({ schema: 'wrong' }), null);

  const storage = memoryStorage({ [EON_CITY_VAULT_REVEALS_STORAGE_KEY]: JSON.stringify(normalized) });
  assert.equal(clearEonCityVaultRevealInventory({ storage }).error, 'explicit-user-action-required');
  assert.equal(clearEonCityVaultRevealInventory({ storage, explicitUserAction: true }).ok, true);
  assert.equal(storage.getItem(EON_CITY_VAULT_REVEALS_STORAGE_KEY), null);
});

test('W564 preserves only the normalized visual preference through encrypted export, Vault backup, restore, and W145 registration', () => {
  const storage = memoryStorage({
    [EON_CITY_VAULT_REVEALS_STORAGE_KEY]: JSON.stringify({
      schema: EON_CITY_VAULT_REVEALS_SCHEMA,
      version: 1,
      updatedAt: '2026-07-03T00:00:00.000Z',
      selectedCosmeticId: 'signal-mist',
      reviewedCosmeticIds: ['signal-mist'],
      prompt: 'private prompt',
      rawTask: 'private task',
      projectId: 'private-project',
      wallet: 'wallet-value',
      secret: 'secret-value'
    })
  });
  assert.equal(isEonAppBackupEligibleKey(EON_CITY_VAULT_REVEALS_STORAGE_KEY), true);

  const localRecords = collectLocalEncryptedExportRecords({ storage });
  const exported = localRecords.find((record) => record.key === EON_CITY_VAULT_REVEALS_STORAGE_KEY);
  assert.ok(exported);
  assert.equal(exported.value.selectedCosmeticId, 'signal-mist');
  assert.equal(JSON.stringify(exported.value).includes('private prompt'), false);
  assert.equal(JSON.stringify(exported.value).includes('wallet-value'), false);

  const vaultSnapshot = collectEonAppOwnedStorage({ storage });
  assert.ok(vaultSnapshot[EON_CITY_VAULT_REVEALS_STORAGE_KEY]);
  assert.equal(vaultSnapshot[EON_CITY_VAULT_REVEALS_STORAGE_KEY].includes('private task'), false);
  assert.equal(vaultSnapshot[EON_CITY_VAULT_REVEALS_STORAGE_KEY].includes('secret-value'), false);

  const target = memoryStorage();
  const restored = restoreLocalEncryptedExportPayload({ records: localRecords }, { storage: target });
  assert.equal(restored.ok, true);
  assert.equal(getEonCitySelectedCompanionSkinId({ storage: target }), 'signal-mist');
  assert.equal(W145_PROTECTED_STORAGE_GROUPS.find((group) => group.id === 'city-preview-work-loop')?.keys.includes(EON_CITY_VAULT_REVEALS_STORAGE_KEY), true);
});

test('W564 source gate remains fail-closed about chance, commercial claims, private inputs, and unreviewed storage', () => {
  const report = inspectW564CityVaultReveals();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 36);
});
