import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFalSubmitRequest, getFalAdapterTruth, parseFalResult } from '../../assets/js/direct-byok/provider-adapters/fal.js';
import { buildReplicateSubmitRequest, getReplicateAdapterTruth, parseReplicateResult } from '../../assets/js/direct-byok/provider-adapters/replicate.js';
import { getDirectProviderRegistryTruth } from '../../assets/js/direct-byok/provider-registry.js';

const job = { input: { prompt: 'test' }, mediaKind: 'image' };

test('W626C has two companion-owned image adapters with manual redirects and no auto paid retry', () => {
  const fal = buildFalSubmitRequest(job, { remoteId: 'fal-ai/flux/schnell' }, 'credential');
  const replicate = buildReplicateSubmitRequest(job, { remoteId: 'black-forest-labs/flux-schnell' }, 'credential');
  assert.match(fal.url, /^https:\/\/queue\.fal\.run\//);
  assert.match(replicate.url, /^https:\/\/api\.replicate\.com\/v1\/models\//);
  assert.equal(fal.redirect, 'manual');
  assert.equal(fal.headers['X-Fal-No-Retry'], '1');
  assert.equal(replicate.headers['Cancel-After'], '2h');
  assert.equal(getFalAdapterTruth().automaticPaidRetry, false);
  assert.equal(getReplicateAdapterTruth().automaticPaidRetry, false);
  assert.equal(getDirectProviderRegistryTruth().twoImageAdaptersPresent, true);
});

test('W626C accepts only allowlisted provider media origins', () => {
  assert.equal(parseFalResult({ images: [{ url: 'https://v3.fal.media/files/a.png', content_type: 'image/png' }] }, 'image').outputs.length, 1);
  assert.equal(parseReplicateResult({ output: 'https://pbxt.replicate.delivery/a.png' }, 'image').outputs.length, 1);
  assert.throws(() => parseFalResult({ images: [{ url: 'https://evil.example/a.png' }] }, 'image'));
  assert.throws(() => parseReplicateResult({ output: 'https://evil.example/a.png' }, 'image'));
});
