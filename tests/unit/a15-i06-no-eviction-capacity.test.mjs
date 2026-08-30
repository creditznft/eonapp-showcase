import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EonCapacityError,
  evaluateEonCapacity,
  getEonCapacityAuthorityTruth,
  inspectOriginStorageCapacity
} from '../../assets/js/storage/eon-capacity-authority.js';
import {
  captureEonStorageSnapshot,
  restoreEonStorageSnapshot,
  verifyEonStorageSnapshot
} from '../../assets/js/storage/eon-storage-transaction.js';
import {
  EON_LIBRARY_STORAGE_KEY,
  EON_PROJECTS_STORAGE_KEY,
  createLibraryItem,
  createProject,
  getLibraryCapacityCounts,
  getProjectCapacityCounts,
  loadLibrary,
  loadProjects
} from '../../assets/js/utils/eon-workspace-store.js';
import {
  EON_LIBRARY_INDEX_STORAGE_KEY,
  getLibraryIndexTruth,
  rebuildLibraryIndexFromLegacy
} from '../../assets/js/storage/eon-library-index.js';
import {
  EON_CREATOR_JOB_STORAGE_KEY,
  createCreatorJob,
  loadCreatorJobs
} from '../../assets/js/create/creator-job-lifecycle.js';
import {
  EON_CREATOR_LIBRARY_STORAGE_KEY,
  listCreatorAssets,
  saveCreatorAsset
} from '../../assets/js/create/creator-library-store.js';
import {
  EON_W631_STORAGE_KEY,
  loadW631State,
  syncProjectOperatingRecord
} from '../../assets/js/workspace/eon-project-operating-system.js';
import { EON_FORGE_QUICK_BUILD } from '../../assets/js/forge/eon-forge-quick-build.js';
import { EON_CAPABILITY_SERVICE_SCHEMA, getFreeCapabilitySnapshot, setCurrentCapabilitySnapshot } from '../../assets/js/capabilities/eon-capability-service.js';

class MemoryStorage {
  constructor(seed = {}) { this.data = { ...seed }; }
  get length() { return Object.keys(this.data).length; }
  key(index) { return Object.keys(this.data)[index] || null; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; }
  setItem(key, value) { this.data[key] = String(value); }
  removeItem(key) { delete this.data[key]; }
}

const fixedNow = () => Date.parse('2026-08-04T16:00:00.000Z');
const timestamp = '2026-08-04T16:00:00.000Z';

