import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  cancelComfyUiJob,
  readComfyUiQueueState,
  sanitizeComfyUiCapabilityEvidence
} from '../../assets/js/local-ai/comfyui-local-media.js';
import {
  buildLocalImageProofReceipt,
  inspectLocalImageBlob,
  reopenLocalImageFile
} from '../../assets/js/local-ai/local-image-proof.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const endpoint = 'http://127.0.0.1:8188';

function imageBlob(bytes = [1, 2, 3, 4]) {
  return new Blob([new Uint8Array(bytes)], { type: 'image/png' });
}

function namedImage(bytes, name = 'saved.png') {
  const blob = imageBlob(bytes);
  Object.defineProperty(blob, 'name', { value: name });
  return blob;
}

test('W625A queue state distinguishes queued, running and absent prompt identifiers', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    queue_running: [[1, 'running-id', {}, {}, []]],
    queue_pending: [[2, 'queued-id', {}, {}, []]]
  }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    assert.equal((await readComfyUiQueueState({ endpoint, promptId: 'queued-id' })).state, 'queued');
    assert.equal((await readComfyUiQueueState({ endpoint, promptId: 'running-id' })).state, 'running');
    assert.equal((await readComfyUiQueueState({ endpoint, promptId: 'missing-id' })).state, 'not-listed');
  } finally { globalThis.fetch = originalFetch; }
});

test('W625A cancellation requires a click and uses only the identified local queue or interrupt endpoint', async () => {
  assert.equal((await cancelComfyUiJob({ endpoint, promptId: 'job-1' })).error, 'explicit-user-action-required');
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET', body: options.body || '' });
    if ((options.method || 'GET') === 'GET') return new Response(JSON.stringify({ queue_running: [], queue_pending: [[1, 'job-1', {}, {}, []]] }), { status: 200, headers: { 'content-type': 'application/json' } });
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const result = await cancelComfyUiJob({ endpoint, promptId: 'job-1', explicitUserAction: true });
    assert.equal(result.ok, true);
    assert.equal(result.action, 'delete-pending');
    assert.equal(calls[1].url, `${endpoint}/queue`);
    assert.deepEqual(JSON.parse(calls[1].body), { delete: ['job-1'] });
  } finally { globalThis.fetch = originalFetch; }
});

test('W625A save/reopen proof requires a digest match to the generated image bytes', async () => {
  const generated = imageBlob([10, 20, 30, 40]);
  const bitmap = async () => ({ width: 512, height: 512, close() {} });
  const inspected = await inspectLocalImageBlob(generated, { createImageBitmapRef: bitmap });
  assert.equal(inspected.ok, true);
  assert.equal(inspected.width, 512);
  assert.equal(inspected.height, 512);
  assert.match(inspected.sha256, /^[a-f0-9]{64}$/);
  const matched = await reopenLocalImageFile(namedImage([10, 20, 30, 40]), { expectedSha256: inspected.sha256, createImageBitmapRef: bitmap, urlRef: null });
  const mismatch = await reopenLocalImageFile(namedImage([10, 20, 30, 41]), { expectedSha256: inspected.sha256, createImageBitmapRef: bitmap, urlRef: null });
  assert.equal(matched.verifiedReopen, true);
  assert.equal(mismatch.verifiedReopen, false);
});

test('W625A receipts are redacted and cannot claim real proof while negative lanes are pending', () => {
  const receipt = buildLocalImageProofReceipt({
    sourceRevisionOrZipSha256: 'a'.repeat(64),
    generated: true,
    historyCompleted: true,
    fetched: true,
    previewed: true,
    saveInitiated: true,
    reopened: true,
    digestMatched: true,
    outputSha256: 'b'.repeat(64),
    width: 512,
    height: 512,
    steps: 12,
    standardNodesOnly: true,
    negativeLanes: { runtimeStopped: 'pass' }
  });
  assert.equal(receipt.positivePathComplete, true);
  assert.equal(receipt.realImageProofPass, false);
  assert.equal(receipt.promptIncluded, false);
  assert.equal(receipt.checkpointFilenameIncluded, false);
  assert.equal(receipt.localPathIncluded, false);
  assert.equal(receipt.mediaBodyIncluded, false);
  assert.doesNotMatch(JSON.stringify(receipt), /cinematic|safetensors|Users[\\/]/i);
});

test('W625A sanitized capability evidence excludes checkpoint filenames and local paths', () => {
  const evidence = sanitizeComfyUiCapabilityEvidence({
    endpoint,
    checkpoints: ['private-model.safetensors'],
    checkpointOptions: [{ family: 'sd15', proofEligible: true }],
    devices: [{ name: 'secret-device-name', type: 'cuda', vramTotalBytes: 4, vramFreeBytes: 3 }]
  });
  assert.equal(evidence.checkpointCount, 1);
  assert.equal(evidence.checkpointFilenamesIncluded, false);
  assert.equal(evidence.localPathsIncluded, false);
  assert.doesNotMatch(JSON.stringify(evidence), /private-model|secret-device-name/);
});

test('W625A source wires cancel, save, reopen and redacted receipts without activating video inside the image adapter', () => {
  const lab = read('assets/js/local-ai/comfyui-image-lab.js');
  assert.match(lab, /data-comfy-cancel/);
  assert.match(lab, /data-comfy-save/);
  assert.match(lab, /data-comfy-reopen-file/);
  assert.match(lab, /downloadLocalImageProofReceipt/);
  assert.match(lab, /SHA-256 match|digestMatched/);
  assert.match(lab, /Video is checked separately/);
  assert.match(lab, /own model, workflow, device and real-output checks pass/);
  assert.doesNotMatch(lab, /videoReady\s*=\s*true|generateComfyUiVideo/);
});
