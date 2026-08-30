import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import {
  EON_CITY_DATA_DELETE_CONFIRMATION,
  EON_CITY_DATA_RESTORE_CONFIRMATION,
  EON_CITY_DATA_SURVIVAL_RECORDS,
  getEonCityDataSurvivalManifestTruth
} from '../../assets/js/contracts/city/eon-city-data-survival-manifest.js';
import {
  EON_CITY_DATA_SURVIVAL_BUNDLE_SCHEMA,
  clearEonCityDataSurvivalState,
  createEonCityDataSurvivalBundle,
  getEonCityDataSurvivalTruth,
  inspectEonCityDataRestore,
  restoreEonCityDataSurvivalBundle,
  verifyEonCityDataSurvivalBundle
} from '../../assets/js/city/c06/eon-city-c06-data-survival.js';
import {
  EON_EXPANSE_W766A_STORAGE_KEY,
  createEonExpanseW766AInitialState,
  createEonExpanseW766APersistence
} from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';
import {
  EON_CITY_W659G_PROGRESSION_STORAGE_KEY,
  readEonCityW659gProgression
} from '../../assets/js/contracts/city/w659g/eon-city-w659g-progression-ledger.js';
import {
  EON_CITY_W737_MISSION_STORAGE_KEY,
  readEonCityW737MissionState
} from '../../assets/js/city/w737/eon-city-w737-missions.js';
import {
  CITY_WORLD_STATE_KEY,
  createCityWorldState
} from '../../assets/js/contracts/city/city-world-state.js';
import {
  EON_PROJECT_DISTRICT_SCHEMA,
  EON_PROJECT_DISTRICT_STORAGE_KEY,
  sanitizeEonProjectDistrictRegistry
} from '../../assets/js/city/eon-city-project-district-manifest.js';
import {
  EON_CITY_PRODUCTIVE_RPG_SCHEMA,
  EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY,
  readEonCityProductiveRpgStore
} from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import {
  EON_CITY_W751_ACTIVITY_STORAGE_KEY,
  EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA,
  readEonCityW751StationActivity
} from '../../assets/js/city/w751/eon-city-w751-productive-stations.js';
import {
  EON_CITY_PROGRESS_RECEIPT_SCHEMA,
  EON_CITY_PROGRESS_STORAGE_KEY,
  readEonCityProgressStore
} from '../../assets/js/contracts/city/eon-city-progress-bridge.js';
import {
  EON_CITY_RESUME_STATE_KEY,
  persistEonCityResumeState
} from '../../assets/js/contracts/city/eon-city-resume-travel.js';
import {
  EON_CITY_VAULT_REVEALS_STORAGE_KEY,
  createEonCityVaultRevealInventory
} from '../../assets/js/contracts/city/eon-city-vault-reveals.js';
import {
  EON_CITY_RT91_SESSION_STORAGE_KEY,
  sanitizeEonCityRt91SessionSave
} from '../../assets/js/city/rt91/eon-city-rt91-session-save.js';
import {
  EON_CITY_AGENT_THEATRE_STORAGE_KEY,
  sanitizeEonCityAgentTheatreStore
} from '../../assets/js/city/eon-city-genuine-agent-theatre.js';
import {
  EONBOT_JOB_FABRIC_STORAGE_KEY,
  sanitizeEonbotJobFabricState
} from '../../assets/js/chat/eonbot-job-fabric.js';
import {
  EON_CITY_LIVING_NEXUS_STORAGE_KEY,
  sanitizeEonCityLivingNexusState
} from '../../assets/js/city/eon-city-living-nexus-hybrid.js';
import {
  EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY,
  sanitizeEonCityLivingNexusEncounterState
} from '../../assets/js/city/eon-city-living-nexus-encounters.js';
import {
  EON_COMMAND_DISTRICT_STORAGE_KEY,
  normalizeCommandDistrictState
} from '../../assets/js/city/eon-city-command-district.js';
import { buildEonDataSurvivalInventory } from '../../assets/js/data-survival/eon-data-survival-inventory.js';

const NOW = 1_754_346_000_000;

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [String(key), String(value)]));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
    dump() { return new Map(values); }
  };
}

