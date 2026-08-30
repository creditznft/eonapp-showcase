import assert from 'node:assert/strict';
import test from 'node:test';
import { W403_LEAN_MEDIA_LIFECYCLE_CONTRACT, validateW403LeanMediaLifecycleContract } from '../../config/w403-lean-media-lifecycle-contract.mjs';
import { buildCreatorMediaLifecycleExport, createCreatorMediaLifecycleEntry, CREATOR_MEDIA_ROLES, getCreatorMediaLifecycleTruth } from '../../assets/js/creator/media-lifecycle.js';
import { inspectW403LeanMediaLifecycle } from '../../scripts/w403-lean-media-lifecycle-gate.mjs';

test('W403 treats source/cache as temporary and final output as user-saved only', () => {
  assert.deepEqual(validateW403LeanMediaLifecycleContract(), []);
  assert.deepEqual(CREATOR_MEDIA_ROLES.map((entry) => entry.id), W403_LEAN_MEDIA_LIFECYCLE_CONTRACT.roles);
  const source = createCreatorMediaLifecycleEntry({ title: 'Raw permitted clip', role: 'source', format: 'MP4' });
  const final = createCreatorMediaLifecycleEntry({ title: 'Final vertical cut', role: 'final-output', format: '1080×1920 MP4' });
  assert.equal(source.keep, false);
  assert.equal(source.retention, 'page-memory-until-task-close');
  assert.equal(final.keep, true);
  assert.equal(final.userSaveRequired, true);
  assert.equal(getCreatorMediaLifecycleTruth().mediaBodyStored, false);
});

test('W403 refuses media bodies and secret-looking lifecycle metadata', () => {
  assert.throws(() => createCreatorMediaLifecycleEntry({ title: 'Video', role: 'source', blob: {} }), /metadata only/i);
  assert.throws(() => createCreatorMediaLifecycleEntry({ title: 'Provider', role: 'final-output', note: 'api key: example-secret-123456789' }), /secret/i);
});

test('W403 export carries only lifecycle metadata and static gate passes', () => {
  const entry = createCreatorMediaLifecycleEntry({ title: 'Final social video', role: 'final-output' });
  const exported = buildCreatorMediaLifecycleExport([entry]);
  assert.equal(exported.entries.length, 1);
  assert.match(exported.limitations.join(' '), /No original footage/i);
  const report = inspectW403LeanMediaLifecycle();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 8);
});
