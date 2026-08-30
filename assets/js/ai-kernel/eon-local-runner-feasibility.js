/**
 * W337 — local runner feasibility contract.
 *
 * This module is deliberately planning-only. It never inspects the device,
 * downloads a model, starts a service, opens a port, or continues after the
 * current foreground session ends. A caller must supply a coarse, voluntary
 * profile after the user asks to assess local-runner suitability.
 */

export const EON_LOCAL_RUNNER_FEASIBILITY_SCHEMA = 'eonapp.local-runner-feasibility.v1';

const DEVICE_CLASSES = Object.freeze({
  'desktop-capable': Object.freeze({ minMemoryGb: 16, minFreeStorageGb: 25, expectedWebGpu: true }),
  'desktop-conditional': Object.freeze({ minMemoryGb: 8, minFreeStorageGb: 12, expectedWebGpu: false }),
  'mobile-4gb': Object.freeze({ minMemoryGb: 4, minFreeStorageGb: 8, expectedWebGpu: false }),
  unknown: Object.freeze({ minMemoryGb: 0, minFreeStorageGb: 0, expectedWebGpu: false })
});

function cleanClass(value = '') {
  const id = String(value || '').trim().toLowerCase();
  return Object.hasOwn(DEVICE_CLASSES, id) ? id : 'unknown';
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function baseResult(deviceClass) {
  return {
    schema: EON_LOCAL_RUNNER_FEASIBILITY_SCHEMA,
    deviceClass,
    installStarted: false,
    modelDownloadStarted: false,
    directNetworkCreated: false,
    backgroundRunnerShipped: false,
    backgroundAfterClose: false,
    deviceFingerprintStored: false,
    encryptedStateCreated: false
  };
}

/**
 * Assess a voluntarily provided coarse device profile. This is not automatic
 * telemetry and intentionally does not promise a model/runtime on any device.
 */
export function assessEonLocalRunnerFeasibility(input = {}) {
  const candidate = input && typeof input === 'object' ? input : {};
  const deviceClass = cleanClass(candidate.deviceClass);
  const required = DEVICE_CLASSES[deviceClass];
  const userInitiated = candidate.userInitiated === true;
  const memoryGb = finiteNumber(candidate.memoryGb);
  const freeStorageGb = finiteNumber(candidate.freeStorageGb);
  const webGpuAvailable = candidate.webGpuAvailable === true;
  const secureContext = candidate.secureContext !== false;

  if (!userInitiated) {
    return Object.freeze({
      ...baseResult(deviceClass),
      status: 'not-assessed',
      reason: 'explicit-user-request-required',
      nextStep: 'Ask the user before assessing local-runner feasibility.'
    });
  }

  if (!secureContext) {
    return Object.freeze({
      ...baseResult(deviceClass),
      status: 'not-recommended',
      reason: 'secure-context-required',
      nextStep: 'Use a secure browser context before considering any local runtime research.'
    });
  }

  if (deviceClass === 'mobile-4gb') {
    return Object.freeze({
      ...baseResult(deviceClass),
      status: 'not-recommended',
      reason: 'low-memory-mobile-research-only',
      nextStep: 'Keep EONAPP in direct-BYOK, guide, export, and City Lite modes. Do not promise an on-device runner.'
    });
  }

  const memoryReady = memoryGb >= required.minMemoryGb;
  const storageReady = freeStorageGb >= required.minFreeStorageGb;
  const graphicsReady = required.expectedWebGpu ? webGpuAvailable : true;
  const feasible = memoryReady && storageReady && graphicsReady;

  return Object.freeze({
    ...baseResult(deviceClass),
    status: feasible ? 'research-feasible-not-shipped' : 'conditional-research-only',
    reason: feasible ? 'coarse-profile-meets-research-floor' : 'coarse-profile-below-research-floor',
    required: Object.freeze({
      memoryGb: required.minMemoryGb,
      freeStorageGb: required.minFreeStorageGb,
      webGpuExpected: required.expectedWebGpu
    }),
    observed: Object.freeze({
      memoryGb,
      freeStorageGb,
      webGpuAvailable
    }),
    nextStep: feasible
      ? 'Require a separate explicit install, provenance, security, performance, shutdown, and recovery decision before any runner proof spike.'
      : 'Remain on direct-BYOK, guide, export, and City Lite. Do not attempt a model download or background runner.'
  });
}

export function getEonLocalRunnerFeasibilityTruth() {
  return Object.freeze({
    schema: EON_LOCAL_RUNNER_FEASIBILITY_SCHEMA,
    automaticDeviceProbe: false,
    installOnAssessment: false,
    modelDownloadOnAssessment: false,
    backgroundRunnerShipped: false,
    backgroundAfterClose: false,
    cloudRelay: false,
    rawDeviceFingerprintStored: false,
    explicitUserRequestRequired: true
  });
}
