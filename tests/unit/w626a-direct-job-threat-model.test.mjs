import test from 'node:test';
import assert from 'node:assert/strict';
import { assertDirectJobEndpoint, assertDirectProviderApiEndpoint, assertDirectProviderMediaEndpoint, buildDirectJobRequest, getDirectJobThreatModel, isAllowedEonAppOrigin, toDirectJobPublicReceipt } from '../../assets/js/direct-byok/direct-job-contract.js';
import { getDirectProvider } from '../../assets/js/direct-byok/provider-registry.js';

test('W626A requires explicit approval, budget confirmation and reviewed providers', () => {
  const base = { providerId: 'fal', mediaKind: 'image', modelId: 'fal-image-proof', prompt: 'graphite city', input: {} };
  assert.equal(buildDirectJobRequest(base, { explicitUserAction: true, explicitUserApproval: true }).reason, 'per-job-budget-confirmation-required');
  assert.equal(buildDirectJobRequest({ ...base, providerId: 'unknown' }, { explicitUserAction: true, explicitUserApproval: true, budgetConfirmed: true }).reason, 'provider-not-allowlisted');
  assert.equal(buildDirectJobRequest({ ...base, input: { apiKey: 'not-allowed' } }, { explicitUserAction: true, explicitUserApproval: true, budgetConfirmed: true }).reason, 'credential-fields-rejected');
});

test('W626A allowlists app origins and provider endpoints', () => {
  assert.equal(isAllowedEonAppOrigin('https://eonapp.ch/create'), true);
  assert.equal(isAllowedEonAppOrigin('http://192.168.1.5:4173'), false);
  const fal=getDirectProvider('fal');
  assert.equal(assertDirectJobEndpoint('https://queue.fal.run/fal-ai/flux/schnell', fal).ok, true);
  assert.equal(assertDirectJobEndpoint('https://example.com/proxy', fal).ok, false);
  assert.equal(assertDirectProviderApiEndpoint('https://queue.fal.run/fal-ai/flux/schnell', fal).ok, true);
  assert.equal(assertDirectProviderApiEndpoint('https://v3.fal.media/files/a.png', fal).ok, false);
  assert.equal(assertDirectProviderMediaEndpoint('https://v3.fal.media/files/a.png', fal).ok, true);
  assert.equal(assertDirectProviderMediaEndpoint('https://queue.fal.run/fal-ai/flux/schnell', fal).ok, false);
});

test('W626A public receipt strips prompt and private payload', () => {
  const built = buildDirectJobRequest({ providerId: 'fal', mediaKind: 'image', modelId: 'fal-image-proof', prompt: 'private prompt', input: {} }, { explicitUserAction: true, explicitUserApproval: true, budgetConfirmed: true, now: () => 1000 });
  const receipt = toDirectJobPublicReceipt(built.job, { state: 'queued', message: 'queued', at: 1000 });
  assert.equal(receipt.rawPromptIncluded, false);
  assert.equal('input' in receipt, false);
  assert.equal(JSON.stringify(receipt).includes('private prompt'), false);
  assert.equal(getDirectJobThreatModel().eonappCloudflareProxyAllowed, false);
});
