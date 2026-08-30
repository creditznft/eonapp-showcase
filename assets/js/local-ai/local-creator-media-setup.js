import { detectLocalAiCapabilityProfile } from '../utils/local-ai-capability-matrix.js';
import { buildGuidedInstallPlan } from '../utils/local-model-source-registry.js';
import { buildCreatorTaskPlan } from '../creator/creator-engine-registry.js';
import { buildLocalCreatorMediaProfilePlan } from './eon-local-creator-media-profiles.js';

export const LOCAL_CREATOR_MEDIA_SETUP_SCHEMA = 'eon.local-creator-media.setup.w479m0.v1';

function chooseState(profile = {}, taskPlan = {}) {
  const cls = String(profile.computeClass || '').toLowerCase();
  const local = (taskPlan.modes || []).find((mode) => mode.id === 'local-runtime') || {};
  if (cls === 'mobile' || cls === 'browser-light') return 'guide-only';
  if (local.available && local.state === 'advanced') return 'advanced-local-runtime';
  if (local.available) return 'candidate-local-runtime';
  return 'cloud-or-provider-preferred';
}

function runtimeRecommendation(profile = {}, taskId = 'image') {
  const cls = String(profile.computeClass || '').toLowerCase();
  if (taskId === 'image' || taskId === 'image-edit') {
    if (['rtx-creator', 'workstation', 'gpu-standard', 'apple-silicon'].includes(cls)) return 'ComfyUI';
  }
  if (taskId === 'image-to-video' || taskId === 'video') {
    if (cls === 'workstation' || cls === 'rtx-creator') return 'ComfyUI';
    return 'Manual storyboard / provider-connected later';
  }
  return cls === 'cpu-local' ? 'LM Studio or Ollama for planning only' : 'Guide Mode first';
}

function setupStepsFor(state, runtimeLabel) {
  const base = [
    'Review the device-fit estimate. Browser hints are not a VRAM, storage, heat, or battery-health measurement.',
    `Open the official ${runtimeLabel} installer or guide yourself. EONAPP does not install or download a runtime from the browser.`,
    'Confirm local storage headroom and stop if the device is hot, low battery, or the operating system warns about performance.',
    'Install the runtime and models yourself from official or trusted sources only.',
    'Run a local self-test outside EONAPP before any later adapter is enabled.'
  ];
  if (state === 'guide-only' || state === 'cloud-or-provider-preferred') {
    return base.concat(['Keep this task in draft/Guide Mode for now; do not promise local image or video generation on this device.']);
  }
  return base.concat([
    'When a future adapter exists, connect only by explicit user action and show connection/capability proof before generation.',
    'Save the generated output locally, validate the file, then move it into Creator Library / Ready-to-Post manually.'
  ]);
}

export function buildLocalCreatorMediaSetupPlan(taskId = 'image', options = {}) {
  const profile = options.profile || detectLocalAiCapabilityProfile(options.context || {});
  const taskPlan = buildCreatorTaskPlan(taskId, { profile, localRuntimeDetected: Boolean(options.localRuntimeDetected) });
  const state = chooseState(profile, taskPlan);
  const runtimeLabel = runtimeRecommendation(profile, taskId);
  const installPlan = buildGuidedInstallPlan(profile, options);
  const mediaProfilePlan = buildLocalCreatorMediaProfilePlan({
    systemMemoryGb: options.systemMemoryGb || profile.memoryGB || profile.memoryGb || 0,
    gpuVramGb: options.gpuVramGb || options.gpuVRAMGb || options.vramGb || 0
  });
  return Object.freeze({
    schema: LOCAL_CREATOR_MEDIA_SETUP_SCHEMA,
    taskId,
    state,
    device: Object.freeze({
      label: profile.label,
      computeClass: profile.computeClass,
      acceleration: profile.acceleration,
      memoryGB: profile.memoryGB || 0,
      cpuCores: profile.cpuCores || 0,
      summary: profile.summary
    }),
    runtimeRecommendation: runtimeLabel,
    officialInstallUrls: Object.freeze((installPlan.runtimeRails || [])
      .filter((runtime) => String(runtime.label || '').toLowerCase().includes(String(runtimeLabel || '').toLowerCase().split(' ')[0]))
      .map((runtime) => runtime.installUrl)
      .concat(runtimeLabel === 'ComfyUI' ? ['https://comfy.org/download/'] : [])
      .filter((value, index, arr) => value && arr.indexOf(value) === index)),
    taskPlan,
    mediaProfilePlan,
    setupSteps: Object.freeze(setupStepsFor(state, runtimeLabel)).concat([
      'For image/video, use the optional technical real-output check after installing a runtime. It is explicit, loopback-only, high-load opt-in, and stores only a redacted receipt.'
    ]),
    proofRequiredBeforeGeneration: Object.freeze([
      'user-installed-runtime-confirmed',
      'explicit-local-scan-or-manual-url',
      'capability-discovery-result',
      'tiny-generation-or-dry-run-self-test',
      'cancel-error-output-validation',
      'CSP-CORS-PNA-proof',
      'real-device-evidence'
    ]),
    truth: Object.freeze({
      browserInstallsRuntime: false,
      browserDownloadsModels: false,
      adapterConnected: false,
      generationAvailable: false,
      uploadsRawMedia: false,
      automaticPosting: false,
      readyToPostRequiresSavedOutput: true,
      browserCanInferGpuVram: false,
      outputMatrixAvailable: true
    })
  });
}

export function buildLocalCreatorMediaSetupOverview(options = {}) {
  const profile = options.profile || detectLocalAiCapabilityProfile(options.context || {});
  return Object.freeze({
    schema: LOCAL_CREATOR_MEDIA_SETUP_SCHEMA,
    profile,
    plans: Object.freeze(['image', 'image-edit', 'image-to-video', 'video'].map((taskId) => buildLocalCreatorMediaSetupPlan(taskId, { ...options, profile }))),
    releaseTruth: Object.freeze({
      m0IsSetupGuidanceOnly: true,
      localImageAdapterActive: false,
      localVideoAdapterActive: false,
      readyToPostBridgeActiveOnlyForExistingSavedAssets: true
    })
  });
}
