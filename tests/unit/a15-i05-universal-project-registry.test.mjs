import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_PROJECT_REGISTRY_STORAGE_KEY,
  getProjectRegistryTruth,
  loadProjectRegistry,
  projectLifecycleFromOperationalStatus,
  registerProjectSource
} from '../../assets/js/projects/eon-project-registry.js';
import {
  inspectLegacyProjectSources,
  migrateLegacyProjects,
  rollbackProjectMigration
} from '../../assets/js/projects/eon-project-registry-migration.js';

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); }
  };
}

const fixedNow = () => Date.parse('2026-08-04T14:30:00.000Z');

function legacySeed() {
  return {
    'eon:projects:v3': JSON.stringify({
      schema: 'eon.projects.v3',
      projects: [
        { id: 'project_alpha', title: 'Alpha', summary: 'Core project', status: 'active', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-03T00:00:00.000Z' },
        { id: 'project_done', title: 'Finished', status: 'complete', createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-02T00:00:00.000Z' }
      ]
    }),
    'eon:workspace:projects:v1': JSON.stringify({ projects: [{ id: 'legacy_workspace', title: 'Legacy workspace', status: 'paused' }] }),
    'eon:project-operating-system:w631:v1': JSON.stringify({
      schema: 'eon.project-operating-system.w631.v1',
      projects: {
        project_alpha: { projectId: 'project_alpha', title: 'Alpha continuity', outcome: 'Continue Alpha', continueRoute: '/projects', updatedAt: '2026-08-04T00:00:00.000Z' },
        operating_only: { projectId: 'operating_only', title: 'Operating only', outcome: 'Legacy record', updatedAt: '2026-08-02T00:00:00.000Z' }
      }
    }),
    'eon:forge:projects:v1': JSON.stringify([{ id: 'forge_site', title: 'Forge site', brief: 'Build a site', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-04T00:00:00.000Z' }]),
    'eon:creator-jobs:v1': JSON.stringify({ jobs: [{ jobId: 'creatorjob_one', safeLabel: 'Poster', state: 'saved', createdAt: '2026-08-02T00:00:00.000Z', updatedAt: '2026-08-04T00:00:00.000Z' }] }),
    'eon:creator-library:v1': JSON.stringify({ assets: [
      { assetId: 'asset_one', sourceJobId: 'creatorjob_one', title: 'Poster v1', sha256: 'a'.repeat(64), createdAt: '2026-08-03T00:00:00.000Z' },
      { assetId: 'asset_orphan', sourceJobId: '', title: 'Orphan-safe output', sha256: 'b'.repeat(64), createdAt: '2026-08-03T00:00:00.000Z' }
    ] })
  };
}

test('I05 lifecycle has one active/archive authority without treating paused as archived', () => {
  assert.equal(projectLifecycleFromOperationalStatus('active'), 'active');
  assert.equal(projectLifecycleFromOperationalStatus('paused'), 'active');
  assert.equal(projectLifecycleFromOperationalStatus('complete'), 'archived');
  assert.equal(projectLifecycleFromOperationalStatus('archived'), 'archived');
  assert.equal(projectLifecycleFromOperationalStatus('deleted'), 'archived');
});

test('I05 inspects all legacy sources without mutating them', async () => {
  const storage = memoryStorage(legacySeed());
  const before = storage.snapshot();
  const inspected = await inspectLegacyProjectSources({ storage });
  assert.equal(inspected.ok, true);
  assert.deepEqual(inspected.sourceSnapshots.map((row) => row.count), [2, 1, 2, 1, 1, 2]);
  assert.equal(inspected.candidates.length, 9);
  assert.deepEqual(storage.snapshot(), before);
});

test('I05 migration merges shared identities, preserves every source and is idempotent', async () => {
  const storage = memoryStorage(legacySeed());
  const sourceBefore = Object.fromEntries(Object.entries(storage.snapshot()).filter(([key]) => key !== EON_PROJECT_REGISTRY_STORAGE_KEY));
  const first = await migrateLegacyProjects({ storage, explicitUserAction: true, now: fixedNow });
  assert.equal(first.ok, true);
  const state = loadProjectRegistry({ storage, now: fixedNow });
  assert.equal(Object.keys(state.records).length, 7);
  assert.equal(state.records.project_alpha.sources.length, 2);
  assert.ok(state.records.project_forge_forge_site);
  assert.ok(state.records['project_creator-job_creatorjob_one']);
  assert.ok(state.records['project_creator-asset_asset_orphan']);
  assert.deepEqual(Object.fromEntries(Object.entries(storage.snapshot()).filter(([key]) => key !== EON_PROJECT_REGISTRY_STORAGE_KEY)), sourceBefore);
  const truth = getProjectRegistryTruth({ storage });
  assert.equal(truth.totalProjects, 7);
  assert.equal(truth.sourceBodiesMutated, false);

  const second = await migrateLegacyProjects({ storage, automaticIndexOnly: true, now: fixedNow });
  assert.equal(second.ok, true);
  assert.equal(second.receipt.receiptId, first.receipt.receiptId);
  assert.equal(Object.keys(loadProjectRegistry({ storage }).records).length, 7);
  assert.equal(loadProjectRegistry({ storage }).migrations.length, 1);
});

test('I05 rollback restores the exact pre-migration registry and never touches legacy stores', async () => {
  const storage = memoryStorage(legacySeed());
  const seeded = registerProjectSource({ namespace: 'ordinary', sourceId: 'project_existing', projectId: 'project_existing', preserveSourceId: true, title: 'Existing' }, { storage, now: fixedNow });
  assert.equal(seeded.ok, true);
  const beforeRegistry = loadProjectRegistry({ storage });
  const sourceBefore = Object.fromEntries(Object.entries(storage.snapshot()).filter(([key]) => key !== EON_PROJECT_REGISTRY_STORAGE_KEY));
  const migrated = await migrateLegacyProjects({ storage, explicitUserAction: true, now: fixedNow });
  assert.equal(migrated.ok, true);
  const rolledBack = await rollbackProjectMigration(migrated.receipt.receiptId, { storage, explicitUserAction: true, confirmed: true, now: fixedNow });
  assert.equal(rolledBack.ok, true);
  const after = loadProjectRegistry({ storage });
  assert.deepEqual(Object.keys(after.records).sort(), Object.keys(beforeRegistry.records).sort());
  assert.equal(after.records.project_existing.title, 'Existing');
  assert.equal(after.migrations.length, 0);
  assert.deepEqual(Object.fromEntries(Object.entries(storage.snapshot()).filter(([key]) => key !== EON_PROJECT_REGISTRY_STORAGE_KEY)), sourceBefore);
});

test('I05 registry fails closed when persistence cannot be verified', () => {
  const storage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  const result = registerProjectSource({ namespace: 'ordinary', sourceId: 'project_fail', title: 'Fail' }, { storage, now: fixedNow });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'write-verification-failed');
});
