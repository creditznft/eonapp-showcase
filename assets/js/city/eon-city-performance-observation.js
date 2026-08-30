/**
 * W453 — local EON City renderer-session observation.
 *
 * This module measures only the foreground Babylon session in memory. It does
 * not identify the device, persist a profile, upload telemetry, scrape the
 * console, read private work, or issue a device/certification pass. A person
 * must still review console/WebGL output, thermal behaviour and the actual
 * visual result on each device in Device Lab.
 */
export const EON_CITY_PERFORMANCE_OBSERVATION_SCHEMA = 'eon.city.performance-observation.w453.v1';

export const EON_CITY_PERFORMANCE_OBSERVATION_STAGES = Object.freeze([
  'route-entered',
  'engine-created',
  'scene-created',
  'first-frame-ready',
  'deferred-stages-started',
  'performance-protection-applied',
  'webgl-context-lost',
  'renderer-destroyed'
]);

const STAGE_SET = new Set(EON_CITY_PERFORMANCE_OBSERVATION_STAGES);
const MAX_FRAME_SAMPLES = 720;
const MAX_MEMORY_SAMPLES = 16;
const MAX_STAGE_EVENTS = 12;
const MAX_FRAME_MS = 1000;

const freeze = (value) => Object.freeze(value);

function defaultNow() {
  const value = Number(globalThis.performance?.now?.());
  return Number.isFinite(value) ? value : Date.now();
}

function defaultMemoryReader() {
  const memory = globalThis.performance?.memory;
  if (!memory || typeof memory !== 'object') return null;
  const usedBytes = Number(memory.usedJSHeapSize);
  const totalBytes = Number(memory.totalJSHeapSize);
  const limitBytes = Number(memory.jsHeapSizeLimit);
  if (![usedBytes, totalBytes, limitBytes].some(Number.isFinite)) return null;
  return { usedBytes, totalBytes, limitBytes };
}

function boundedNumber(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(min, number));
}

function round(value, precision = 2) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function average(values = []) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function percentile(values = [], fraction = 0.95) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index];
}

function cleanStage(stage = '') {
  const value = String(stage || '').trim();
  return STAGE_SET.has(value) ? value : null;
}

function cleanMemorySample(raw = {}) {
  const usedBytes = boundedNumber(raw?.usedBytes, { max: Number.MAX_SAFE_INTEGER });
  const totalBytes = boundedNumber(raw?.totalBytes, { max: Number.MAX_SAFE_INTEGER });
  const limitBytes = boundedNumber(raw?.limitBytes, { max: Number.MAX_SAFE_INTEGER });
  if (usedBytes === null && totalBytes === null && limitBytes === null) return null;
  return freeze({ usedBytes, totalBytes, limitBytes });
}

function summarizeMemory(samples = []) {
  if (!samples.length) return freeze({ support: 'unavailable', sampleCount: 0, latestUsedBytes: null, slopeBytesPerMinute: null });
  const latest = samples[samples.length - 1];
  if (samples.length < 2) return freeze({ support: 'available', sampleCount: samples.length, latestUsedBytes: latest.usedBytes, slopeBytesPerMinute: null });
  const first = samples[0];
  const elapsedMs = Math.max(1, latest.at - first.at);
  const canMeasureSlope = Number.isFinite(first.usedBytes) && Number.isFinite(latest.usedBytes);
  const slope = canMeasureSlope ? ((latest.usedBytes - first.usedBytes) / elapsedMs) * 60000 : null;
  return freeze({
    support: 'available',
    sampleCount: samples.length,
    latestUsedBytes: latest.usedBytes,
    slopeBytesPerMinute: round(slope, 2)
  });
}

function safeFrames(frames = []) {
  return frames.map((value) => boundedNumber(value, { min: 0, max: MAX_FRAME_MS })).filter((value) => value !== null);
}

