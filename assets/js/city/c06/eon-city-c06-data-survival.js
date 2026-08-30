/**
 * A15 C06 — canonical EONCITY/Signal Frontier data survival implementation.
 *
 * The bundle is a digest-verified sub-payload intended for the encrypted
 * Workspace Capsule. It contains only closed, privacy-safe City state schemas.
 * Restore is previewed, explicitly confirmed, atomic and rollback verified.
 */
import {
  EON_CITY_DATA_DELETE_CONFIRMATION,
  EON_CITY_DATA_RESTORE_CONFIRMATION,
  EON_CITY_DATA_SURVIVAL_MANIFEST_SCHEMA,
  EON_CITY_DATA_SURVIVAL_RECORDS
} from '../../contracts/city/eon-city-data-survival-manifest.js';
import {
  EON_EXPANSE_W766A_FOUNDATION_SCHEMA,
  EON_EXPANSE_W766A_STORAGE_KEY,
  createEonExpanseW766AInitialState,
  createEonExpanseW766APersistence
} from '../w766/eon-expanse-w766a-foundation.js';
import {
  EON_CITY_W659G_PROGRESSION_SCHEMA,
  EON_CITY_W659G_PROGRESSION_STORAGE_KEY,
  readEonCityW659gProgression
} from '../../contracts/city/w659g/eon-city-w659g-progression-ledger.js';
import { EON_CITY_W737_MISSION_SCHEMA, EON_CITY_W737_MISSION_STORAGE_KEY, readEonCityW737MissionState } from '../w737/eon-city-w737-missions.js';
import {
  CITY_WORLD_STATE_KEY,
  CITY_WORLD_STATE_VERSION,
  normalizeCityWorldState,
  readCityWorldState
} from '../../contracts/city/city-world-state.js';
import {
  EON_PROJECT_DISTRICT_SCHEMA,
  EON_PROJECT_DISTRICT_STORAGE_KEY,
  readEonProjectDistrictRegistry,
  sanitizeEonProjectDistrictRegistry
} from '../eon-city-project-district-manifest.js';
import { EON_CITY_PRODUCTIVE_RPG_SCHEMA, EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY, readEonCityProductiveRpgStore } from '../../contracts/city/eon-city-productive-rpg-loop.js';
import { EON_CITY_W751_ACTIVITY_STORAGE_KEY, EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA, readEonCityW751StationActivity } from '../w751/eon-city-w751-productive-stations.js';
import { EON_CITY_PROGRESS_RECEIPT_SCHEMA, EON_CITY_PROGRESS_STORAGE_KEY, readEonCityProgressStore } from '../../contracts/city/eon-city-progress-bridge.js';
import { EON_CITY_RESUME_STATE_KEY, EON_CITY_RESUME_TRAVEL_SCHEMA, normalizeEonCityResumeState } from '../../contracts/city/eon-city-resume-travel.js';
import { EON_CITY_VAULT_REVEALS_SCHEMA, EON_CITY_VAULT_REVEALS_STORAGE_KEY, normalizeEonCityVaultRevealInventory } from '../../contracts/city/eon-city-vault-reveals.js';
import {
  EON_CITY_RT91_SESSION_SAVE_SCHEMA,
  EON_CITY_RT91_SESSION_STORAGE_KEY,
  sanitizeEonCityRt91SessionSave
} from '../rt91/eon-city-rt91-session-save.js';
import {
  EON_CITY_AGENT_THEATRE_STORAGE_KEY,
  EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA,
  readEonCityAgentTheatreStore,
  sanitizeEonCityAgentTheatreStore
} from '../eon-city-genuine-agent-theatre.js';
import {
  EONBOT_JOB_FABRIC_SCHEMA,
  EONBOT_JOB_FABRIC_STORAGE_KEY,
  readEonbotJobFabricState,
  sanitizeEonbotJobFabricState
} from '../../chat/eonbot-job-fabric.js';
import {
  EON_CITY_LIVING_NEXUS_SCHEMA,
  EON_CITY_LIVING_NEXUS_STORAGE_KEY,
  readEonCityLivingNexusState,
  sanitizeEonCityLivingNexusState
} from '../eon-city-living-nexus-hybrid.js';
import {
  EON_CITY_LIVING_NEXUS_ENCOUNTER_SCHEMA,
  EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY,
  readEonCityLivingNexusEncounterState,
  sanitizeEonCityLivingNexusEncounterState
} from '../eon-city-living-nexus-encounters.js';
import {
  EON_COMMAND_DISTRICT_SCHEMA,
  EON_COMMAND_DISTRICT_STORAGE_KEY,
  normalizeCommandDistrictState,
  readCommandDistrictState
} from '../eon-city-command-district.js';

