import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_VIDEO_GIB } from '../../assets/js/local-ai/local-video-efficiency-governor.js';
import { evaluateLocalVideoCapability } from '../../assets/js/local-ai/comfyui-video-capability.js';
import {
  prepareComfyUiVideoApiWorkflow,
  reviewComfyUiVideoApiWorkflow
} from '../../assets/js/local-ai/comfyui-video-workflow-registry.js';
import {
  fetchComfyUiVideoOutputBlob,
  generateComfyUiVideo,
  getComfyUiVideoRuntimeTruth
} from '../../assets/js/local-ai/comfyui-video-runtime.js';
import {
  buildLocalVideoProofReceipt,
  getLocalVideoProofTruth
} from '../../assets/js/local-ai/local-video-proof.js';

function workflow() {
  return {
    '1': { class_type: 'LoadImage', inputs: { image: 'placeholder.png' } },
    '2': { class_type: 'CLIPTextEncode', inputs: { text: 'placeholder' } },
    '3': { class_type: 'WanImageToVideo', inputs: { width: 512, height: 288, length: 33, fps: 16 } },
    '4': { class_type: 'KSampler', inputs: { seed: 1 } },
    '5': { class_type: 'VAEDecode', inputs: {} },
    '6': { class_type: 'SaveVideo', inputs: { filename_prefix: 'EONAPP' } }
  };
}

function supportedCapability() {
  return evaluateLocalVideoCapability({
    runtimeReached: true,
    devices: [{ type: 'cuda', vramTotalBytes: 12 * LOCAL_VIDEO_GIB, vramFreeBytes: 10 * LOCAL_VIDEO_GIB }],
    systemRamBytes: 32 * LOCAL_VIDEO_GIB,
    freeStorageBytes: 60 * LOCAL_VIDEO_GIB,
    workflowReviewed: true,
    requiredModelsReady: true,
    acPower: true,
    batteryPercent: 100,
    thermalMonitoring: true
  });
}

test('W625E safe API workflow receives a stable local SHA-256 review', async () => {
  const review = await reviewComfyUiVideoApiWorkflow(workflow());
  assert.equal(review.ok, true);
  assert.match(review.sha256, /^[a-f0-9]{64}$/);
  assert.equal(review.standardCoreNodesOnly, true);
});

test('W625E forbidden network or execution node is rejected before submission', async () => {
  const candidate = workflow();
  candidate['7'] = { class_type: 'HTTPDownload', inputs: { url: 'https://example.com' } };
  const review = await reviewComfyUiVideoApiWorkflow(candidate);
  assert.equal(review.ok, false);
  assert.ok(review.blockers.includes('forbidden-network-or-execution-node'));
});

test('W625E prepared workflow requires exact digest confirmation and patches proof controls', async () => {
  const review = await reviewComfyUiVideoApiWorkflow(workflow());
  assert.throws(() => prepareComfyUiVideoApiWorkflow(review, { uploadedImageName: 'frame.png', prompt: 'motion', seed: 7 }), /workflow-digest-confirmation-required/);
  const prepared = prepareComfyUiVideoApiWorkflow(review, {
    confirmedWorkflowSha256: review.sha256,
    uploadedImageName: 'frame.png',
    prompt: 'motion',
    seed: 7,
    width: 512,
    height: 288,
    frames: 33,
    fps: 16
  });
  assert.equal(prepared.workflow['1'].inputs.image, 'frame.png');
  assert.equal(prepared.workflow['2'].inputs.text, 'motion');
  assert.equal(prepared.workflow['4'].inputs.seed, 7);
  assert.equal(prepared.workflow['3'].inputs.length, 33);
});

test('W625E public endpoint is rejected before network access', async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error('should-not-run'); };
  try {
    const result = await generateComfyUiVideo({ endpoint: 'https://example.com', explicitUserAction: true, capability: supportedCapability() });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'endpoint-not-approved-loopback');
    assert.equal(called, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('W625E unsupported device cannot submit even with explicit user action', async () => {
  const result = await generateComfyUiVideo({ endpoint: 'http://127.0.0.1:8188', explicitUserAction: true, capability: { verdict: 'unsupported', reviewedWorkflowSubmissionAllowed: false } });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'device-capability-not-supported');
});

test('W625E output fetch rejects a non-loopback URL', async () => {
  const result = await fetchComfyUiVideoOutputBlob({ url: 'https://example.com/view?filename=x.mp4', filename: 'x.mp4' });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'output-url-not-approved');
});

test('W625E proof receipt cannot pass without real job and eleven recovery lanes', () => {
  const receipt = buildLocalVideoProofReceipt({
    promptSubmitted: true,
    promptIdRecorded: true,
    outputFetched: true,
    outputPreviewed: true,
    outputSaved: true,
    outputReopened: true,
    digestMatched: true,
    negativeLanes: { runtimeStoppedAndRecovered: 'pending' }
  });
  assert.equal(receipt.realVideoProofPass, false);
  assert.equal(receipt.verdict, 'pending-or-fail');
  assert.equal(receipt.privacy.cloudGenerationRequestsObserved, 0);
});

test('W625E runtime and proof truth prohibit source-only certification', () => {
  assert.equal(getComfyUiVideoRuntimeTruth().sourceIntegrationCanAwardRealProof, false);
  assert.equal(getLocalVideoProofTruth().realProofCanBeAwardedBySource, false);
  assert.equal(getComfyUiVideoRuntimeTruth().cloudFallback, false);
});