function projectRow(index, status = 'active') {
  return {
    id: `project_${index}`,
    title: `Project ${index}`,
    summary: 'Preserved local work',
    status,
    tasks: [],
    artifacts: [],
    automationIds: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function libraryRow(index, lifecycleState = 'active') {
  return {
    id: `library_${index}`,
    type: 'note',
    title: `Library ${index}`,
    content: `Body ${index}`,
    tags: [],
    useCount: 0,
    lifecycleState,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function withGlobalStorage(storage, callback) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  try { return callback(); }
  finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
}

test('I06 capacity authority distinguishes active, archived and total records and offers only explicit actions', () => {
  const decision = evaluateEonCapacity({
    resourceId: 'ordinary-projects',
    activeCount: 2,
    archivedCount: 5,
    totalCount: 7,
    requestedCount: 1,
    requestedTotalCount: 1
  }, { limitOverrides: { 'ordinary-projects': 2 }, now: fixedNow });
  assert.equal(decision.allowed, false);
  assert.equal(decision.activeCount, 2);
  assert.equal(decision.archivedCount, 5);
  assert.equal(decision.totalCount, 7);
  assert.equal(decision.silentEviction, false);
  assert.equal(decision.automaticDeletion, false);
  assert.deepEqual(decision.choices.map((choice) => choice.id), ['archive', 'export', 'delete', 'upgrade']);
  assert.ok(decision.choices.every((choice) => choice.requiresExplicitUserAction && !choice.automatic));
  assert.equal(getEonCapacityAuthorityTruth().capabilityLimitInjectionSupported, true);
});

test('I06 origin storage reserve fails closed when remaining quota is below the institutional reserve', async () => {
  const result = await inspectOriginStorageCapacity({
    storageManager: { estimate: async () => ({ usage: 96 * 1024 * 1024, quota: 100 * 1024 * 1024 }) },
    now: fixedNow
  });
  assert.equal(result.available, true);
  assert.equal(result.belowSafetyReserve, true);
  assert.equal(result.writeAuthorized, false);
});

test('I06 exact storage transactions restore absent and present keys byte-for-byte', () => {
  const storage = new MemoryStorage({ alpha: 'one', beta: 'two' });
  const snapshot = captureEonStorageSnapshot(['alpha', 'beta', 'gamma'], { storage });
  storage.setItem('alpha', 'changed');
  storage.removeItem('beta');
  storage.setItem('gamma', 'new');
  assert.equal(verifyEonStorageSnapshot(snapshot, { storage }), false);
  const restored = restoreEonStorageSnapshot(snapshot, { storage });
  assert.equal(restored.ok, true);
  assert.equal(verifyEonStorageSnapshot(snapshot, { storage }), true);
  assert.equal(storage.getItem('alpha'), 'one');
  assert.equal(storage.getItem('beta'), 'two');
  assert.equal(storage.getItem('gamma'), null);
});

test('I06 the 161st active ordinary Project is blocked without changing or evicting any stored byte', () => {
  const seed = JSON.stringify({ schema: 'eon.projects.v3', createdAt: timestamp, updatedAt: timestamp, projects: Array.from({ length: 160 }, (_, index) => projectRow(index + 1)) });
  const storage = new MemoryStorage({ [EON_PROJECTS_STORAGE_KEY]: seed });
  assert.throws(
    () => createProject({ title: 'Project 161', summary: 'Must not evict' }, { storage, now: fixedNow, limitOverrides: { 'ordinary-projects': 160, 'universal-projects': 160 } }),
    (error) => error instanceof EonCapacityError && error.decision.currentCount === 160
  );
  assert.equal(storage.getItem(EON_PROJECTS_STORAGE_KEY), seed);
  assert.equal(loadProjects({ storage }).projects.length, 160);
  assert.equal(loadProjects({ storage }).projects[0].id, 'project_1');
});

test('I06 completed Projects are archived capacity and allow a new active Project without losing history', () => {
  const projects = [...Array.from({ length: 159 }, (_, index) => projectRow(index + 1)), projectRow(160, 'complete')];
  const storage = new MemoryStorage({ [EON_PROJECTS_STORAGE_KEY]: JSON.stringify({ schema: 'eon.projects.v3', projects }) });
  const created = createProject({ title: 'Replacement active slot', summary: 'Archived work remains' }, { storage, now: fixedNow, limitOverrides: { 'ordinary-projects': 160, 'universal-projects': 160 } });
  const counts = getProjectCapacityCounts({ storage });
  assert.equal(created.status, 'active');
  assert.deepEqual(counts, { activeCount: 160, archivedCount: 1, totalCount: 161 });
  assert.ok(loadProjects({ storage }).projects.some((project) => project.id === 'project_160' && project.status === 'complete'));
});

test('I06 the 501st active Library item is blocked without changing or evicting any stored byte', () => {
  const seed = JSON.stringify({ schema: 'eon.library.v3', createdAt: timestamp, updatedAt: timestamp, items: Array.from({ length: 500 }, (_, index) => libraryRow(index + 1)) });
  const storage = new MemoryStorage({ [EON_LIBRARY_STORAGE_KEY]: seed });
  assert.throws(
    () => createLibraryItem({ title: 'Library 501', content: 'Must not evict' }, { storage, now: fixedNow }),
    (error) => error instanceof EonCapacityError && error.decision.currentCount === 500
  );
  assert.equal(storage.getItem(EON_LIBRARY_STORAGE_KEY), seed);
  assert.equal(loadLibrary({ storage }).items.length, 500);
  assert.equal(loadLibrary({ storage }).items[0].id, 'library_1');
});

test('I06 archived Library records remain portable and do not consume an active slot', () => {
  const items = [...Array.from({ length: 499 }, (_, index) => libraryRow(index + 1)), libraryRow(500, 'archived')];
  const storage = new MemoryStorage({ [EON_LIBRARY_STORAGE_KEY]: JSON.stringify({ schema: 'eon.library.v3', items }) });
  createLibraryItem({ title: 'New active item', content: 'Older archive stays' }, { storage, now: fixedNow });
  assert.deepEqual(getLibraryCapacityCounts({ storage }), { activeCount: 500, archivedCount: 1, totalCount: 501 });
  assert.ok(loadLibrary({ storage }).items.some((item) => item.id === 'library_500' && item.lifecycleState === 'archived'));
});

test('I06 unified Library rebuild indexes ordinary items, Project artifacts and Creator assets without copying bodies', () => {
  const storage = new MemoryStorage({
    [EON_LIBRARY_STORAGE_KEY]: JSON.stringify({ schema: 'eon.library.v3', items: [libraryRow(1), libraryRow(2, 'archived')] }),
    [EON_PROJECTS_STORAGE_KEY]: JSON.stringify({ schema: 'eon.projects.v3', projects: [{ ...projectRow(1), artifacts: [{ id: 'artifact_1', type: 'note', title: 'Project note', content: 'private work body', createdAt: timestamp, updatedAt: timestamp }] }] }),
    [EON_CREATOR_LIBRARY_STORAGE_KEY]: JSON.stringify({ schema: 'eon.creator-library.w627d.v1', assets: [{ assetId: 'asset_1', title: 'Creator image', mediaKind: 'image', sha256: 'a'.repeat(64), createdAt: timestamp, updatedAt: timestamp }] })
  });
  const rebuilt = rebuildLibraryIndexFromLegacy({ storage, now: fixedNow });
  assert.equal(rebuilt.ok, true);
  assert.deepEqual(rebuilt.receipt.sourceCounts, { ordinaryLibrary: 2, projectArtifacts: 1, creatorAssets: 1 });
  const truth = getLibraryIndexTruth({ storage });
  assert.equal(truth.recordCount, 4);
  assert.equal(truth.archivedRecords, 1);
  assert.equal(truth.contentBodiesStored, false);
  assert.doesNotMatch(storage.getItem(EON_LIBRARY_INDEX_STORAGE_KEY), /private work body/);
});

test('I06 Creator job capacity blocks a new active job and preserves every prior job', () => {
  const storage = new MemoryStorage();
  const options = { storage, explicitUserAction: true, now: fixedNow, limitOverrides: { 'creator-jobs': 2 } };
  assert.equal(createCreatorJob({ intentId: 'one', mediaKind: 'image', rail: 'guide' }, options).ok, true);
  assert.equal(createCreatorJob({ intentId: 'two', mediaKind: 'image', rail: 'guide' }, options).ok, true);
  const before = storage.getItem(EON_CREATOR_JOB_STORAGE_KEY);
  const blocked = createCreatorJob({ intentId: 'three', mediaKind: 'image', rail: 'guide' }, options);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'capacity-reached');
  assert.equal(storage.getItem(EON_CREATOR_JOB_STORAGE_KEY), before);
  assert.equal(loadCreatorJobs({ storage }).length, 2);
});

test('I06 Creator asset capacity blocks a new asset and preserves metadata and indexes', async () => {
  const storage = new MemoryStorage();
  const options = { storage, explicitUserAction: true, now: fixedNow, limitOverrides: { 'creator-assets': 2 } };
  for (const index of [1, 2]) {
    const saved = await saveCreatorAsset({ jobState: 'saved', title: `Asset ${index}`, sha256: String(index).repeat(64), digestMatched: true }, options);
    assert.equal(saved.ok, true);
  }
  const before = storage.getItem(EON_CREATOR_LIBRARY_STORAGE_KEY);
  const blocked = await saveCreatorAsset({ jobState: 'saved', title: 'Asset 3', sha256: '3'.repeat(64), digestMatched: true }, options);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'capacity-reached');
  assert.equal(storage.getItem(EON_CREATOR_LIBRARY_STORAGE_KEY), before);
  assert.equal(listCreatorAssets({ storage }).length, 2);
});

test('I06 Forge blocks the 25th active project and the 13th revision without slicing older work', () => {
  const storage = new MemoryStorage();
  setCurrentCapabilitySnapshot({ schema: EON_CAPABILITY_SERVICE_SCHEMA, tierId: 'institutional-baseline', featureGroups: [], limits: {}, unlocks: [], issuedAt: Date.now(), expiresAt: Date.now() + 60000, serverAuthoritative: false }, { emit: false });
  withGlobalStorage(storage, () => {
    for (let index = 1; index <= 24; index += 1) {
      const project = EON_FORGE_QUICK_BUILD.buildProject({ title: `Forge ${index}`, brief: `Build safe local project number ${index}` });
      assert.equal(EON_FORGE_QUICK_BUILD.saveProject(project), true);
    }
    const beforeProjects = storage.getItem(EON_FORGE_QUICK_BUILD.STORE_KEY);
    const blockedProject = EON_FORGE_QUICK_BUILD.buildProject({ title: 'Forge 25', brief: 'Must not replace an older project' });
    assert.equal(EON_FORGE_QUICK_BUILD.saveProject(blockedProject), false);
    assert.equal(EON_FORGE_QUICK_BUILD.getLastCapacityDecision().resourceId, 'forge-projects');
    assert.equal(storage.getItem(EON_FORGE_QUICK_BUILD.STORE_KEY), beforeProjects);
    assert.equal(EON_FORGE_QUICK_BUILD.readProjects().length, 24);

    const existing = EON_FORGE_QUICK_BUILD.readProjects()[0];
    const overRevision = {
      ...existing,
      history: Array.from({ length: 13 }, (_, index) => ({ id: `snapshot_${index}`, label: `Revision ${index}`, at: timestamp, files: existing.files }))
    };
    const beforeRevision = storage.getItem(EON_FORGE_QUICK_BUILD.STORE_KEY);
    assert.equal(EON_FORGE_QUICK_BUILD.saveProject(overRevision), false);
    assert.equal(EON_FORGE_QUICK_BUILD.getLastCapacityDecision().resourceId, 'forge-snapshots');
    assert.equal(storage.getItem(EON_FORGE_QUICK_BUILD.STORE_KEY), beforeRevision);
    assert.equal(EON_FORGE_QUICK_BUILD.readProjects()[0].history.length, 1);
  });
  setCurrentCapabilitySnapshot(getFreeCapabilitySnapshot(), { emit: false });
});

test('I06 W631 preserves over-cap legacy records and blocks only the next write', () => {
  const projects = Object.fromEntries(Array.from({ length: 161 }, (_, index) => {
    const id = `w631_${index + 1}`;
    return [id, { projectId: id, title: `Continuity ${index + 1}`, lifecycleState: 'active', versions: [], outcomes: [], updatedAt: timestamp }];
  }));
  const seed = JSON.stringify({ schema: 'eon.project-operating-system.w631.v1', projects, automations: {}, createdAt: timestamp, updatedAt: timestamp });
  const storage = new MemoryStorage({ [EON_W631_STORAGE_KEY]: seed });
  assert.equal(Object.keys(loadW631State({ storage }).projects).length, 161);
  assert.equal(storage.getItem(EON_W631_STORAGE_KEY), seed, 'loading an over-cap legacy store must not rewrite or slice it');
  const blocked = syncProjectOperatingRecord({ id: 'w631_162', title: 'Blocked continuity' }, { storage, now: timestamp });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'capacity-reached');
  assert.equal(storage.getItem(EON_W631_STORAGE_KEY), seed);
});
