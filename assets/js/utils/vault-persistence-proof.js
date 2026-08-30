/**
 * vault-persistence-proof.js — W139 Vault persistence and backup proof layer.
 *
 * The Vault already exports browser-local state. W139 makes the critical Market →
 * Vault starter NFT path explicit: backup metadata now proves starter drops,
 * Vault v3 NFT copies, legacy NFT copies, and save receipts are included and
 * restore-visible after import.
 */

export const W139_VAULT_PERSISTENCE_SCHEMA = 'eonapp.w139.vault-persistence-proof.v1';
export const W139_VAULT_PERSISTENCE_RECEIPT_KEY = 'eon:vault:persistence-proof:v1';
export const W139_REQUIRED_PERSISTENCE_KEYS = Object.freeze([
  'eon:market:user-nft-drops:v1',
  'eon:market:starter-vault-receipts:v1',
  'eon:nft-collection:v3',
  'eon:nft:collection:v1'
]);

function safeParse(value, fallback = null) {
  try {
    if (value == null || value === '') return fallback;
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function storageToMap(storage = globalThis.localStorage) {
  const map = {};
  if (!storage) return map;

  // Vault snapshots pass a plain { key: rawString } object.
  if (typeof storage === 'object' && typeof storage.getItem !== 'function') {
    return { ...storage };
  }

  try {
    for (let index = 0; index < Number(storage.length || 0); index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      map[key] = storage.getItem(key);
    }
  } catch {
    // Ignore storage access failures; callers still receive a proof object.
  }
  return map;
}

function summarizeDrop(raw) {
  const drop = safeParse(raw, {});
  const items = Array.isArray(drop?.items) ? drop.items : [];
  const claimedIds = Array.isArray(drop?.claimedIds) ? drop.claimedIds : [];
  const visibleItems = items.filter((item) => item?.id && (item?.title || item?.name));
  return {
    present: Boolean(raw),
    version: String(drop?.version || ''),
    itemCount: items.length,
    claimedCount: claimedIds.length,
    visibleItemCount: visibleItems.length,
    ok: !raw || (items.length >= 1 && visibleItems.length === items.length)
  };
}

function summarizeReceipts(raw) {
  const receipts = safeParse(raw, []);
  const list = Array.isArray(receipts) ? receipts : [];
  const valid = list.filter((receipt) => receipt?.itemId && receipt?.title && receipt?.vaultRoute);
  return {
    present: Boolean(raw),
    receiptCount: list.length,
    validReceiptCount: valid.length,
    latestSavedAt: valid[0]?.savedAt || null,
    ok: !raw || valid.length === list.length
  };
}

function summarizeLegacyCollection(raw) {
  const collection = safeParse(raw, []);
  const list = Array.isArray(collection) ? collection : [];
  const visible = list.filter((item) => (item?.id || item?.nftId) && (item?.name || item?.title));
  return {
    present: Boolean(raw),
    itemCount: list.length,
    visibleItemCount: visible.length,
    ok: !raw || visible.length === list.length
  };
}

function summarizeV3Collection(raw) {
  const collection = safeParse(raw, {});
  const obj = collection && typeof collection === 'object' && !Array.isArray(collection) ? collection : {};
  const copies = Object.entries(obj).flatMap(([id, list]) => (
    Array.isArray(list)
      ? list.map((copy) => ({ ...(copy && typeof copy === 'object' ? copy : {}), id: copy?.id || copy?.nftId || id, nftId: copy?.nftId || id }))
      : []
  ));
  const visible = copies.filter((copy) => (copy.id || copy.nftId) && (copy.name || copy.title));
  const starterVisible = visible.filter((copy) => copy.source === 'market-starter-drop' || copy.metadata?.marketStarterVaultProof);
  return {
    present: Boolean(raw),
    uniqueItemCount: Object.keys(obj).length,
    copyCount: copies.length,
    visibleCopyCount: visible.length,
    starterVisibleCopyCount: starterVisible.length,
    ok: !raw || visible.length === copies.length
  };
}

function requiredKeyRows(map) {
  return W139_REQUIRED_PERSISTENCE_KEYS.map((key) => ({
    key,
    present: Object.prototype.hasOwnProperty.call(map, key),
    bytes: Object.prototype.hasOwnProperty.call(map, key) ? String(map[key] || '').length : 0
  }));
}

export function buildVaultPersistenceManifest(storage = globalThis.localStorage, options = {}) {
  const map = storageToMap(storage);
  const keyRows = requiredKeyRows(map);
  const drop = summarizeDrop(map['eon:market:user-nft-drops:v1']);
  const receipts = summarizeReceipts(map['eon:market:starter-vault-receipts:v1']);
  const v3 = summarizeV3Collection(map['eon:nft-collection:v3']);
  const legacy = summarizeLegacyCollection(map['eon:nft:collection:v1']);
  const hasSavedStarter = receipts.receiptCount > 0 || v3.starterVisibleCopyCount > 0 || legacy.itemCount > 0;
  const savedStarterCopiesProtected = !hasSavedStarter || (
    v3.visibleCopyCount >= v3.starterVisibleCopyCount
    && receipts.validReceiptCount === receipts.receiptCount
    && legacy.visibleItemCount === legacy.itemCount
  );
  const expectedClaimedSaved = Math.max(drop.claimedCount, receipts.receiptCount);
  const restoredClaimedCopies = Math.max(v3.starterVisibleCopyCount, legacy.visibleItemCount);

  return Object.freeze({
    schema: W139_VAULT_PERSISTENCE_SCHEMA,
    proofVersion: 'w139-vault-persistence-backup-proof',
    checkedAt: options.checkedAt || new Date().toISOString(),
    reason: String(options.reason || 'vault-persistence-check').slice(0, 80),
    requiredKeys: keyRows,
    storageKeyCount: Object.keys(map).length,
    starterDrop: drop,
    starterVaultReceipts: receipts,
    nftCollectionV3: v3,
    legacyNftCollection: legacy,
    expectedClaimedSaved,
    restoredClaimedCopies,
    backupCompleteness: Object.freeze({
      starterDropKeyPresent: drop.present,
      receiptsKeyPresentWhenClaimed: expectedClaimedSaved === 0 || receipts.present,
      v3CollectionPresentWhenClaimed: expectedClaimedSaved === 0 || v3.present,
      visibleSavedCopiesProtected: savedStarterCopiesProtected,
      claimedCopiesRecoverable: expectedClaimedSaved === 0 || restoredClaimedCopies >= expectedClaimedSaved,
      requiredKeysTracked: keyRows.every((row) => row.present || expectedClaimedSaved === 0 || row.key === 'eon:nft:collection:v1')
    }),
    ok: Boolean(
      drop.ok
      && receipts.ok
      && v3.ok
      && legacy.ok
      && savedStarterCopiesProtected
      && (expectedClaimedSaved === 0 || restoredClaimedCopies >= expectedClaimedSaved)
    )
  });
}

export function assertVaultPersistenceManifest(manifest) {
  if (!manifest || manifest.schema !== W139_VAULT_PERSISTENCE_SCHEMA) {
    throw new Error('Invalid W139 Vault persistence manifest');
  }
  if (!manifest.ok) {
    throw new Error('Vault persistence proof failed: starter NFTs or receipts are not restore-visible');
  }
  return manifest;
}

export function recordVaultPersistenceRestore(storage = globalThis.localStorage, options = {}) {
  const manifest = buildVaultPersistenceManifest(storage, { reason: options.reason || 'restore-complete' });
  const record = {
    schema: W139_VAULT_PERSISTENCE_SCHEMA,
    type: 'restore-receipt',
    restoredAt: new Date().toISOString(),
    ok: manifest.ok,
    starterDropCount: manifest.starterDrop.itemCount,
    receiptCount: manifest.starterVaultReceipts.receiptCount,
    visibleV3CopyCount: manifest.nftCollectionV3.visibleCopyCount,
    starterVisibleCopyCount: manifest.nftCollectionV3.starterVisibleCopyCount,
    manifest
  };
  try {
    storage?.setItem?.(W139_VAULT_PERSISTENCE_RECEIPT_KEY, JSON.stringify(record));
  } catch {}
  return record;
}

export function getVaultPersistenceStatus(storage = globalThis.localStorage) {
  const manifest = buildVaultPersistenceManifest(storage, { reason: 'status-panel' });
  const restoreReceipt = safeParse(storage?.getItem?.(W139_VAULT_PERSISTENCE_RECEIPT_KEY), null);
  return {
    ...manifest,
    restoreReceipt: restoreReceipt && restoreReceipt.schema === W139_VAULT_PERSISTENCE_SCHEMA ? restoreReceipt : null,
    label: manifest.ok
      ? `${manifest.nftCollectionV3.starterVisibleCopyCount} starter NFT copy${manifest.nftCollectionV3.starterVisibleCopyCount === 1 ? '' : 'ies'} protected`
      : 'Vault backup proof needs attention'
  };
}

export default {
  W139_VAULT_PERSISTENCE_SCHEMA,
  W139_VAULT_PERSISTENCE_RECEIPT_KEY,
  W139_REQUIRED_PERSISTENCE_KEYS,
  buildVaultPersistenceManifest,
  assertVaultPersistenceManifest,
  recordVaultPersistenceRestore,
  getVaultPersistenceStatus
};
