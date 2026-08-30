/** W625D — truthful local video capability detection for approved ComfyUI loopback runtimes. */
import { LOCAL_VIDEO_GIB, buildLocalVideoSafetyPlan } from './local-video-efficiency-governor.js';

export const LOCAL_VIDEO_CAPABILITY_SCHEMA = 'eon.local-ai.comfyui-video-capability.w625d.v1';
export const LOCAL_VIDEO_REFERENCE_WORKFLOW_ID = 'eon-wan22-ti2v5b-native-i2v-v1';
export const LOCAL_VIDEO_REFERENCE_REQUIREMENTS = Object.freeze({
  usableVramBytes: 8 * LOCAL_VIDEO_GIB,
  recommendedSystemRamBytes: 32 * LOCAL_VIDEO_GIB,
  minimumSystemRamBytes: 16 * LOCAL_VIDEO_GIB,
  freeStorageBytes: 35 * LOCAL_VIDEO_GIB,
  width: 512,
  height: 288,
  frames: 33,
  fps: 16,
  batch: 1,
  queueConcurrency: 1
});

function n(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clean(value = '', max = 180) {
  const printable = Array.from(String(value || ''), (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  }).join('');
  return printable.replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeDevices(devices = []) {
  return Object.freeze((Array.isArray(devices) ? devices : []).map((row) => Object.freeze({
    type: clean(row?.type || '', 80),
    nameClass: clean(row?.name || row?.type || 'compute-device', 100).replace(/[A-Z0-9][A-Z0-9 ._-]{4,}/gi, 'gpu-class'),
    totalVramBytes: Math.max(0, n(row?.vramTotalBytes ?? row?.vram_total ?? row?.torchVramTotalBytes ?? row?.torch_vram_total, 0)),
    freeVramBytes: Math.max(0, n(row?.vramFreeBytes ?? row?.vram_free ?? row?.torchVramFreeBytes ?? row?.torch_vram_free, 0))
  })).slice(0, 8));
}

export function evaluateLocalVideoCapability(input = {}) {
  const devices = normalizeDevices(input.devices || input.runtimeStats?.devices || []);
  const usableVramBytes = Math.max(0, ...devices.map((row) => row.freeVramBytes || row.totalVramBytes || 0), n(input.usableVramBytes, 0));
  const totalVramBytes = Math.max(0, ...devices.map((row) => row.totalVramBytes || 0), n(input.totalVramBytes, 0));
  const systemRamBytes = Math.max(0, n(input.systemRamBytes, 0));
  const freeStorageBytes = Math.max(0, n(input.freeStorageBytes, 0));
  const runtimeReached = input.runtimeReached === true;
  const workflowReviewed = input.workflowReviewed === true;
  const requiredModelsReady = input.requiredModelsReady === true;
  const safety = buildLocalVideoSafetyPlan({
    width: input.width || 512,
    height: input.height || 288,
    frames: input.frames || 33,
    fps: input.fps || 16,
    steps: input.steps || 12,
    freeStorageBytes,
    acPower: input.acPower,
    batteryPercent: input.batteryPercent,
    thermalMonitoring: input.thermalMonitoring
  });
  const blockers = [];
  const warnings = [...safety.warnings];
  if (!runtimeReached) blockers.push('comfyui-runtime-not-reached');
  if (!usableVramBytes) blockers.push('usable-vram-not-measured');
  else if (usableVramBytes < LOCAL_VIDEO_REFERENCE_REQUIREMENTS.usableVramBytes) blockers.push('usable-vram-below-8gb-reference-minimum');
  if (!systemRamBytes) warnings.push('system-ram-not-confirmed');
  else if (systemRamBytes < LOCAL_VIDEO_REFERENCE_REQUIREMENTS.minimumSystemRamBytes) blockers.push('system-ram-below-16gb-minimum');
  else if (systemRamBytes < LOCAL_VIDEO_REFERENCE_REQUIREMENTS.recommendedSystemRamBytes) warnings.push('system-ram-below-32gb-recommendation');
  if (!freeStorageBytes) warnings.push('free-storage-not-confirmed');
  else if (freeStorageBytes < LOCAL_VIDEO_REFERENCE_REQUIREMENTS.freeStorageBytes) blockers.push('free-storage-below-35gb-minimum');
  if (!workflowReviewed) blockers.push('reviewed-workflow-not-ready');
  if (!requiredModelsReady) blockers.push('required-models-not-confirmed');
  for (const blocker of safety.blockers) if (!blockers.includes(blocker)) blockers.push(blocker);

  let verdict = 'unsupported';
  if (blockers.length === 0) verdict = warnings.length ? 'experimental' : 'supported';
  else if (runtimeReached && usableVramBytes >= 4 * LOCAL_VIDEO_GIB && usableVramBytes < LOCAL_VIDEO_REFERENCE_REQUIREMENTS.usableVramBytes) verdict = 'experimental';
  const reviewedWorkflowSubmissionAllowed = verdict === 'supported' && blockers.length === 0;
  const reason = reviewedWorkflowSubmissionAllowed
    ? 'This device meets the reviewed Wan2.2 TI2V 5B reference lane and all required confirmations are present.'
    : verdict === 'experimental'
      ? 'The runtime is visible, but this device or evidence set does not meet the reviewed reference lane. Generation stays blocked until every blocker is cleared.'
      : 'The reviewed local-video workflow is unavailable or unsafe on this device. EONAPP will not submit it.';
  return Object.freeze({
    schema: LOCAL_VIDEO_CAPABILITY_SCHEMA,
    workflowId: LOCAL_VIDEO_REFERENCE_WORKFLOW_ID,
    verdict,
    reason,
    runtimeReached,
    devices,
    usableVramBytes,
    totalVramBytes,
    systemRamBytes,
    freeStorageBytes,
    workflowReviewed,
    requiredModelsReady,
    blockers: Object.freeze(blockers),
    warnings: Object.freeze([...new Set(warnings)]),
    reviewedWorkflowSubmissionAllowed,
    noAllDevicePromise: true,
    safeFallbacks: Object.freeze([
      'prepare-image-to-video-storyboard-in-guide-mode',
      'use-future-direct-user-owned-byok-video-provider',
      'move-local-job-to-supported-reference-device'
    ]),
    sideEffects: Object.freeze({ modelDownloadStarted: false, runtimeInstallStarted: false, cloudFallbackStarted: false, queueSubmissionStarted: false })
  });
}

export function buildLocalVideoCapabilityEvidence(capability = {}) {
  return Object.freeze({
    schema: 'eon.local-ai.comfyui-video-capability-evidence.w625d.v1',
    recordedAt: new Date().toISOString(),
    workflowId: clean(capability.workflowId, 100),
    verdict: ['supported', 'experimental', 'unsupported'].includes(capability.verdict) ? capability.verdict : 'unsupported',
    runtimeReached: capability.runtimeReached === true,
    usableVramBytes: Math.max(0, n(capability.usableVramBytes, 0)),
    totalVramBytes: Math.max(0, n(capability.totalVramBytes, 0)),
    systemRamBytes: Math.max(0, n(capability.systemRamBytes, 0)),
    freeStorageBytes: Math.max(0, n(capability.freeStorageBytes, 0)),
    workflowReviewed: capability.workflowReviewed === true,
    requiredModelsReady: capability.requiredModelsReady === true,
    blockers: Object.freeze((capability.blockers || []).map((row) => clean(row, 120)).filter(Boolean).slice(0, 24)),
    warnings: Object.freeze((capability.warnings || []).map((row) => clean(row, 120)).filter(Boolean).slice(0, 24)),
    submissionAllowed: capability.reviewedWorkflowSubmissionAllowed === true,
    exactGpuNameIncluded: false,
    modelFilenamesIncluded: false,
    localPathsIncluded: false
  });
}

export function getLocalVideoCapabilityTruth() {
  return Object.freeze({
    schema: LOCAL_VIDEO_CAPABILITY_SCHEMA,
    referenceWorkflowId: LOCAL_VIDEO_REFERENCE_WORKFLOW_ID,
    minimumUsableVramBytes: LOCAL_VIDEO_REFERENCE_REQUIREMENTS.usableVramBytes,
    ownerFourGbLaneMustRemainBlocked: true,
    allDevicePromise: false,
    automaticInstall: false,
    automaticModelDownload: false,
    cloudFallback: false,
    queueSubmissionDuringDetection: false
  });
}
