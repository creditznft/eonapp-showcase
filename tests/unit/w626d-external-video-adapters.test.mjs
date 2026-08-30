import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFalCancelRequest, parseFalStatus } from '../../assets/js/direct-byok/provider-adapters/fal.js';
import { buildReplicateCancelRequest, parseReplicatePrediction } from '../../assets/js/direct-byok/provider-adapters/replicate.js';
import { getDirectProviderRegistryTruth } from '../../assets/js/direct-byok/provider-registry.js';

const job = { input: { prompt: 'video' }, mediaKind: 'video' };

test('W626D supports long-running video states and cancellation for two providers', () => {
  assert.equal(parseFalStatus({ status: 'IN_QUEUE' }).state, 'queued');
  assert.equal(parseFalStatus({ status: 'IN_PROGRESS' }).state, 'running');
  assert.equal(parseReplicatePrediction({ id: 'pred-1', status: 'processing' }).state, 'running');
  assert.match(buildFalCancelRequest(job, { remoteId: 'reviewed/video' }, 'credential', 'req-1').url, /\/cancel$/);
  assert.match(buildReplicateCancelRequest(job, { remoteId: 'owner/model' }, 'credential', 'pred-1').url, /\/cancel$/);
  assert.equal(getDirectProviderRegistryTruth().twoVideoAdaptersPresent, true);
});
