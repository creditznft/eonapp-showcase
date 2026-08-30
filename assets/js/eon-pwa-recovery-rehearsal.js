import { W145_DEPLOYMENT_INVARIANTS, W145_PROTECTED_STORAGE_GROUPS } from './utils/update-safe-user-data.js';

/**
 * W459.1 — manual, redacted PWA recovery rehearsal.
 *
 * This is an owner-facing planning record, not a restore engine. It reads only
 * storage key names through Storage.key(); it never calls getItem(), so it does
 * not inspect raw Vault values, API keys, receipts, files, prompts, credentials
 * or identity content. No backup is created, no update is applied and no claim
 * of device/PWA/update/recovery certification is made.
 */
export const EON_PWA_RECOVERY_REHEARSAL_SCHEMA = 'eonapp.pwa.recovery-rehearsal.w459.1';
export const EON_PWA_RECOVERY_REHEARSAL_STORAGE_KEY = 'eon:pwa:recovery-rehearsal:v1';
export const EON_PWA_RECOVERY_REHEARSAL_MAX = 6;

export const EON_PWA_RECOVERY_REHEARSAL_STEPS = Object.freeze([
  Object.freeze({ id: 'backup-check', label: 'Keep an encrypted backup file and its passphrase separately.' }),
  Object.freeze({ id: 'update-check', label: 'Use the browser update control only when an update is visibly ready.' }),
  Object.freeze({ id: 'reopen-check', label: 'After reopening, manually inspect your local profile and selected work.' }),
  Object.freeze({ id: 'rollback-check', label: 'Keep the rollback checklist ready; do not treat this rehearsal as a rollback.' })
]);

const STEP_IDS = new Set(EON_PWA_RECOVERY_REHEARSAL_STEPS.map((step) => step.id));
const freeze = (value) => Object.freeze(value);
const safeNow = (now) => {
  const candidate = Number(typeof now === 'function' ? now() : now);
  return Number.isFinite(candidate) && candidate > 0 ? Math.floor(candidate) : Date.now();
};
const iso = (value) => new Date(safeNow(value)).toISOString();
const safeStorage = (storage = null) => storage || (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
const isStorage = (storage) => storage && typeof storage.key === 'function' && typeof storage.setItem === 'function';
const cleanText = (value, fallback = '') => String(value || '')
  .split('')
  .filter((character) => character.charCodeAt(0) >= 32 && character !== '<' && character !== '>')
  .join('')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 96) || fallback;

