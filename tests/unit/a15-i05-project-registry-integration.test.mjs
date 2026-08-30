import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createCreatorJob, transitionCreatorJob } from '../../assets/js/create/creator-job-lifecycle.js';
import { saveCreatorAsset } from '../../assets/js/create/creator-library-store.js';
import { createProject, deleteProject, updateProject } from '../../assets/js/utils/eon-workspace-store.js';
import { syncProjectOperatingRecord } from '../../assets/js/workspace/eon-project-operating-system.js';
import { loadProjectRegistry } from '../../assets/js/projects/eon-project-registry.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

const now = () => Date.parse('2026-08-04T15:00:00.000Z');

test('I05 ordinary Projects and W631 share one canonical identity', () => {
  const storage = memoryStorage();
  const project = createProject({ title: 'Launch', summary: 'Ship safely', status: 'paused' }, { storage });
  const operating = syncProjectOperatingRecord(project, { storage, continueRoute: '/workspace', now: '2026-08-04T15:01:00.000Z' });
  assert.equal(operating.ok, true);
  let registry = loadProjectRegistry({ storage });
  assert.equal(registry.records[project.id].sources.length, 2);
  assert.equal(registry.records[project.id].lifecycleState, 'active');

  updateProject(project.id, { status: 'complete' }, { storage });
  registry = loadProjectRegistry({ storage });
  assert.equal(registry.records[project.id].lifecycleState, 'archived');
  assert.equal(deleteProject(project.id, { storage }), true);
  registry = loadProjectRegistry({ storage });
  assert.ok(registry.records[project.id], 'W631 continuity keeps the canonical record after ordinary deletion');
  assert.equal(registry.records[project.id].sources.length, 1);
});

test('I05 Creator jobs and assets remain one lifecycle identity', async () => {
  const storage = memoryStorage();
  const created = createCreatorJob({ intentId: 'intent_one', mediaKind: 'image', rail: 'guide' }, { storage, explicitUserAction: true, now });
  assert.equal(created.ok, true);
  let result = transitionCreatorJob(created.job.jobId, 'preparing', {}, { storage, explicitUserAction: true, now });
  assert.equal(result.ok, true);
  result = transitionCreatorJob(created.job.jobId, 'running', {}, { storage, authoritativeRailEvent: true, now });
  assert.equal(result.ok, true);
  result = transitionCreatorJob(created.job.jobId, 'complete', { output: { sha256: 'c'.repeat(64), contentType: 'image/png', bytes: 42 } }, { storage, authoritativeRailEvent: true, now });
  assert.equal(result.ok, true);
  result = transitionCreatorJob(created.job.jobId, 'saved', {}, { storage, explicitUserAction: true, now });
  assert.equal(result.ok, true);
  const asset = await saveCreatorAsset({
    sourceJobId: created.job.jobId,
    title: 'Poster',
    mediaKind: 'image',
    sha256: 'c'.repeat(64),
    digestMatched: true,
    jobState: 'saved'
  }, { storage, explicitUserAction: true, now });
  assert.equal(asset.ok, true);
  const registry = loadProjectRegistry({ storage });
  const projectId = `project_creator-job_${created.job.jobId}`;
  assert.equal(registry.records[projectId].lifecycleState, 'archived');
  assert.equal(registry.records[projectId].sources.length, 2);
  assert.deepEqual(registry.records[projectId].artifactRefs, [asset.asset.assetId]);
});

test('I05 active source wires every project family and Continue to the registry', () => {
  const source = (file) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
  assert.match(source('assets/js/utils/eon-workspace-store.js'), /registerOrdinaryProject/);
  assert.match(source('assets/js/workspace/eon-project-operating-system.js'), /namespace: 'w631'/);
  assert.match(source('assets/js/create/creator-job-lifecycle.js'), /registerCreatorJob/);
  assert.match(source('assets/js/create/creator-library-store.js'), /registerCreatorAssetProject/);
  assert.match(source('assets/js/forge/eon-forge-quick-build.js'), /registerForgeProject/);
  assert.match(source('assets/js/eon-app-shell.js'), /eon-project-registry-bootstrap/);
  assert.match(source('assets/js/retention/eon-continue-resolver.js'), /listProjectRegistryRecords/);
});