export const EON_CITY_DATA_SURVIVAL_BUNDLE_SCHEMA = 'eon.city-data-survival-bundle.a15.c06.v1';
export const EON_CITY_DATA_SURVIVAL_RECEIPT_SCHEMA = 'eon.city-data-survival-receipt.a15.c06.v1';
export const EON_CITY_DATA_SURVIVAL_VERSION = 1;
export const EON_CITY_DATA_SURVIVAL_MAX_BYTES = 1_500_000;

const freeze = (value) => Object.freeze(value);
const encoder = new TextEncoder();
const clean = (value = '', max = 180) => String(value || '').trim().slice(0, max);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function storageRef(storage = null) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}
function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); }
  };
}
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function bytes(value) { return encoder.encode(String(value ?? '')).byteLength; }
function base64Url(input) {
  const array = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';
  for (const byte of array) binary += String.fromCharCode(byte);
  const base64 = btoa(binary);
  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}
async function digest(value, cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.subtle?.digest) throw new Error('sha256-unavailable');
  return base64Url(await cryptoApi.subtle.digest('SHA-256', encoder.encode(String(value))));
}
function parse(raw) { try { return JSON.parse(String(raw || '')); } catch { return null; } }

const DEFINITIONS = [
  {
    key: EON_EXPANSE_W766A_STORAGE_KEY, schema: EON_EXPANSE_W766A_FOUNDATION_SCHEMA,
    canonicalize(value, now) {
      const temp = memoryStorage();
      const persistence = createEonExpanseW766APersistence({ storage: temp, now: () => now });
      const result = persistence.write(value);
      if (!result.ok) return null;
      return parse(temp.getItem(EON_EXPANSE_W766A_STORAGE_KEY));
    },
    read(storage, now) { return createEonExpanseW766APersistence({ storage, now: () => now }).read(createEonExpanseW766AInitialState({ now })); }
  },
  {
    key: EON_CITY_W659G_PROGRESSION_STORAGE_KEY, schema: EON_CITY_W659G_PROGRESSION_SCHEMA,
    canonicalize(value, now) { const temp = memoryStorage({ [this.key]: JSON.stringify(value) }); return readEonCityW659gProgression({ storage: temp, now }); },
    read(storage, now) { return readEonCityW659gProgression({ storage, now }); }
  },
  {
    key: CITY_WORLD_STATE_KEY, schema: 'eon.city.world-state.w221.v2',
    accepts(value) { return Number(value?.version) === CITY_WORLD_STATE_VERSION; },
    canonicalize(value, now) { return normalizeCityWorldState(value, { now, fallback: value }); },
    read(storage, now) { return readCityWorldState({ storage, now }).state; }
  },
  {
    key: EON_PROJECT_DISTRICT_STORAGE_KEY, schema: EON_PROJECT_DISTRICT_SCHEMA,
    canonicalize(value, now) { return sanitizeEonProjectDistrictRegistry(value, { now }); },
    read(storage, now) { return readEonProjectDistrictRegistry({ storage, now }); }
  },
  {
    key: EON_CITY_W737_MISSION_STORAGE_KEY, schema: EON_CITY_W737_MISSION_SCHEMA,
    canonicalize(value) { const temp = memoryStorage({ [this.key]: JSON.stringify(value) }); return readEonCityW737MissionState(temp); },
    read(storage) { return readEonCityW737MissionState(storage); }
  },
  {
    key: EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY, schema: EON_CITY_PRODUCTIVE_RPG_SCHEMA,
    canonicalize(value) { const temp = memoryStorage({ [this.key]: JSON.stringify(value) }); return readEonCityProductiveRpgStore(temp); },
    read(storage) { return readEonCityProductiveRpgStore(storage); }
  },
  {
    key: EON_CITY_W751_ACTIVITY_STORAGE_KEY, schema: EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA,
    canonicalize(value) { const temp = memoryStorage({ [this.key]: JSON.stringify(value) }); return readEonCityW751StationActivity(temp); },
    read(storage) { return readEonCityW751StationActivity(storage); }
  },
  {
    key: EON_CITY_PROGRESS_STORAGE_KEY, schema: EON_CITY_PROGRESS_RECEIPT_SCHEMA,
    canonicalize(value) { const temp = memoryStorage({ [this.key]: JSON.stringify(value) }); return readEonCityProgressStore({ storage: temp }); },
    read(storage) { return readEonCityProgressStore({ storage }); }
  },
  {
    key: EON_CITY_RESUME_STATE_KEY, schema: EON_CITY_RESUME_TRAVEL_SCHEMA,
    canonicalize(value, now) { return normalizeEonCityResumeState(value, { now }); },
    read(storage, now) { return normalizeEonCityResumeState(parse(storage.getItem(this.key)), { now }); }
  },
  {
    key: EON_CITY_VAULT_REVEALS_STORAGE_KEY, schema: EON_CITY_VAULT_REVEALS_SCHEMA,
    canonicalize(value, now) { return normalizeEonCityVaultRevealInventory(value, { now }); },
    read(storage, now) { return normalizeEonCityVaultRevealInventory(parse(storage.getItem(this.key)), { now }); }
  },
  {
    key: EON_CITY_RT91_SESSION_STORAGE_KEY, schema: EON_CITY_RT91_SESSION_SAVE_SCHEMA,
    canonicalize(value) { return sanitizeEonCityRt91SessionSave(value); },
    read(storage) { return sanitizeEonCityRt91SessionSave(parse(storage.getItem(this.key)) || {}); }
  },
  {
    key: EON_CITY_AGENT_THEATRE_STORAGE_KEY, schema: EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA,
    canonicalize(value, now) { return sanitizeEonCityAgentTheatreStore(value, { now }); },
    read(storage, now) { return readEonCityAgentTheatreStore({ storage, now }); }
  },
  {
    key: EONBOT_JOB_FABRIC_STORAGE_KEY, schema: EONBOT_JOB_FABRIC_SCHEMA,
    canonicalize(value, now) { return sanitizeEonbotJobFabricState(value, { now }); },
    read(storage, now) { return readEonbotJobFabricState({ storage, now }); }
  },
  {
    key: EON_CITY_LIVING_NEXUS_STORAGE_KEY, schema: EON_CITY_LIVING_NEXUS_SCHEMA,
    canonicalize(value) { return sanitizeEonCityLivingNexusState(value); },
    read(storage) { return readEonCityLivingNexusState({ storage }); }
  },
  {
    key: EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY, schema: EON_CITY_LIVING_NEXUS_ENCOUNTER_SCHEMA,
    canonicalize(value, now) { return sanitizeEonCityLivingNexusEncounterState(value, { now }); },
    read(storage, now) { return readEonCityLivingNexusEncounterState({ storage, now }); }
  },
  {
    key: EON_COMMAND_DISTRICT_STORAGE_KEY, schema: EON_COMMAND_DISTRICT_SCHEMA,
    canonicalize(value, now) { return normalizeCommandDistrictState(value, { now }); },
    read(storage, now) { return readCommandDistrictState({ storage, now }).state; }
  }
];
const definitionByKey = new Map(DEFINITIONS.map((entry) => [entry.key, entry]));

