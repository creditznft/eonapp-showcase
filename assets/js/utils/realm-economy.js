const REALM_ECONOMY_CONFIG_KEY = 'eon:realm:economy-config:v1';
const REALM_FEE_LEDGER_KEY = 'eon:realm:fee-ledger:v1';

const /** @type {any} */
DEFAULT_SPLIT = {
  platformSink: 4500,
  ownerShare: 2500,
  districtPool: 2000,
  referralPool: 1000
};

const /** @type {any} */
FEE_ACTION_CATALOG = [
  { feeType: 'entry-ticket', label: 'Entry Ticket', defaultAmount: 3 },
  { feeType: 'sponsor', label: 'Sponsor Boost', defaultAmount: 6 },
  { feeType: 'vip-pass', label: 'VIP Pass', defaultAmount: 10 }
];

function safeParse(/** @type {any} */ raw, /** @type {any} */ fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function loadParcels() {
  const parsed = safeParse(localStorage.getItem('eon:realm:parcels:v2') || '[]', []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveParcels(/** @type {any} */ parcels) {
  try {
    localStorage.setItem('eon:realm:parcels:v2', JSON.stringify(parcels));
  } catch {
    // Best-effort persistence.
  }
}

function loadConfigMap() {
  const parsed = safeParse(localStorage.getItem(REALM_ECONOMY_CONFIG_KEY) || '{}', {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function saveConfigMap(/** @type {any} */ configMap) {
  try {
    localStorage.setItem(REALM_ECONOMY_CONFIG_KEY, JSON.stringify(configMap));
  } catch {
    // Best-effort persistence.
  }
}

function loadLedger() {
  const parsed = safeParse(localStorage.getItem(REALM_FEE_LEDGER_KEY) || '[]', []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveLedger(/** @type {any} */ ledger) {
  try {
    localStorage.setItem(REALM_FEE_LEDGER_KEY, JSON.stringify(ledger.slice(0, 4000)));
  } catch {
    // Best-effort persistence.
  }
}

function normalizeSplit(/** @type {any} */ splitInput = {}) {
  const ownerShareInput = Number(splitInput.ownerShare);
  const ownerShare = Number.isFinite(ownerShareInput)
    ? Math.max(2000, Math.min(3000, Math.floor(ownerShareInput)))
    : DEFAULT_SPLIT.ownerShare;

  const districtPool = DEFAULT_SPLIT.districtPool;
  const referralPool = DEFAULT_SPLIT.referralPool;
  const platformSink = 10_000 - ownerShare - districtPool - referralPool;

  return {
    platformSink,
    ownerShare,
    districtPool,
    referralPool
  };
}

function resolveParcelEconomyConfig(/** @type {any} */ parcelId) {
  const map = loadConfigMap();
  const row = map[String(parcelId)] || {};
  const split = normalizeSplit(row.split || {});
  return {
    parcelId: String(parcelId),
    split
  };
}

function toCsvRow(/** @type {any} */ cols) {
  return cols.map((/** @type {any} */ col) => {
    const text = String(col ?? '');
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }).join(',');
}

export function getDefaultSplit() {
  return { ...DEFAULT_SPLIT };
}

export function getFeeActionCatalog() {
  return FEE_ACTION_CATALOG.map((/** @type {any} */ entry) => ({ ...entry }));
}

export function getParcelEconomyConfig(/** @type {any} */ parcelId) {
  return resolveParcelEconomyConfig(parcelId);
}

export function setParcelEconomyConfig(/** @type {any} */ parcelId, /** @type {any} */ update = {}) {
  const map = loadConfigMap();
  const normalizedSplit = normalizeSplit(update?.split || {});
  map[String(parcelId)] = {
    split: normalizedSplit,
    updatedAt: new Date().toISOString()
  };
  saveConfigMap(map);
  return {
    ok: true,
    normalizedSplit,
    config: { parcelId: String(parcelId), split: normalizedSplit }
  };
}

export function recordFeeAction(/** @type {any} */ parcelId, /** @type {any} */ feeType, /** @type {any} */ amount, /** @type {any} */ meta = {}) {
  const parcelIdText = String(parcelId || '');
  if (!parcelIdText) return { ok: false, error: 'missing_parcel_id' };
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { ok: false, error: 'invalid_amount' };
  }

  const config = resolveParcelEconomyConfig(parcelIdText);
  const gross = Math.floor(numericAmount * 100);
  const /** @type {any} */
allocations = {
    platformSink: Math.floor((gross * config.split.platformSink) / 10_000),
    ownerShare: Math.floor((gross * config.split.ownerShare) / 10_000),
    districtPool: Math.floor((gross * config.split.districtPool) / 10_000),
    referralPool: 0
  };
  allocations.referralPool = gross - allocations.platformSink - allocations.ownerShare - allocations.districtPool;

  const /** @type {any} */
action = {
    actionId: `fee-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    parcelId: parcelIdText,
    feeType: String(feeType || 'unknown'),
    amount: numericAmount,
    gross,
    allocations,
    source: String(meta?.source || 'manual'),
    timestampIso: new Date().toISOString()
  };

  const ledger = loadLedger();
  ledger.unshift(action);
  saveLedger(ledger);

  const parcels = loadParcels();
  const idx = parcels.findIndex((/** @type {any} */ p) => String(p?.parcelId) === parcelIdText);
  if (idx >= 0) {
    const parcel = parcels[idx];
    parcel.revenueStats = parcel.revenueStats || { gross30d: 0, ownerShare30d: 0 };
    parcel.revenueStats.gross30d = Number(parcel.revenueStats.gross30d || 0) + gross;
    parcel.revenueStats.ownerShare30d = Number(parcel.revenueStats.ownerShare30d || 0) + allocations.ownerShare;
    parcel.updatedAt = new Date().toISOString();
    parcels[idx] = parcel;
    saveParcels(parcels);
  }

  return {
    ok: true,
    action,
    allocations,
    config
  };
}

export function getAllParcelOwnerShareSummaries(/** @type {any} */ filter = {}) {
  const ownerWalletFilter = String(filter?.ownerWallet || '').toLowerCase();
  const parcels = loadParcels();
  const /** @type {any} */
parcelById = new Map(parcels.map((/** @type {any} */ p) => [String(p?.parcelId || ''), p]));
  const ledger = loadLedger();
  const /** @type {any} */
summaryByParcel = new Map();

  for (const /** @type {any} */
row of ledger) {
    const parcelId = String(row?.parcelId || '');
    if (!parcelId) continue;
    const parcel = parcelById.get(parcelId);
    if (ownerWalletFilter && String(parcel?.ownerWallet || '').toLowerCase() !== ownerWalletFilter) {
      continue;
    }

    const current = summaryByParcel.get(parcelId) || {
      parcelId,
      gross: 0,
      ownerShare: 0,
      actionCount: 0
    };

    current.gross += Number(row?.gross || 0);
    current.ownerShare += Number(row?.allocations?.ownerShare || 0);
    current.actionCount += 1;
    summaryByParcel.set(parcelId, current);
  }

  return Array.from(summaryByParcel.values()).sort((/** @type {any} */ a, /** @type {any} */ b) => b.ownerShare - a.ownerShare);
}

export function exportFeeLeaderCsv() {
  const ledger = loadLedger();
  const /** @type {any} */
lines = [
    toCsvRow(['actionId', 'parcelId', 'feeType', 'amount', 'gross', 'ownerShare', 'platformSink', 'districtPool', 'referralPool', 'source', 'timestampIso'])
  ];

  for (const /** @type {any} */
row of ledger) {
    lines.push(toCsvRow([
      row.actionId,
      row.parcelId,
      row.feeType,
      row.amount,
      row.gross,
      row.allocations?.ownerShare || 0,
      row.allocations?.platformSink || 0,
      row.allocations?.districtPool || 0,
      row.allocations?.referralPool || 0,
      row.source,
      row.timestampIso
    ]));
  }

  return lines.join('\n');
}

export function exportOwnerShareSummaryCsv(/** @type {any} */ filter = {}) {
  const summaries = getAllParcelOwnerShareSummaries(filter);
  const /** @type {any} */
lines = [toCsvRow(['parcelId', 'ownerShare', 'gross', 'actionCount'])];
  for (const /** @type {any} */
row of summaries) {
    lines.push(toCsvRow([row.parcelId, row.ownerShare, row.gross, row.actionCount]));
  }
  return lines.join('\n');
}
