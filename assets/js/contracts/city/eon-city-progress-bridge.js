/**
 * A15 C05 — verified Core outcome to EONCITY progress bridge.
 *
 * The bridge consumes only redacted, policy-approved Core outcomes and creates
 * one bounded City progress receipt per outcome. A progress receipt makes a
 * mission eligible for explicit claim; it never awards XP, reveals, cosmetics,
 * entitlements, payments or completion automatically.
 */
import {
  EON_CORE_OUTCOME_EVENT,
  EON_CORE_OUTCOME_STORAGE_KEY,
  listEonCoreOutcomes,
  validateEonCoreOutcome
} from '../outcomes/eon-core-outcome-authority.js';
import { recordEonCityProductiveRpgOutcome } from './eon-city-productive-rpg-loop.js';

export const EON_CITY_PROGRESS_RECEIPT_SCHEMA = 'eon.city-progress-receipt.a15.v1';
export const EON_CITY_PROGRESS_STORAGE_KEY = 'eon:city:progress-receipts:a15:v1';
export const EON_CITY_PROGRESS_EVENT = 'eon:city-progress-receipt-recorded';
export const EON_CITY_PROGRESS_MAX_RECEIPTS = 256;

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 180) => String(value || '').trim().slice(0, max);
const safeId = (value = '', max = 180) => clean(value, max).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const LEGACY_PRODUCTIVE_KINDS = new Set([
  'creator-guide-artifact',
  'creator-image-verified',
  'creator-video-verified',
  'creator-music-exported',
  'creator-radio-station',
  'forge-source-applied',
  'project-shell',
  'project-resume',
  'backup-readiness-receipt',
  'recovery-restore-receipt',
  'local-ai-self-test',
  'byok-provider-verification',
  'automation-proposal'
]);

function resolveStorage(storage = null) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function emptyStore() {
  return { schema: EON_CITY_PROGRESS_RECEIPT_SCHEMA, revision: 0, updatedAt: 0, receipts: [] };
}

function normalizeReceipt(value = {}) {
  const coreOutcomeId = safeId(value.coreOutcomeId, 220);
  const evidenceReceiptId = safeId(value.evidenceReceiptId, 180);
  const kind = safeId(value.kind);
  const stationId = safeId(value.stationId);
  const missionId = safeId(value.missionId);
  const receiptId = safeId(value.receiptId || `city-progress:${coreOutcomeId}`, 240);
  if (!coreOutcomeId || !evidenceReceiptId || !kind || !stationId || !missionId || value.verified !== true) return null;
  return freeze({
    schema: EON_CITY_PROGRESS_RECEIPT_SCHEMA,
    receiptId,
    coreOutcomeId,
    evidenceReceiptId,
    kind,
    stationId,
    missionId,
    verified: true,
    verifiedAt: Math.max(1, finite(value.verifiedAt)),
    acceptedAt: Math.max(1, finite(value.acceptedAt || value.verifiedAt)),
    privateContentStored: false,
    receiptPayloadStored: false,
    xpGranted: false,
    rewardGranted: false,
    completionClaimed: false,
    explicitClaimRequired: true,
    automaticExecution: false,
    automaticNavigation: false
  });
}

export function readEonCityProgressStore({ storage = null } = {}) {
  try {
    const parsed = JSON.parse(resolveStorage(storage)?.getItem?.(EON_CITY_PROGRESS_STORAGE_KEY) || 'null');
    if (parsed?.schema !== EON_CITY_PROGRESS_RECEIPT_SCHEMA || !Array.isArray(parsed.receipts)) return freeze(emptyStore());
    return freeze({
      schema: EON_CITY_PROGRESS_RECEIPT_SCHEMA,
      revision: Math.max(0, finite(parsed.revision)),
      updatedAt: Math.max(0, finite(parsed.updatedAt)),
      receipts: freeze(parsed.receipts.map(normalizeReceipt).filter(Boolean))
    });
  } catch {
    return freeze(emptyStore());
  }
}

export function listEonCityProgressReceipts(options = {}) {
  return readEonCityProgressStore(options).receipts;
}

function progressReceiptMatchesCoreOutcome(receipt = {}, outcome = {}) {
  return Boolean(
    receipt?.verified === true && outcome?.verified === true
    && receipt.coreOutcomeId === outcome.outcomeId
    && receipt.evidenceReceiptId === outcome.evidenceReceiptId
    && receipt.kind === outcome.kind
    && receipt.stationId === outcome.stationId
    && receipt.missionId === outcome.missionId
    && outcome.cityMaySubscribe === true
  );
}