function seedAllCityState(storage) {
  const persistence = createEonExpanseW766APersistence({ storage, now: () => NOW });
  assert.equal(persistence.write(createEonExpanseW766AInitialState({ now: NOW })).ok, true);

  const progression = readEonCityW659gProgression({ storage: memoryStorage(), now: NOW });
  storage.setItem(EON_CITY_W659G_PROGRESSION_STORAGE_KEY, JSON.stringify(progression));

  const worldState = createCityWorldState({ now: NOW, citySeed: 'recovery-city-seed', worldId: 'recovery-city-world' });
  worldState.unlockedDistricts = ['command', 'creator', 'archive'];
  worldState.progress.completedObjectives = ['visit-command-centre'];
  worldState.progress.visitCounts = { command: 2, creator: 1 };
  storage.setItem(CITY_WORLD_STATE_KEY, JSON.stringify(worldState));

  storage.setItem(EON_PROJECT_DISTRICT_STORAGE_KEY, JSON.stringify(sanitizeEonProjectDistrictRegistry({
    schema: EON_PROJECT_DISTRICT_SCHEMA, version: 1, updatedAt: NOW, manifests: []
  }, { now: NOW })));

  const missions = readEonCityW737MissionState(memoryStorage());
  storage.setItem(EON_CITY_W737_MISSION_STORAGE_KEY, JSON.stringify(missions));

  const productiveSeed = { schema: EON_CITY_PRODUCTIVE_RPG_SCHEMA, updatedAt: NOW, missions: {} };
  const productiveStorage = memoryStorage({ [EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY]: JSON.stringify(productiveSeed) });
  storage.setItem(EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY, JSON.stringify(readEonCityProductiveRpgStore(productiveStorage)));

  const stationsSeed = { schema: EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA, updatedAt: NOW, stations: {} };
  const stationStorage = memoryStorage({ [EON_CITY_W751_ACTIVITY_STORAGE_KEY]: JSON.stringify(stationsSeed) });
  storage.setItem(EON_CITY_W751_ACTIVITY_STORAGE_KEY, JSON.stringify(readEonCityW751StationActivity(stationStorage)));

  const progressSeed = { schema: EON_CITY_PROGRESS_RECEIPT_SCHEMA, revision: 0, updatedAt: NOW, receipts: [] };
  const progressStorage = memoryStorage({ [EON_CITY_PROGRESS_STORAGE_KEY]: JSON.stringify(progressSeed) });
  storage.setItem(EON_CITY_PROGRESS_STORAGE_KEY, JSON.stringify(readEonCityProgressStore({ storage: progressStorage })));

  const pose = {
    player: { x: 2, y: 0.2, z: 3, heading: 0.5 },
    camera: { alpha: 1, beta: 1.1, radius: 12, target: { x: 2, y: 1, z: 3 } }
  };
  assert.equal(persistEonCityResumeState({ pose, lastDestinationId: 'command-centre', reason: 'local-page-exit' }, { storage, now: NOW }).ok, true);
  storage.setItem(EON_CITY_VAULT_REVEALS_STORAGE_KEY, JSON.stringify(createEonCityVaultRevealInventory({ now: NOW })));
  storage.setItem(EON_CITY_RT91_SESSION_STORAGE_KEY, JSON.stringify(sanitizeEonCityRt91SessionSave({
    livingFrontier: { worldSeed: 'recovery-seed', currentWorldId: 'signal-frontier', updatedAt: NOW },
    campaigns: { signalMastery: { completedMissionIds: ['signal-mastery:gateway-overlook:relay-recovery'] } },
    updatedAt: NOW
  })));
  storage.setItem(EON_CITY_AGENT_THEATRE_STORAGE_KEY, JSON.stringify(sanitizeEonCityAgentTheatreStore({}, { now: NOW })));
  storage.setItem(EONBOT_JOB_FABRIC_STORAGE_KEY, JSON.stringify(sanitizeEonbotJobFabricState({}, { now: NOW })));
  storage.setItem(EON_CITY_LIVING_NEXUS_STORAGE_KEY, JSON.stringify(sanitizeEonCityLivingNexusState({ destination: 'expanse' })));
  storage.setItem(EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY, JSON.stringify(sanitizeEonCityLivingNexusEncounterState({}, { now: NOW })));
  storage.setItem(EON_COMMAND_DISTRICT_STORAGE_KEY, JSON.stringify(normalizeCommandDistrictState({ stageId: 'meet-eonbot', updatedAt: new Date(NOW).toISOString() }, { now: NOW })));
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

test('C06 manifest explicitly covers flagship, Living Nexus, Command District and Agent Theatre continuity in sixteen closed records', () => {
  const truth = getEonCityDataSurvivalManifestTruth();
  assert.equal(EON_CITY_DATA_SURVIVAL_RECORDS.length, 16);
  assert.equal(truth.recordCount, 16);
  assert.equal(truth.signalFrontierCovered, true);
  assert.equal(truth.myFrontierCovered, true);
  assert.equal(truth.stormSectorCovered, true);
  assert.equal(truth.privateProjectContentAllowed, false);
  assert.equal(EON_CITY_DATA_SURVIVAL_RECORDS[0].key, EON_EXPANSE_W766A_STORAGE_KEY);
  assert.equal(EON_CITY_DATA_SURVIVAL_RECORDS.every((row) => row.privateContentAllowed === false), true);
  for (const key of [
    CITY_WORLD_STATE_KEY, EON_PROJECT_DISTRICT_STORAGE_KEY,
    EON_CITY_RT91_SESSION_STORAGE_KEY, EON_CITY_AGENT_THEATRE_STORAGE_KEY, EONBOT_JOB_FABRIC_STORAGE_KEY,
    EON_CITY_LIVING_NEXUS_STORAGE_KEY, EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY, EON_COMMAND_DISTRICT_STORAGE_KEY
  ]) {
    assert.ok(EON_CITY_DATA_SURVIVAL_RECORDS.some((row) => row.key === key), `missing recovery record ${key}`);
  }
});

test('C06 creates and verifies one digest-bound bundle for all declared City state', async () => {
  const storage = memoryStorage();
  seedAllCityState(storage);
  const bundle = await createEonCityDataSurvivalBundle({ storage, now: NOW, cryptoApi: webcrypto });
  assert.equal(bundle.schema, EON_CITY_DATA_SURVIVAL_BUNDLE_SCHEMA);
  assert.equal(bundle.recordCount, 16);
  assert.equal(bundle.records.length, 16);
  assert.equal(new Set(bundle.records.map((row) => row.key)).size, 16);
  assert.equal(bundle.records.every((row) => row.digest.length > 30), true);
  assert.equal(bundle.containsPrivateProjectContent, false);
  assert.equal(bundle.containsCredentials, false);
  assert.equal(bundle.containsRawMedia, false);
  const verified = await verifyEonCityDataSurvivalBundle(bundle, { now: NOW, cryptoApi: webcrypto });
  assert.equal(verified.ok, true, verified.reason);
  assert.equal(verified.bundle.integrity.payloadDigest, bundle.integrity.payloadDigest);
});

test('C06 rejects tampering, unknown fields carrying private content and future versions', async () => {
  const storage = memoryStorage();
  seedAllCityState(storage);
  const bundle = await createEonCityDataSurvivalBundle({ storage, now: NOW, cryptoApi: webcrypto });

  const tampered = structuredClone(bundle);
  tampered.records[0].value.safePosition.x += 1;
  assert.equal((await verifyEonCityDataSurvivalBundle(tampered, { now: NOW, cryptoApi: webcrypto })).ok, false);

  const privateField = structuredClone(bundle);
  privateField.records[0].value.rawPrompt = 'must-not-survive';
  const privateResult = await verifyEonCityDataSurvivalBundle(privateField, { now: NOW, cryptoApi: webcrypto });
  assert.equal(privateResult.ok, false);
  assert.match(privateResult.reason, /record-invalid/);

  const future = structuredClone(bundle);
  future.version = 2;
  assert.equal((await verifyEonCityDataSurvivalBundle(future, { now: NOW, cryptoApi: webcrypto })).reason, 'city-data-header-invalid');
});

test('C06 restore requires preview plus typed confirmation and applies all records atomically', async () => {
  const source = memoryStorage();
  seedAllCityState(source);
  const bundle = await createEonCityDataSurvivalBundle({ storage: source, now: NOW, cryptoApi: webcrypto });
  const target = memoryStorage({ unrelated: 'preserve-me' });
  const preview = await inspectEonCityDataRestore(bundle, { storage: target, now: NOW, cryptoApi: webcrypto });
  assert.equal(preview.ok, true);
  assert.equal(preview.writeStarted, false);
  assert.equal(preview.changes.length, 16);
  assert.equal((await restoreEonCityDataSurvivalBundle(bundle, { storage: target, now: NOW, cryptoApi: webcrypto })).reason, 'explicit-user-action-required');
  assert.equal((await restoreEonCityDataSurvivalBundle(bundle, { storage: target, now: NOW, cryptoApi: webcrypto, explicitUserAction: true, confirmation: EON_CITY_DATA_RESTORE_CONFIRMATION })).reason, 'reviewed-preview-required');
  const restored = await restoreEonCityDataSurvivalBundle(bundle, {
    storage: target, now: NOW, cryptoApi: webcrypto, explicitUserAction: true,
    confirmation: EON_CITY_DATA_RESTORE_CONFIRMATION, reviewedPreviewId: preview.previewId
  });
  assert.equal(restored.ok, true, restored.reason);
  assert.equal(restored.recordCount, 16);
  assert.equal(target.getItem('unrelated'), 'preserve-me');
  for (const row of bundle.records) assert.equal(stable(JSON.parse(target.getItem(row.key))), stable(row.value));
});

test('C06 restores exact prior bytes when any write or post-write verification fails', async () => {
  const source = memoryStorage();
  seedAllCityState(source);
  const bundle = await createEonCityDataSurvivalBundle({ storage: source, now: NOW, cryptoApi: webcrypto });
  const base = memoryStorage({ unrelated: 'safe', [EON_CITY_W659G_PROGRESSION_STORAGE_KEY]: '{"old":true}' });
  const before = base.dump();
  let writes = 0;
  const failing = {
    get length() { return base.length; }, key: (index) => base.key(index), getItem: (key) => base.getItem(key), removeItem: (key) => base.removeItem(key),
    setItem(key, value) {
      writes += 1;
      if (writes === 3) throw new Error('injected-write-failure');
      base.setItem(key, value);
    }
  };
  const preview = await inspectEonCityDataRestore(bundle, { storage: failing, now: NOW, cryptoApi: webcrypto });
  const result = await restoreEonCityDataSurvivalBundle(bundle, {
    storage: failing, now: NOW, cryptoApi: webcrypto, explicitUserAction: true,
    confirmation: EON_CITY_DATA_RESTORE_CONFIRMATION, reviewedPreviewId: preview.previewId
  });
  assert.equal(result.ok, false);
  assert.equal(result.atomic, true);
  assert.equal(result.rollbackAttempted, true);
  assert.equal(result.rollbackVerified, true);
  assert.deepEqual([...base.dump()], [...before]);
});

test('C06 deletion removes only declared City records and verifies zero residue', () => {
  const storage = memoryStorage({ unrelated: 'keep' });
  seedAllCityState(storage);
  assert.equal(clearEonCityDataSurvivalState({ storage }).reason, 'explicit-user-action-required');
  assert.equal(clearEonCityDataSurvivalState({ storage, explicitUserAction: true }).reason, 'backup-acknowledgement-required');
  const result = clearEonCityDataSurvivalState({
    storage, explicitUserAction: true, backupAcknowledged: true, confirmation: EON_CITY_DATA_DELETE_CONFIRMATION
  });
  assert.equal(result.ok, true);
  assert.equal(result.removed, 16);
  assert.equal(result.zeroDeclaredResidue, true);
  assert.equal(storage.getItem('unrelated'), 'keep');
  assert.equal(EON_CITY_DATA_SURVIVAL_RECORDS.every((row) => storage.getItem(row.key) == null), true);
});

test('C06 joins observed City keys to the inventory without reading values', async () => {
  const storage = memoryStorage();
  seedAllCityState(storage);
  const inventory = await buildEonDataSurvivalInventory({ localStorage: storage, sessionStorage: memoryStorage(), indexedDbNames: [], cacheNames: [], now: NOW });
  assert.equal(inventory.valuesIncluded, false);
  assert.equal(inventory.counts.cityStateDeclared, 16);
  assert.equal(inventory.counts.cityStateObserved, 16);
  assert.equal(inventory.counts.openWorldStateObserved, 1);
  const cityItems = inventory.items.filter((row) => row.cityStateAuthority);
  assert.equal(cityItems.length, 16);
  assert.equal(cityItems.every((row) => row.valueIncluded === false && row.citySchema), true);
});

test('C06 truth never claims cloud sync, raw media, credentials or private project content', () => {
  const truth = getEonCityDataSurvivalTruth();
  assert.equal(truth.manifestRecordCount, 16);
  assert.equal(truth.atomicRestore, true);
  assert.equal(truth.rollbackVerifiedOnFailure, true);
  assert.equal(truth.verifiedDeletion, true);
  assert.equal(truth.privateProjectContentStored, false);
  assert.equal(truth.credentialsStored, false);
  assert.equal(truth.rawMediaStored, false);
  assert.equal(truth.networkRequestCreated, false);
});