function containsForbiddenPrivateField(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (/^(rawPrompt|promptText|providerKey|apiKey|credential|credentialValue|secret|privateProjectContent)$/i.test(key)) return true;
    if (/^privateProjectContentStored$/i.test(key) && child !== false) return true;
    if (containsForbiddenPrivateField(child, seen)) return true;
  }
  return false;
}
function canonicalClock(value, now) {
  const direct = finite(value?.updatedAt, NaN);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const iso = Date.parse(String(value?.updatedAt || ''));
  return Number.isFinite(iso) ? iso : now;
}
function validateClosedValue(definition, value, now) {
  const accepts = (candidate) => definition.accepts ? definition.accepts(candidate) : candidate?.schema === definition.schema;
  if (!value || typeof value !== 'object' || Array.isArray(value) || !accepts(value)) return null;
  if (containsForbiddenPrivateField(value)) return null;
  const canonical = definition.canonicalize(value, canonicalClock(value, now));
  if (!canonical || !accepts(canonical) || containsForbiddenPrivateField(canonical)) return null;
  return canonical;
}

async function buildRecords(storage, now, cryptoApi) {
  const records = [];
  for (const definition of DEFINITIONS) {
    const raw = storage.getItem(definition.key);
    if (raw == null) continue;
    const parsed = parse(raw);
    const value = validateClosedValue(definition, parsed, now);
    if (!value) throw new Error(`city-record-invalid:${definition.key}`);
    records.push(freeze({ key: definition.key, schema: definition.schema, value, digest: await digest(stable(value), cryptoApi) }));
  }
  return records;
}

