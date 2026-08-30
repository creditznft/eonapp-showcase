/** W629G — canonical EONKEY-compatible Vault Reveal integration. */
export const EON_W629_VAULT_REVEAL_SCHEMA = 'eonapp.vault-reveals.w629.v1';
export const EON_W629_VAULT_REVEAL_STORAGE_KEY = 'eon:vault:reveals:v1';
export const EON_W629_LEGACY_REVEAL_KEYS = Object.freeze(['eon:city:cosmetics:v1', 'eon:vault:relics:v1']);
const ALLOWED_CODES = new Set(['welcome-vault-reveal', 'signal-vault-relic', 'builder-vault-relic', 'power-vault-relic', 'builder-circle-relic']);
const safe = (value = '', max = 120) => String(value ?? '').trim().replace(/[^a-zA-Z0-9._:@/-]/g, '').slice(0, max);
const freeze = (value) => Object.freeze(value);

function safeVisualIds(values = []) {
  if (!Array.isArray(values)) return freeze([]);
  return freeze([...new Set(values.map((value) => safe(value, 80)).filter(Boolean))].slice(0, 32));
}

function resolveStorage(storage = null) {
  if (storage?.getItem && storage?.setItem) return storage;
  try {
    const candidate = globalThis?.localStorage;
    return candidate?.getItem && candidate?.setItem ? candidate : null;
  } catch {
    return null;
  }
}

export function normalizeVaultRevealReceipt(input = {}) {
  const rewardCode = safe(input.rewardCode || input.code, 80).toLowerCase();
  if (!ALLOWED_CODES.has(rewardCode)) return null;
  const requestedStatus = safe(input.status, 24).toLowerCase();
  const status = ['available', 'selected', 'revoked'].includes(requestedStatus) ? requestedStatus : 'available';
  return freeze({
    receiptId: safe(input.receiptId || input.rewardId || `${rewardCode}:local`, 96),
    rewardCode,
    status,
    selectedVisualId: safe(input.selectedVisualId, 80),
    legacyVisualIds: safeVisualIds(input.legacyVisualIds || input.reviewedCosmeticIds),
    issuedAt: Number(input.issuedAt || 0) || null,
    revokedAt: Number(input.revokedAt || 0) || null,
    source: safe(input.source || 'server-reward', 40),
    nonFinancial: true,
    transferable: false,
    ownershipClaimed: false,
    rarityClaimed: false,
    randomChance: false,
    generatedMedia: false
  });
}

export function migrateLegacyVaultRevealRecords({ canonical = null, legacyCity = null, legacyRelics = null, serverRewards = [] } = {}) {
  const existing = Array.isArray(canonical?.receipts) ? canonical.receipts : [];
  const legacyCandidates = [];
  const cityVisualIds = safeVisualIds(legacyCity?.reviewedCosmeticIds);
  if (cityVisualIds.length) {
    legacyCandidates.push({
      rewardCode: 'signal-vault-relic',
      receiptId: 'legacy:city-cosmetics',
      source: 'legacy-city-migration',
      legacyVisualIds: cityVisualIds
    });
  }
  if (legacyRelics?.rewardCode || legacyRelics?.code) {
    legacyCandidates.push({
      rewardCode: legacyRelics.rewardCode || legacyRelics.code,
      receiptId: safe(legacyRelics.receiptId || legacyRelics.rewardId || 'legacy:vault-relic', 96),
      status: legacyRelics.status,
      selectedVisualId: legacyRelics.selectedVisualId,
      legacyVisualIds: legacyRelics.legacyVisualIds,
      source: 'legacy-vault-migration'
    });
  }
  const candidates = [...existing, ...legacyCandidates, ...(Array.isArray(serverRewards) ? serverRewards : [])];
  const receipts = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const normalized = normalizeVaultRevealReceipt(candidate);
    if (!normalized || seen.has(normalized.receiptId)) continue;
    seen.add(normalized.receiptId);
    receipts.push(normalized);
  }
  const expectedLegacyVisualCount = cityVisualIds.length;
  const preservedLegacyVisualCount = receipts.reduce((total, row) => total + row.legacyVisualIds.length, 0);
  return freeze({
    schema: EON_W629_VAULT_REVEAL_SCHEMA,
    version: 1,
    receipts: freeze(receipts),
    migratedLegacyRecordCount: legacyCandidates.length,
    preservedLegacyVisualCount,
    dataLossDetected: preservedLegacyVisualCount < expectedLegacyVisualCount,
    privateInputsStored: false,
    subscriptionEntitlementClaimed: false,
    walletOrTokenCreated: false,
    marketListingCreated: false
  });
}

export function installW629VaultRevealMigration({ storage = null, serverRewards = [] } = {}) {
  const target = resolveStorage(storage);
  if (!target) return freeze({ ok: false, status: 'storage-unavailable' });
  const parse = (key) => {
    try { return JSON.parse(target.getItem(key) || 'null'); }
    catch { return null; }
  };
  const canonical = parse(EON_W629_VAULT_REVEAL_STORAGE_KEY);
  const legacyCity = parse(EON_W629_LEGACY_REVEAL_KEYS[0]);
  const legacyRelics = parse(EON_W629_LEGACY_REVEAL_KEYS[1]);
  const migrated = migrateLegacyVaultRevealRecords({ canonical, legacyCity, legacyRelics, serverRewards });
  if (migrated.dataLossDetected) return freeze({ ok: false, status: 'migration-data-loss-detected' });
  try {
    target.setItem(EON_W629_VAULT_REVEAL_STORAGE_KEY, JSON.stringify(migrated));
  } catch {
    return freeze({ ok: false, status: 'storage-write-failed' });
  }
  return freeze({
    ok: true,
    status: 'canonical-vault-reveals-ready',
    migratedLegacyRecordCount: migrated.migratedLegacyRecordCount,
    preservedLegacyVisualCount: migrated.preservedLegacyVisualCount,
    receiptCount: migrated.receipts.length
  });
}

export function serializeVaultRevealInventory(input = {}) {
  const normalized = migrateLegacyVaultRevealRecords({ canonical: input });
  return JSON.stringify(normalized);
}

export function validateW629VaultRevealContract() {
  const migrated = migrateLegacyVaultRevealRecords({
    legacyCity: { reviewedCosmeticIds: ['signal-mist', 'signal-plaque'], prompt: 'private' },
    serverRewards: [{ rewardId: 'reward-1', rewardCode: 'builder-vault-relic', status: 'available', rawPayload: 'private' }]
  });
  const text = JSON.stringify(migrated);
  const errors = [];
  if (migrated.receipts.length !== 2) errors.push('migration-count-invalid');
  if (migrated.preservedLegacyVisualCount !== 2 || migrated.dataLossDetected) errors.push('legacy-visuals-not-preserved');
  if (/prompt|rawPayload|private prompt|customerEmail|providerKey/.test(text)) errors.push('private-field-leaked');
  if (!migrated.receipts.every((row) => row.nonFinancial && row.transferable === false && row.generatedMedia === false)) errors.push('commercial-boundary-failed');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_W629_VAULT_REVEAL_SCHEMA });
}

export default freeze({
  EON_W629_VAULT_REVEAL_SCHEMA,
  EON_W629_VAULT_REVEAL_STORAGE_KEY,
  EON_W629_LEGACY_REVEAL_KEYS,
  normalizeVaultRevealReceipt,
  migrateLegacyVaultRevealRecords,
  installW629VaultRevealMigration,
  serializeVaultRevealInventory,
  validateW629VaultRevealContract
});