export function createCityPerformanceObservation({ now = defaultNow, readMemory = defaultMemoryReader, maxFrameSamples = MAX_FRAME_SAMPLES, maxMemorySamples = MAX_MEMORY_SAMPLES } = {}) {
  const startedAt = Number(now()) || 0;
  const frameLimit = Math.max(12, Math.min(MAX_FRAME_SAMPLES, Number(maxFrameSamples) || MAX_FRAME_SAMPLES));
  const memoryLimit = Math.max(2, Math.min(MAX_MEMORY_SAMPLES, Number(maxMemorySamples) || MAX_MEMORY_SAMPLES));
  const frames = [];
  const memorySamples = [];
  const stages = [];
  let firstFrameAt = null;
  let contextLost = false;
  let destroyed = false;

  const timestamp = () => {
    const value = Number(now());
    return Number.isFinite(value) ? Math.max(startedAt, value) : startedAt;
  };

  const snapshot = () => {
    const safe = safeFrames(frames);
    const averageFrameMs = average(safe);
    const firstFrameMs = firstFrameAt === null ? null : Math.max(0, firstFrameAt - startedAt);
    const durationMs = Math.max(0, timestamp() - startedAt);
    return freeze({
      schema: EON_CITY_PERFORMANCE_OBSERVATION_SCHEMA,
      localOnly: true,
      persistence: 'memory-only',
      remoteTelemetry: false,
      deviceIdentifierCollected: false,
      userAgentCollected: false,
      privateContentCollected: false,
      consoleCaptured: false,
      certificationCreated: false,
      launchApprovalCreated: false,
      startedAtMonotonicMs: startedAt,
      sessionDurationMs: round(durationMs),
      firstFrameMs: round(firstFrameMs),
      firstFrameState: firstFrameAt === null ? 'pending' : 'observed-locally',
      frameSamples: safe.length,
      averageFrameMs: round(averageFrameMs),
      p95FrameMs: round(percentile(safe, 0.95)),
      p99FrameMs: round(percentile(safe, 0.99)),
      estimatedFps: averageFrameMs && averageFrameMs > 0 ? round(1000 / averageFrameMs) : null,
      memory: summarizeMemory(memorySamples),
      stages: freeze(stages.map((entry) => freeze({ ...entry }))),
      contextLost,
      destroyed,
      manualReviewRequired: freeze([
        'console-webgl-warnings',
        'gpu-visual-review',
        'thermal-and-battery-behaviour',
        'real-device-touch-and-rotation'
      ])
    });
  };

  const recordStage = (stage) => {
    const safeStage = cleanStage(stage);
    if (!safeStage) return snapshot();
    const at = timestamp();
    stages.push(freeze({ stage: safeStage, offsetMs: round(Math.max(0, at - startedAt)) }));
    if (stages.length > MAX_STAGE_EVENTS) stages.shift();
    if (safeStage === 'webgl-context-lost') contextLost = true;
    if (safeStage === 'renderer-destroyed') destroyed = true;
    return snapshot();
  };

  const recordFirstFrame = () => {
    if (firstFrameAt === null) {
      firstFrameAt = timestamp();
      recordStage('first-frame-ready');
    }
    return snapshot();
  };

  const recordFrame = (frameMs) => {
    if (destroyed || contextLost) return snapshot();
    const frame = Number(frameMs);
    if (!Number.isFinite(frame) || frame < 0 || frame > MAX_FRAME_MS) return snapshot();
    frames.push(frame);
    if (frames.length > frameLimit) frames.shift();
    return snapshot();
  };

  const captureMemory = () => {
    if (destroyed) return snapshot();
    let raw = null;
    try { raw = readMemory?.(); } catch { raw = null; }
    const sample = cleanMemorySample(raw);
    if (!sample) return snapshot();
    memorySamples.push(freeze({ at: timestamp(), ...sample }));
    if (memorySamples.length > memoryLimit) memorySamples.shift();
    return snapshot();
  };

  return freeze({
    recordStage,
    recordFirstFrame,
    recordFrame,
    captureMemory,
    getSnapshot: snapshot
  });
}