export async function createEonCityDataSurvivalBundle({ storage = null, now = Date.now(), cryptoApi = globalThis.crypto } = {}) {
  const target = storageRef(storage);
  if (!target) throw new Error('city-data-storage-unavailable');
  const timestamp = Math.max(1, finite(now, Date.now()));
  const records = await buildRecords(target, timestamp, cryptoApi);
  const payload = {
    schema: EON_CITY_DATA_SURVIVAL_BUNDLE_SCHEMA,
    version: EON_CITY_DATA_SURVIVAL_VERSION,
    manifestSchema: EON_CITY_DATA_SURVIVAL_MANIFEST_SCHEMA,
    createdAt: new Date(timestamp).toISOString(),
    recordCount: records.length,
    records,
    containsPrivateProjectContent: false,
    containsCredentials: false,
    containsRawMedia: false,
    encryptedWorkspaceCapsuleRequired: true
  };
  const payloadDigest = await digest(stable(payload), cryptoApi);
  const bundle = freeze({ ...payload, integrity: freeze({ algorithm: 'SHA-256', payloadDigest }) });
  if (bytes(JSON.stringify(bundle)) > EON_CITY_DATA_SURVIVAL_MAX_BYTES) throw new Error('city-data-bundle-too-large');
  return bundle;
}

export async function verifyEonCityDataSurvivalBundle(input, { cryptoApi = globalThis.crypto, now = Date.now() } = {}) {
  let bundle = input;
  if (typeof input === 'string') {
    if (bytes(input) > EON_CITY_DATA_SURVIVAL_MAX_BYTES) return freeze({ ok: false, reason: 'city-data-bundle-too-large', bundle: null });
    bundle = parse(input);
  }
  try {
    if (!bundle || bundle.schema !== EON_CITY_DATA_SURVIVAL_BUNDLE_SCHEMA || bundle.version !== EON_CITY_DATA_SURVIVAL_VERSION) throw new Error('city-data-header-invalid');
    if (bundle.manifestSchema !== EON_CITY_DATA_SURVIVAL_MANIFEST_SCHEMA || !Array.isArray(bundle.records) || bundle.recordCount !== bundle.records.length) throw new Error('city-data-manifest-invalid');
    const keys = new Set();
    const records = [];
    for (const source of bundle.records) {
      const definition = definitionByKey.get(String(source?.key || ''));
      if (!definition || keys.has(definition.key) || source?.schema !== definition.schema) throw new Error('city-data-record-unknown-or-duplicate');
      const value = validateClosedValue(definition, source.value, now);
      if (!value) throw new Error(`city-data-record-invalid:${definition.key}`);
      const recordDigest = await digest(stable(value), cryptoApi);
      if (recordDigest !== source.digest) throw new Error(`city-data-record-digest-mismatch:${definition.key}`);
      keys.add(definition.key);
      records.push(freeze({ key: definition.key, schema: definition.schema, value, digest: recordDigest }));
    }
    const payload = {
      schema: bundle.schema, version: bundle.version, manifestSchema: bundle.manifestSchema,
      createdAt: clean(bundle.createdAt), recordCount: records.length, records,
      containsPrivateProjectContent: false, containsCredentials: false, containsRawMedia: false,
      encryptedWorkspaceCapsuleRequired: true
    };
    const payloadDigest = await digest(stable(payload), cryptoApi);
    if (bundle.integrity?.algorithm !== 'SHA-256' || payloadDigest !== bundle.integrity?.payloadDigest) throw new Error('city-data-bundle-digest-mismatch');
    return freeze({ ok: true, reason: null, bundle: freeze({ ...payload, integrity: freeze({ algorithm: 'SHA-256', payloadDigest }) }) });
  } catch (error) {
    return freeze({ ok: false, reason: clean(error?.message || 'city-data-bundle-invalid'), bundle: null });
  }
}

export async function inspectEonCityDataRestore(input, { storage = null, cryptoApi = globalThis.crypto, now = Date.now() } = {}) {
  const target = storageRef(storage);
  if (!target) return freeze({ ok: false, reason: 'city-data-storage-unavailable', readyToApply: false });
  const verified = await verifyEonCityDataSurvivalBundle(input, { cryptoApi, now });
  if (!verified.ok) return freeze({ ...verified, readyToApply: false });
  const changes = verified.bundle.records.map((record) => freeze({ key: record.key, action: target.getItem(record.key) == null ? 'add' : 'replace', schema: record.schema }));
  const previewId = await digest(stable({ payloadDigest: verified.bundle.integrity.payloadDigest, changes }), cryptoApi);
  return freeze({ ok: true, reason: null, bundle: verified.bundle, previewId, changes: freeze(changes), readyToApply: true, writeStarted: false, automaticMerge: false, networkRequestCreated: false });
}

