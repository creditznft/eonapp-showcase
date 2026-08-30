import test from 'node:test';
import assert from 'node:assert/strict';
import { createCreatorJob, loadCreatorJobs, projectEstablishedRailEvent, transitionCreatorJob } from '../../assets/js/create/creator-job-lifecycle.js';

function memoryStorage() { const map = new Map(); return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }; }

test('W627C enforces lifecycle transitions and keeps complete separate from saved', () => {
  const storage = memoryStorage();
  const created = createCreatorJob({ intentId: 'intent_1', mediaKind: 'image', rail: 'local-runtime' }, { storage, explicitUserAction: true, now: () => 1_700_000_000_000 });
  assert.equal(created.ok, true);
  assert.equal(transitionCreatorJob(created.job.jobId, 'running', {}, { storage, explicitUserAction: true }).reason, 'invalid-transition');
  assert.equal(transitionCreatorJob(created.job.jobId, 'preparing', {}, { storage, explicitUserAction: true }).ok, true);
  assert.equal(projectEstablishedRailEvent(created.job.jobId, { state: 'running', progress: 50 }, { storage }).ok, true);
  assert.equal(projectEstablishedRailEvent(created.job.jobId, { state: 'completed', output: { sha256: 'abc' } }, { storage }).job.state, 'complete');
  assert.equal(loadCreatorJobs({ storage })[0].state, 'complete');
});

test('W627C deleted is terminal', () => {
  const storage = memoryStorage();
  const created = createCreatorJob({ mediaKind: 'video', rail: 'guide' }, { storage, explicitUserAction: true });
  assert.equal(transitionCreatorJob(created.job.jobId, 'deleted', {}, { storage, explicitUserAction: true }).ok, true);
  assert.equal(transitionCreatorJob(created.job.jobId, 'preparing', {}, { storage, explicitUserAction: true }).reason, 'invalid-transition');
});