export function buildCityPerformanceObservationExport(observation = {}, { exportedAt = new Date().toISOString(), worldRegionId = 'unknown', assetTransfer = null, fpsSample = null } = {}) {
  const source = observation && typeof observation === 'object' ? observation : {};
  const safeWorldRegionId = String(worldRegionId || 'unknown').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 48) || 'unknown';
  const transfer = assetTransfer && typeof assetTransfer === 'object' ? assetTransfer : {};
  const sample = fpsSample && typeof fpsSample === 'object' ? fpsSample : {};
  const safeFpsSample = {
    samplePhase: ['startup', 'stable-session'].includes(String(sample.samplePhase || '')) ? String(sample.samplePhase) : 'unknown',
    fps: boundedNumber(sample.fps, { min: 0, max: 1000 }),
    engineFps: boundedNumber(sample.engineFps, { min: 0, max: 1000 }),
    sampleMs: boundedNumber(sample.sampleMs, { min: 0, max: MAX_FRAME_MS * 100 }),
    hardwareScalingLevel: boundedNumber(sample.hardwareScalingLevel, { min: 0, max: 8 })
  };
  const safeAssetTransfer = {
    observedAssetCount: boundedNumber(transfer.observedAssetCount, { min: 0, max: 10000 }),
    networkTransferAssetCount: boundedNumber(transfer.networkTransferAssetCount, { min: 0, max: 10000 }),
    localReuseOnlyAssetCount: boundedNumber(transfer.localReuseOnlyAssetCount, { min: 0, max: 10000 }),
    persistentCacheEntryCount: boundedNumber(transfer.persistentCacheEntryCount, { min: 0, max: 10000 }),
    totalTransferBytes: boundedNumber(transfer.totalTransferBytes, { min: 0, max: Number.MAX_SAFE_INTEGER }),
    zeroTransferDoesNotClaimSpecificCacheLayer: transfer?.truth?.zeroTransferDoesNotClaimSpecificCacheLayer === true
  };
  return JSON.stringify({
    schema: EON_CITY_PERFORMANCE_OBSERVATION_SCHEMA,
    exportedAt: String(exportedAt).slice(0, 40),
    scope: 'user-exported-local-eon-city-renderer-session',
    worldRegionId: safeWorldRegionId,
    fpsSample: safeFpsSample,
    assetTransfer: safeAssetTransfer,
    observation: {
      firstFrameMs: boundedNumber(source.firstFrameMs, { min: 0, max: MAX_FRAME_MS * 100 }),
      sessionDurationMs: boundedNumber(source.sessionDurationMs, { min: 0, max: MAX_FRAME_MS * 10000 }),
      frameSamples: boundedNumber(source.frameSamples, { min: 0, max: MAX_FRAME_SAMPLES }),
      averageFrameMs: boundedNumber(source.averageFrameMs, { min: 0, max: MAX_FRAME_MS }),
      p95FrameMs: boundedNumber(source.p95FrameMs, { min: 0, max: MAX_FRAME_MS }),
      p99FrameMs: boundedNumber(source.p99FrameMs, { min: 0, max: MAX_FRAME_MS }),
      estimatedFps: boundedNumber(source.estimatedFps, { min: 0, max: 1000 }),
      memory: {
        support: String(source.memory?.support || 'unavailable').slice(0, 24),
        sampleCount: boundedNumber(source.memory?.sampleCount, { min: 0, max: MAX_MEMORY_SAMPLES }),
        latestUsedBytes: boundedNumber(source.memory?.latestUsedBytes, { min: 0, max: Number.MAX_SAFE_INTEGER }),
        slopeBytesPerMinute: boundedNumber(source.memory?.slopeBytesPerMinute, { min: -1000000000, max: 1000000000 })
      },
      contextLost: source.contextLost === true,
      stages: Array.isArray(source.stages) ? source.stages.map((entry) => ({ stage: cleanStage(entry?.stage), offsetMs: boundedNumber(entry?.offsetMs, { min: 0, max: MAX_FRAME_MS * 100 }) })).filter((entry) => entry.stage) : []
    },
    proofBoundary: {
      localOnly: true,
      remoteTelemetry: false,
      userAgentCollected: false,
      deviceIdentifierCollected: false,
      consoleCaptured: false,
      automaticallyCertified: false,
      manualReviewStillRequired: ['console-webgl-warnings', 'gpu-visual-review', 'thermal-and-battery-behaviour', 'real-device-touch-and-rotation']
    }
  }, null, 2);
}

export function getCityPerformanceObservationTruth() {
  return freeze({
    schema: EON_CITY_PERFORMANCE_OBSERVATION_SCHEMA,
    localOnly: true,
    persistence: 'memory-only',
    remoteTelemetry: false,
    deviceIdentifierCollected: false,
    userAgentCollected: false,
    privateContentCollected: false,
    consoleCaptured: false,
    automaticCertification: false,
    automaticLaunchApproval: false,
    manualReviewRequired: true
  });
}
