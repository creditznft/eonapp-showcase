import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonSharePack, EON_UNIVERSAL_POST_DESTINATIONS, shareEonSharePack } from '../../assets/js/share/eon-share-pack.js';
import { W479P_REQUIRED_DESTINATIONS, W479P_TRUTH, validateW479PUniversalManualPostContract } from '../../config/w479p-universal-manual-post-contract.mjs';
import { inspectW479PUniversalManualPost } from '../../scripts/w479p-universal-manual-post-gate.mjs';

test('W479-P0 keeps a universal manual-first post kit without a media body', () => {
  assert.deepEqual(validateW479PUniversalManualPostContract(), []);
  assert.deepEqual(EON_UNIVERSAL_POST_DESTINATIONS.map((item) => item.id), W479P_REQUIRED_DESTINATIONS);
  const pack = createEonSharePack({ title: 'Creator clip', destination: 'youtube', goal: 'Make one clear value promise.' });
  assert.equal(pack.destination.id, 'youtube');
  assert.equal(pack.execution.directPublishing, false);
  assert.equal(pack.execution.hostedMedia, false);
  assert.equal(Object.hasOwn(pack, 'file'), false);
  assert.equal(W479P_TRUTH.referralTransportLive, false);
});

test('W479-P0 requires a visible action before native share', async () => {
  const pack = createEonSharePack({ title: 'Manual post', goal: 'Review before sharing.' });
  const calls = [];
  const blocked = await shareEonSharePack(pack, { nativeShare: async (payload) => calls.push(payload) });
  assert.deepEqual(blocked, { ok: false, reason: 'explicit-user-action-required' });
  assert.equal(calls.length, 0);
});

test('W479-P0 passes a user-selected media file only to a single supported native share call', async () => {
  const pack = createEonSharePack({ title: 'Local clip', destination: 'tiktok', goal: 'Show the workflow.' });
  const file = { name: 'launch-clip.mp4', type: 'video/mp4', size: 2048 };
  const calls = [];
  const result = await shareEonSharePack(pack, {
    userGesture: true,
    file,
    nativeCanShare: (payload) => Array.isArray(payload.files) && payload.files[0] === file,
    nativeShare: async (payload) => calls.push(payload)
  });
  assert.equal(result.ok, true);
  assert.equal(result.fileShared, true);
  assert.equal(result.fileKeptLocal, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].files[0], file);
  assert.equal(Object.hasOwn(result.payload, 'files'), false);
  assert.equal(result.payload.fileName, 'launch-clip.mp4');
  assert.equal(Object.hasOwn(pack, 'file'), false);
});

test('W479-P0 rejects unsupported selected files without making a publishing claim', async () => {
  const pack = createEonSharePack({ title: 'Local kit', goal: 'Keep the fallback clear.' });
  const result = await shareEonSharePack(pack, {
    userGesture: true,
    file: { name: 'notes.pdf', type: 'application/pdf', size: 250 },
    nativeShare: async () => undefined
  });
  assert.equal(result.ok, true);
  assert.equal(result.fileShared, false);
  const report = inspectW479PUniversalManualPost({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /not proof that a platform posted/i);
});
