/**
 * W625G — conservative local-video efficiency governor.
 *
 * Estimates are intentionally directional. They never claim exact runtime
 * memory use and they never start cleanup or generation automatically.
 */
export const LOCAL_VIDEO_GOVERNOR_SCHEMA = 'eon.local-ai.video-efficiency-governor.w625g.v1';
export const LOCAL_VIDEO_GIB = 1024 ** 3;

const LIMITS = Object.freeze({
  width: Object.freeze({ min: 256, max: 768 }),
  height: Object.freeze({ min: 144, max: 432 }),
  frames: Object.freeze({ min: 9, max: 49 }),
  fps: Object.freeze({ min: 8, max: 24 }),
  steps: Object.freeze({ min: 4, max: 24 }),
  batch: 1,
  queueConcurrency: 1
});

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max, fallback) {
  return Math.max(min, Math.min(max, number(value, fallback)));
}

function roundToMultiple(value, multiple = 8) {
  return Math.max(multiple, Math.round(value / multiple) * multiple);
}

export function normalizeLocalVideoRecipe(input = {}) {
  const width = roundToMultiple(clamp(input.width, LIMITS.width.min, LIMITS.width.max, 512), 16);
  const height = roundToMultiple(clamp(input.height, LIMITS.height.min, LIMITS.height.max, 288), 16);
  const frames = Math.round(clamp(input.frames, LIMITS.frames.min, LIMITS.frames.max, 33));
  const fps = Math.round(clamp(input.fps, LIMITS.fps.min, LIMITS.fps.max, 16));
  const steps = Math.round(clamp(input.steps, LIMITS.steps.min, LIMITS.steps.max, 12));
  const seedValue = String(input.seed ?? '').trim();
  const seed = seedValue === '' ? null : Math.max(0, Math.min(2147483647, Math.trunc(number(seedValue, 0))));
  const motionStrength = ['low', 'medium'].includes(String(input.motionStrength || '').toLowerCase())
    ? String(input.motionStrength).toLowerCase()
    : 'low';
  return Object.freeze({
    schema: LOCAL_VIDEO_GOVERNOR_SCHEMA,
    mode: input.mode === 'text-to-video' ? 'text-to-video' : 'image-to-video',
    width,
    height,
    frames,
    fps,
    steps,
    batch: 1,
    queueConcurrency: 1,
    durationSeconds: Number((frames / fps).toFixed(3)),
    seed,
    motionStrength,
    audio: false,
    interpolation: false,
    upscaler: false,
    customNodes: false
  });
}

export function estimateLocalVideoWorkload(input = {}) {
  const recipe = normalizeLocalVideoRecipe(input);
  const pixelsPerFrame = recipe.width * recipe.height;
  const pixelFrames = pixelsPerFrame * recipe.frames;
  const workUnits = pixelFrames * recipe.steps;
  const rawFrameBytes = pixelFrames * 4;
  const previewBytes = Math.ceil(rawFrameBytes * 0.22);
  const outputBytesLow = Math.max(1_500_000, Math.ceil(pixelFrames * 0.22));
  const outputBytesHigh = Math.max(outputBytesLow, Math.ceil(pixelFrames * 0.9));
  const temporaryBytes = Math.ceil(rawFrameBytes * 6.5 + outputBytesHigh * 3);
  const recommendedFreeStorageBytes = Math.max(35 * LOCAL_VIDEO_GIB, temporaryBytes * 4);
  const workloadClass = workUnits <= 1_000_000_000 ? 'conservative' : workUnits <= 3_000_000_000 ? 'elevated' : 'high';
  return Object.freeze({
    schema: LOCAL_VIDEO_GOVERNOR_SCHEMA,
    recipe,
    pixelsPerFrame,
    pixelFrames,
    workUnits,
    workloadClass,
    previewBytes,
    outputBytesRange: Object.freeze({ low: outputBytesLow, high: outputBytesHigh }),
    temporaryBytes,
    recommendedFreeStorageBytes,
    estimateOnly: true
  });
}

export function buildLocalVideoSafetyPlan(input = {}) {
  const workload = estimateLocalVideoWorkload(input);
  const freeStorageBytes = Math.max(0, number(input.freeStorageBytes, 0));
  const batteryPercent = clamp(input.batteryPercent, 0, 100, 100);
  const acPower = input.acPower === true;
  const thermalMonitoring = input.thermalMonitoring === true;
  const blockers = [];
  const warnings = [];
  if (freeStorageBytes && freeStorageBytes < workload.recommendedFreeStorageBytes) blockers.push('free-storage-below-reviewed-minimum');
  if (!freeStorageBytes) warnings.push('free-storage-not-confirmed');
  if (!acPower) warnings.push('ac-power-not-confirmed');
  if (batteryPercent < 35) warnings.push('battery-low-for-long-video-job');
  if (!thermalMonitoring) warnings.push('thermal-monitoring-not-confirmed');
  if (workload.workloadClass === 'high') blockers.push('recipe-exceeds-conservative-proof-budget');
  return Object.freeze({
    schema: LOCAL_VIDEO_GOVERNOR_SCHEMA,
    workload,
    blockers: Object.freeze(blockers),
    warnings: Object.freeze(warnings),
    canSubmit: blockers.length === 0,
    cleanupProposal: Object.freeze({
      automaticDeletion: false,
      requiresExplicitUserApproval: true,
      targets: Object.freeze(['temporary-preview-object-urls', 'failed-job-temporary-input', 'expired-session-job-records']),
      neverDelete: Object.freeze(['owner-saved-video', 'owner-selected-input-image', 'unrelated-comfyui-output'])
    }),
    queueConcurrency: 1,
    safeDefaults: workload.recipe
  });
}

export function getLocalVideoGovernorTruth() {
  return Object.freeze({
    schema: LOCAL_VIDEO_GOVERNOR_SCHEMA,
    exactMemoryPromise: false,
    exactLatencyPromise: false,
    automaticCleanup: false,
    cleanupRequiresUserApproval: true,
    queueConcurrency: 1,
    batch: 1,
    maxWidth: LIMITS.width.max,
    maxHeight: LIMITS.height.max,
    maxFrames: LIMITS.frames.max,
    maxSteps: LIMITS.steps.max
  });
}