export async function restoreEonCityDataSurvivalBundle(input, {
  storage = null, cryptoApi = globalThis.crypto, now = Date.now(), explicitUserAction = false,
  confirmation = '', reviewedPreviewId = ''
} = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', restoreApplied: false });
  if (String(confirmation) !== EON_CITY_DATA_RESTORE_CONFIRMATION) return freeze({ ok: false, reason: 'typed-confirmation-required', confirmationRequired: EON_CITY_DATA_RESTORE_CONFIRMATION, restoreApplied: false });
  const target = storageRef(storage);
  const preview = await inspectEonCityDataRestore(input, { storage: target, cryptoApi, now });
  if (!preview.ok) return freeze({ ...preview, restoreApplied: false });
  if (!reviewedPreviewId || reviewedPreviewId !== preview.previewId) return freeze({ ...preview, ok: false, reason: 'reviewed-preview-required', restoreApplied: false });
  const snapshots = new Map(preview.bundle.records.map((record) => [record.key, target.getItem(record.key)]));
  try {
    for (const record of preview.bundle.records) {
      const serialized = JSON.stringify(record.value);
      target.setItem(record.key, serialized);
      if (target.getItem(record.key) !== serialized) throw new Error(`city-data-write-verification-failed:${record.key}`);
      const canonical = definitionByKey.get(record.key).read(target, canonicalClock(record.value, now));
      if (stable(canonical) !== stable(record.value)) throw new Error(`city-data-post-restore-mismatch:${record.key}`);
    }
  } catch (error) {
    for (const [key, value] of snapshots) {
      try { value == null ? target.removeItem(key) : target.setItem(key, value); } catch {}
    }
    const rollbackVerified = [...snapshots].every(([key, value]) => target.getItem(key) === value);
    return freeze({ ok: false, reason: clean(error?.message), restoreApplied: false, atomic: true, rollbackAttempted: true, rollbackVerified, networkRequestCreated: false });
  }
  return freeze({
    ok: true, reason: null, schema: EON_CITY_DATA_SURVIVAL_RECEIPT_SCHEMA,
    restoredAt: new Date(Math.max(1, finite(now, Date.now()))).toISOString(), recordCount: preview.bundle.recordCount,
    payloadDigest: preview.bundle.integrity.payloadDigest, restoreApplied: true, atomic: true,
    rollbackRequired: false, privateContentStored: false, networkRequestCreated: false
  });
}

export function clearEonCityDataSurvivalState({ storage = null, explicitUserAction = false, backupAcknowledged = false, confirmation = '' } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', removed: 0 });
  if (backupAcknowledged !== true) return freeze({ ok: false, reason: 'backup-acknowledgement-required', removed: 0 });
  if (String(confirmation) !== EON_CITY_DATA_DELETE_CONFIRMATION) return freeze({ ok: false, reason: 'typed-confirmation-required', confirmationRequired: EON_CITY_DATA_DELETE_CONFIRMATION, removed: 0 });
  const target = storageRef(storage);
  if (!target) return freeze({ ok: false, reason: 'city-data-storage-unavailable', removed: 0 });
  const failures = [];
  let removed = 0;
  for (const record of EON_CITY_DATA_SURVIVAL_RECORDS) {
    try {
      const existed = target.getItem(record.key) != null;
      target.removeItem(record.key);
      if (target.getItem(record.key) != null) failures.push(record.key);
      else if (existed) removed += 1;
    } catch { failures.push(record.key); }
  }
  return freeze({ ok: failures.length === 0, schema: EON_CITY_DATA_SURVIVAL_RECEIPT_SCHEMA, removed, failures: freeze(failures), zeroDeclaredResidue: failures.length === 0, unrelatedStoragePreserved: true, providerSideDataDeleted: false, networkRequestCreated: false });
}

export function getEonCityDataSurvivalTruth() {
  return freeze({
    schema: EON_CITY_DATA_SURVIVAL_BUNDLE_SCHEMA,
    manifestRecordCount: EON_CITY_DATA_SURVIVAL_RECORDS.length,
    signalFrontierCovered: true, myFrontierCovered: true, stormSectorCovered: true,
    recordDigestsRequired: true, bundleDigestRequired: true, futureVersionsRejected: true,
    previewRequired: true, typedConfirmationRequired: EON_CITY_DATA_RESTORE_CONFIRMATION,
    atomicRestore: true, rollbackVerifiedOnFailure: true, verifiedDeletion: true,
    privateProjectContentStored: false, credentialsStored: false, rawMediaStored: false,
    encryptedWorkspaceCapsuleRequired: true, networkRequestCreated: false
  });
}