/**
 * Returns only City progress receipts that can still be joined to a currently
 * valid, policy-approved Core outcome. This is the claim/progression authority.
 * The raw reader remains available for backup/data-survival canonicalisation.
 */
export function listVerifiedEonCityProgressReceipts({ storage = null } = {}) {
  const target = resolveStorage(storage);
  const outcomes = listEonCoreOutcomes({ storage: target });
  const byId = new Map(outcomes.map((outcome) => [outcome.outcomeId, outcome]));
  return freeze(readEonCityProgressStore({ storage: target }).receipts.filter((receipt) => {
    const outcome = byId.get(receipt.coreOutcomeId);
    return outcome ? progressReceiptMatchesCoreOutcome(receipt, outcome) : false;
  }));
}

export function getVerifiedEonCityProgressReceipt({ storage = null, receiptId = '', stationId = '' } = {}) {
  const targetReceipt = safeId(receiptId, 240);
  const targetStation = safeId(stationId);
  return listVerifiedEonCityProgressReceipts({ storage }).find((receipt) => (
    receipt.receiptId === targetReceipt && (!targetStation || receipt.stationId === targetStation)
  )) || null;
}

export function getLatestEonCityProgressReceipt(receipts = [], stationId = '') {
  const target = safeId(stationId);
  return [...(Array.isArray(receipts) ? receipts : [])]
    .filter((entry) => entry?.stationId === target && entry?.verified === true)
    .sort((left, right) => finite(right.acceptedAt) - finite(left.acceptedAt))[0] || null;
}

function emitProgress(environment, receipt) {
  if (typeof environment?.dispatchEvent !== 'function' || typeof environment?.CustomEvent !== 'function') return false;
  environment.dispatchEvent(new environment.CustomEvent(EON_CITY_PROGRESS_EVENT, {
    detail: freeze({ schema: EON_CITY_PROGRESS_RECEIPT_SCHEMA, receipt })
  }));
  return true;
}

function projectOutcome(outcome = {}, acceptedAt = Date.now()) {
  const validation = validateEonCoreOutcome(outcome);
  if (!validation.ok || validation.outcome?.cityMaySubscribe !== true) return null;
  const verified = validation.outcome;
  return normalizeReceipt({
    receiptId: `city-progress:${verified.outcomeId}`,
    coreOutcomeId: verified.outcomeId,
    evidenceReceiptId: verified.evidenceReceiptId,
    kind: verified.kind,
    stationId: verified.stationId,
    missionId: verified.missionId,
    verified: true,
    verifiedAt: verified.verifiedAt,
    acceptedAt
  });
}

export function syncEonCoreOutcomesToCity({ storage = null, environment = globalThis, now = Date.now() } = {}) {
  const target = resolveStorage(storage);
  if (!target) return freeze({ ok: false, reason: 'city-progress-storage-unavailable', created: freeze([]) });
  const rawCurrent = readEonCityProgressStore({ storage: target });
  const verifiedReceipts = listVerifiedEonCityProgressReceipts({ storage: target });
  const current = freeze({ ...rawCurrent, receipts: verifiedReceipts });
  const integrityRepairRequired = rawCurrent.receipts.length !== verifiedReceipts.length;
  const seen = new Set(current.receipts.map((entry) => entry.coreOutcomeId));
  const created = [];
  const nextReceipts = [...current.receipts];
  for (const outcome of listEonCoreOutcomes({ storage: target })) {
    if (seen.has(outcome.outcomeId)) continue;
    const receipt = projectOutcome(outcome, Math.max(1, finite(now, Date.now())));
    if (!receipt) continue;
    if (nextReceipts.length >= EON_CITY_PROGRESS_MAX_RECEIPTS) return freeze({ ok: false, reason: 'city-progress-capacity-reached', created: freeze(created), store: current });
    nextReceipts.push(receipt);
    seen.add(outcome.outcomeId);
    created.push(receipt);
    if (LEGACY_PRODUCTIVE_KINDS.has(outcome.kind)) {
      recordEonCityProductiveRpgOutcome({
        kind: outcome.kind,
        route: outcome.route,
        source: outcome.source,
        receiptId: outcome.evidenceReceiptId,
        verified: true,
        verifiedAt: outcome.verifiedAt
      }, { storage: target, now: outcome.verifiedAt });
    }
  }
  if (created.length === 0 && !integrityRepairRequired) return freeze({ ok: true, reason: 'no-new-outcomes', duplicate: true, created: freeze([]), store: current });
  const next = {
    schema: EON_CITY_PROGRESS_RECEIPT_SCHEMA,
    revision: current.revision + 1,
    updatedAt: created.length ? Math.max(...created.map((entry) => entry.acceptedAt)) : Math.max(1, finite(now, Date.now())),
    receipts: nextReceipts
  };
  try {
    const serialized = JSON.stringify(next);
    target.setItem(EON_CITY_PROGRESS_STORAGE_KEY, serialized);
    if (target.getItem(EON_CITY_PROGRESS_STORAGE_KEY) !== serialized) throw new Error('city-progress-write-verification-failed');
  } catch {
    return freeze({ ok: false, reason: 'city-progress-write-verification-failed', created: freeze([]), store: current });
  }
  for (const receipt of created) emitProgress(environment, receipt);
  return freeze({ ok: true, reason: integrityRepairRequired && created.length === 0 ? 'invalid-progress-receipts-pruned' : 'core-outcomes-synchronised', duplicate: false, integrityRepairRequired, created: freeze(created), store: freeze(next) });
}