function digest(text = '') {
  let hash = 2166136261;
  const value = String(text || '');
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `redacted-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Returns only key-name counts. It deliberately avoids getItem() and therefore
 * cannot inspect stored values or secret material.
 */
function observeStorageKeyNames(storage) {
  if (!storage || typeof storage.key !== 'function') return [];
  const names = [];
  try {
    const length = Math.max(0, Number(storage.length) || 0);
    for (let index = 0; index < length; index += 1) {
      const key = String(storage.key(index) || '');
      if (key) names.push(key);
    }
  } catch {}
  return names.sort();
}

function redactedInventory(storage) {
  const observed = observeStorageKeyNames(storage);
  const observedSet = new Set(observed);
  const knownKeys = new Set(W145_PROTECTED_STORAGE_GROUPS.flatMap((group) => group.keys));
  const protectedKeysPresent = W145_PROTECTED_STORAGE_GROUPS
    .reduce((count, group) => count + group.keys.filter((key) => observedSet.has(key)).length, 0);
  const protectedCategoryCount = W145_PROTECTED_STORAGE_GROUPS
    .filter((group) => group.keys.some((key) => observedSet.has(key))).length;
  const appOwnedKeys = observed.filter((key) => key.startsWith(W145_DEPLOYMENT_INVARIANTS.appOwnedPrefix));
  const unclassifiedAppOwnedKeyCount = appOwnedKeys.filter((key) => !knownKeys.has(key)).length;
  return freeze({
    protectedCategoryCount,
    protectedKeysPresent,
    appOwnedKeyCount: appOwnedKeys.length,
    unclassifiedAppOwnedKeyCount,
    inventoryDigest: digest(JSON.stringify([
      protectedCategoryCount,
      protectedKeysPresent,
      appOwnedKeys.length,
      unclassifiedAppOwnedKeyCount
    ])),
    keyNamesStored: false,
    rawValuesRead: false,
    rawValuesStored: false
  });
}

function emptyState(now) {
  return freeze({ schema: EON_PWA_RECOVERY_REHEARSAL_SCHEMA, updatedAt: iso(now), rehearsals: freeze([]) });
}

function normalizeRehearsal(candidate = {}, now = Date.now()) {
  if (!candidate || candidate.schema !== EON_PWA_RECOVERY_REHEARSAL_SCHEMA) return null;
  const rehearsalId = String(candidate.rehearsalId || '');
  if (!/^pwa-rehearsal-[a-z0-9_-]{8,120}$/i.test(rehearsalId)) return null;
  const acknowledgedSteps = Array.from(new Set(Array.isArray(candidate.acknowledgedSteps) ? candidate.acknowledgedSteps.filter((step) => STEP_IDS.has(String(step))) : []));
  const inventory = candidate.inventory && typeof candidate.inventory === 'object' ? candidate.inventory : {};
  return freeze({
    schema: EON_PWA_RECOVERY_REHEARSAL_SCHEMA,
    rehearsalId,
    safeLabel: cleanText(candidate.safeLabel, 'Manual recovery rehearsal'),
    createdAt: iso(candidate.createdAt || now),
    updatedAt: iso(candidate.updatedAt || candidate.createdAt || now),
    status: acknowledgedSteps.length === EON_PWA_RECOVERY_REHEARSAL_STEPS.length ? 'manual-plan-reviewed' : 'manual-proof-pending',
    acknowledgedSteps: freeze(acknowledgedSteps),
    inventory: freeze({
      protectedCategoryCount: Math.max(0, Number(inventory.protectedCategoryCount) || 0),
      protectedKeysPresent: Math.max(0, Number(inventory.protectedKeysPresent) || 0),
      appOwnedKeyCount: Math.max(0, Number(inventory.appOwnedKeyCount) || 0),
      unclassifiedAppOwnedKeyCount: Math.max(0, Number(inventory.unclassifiedAppOwnedKeyCount) || 0),
      inventoryDigest: /^redacted-[a-f0-9]{8}$/i.test(String(inventory.inventoryDigest || '')) ? String(inventory.inventoryDigest) : 'redacted-00000000',
      keyNamesStored: false,
      rawValuesRead: false,
      rawValuesStored: false
    }),
    actualBackupCreated: false,
    actualRestoreApplied: false,
    actualUpdateApplied: false,
    rollbackApplied: false,
    deviceProofAttached: false,
    crossDeviceProofAttached: false,
    recoveryCertified: false
  });
}

function readState(storage, now) {
  if (!isStorage(storage)) return emptyState(now);
  try {
    const parsed = JSON.parse(storage.getItem(EON_PWA_RECOVERY_REHEARSAL_STORAGE_KEY) || 'null');
    if (parsed?.schema !== EON_PWA_RECOVERY_REHEARSAL_SCHEMA || !Array.isArray(parsed.rehearsals)) return emptyState(now);
    const rehearsals = parsed.rehearsals
      .map((candidate) => normalizeRehearsal(candidate, now))
      .filter(Boolean)
      .slice(0, EON_PWA_RECOVERY_REHEARSAL_MAX);
    return freeze({ schema: EON_PWA_RECOVERY_REHEARSAL_SCHEMA, updatedAt: iso(parsed.updatedAt || now), rehearsals: freeze(rehearsals) });
  } catch {
    return emptyState(now);
  }
}

function writeState(storage, state) {
  if (!isStorage(storage)) return false;
  try { storage.setItem(EON_PWA_RECOVERY_REHEARSAL_STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

function publicRehearsal(rehearsal) {
  const steps = EON_PWA_RECOVERY_REHEARSAL_STEPS.map((step) => freeze({
    id: step.id,
    label: step.label,
    acknowledged: rehearsal.acknowledgedSteps.includes(step.id)
  }));
  return freeze({
    rehearsalId: rehearsal.rehearsalId,
    safeLabel: rehearsal.safeLabel,
    createdAt: rehearsal.createdAt,
    updatedAt: rehearsal.updatedAt,
    status: rehearsal.status,
    acknowledgedStepCount: rehearsal.acknowledgedSteps.length,
    requiredStepCount: EON_PWA_RECOVERY_REHEARSAL_STEPS.length,
    steps: freeze(steps),
    inventory: rehearsal.inventory,
    actualBackupCreated: false,
    actualRestoreApplied: false,
    actualUpdateApplied: false,
    rollbackApplied: false,
    deviceProofAttached: false,
    crossDeviceProofAttached: false,
    recoveryCertified: false,
    localOnly: true,
    networkRequestCreated: false,
    browserPermissionRequested: false
  });
}

function snapshot(state) {
  return freeze({
    schema: EON_PWA_RECOVERY_REHEARSAL_SCHEMA,
    rehearsalCount: state.rehearsals.length,
    rehearsals: freeze(state.rehearsals.map(publicRehearsal)),
    localOnly: true,
    rawValuesRead: false,
    rawValuesStored: false,
    keyNamesStored: false,
    automaticUpdateApplication: false,
    recoveryCertified: false,
    productionPwaProof: false
  });
}

export function createEonPwaRecoveryRehearsal({ storage = null, now = () => Date.now() } = {}) {
  const targetStorage = safeStorage(storage);
  const clock = () => safeNow(now);
  const current = () => readState(targetStorage, clock());
  const persist = (state) => {
    const stored = writeState(targetStorage, state);
    return freeze({ stored, browserStorageChanged: stored, networkRequestCreated: false, browserPermissionRequested: false, serviceWorkerUpdateApplied: false, pageReloaded: false, snapshot: snapshot(state) });
  };
  return freeze({
    getSnapshot() { return snapshot(current()); },
    prepare({ safeLabel = '' } = {}, { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false });
      const timestamp = clock();
      const rehearsal = normalizeRehearsal({
        schema: EON_PWA_RECOVERY_REHEARSAL_SCHEMA,
        rehearsalId: `pwa-rehearsal-${timestamp.toString(36)}-${digest(`${timestamp}:${Math.random()}`).slice(-8)}`,
        safeLabel: cleanText(safeLabel, 'Manual recovery rehearsal'),
        createdAt: timestamp,
        updatedAt: timestamp,
        acknowledgedSteps: [],
        inventory: redactedInventory(targetStorage)
      }, timestamp);
      const state = current();
      const next = freeze({ schema: EON_PWA_RECOVERY_REHEARSAL_SCHEMA, updatedAt: iso(timestamp), rehearsals: freeze([rehearsal, ...state.rehearsals].slice(0, EON_PWA_RECOVERY_REHEARSAL_MAX)) });
      const saved = persist(next);
      return freeze({ ok: saved.stored, rehearsal: publicRehearsal(rehearsal), ...saved });
    },
    acknowledgeStep(rehearsalId = '', stepId = '', { explicitUserAction = false, explicitUserConfirmation = false } = {}) {
      if (explicitUserAction !== true || explicitUserConfirmation !== true) return freeze({ ok: false, error: 'explicit-manual-review-confirmation-required', browserStorageChanged: false, networkRequestCreated: false });
      if (!STEP_IDS.has(String(stepId || ''))) return freeze({ ok: false, error: 'recovery-rehearsal-step-invalid', browserStorageChanged: false, networkRequestCreated: false });
      const state = current();
      const rehearsal = state.rehearsals.find((item) => item.rehearsalId === String(rehearsalId || ''));
      if (!rehearsal) return freeze({ ok: false, error: 'recovery-rehearsal-not-found', browserStorageChanged: false, networkRequestCreated: false });
      const acknowledgedSteps = Array.from(new Set([...rehearsal.acknowledgedSteps, String(stepId)]));
      const nextRehearsal = normalizeRehearsal({ ...rehearsal, acknowledgedSteps, updatedAt: clock() }, clock());
      const next = freeze({ ...state, updatedAt: iso(clock()), rehearsals: freeze(state.rehearsals.map((item) => item.rehearsalId === rehearsal.rehearsalId ? nextRehearsal : item)) });
      const saved = persist(next);
      return freeze({ ok: saved.stored, rehearsal: publicRehearsal(nextRehearsal), ...saved });
    },
    clear({ explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false });
      const next = emptyState(clock());
      const saved = persist(next);
      return freeze({ ok: saved.stored, ...saved });
    }
  });
}

export function getEonPwaRecoveryRehearsalTruth() {
  return freeze({
    schema: EON_PWA_RECOVERY_REHEARSAL_SCHEMA,
    localRedactedPlan: true,
    explicitUserActionRequired: true,
    rawVaultValueRead: false,
    rawStorageValuesRead: false,
    rawStorageValuesStored: false,
    rawKeyNameStored: false,
    rawKeyNamesStored: false,
    backupCreated: false,
    restoreApplied: false,
    automaticUpdateApplication: false,
    rollbackApplied: false,
    browserPermissionRequested: false,
    networkRequestCreated: false,
    deviceProofAttached: false,
    crossDeviceProofAttached: false,
    recoveryCertified: false,
    productionPwaProof: false
  });
}
