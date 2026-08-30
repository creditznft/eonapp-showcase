import test from 'node:test';
import assert from 'node:assert/strict';
import { EonDirectJobFabric, getUnifiedDirectJobFabricTruth } from '../../assets/js/direct-byok/direct-job-fabric.js';

test('W626E projects direct and local jobs through one bounded state model', async () => {
  const receipts = [];
  const fabric = new EonDirectJobFabric({ companion: { submit: async () => ({ state: 'queued' }), read: async () => ({ state: 'running' }), cancel: async () => ({ state: 'cancelled' }) }, recordReceipt: (row) => receipts.push(row), now: () => 1000 });
  const job = { jobId: 'eondirectjob_test123', providerId: 'fal', mediaKind: 'image', modelId: 'fal-image-proof', sourceSurface: 'create', safeLabel: 'Direct image', createdAt: new Date(1000).toISOString(), updatedAt: new Date(1000).toISOString() };
  await fabric.submit(job);
  assert.equal((await fabric.refresh(job.jobId)).state, 'running');
  assert.equal((await fabric.cancel(job.jobId, { explicitUserAction: true })).job.state, 'cancelled');
  assert.equal(fabric.importLocalReceipt({ jobId: 'local_job_123', mediaKind: 'video', state: 'completed' }).rail, 'local');
  assert.ok(receipts.every((row) => row.rawPromptIncluded === false));
  assert.equal(getUnifiedDirectJobFabricTruth().eonappServerProxy, false);
});