export function createEonCityProgressBridge({ storage = null, environment = globalThis, now = () => Date.now() } = {}) {
  const boundedStorage = resolveStorage(storage);
  let disposed = false;
  const sync = (reason = 'refresh') => {
    if (disposed) return freeze({ ok: false, reason: 'city-progress-bridge-disposed' });
    return freeze({ ...syncEonCoreOutcomesToCity({ storage: boundedStorage, environment, now: now() }), trigger: clean(reason, 80) });
  };
  const onOutcome = () => sync('core-outcome-event');
  const onStorage = (event) => {
    if (String(event?.key || '') === EON_CORE_OUTCOME_STORAGE_KEY) sync('core-outcome-storage');
  };
  environment.addEventListener?.(EON_CORE_OUTCOME_EVENT, onOutcome);
  environment.addEventListener?.('storage', onStorage);
  sync('initial');
  return freeze({
    ok: true,
    schema: EON_CITY_PROGRESS_RECEIPT_SCHEMA,
    sync,
    getReceipts: () => listEonCityProgressReceipts({ storage: boundedStorage }),
    dispose() {
      if (disposed) return;
      disposed = true;
      environment.removeEventListener?.(EON_CORE_OUTCOME_EVENT, onOutcome);
      environment.removeEventListener?.('storage', onStorage);
    }
  });
}

export function getEonCityProgressTruth() {
  return freeze({
    schema: EON_CITY_PROGRESS_RECEIPT_SCHEMA,
    consumesOnlyPolicyApprovedCoreOutcomes: true,
    claimReadsRevalidateAgainstCoreOutcome: true,
    forgedProgressReceiptsIgnored: true,
    oneReceiptPerCoreOutcome: true,
    privateContentStored: false,
    routeOpeningGrantsXp: false,
    cityReturnReceiptGrantsXp: false,
    localReviewGrantsXp: false,
    xpGranted: false,
    rewardGranted: false,
    completionClaimed: false,
    explicitMissionClaimRequired: true,
    silentEviction: false
  });
}

export function validateEonCityProgressReceipt(receipt = {}) {
  const normalized = normalizeReceipt(receipt);
  const errors = [];
  if (!normalized) errors.push('receipt-invalid');
  if (receipt?.privateContentStored || receipt?.receiptPayloadStored || receipt?.xpGranted || receipt?.rewardGranted || receipt?.completionClaimed || receipt?.automaticExecution || receipt?.automaticNavigation) errors.push('truth-boundary-invalid');
  const serialized = JSON.stringify(receipt);
  if (/rawPrompt|providerKey|fileContent|mediaBlob|signedUrl|cardNumber/i.test(serialized)) errors.push('private-field-present');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), receipt: normalized });
}

export default freeze({
  EON_CITY_PROGRESS_RECEIPT_SCHEMA,
  EON_CITY_PROGRESS_STORAGE_KEY,
  EON_CITY_PROGRESS_EVENT,
  readEonCityProgressStore,
  listEonCityProgressReceipts,
  listVerifiedEonCityProgressReceipts,
  getVerifiedEonCityProgressReceipt,
  getLatestEonCityProgressReceipt,
  syncEonCoreOutcomesToCity,
  createEonCityProgressBridge,
  getEonCityProgressTruth,
  validateEonCityProgressReceipt
});
