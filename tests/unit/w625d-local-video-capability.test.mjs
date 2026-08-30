import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCAL_VIDEO_GIB,
  buildLocalVideoSafetyPlan
} from '../../assets/js/local-ai/local-video-efficiency-governor.js';
import {
  LOCAL_VIDEO_REFERENCE_REQUIREMENTS,
  buildLocalVideoCapabilityEvidence,
  evaluateLocalVideoCapability,
  getLocalVideoCapabilityTruth
} from '../../assets/js/local-ai/comfyui-video-capability.js';

function supportedInput(overrides = {}) {
  return {
    runtimeReached: true,
    devices: [{ type: 'cuda', vramTotalBytes: 12 * LOCAL_VIDEO_GIB, vramFreeBytes: 10 * LOCAL_VIDEO_GIB }],
    systemRamBytes: 32 * LOCAL_VIDEO_GIB,
    freeStorageBytes: 60 * LOCAL_VIDEO_GIB,
    workflowReviewed: true,
    requiredModelsReady: true,
    acPower: true,
    batteryPercent: 100,
    thermalMonitoring: true,
    ...overrides
  };
}

test('W625D reference requirement keeps the reviewed 8 GB usable-VRAM floor', () => {
  assert.equal(LOCAL_VIDEO_REFERENCE_REQUIREMENTS.usableVramBytes, 8 * LOCAL_VIDEO_GIB);
  assert.equal(getLocalVideoCapabilityTruth().ownerFourGbLaneMustRemainBlocked, true);
});

test('W625D supported reference lane requires every reviewed confirmation', () => {
  const result = evaluateLocalVideoCapability(supportedInput());
  assert.equal(result.verdict, 'supported');
  assert.equal(result.reviewedWorkflowSubmissionAllowed, true);
  assert.deepEqual(result.blockers, []);
});

test('W625D 4 GB owner lane remains experimental and blocked before queue submission', () => {
  const result = evaluateLocalVideoCapability(supportedInput({ devices: [{ type: 'cuda', vramTotalBytes: 4 * LOCAL_VIDEO_GIB, vramFreeBytes: 3.6 * LOCAL_VIDEO_GIB }] }));
  assert.equal(result.verdict, 'unsupported');
  assert.equal(result.reviewedWorkflowSubmissionAllowed, false);
  assert.ok(result.blockers.includes('usable-vram-below-8gb-reference-minimum'));
  assert.equal(result.sideEffects.queueSubmissionStarted, false);
});

test('W625D visible 6 GB lane is experimental but still blocked', () => {
  const result = evaluateLocalVideoCapability(supportedInput({ devices: [{ type: 'cuda', vramTotalBytes: 6 * LOCAL_VIDEO_GIB, vramFreeBytes: 5 * LOCAL_VIDEO_GIB }] }));
  assert.equal(result.verdict, 'experimental');
  assert.equal(result.reviewedWorkflowSubmissionAllowed, false);
});

test('W625D missing workflow and model readiness are explicit blockers', () => {
  const result = evaluateLocalVideoCapability(supportedInput({ workflowReviewed: false, requiredModelsReady: false }));
  assert.ok(result.blockers.includes('reviewed-workflow-not-ready'));
  assert.ok(result.blockers.includes('required-models-not-confirmed'));
});

test('W625D low storage blocks before generation and proposes no automatic deletion', () => {
  const plan = buildLocalVideoSafetyPlan({ freeStorageBytes: 2 * LOCAL_VIDEO_GIB, acPower: true, thermalMonitoring: true });
  assert.equal(plan.canSubmit, false);
  assert.ok(plan.blockers.includes('free-storage-below-reviewed-minimum'));
  assert.equal(plan.cleanupProposal.automaticDeletion, false);
});

test('W625D capability evidence stays redacted', () => {
  const result = evaluateLocalVideoCapability(supportedInput());
  const evidence = buildLocalVideoCapabilityEvidence(result);
  assert.equal(evidence.exactGpuNameIncluded, false);
  assert.equal(evidence.modelFilenamesIncluded, false);
  assert.equal(evidence.localPathsIncluded, false);
  assert.equal(evidence.submissionAllowed, true);
});

test('W625D detection never installs, downloads or starts a cloud fallback', () => {
  const result = evaluateLocalVideoCapability({ runtimeReached: false });
  assert.deepEqual(result.sideEffects, {
    modelDownloadStarted: false,
    runtimeInstallStarted: false,
    cloudFallbackStarted: false,
    queueSubmissionStarted: false
  });
});
