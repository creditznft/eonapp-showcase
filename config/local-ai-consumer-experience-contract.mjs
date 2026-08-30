/**
 * RT90 — Local AI consumer experience contract.
 *
 * Goal: one calm "Use Local AI" experience across devices while preserving
 * EONAPP's security boundaries. A single explicit setup action may perform
 * bounded detection/self-tests of approved local capabilities. Installation,
 * model downloads and OS elevation remain explicit reviewed user actions.
 * There is never a silent cloud fallback from Local AI.
 */
export const LOCAL_AI_CONSUMER_EXPERIENCE_SCHEMA = 'eon.local-ai.consumer-experience.rt90.v1';
export const LOCAL_AI_CONSUMER_EXPERIENCE_REVIEWED_AT = '2026-08-14';

export const LOCAL_AI_LITE_PACK = Object.freeze({
  id: 'eon-local-lite-smollm2-135m',
  providerId: 'browserlocal',
  label: 'EON Local Lite',
  task: 'text-generation',
  model: 'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA',
  library: '@huggingface/transformers',
  libraryVersion: '3.8.1',
  libraryModuleUrl: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm',
  preferredWebGpuDtype: 'q4f16',
  wasmDtype: 'q4',
  approximatePrimaryWeightMb: Object.freeze({ webgpu: 118, wasm: 182 }),
  modelCache: 'browser-managed',
  firstUseDownloadRequired: true,
  inferenceLeavesDevice: false,
  externalActions: false,
  intendedUse: 'basic private chat, short rewriting, summaries and guidance',
  notFor: Object.freeze(['high-stakes expert advice', 'large-context coding', 'image generation', 'video generation'])
});

// Public, reviewed browser packs only. Auto never promotes a device to a
// larger model on capability hints alone: the larger tier must have a stored
// successful local preparation/self-test first. Strong and Advanced remain
// deliberately absent until a separate browser compatibility review exists.
export const LOCAL_AI_LITE_TIERS = Object.freeze({
  lite: Object.freeze({ id: 'lite', label: 'Lite — fastest / widest compatibility', model: LOCAL_AI_LITE_PACK.model, webgpuMb: 118, wasmMb: 182, maxHistoryMessages: 2, maxInputChars: 4200, autoEligible: true }),
  balanced: Object.freeze({ id: 'balanced', label: 'Balanced — better answers', model: 'onnx-community/SmolLM2-360M-ONNX', webgpuMb: 272, wasmMb: 386, maxHistoryMessages: 4, maxInputChars: 7600, autoEligible: true }),
  strong: Object.freeze({ id: 'strong', label: 'Strong — manual review required', model: '', webgpuMb: 0, wasmMb: 0, maxHistoryMessages: 6, maxInputChars: 12000, autoEligible: false }),
  advanced: Object.freeze({ id: 'advanced', label: 'Advanced — experimental/manual', model: '', webgpuMb: 0, wasmMb: 0, maxHistoryMessages: 6, maxInputChars: 15000, autoEligible: false })
});

export function recommendLocalLiteTier(evidence = {}, requested = 'auto') {
  const requestedTier = String(requested || 'auto').toLowerCase();
  const memory = Number(evidence.deviceMemory || 0);
  const cores = Number(evidence.hardwareConcurrency || 0);
  const balancedCapable = evidence.hasWebGPU === true && memory >= 8 && cores >= 8;
  const balancedProven = evidence.knownGoodBalanced === true;
  if (requestedTier === 'balanced' && balancedCapable) return Object.freeze({ tier: 'balanced', fallback: false, reason: 'explicit-reviewed-tier' });
  if (requestedTier === 'lite') return Object.freeze({ tier: 'lite', fallback: false, reason: 'explicit-reviewed-tier' });
  if (requestedTier === 'strong' || requestedTier === 'advanced') return Object.freeze({ tier: 'lite', fallback: true, reason: 'tier-manual-review-required' });
  return Object.freeze({ tier: balancedCapable && balancedProven ? 'balanced' : 'lite', fallback: false, reason: balancedCapable ? 'balanced-needs-local-self-test' : 'conservative-device-fit' });
}

export const LOCAL_AI_CONSUMER_PATHS = Object.freeze({
  browserLite: Object.freeze({
    id: 'browser-lite',
    label: 'Local Lite',
    description: 'Runs a small reviewed text model inside this browser. No desktop AI app is required.',
    local: true,
    requiresCompanion: false,
    supports: Object.freeze(['chat']),
    explicitFirstDownload: true
  }),
  desktopRuntime: Object.freeze({
    id: 'desktop-runtime',
    label: 'Local Desktop AI',
    description: 'Uses an already installed Ollama, LM Studio or Jan runtime after a successful local self-test.',
    local: true,
    requiresCompanion: false,
    supports: Object.freeze(['chat']),
    explicitFirstDownload: false
  }),
  desktopCompanion: Object.freeze({
    id: 'desktop-companion',
    label: 'EON Local Companion',
    description: 'One local connection authority for text runtimes and heavier Creator tools such as ComfyUI.',
    local: true,
    requiresCompanion: true,
    supports: Object.freeze(['chat', 'image', 'video', 'music']),
    explicitFirstDownload: true
  })
});

const text = (value = '') => String(value || '').trim();
const bool = (value) => value === true;

function mobileLike(profile = {}) {
  const platform = text(profile.platformFamily).toLowerCase();
  return text(profile.computeClass).toLowerCase() === 'mobile' || /android|ios|mobile/.test(platform);
}

function lowPower(profile = {}) {
  const memory = Number(profile.memoryGB || profile.memoryGb || 0) || 0;
  return text(profile.computeClass).toLowerCase() === 'browser-light' || (memory > 0 && memory <= 4);
}

/**
 * Projects one recommended path from supplied evidence. This function performs
 * no probes and no downloads; callers own the explicit user action.
 */
export function buildLocalAiConsumerPlan(profile = {}, evidence = {}) {
  const mobile = mobileLike(profile);
  const liteSupported = evidence.browserLiteSupported !== false;
  const verifiedRuntime = evidence.verifiedRuntime?.ok === true ? evidence.verifiedRuntime : null;
  const companionAvailable = bool(evidence.companionAvailable);
  const companionPaired = bool(evidence.companionPaired);
  const comfyReady = bool(evidence.comfyReady);
  const videoReady = bool(evidence.videoReady);

  let primaryPath = LOCAL_AI_CONSUMER_PATHS.browserLite;
  let reason = mobile
    ? 'This device can start with a small in-browser local model instead of desktop runtime setup.'
    : 'Local Lite is the fastest private starting point while desktop runtimes remain optional.';

  if (!mobile && verifiedRuntime) {
    primaryPath = LOCAL_AI_CONSUMER_PATHS.desktopRuntime;
    reason = `${text(verifiedRuntime.runtime || verifiedRuntime.runtimeId || 'A local runtime')} already passed a device-local self-test.`;
  } else if (!mobile && companionAvailable && companionPaired) {
    primaryPath = LOCAL_AI_CONSUMER_PATHS.desktopCompanion;
    reason = 'EON Local Companion is already connected and can coordinate approved local runtimes.';
  } else if (!liteSupported && !mobile) {
    primaryPath = LOCAL_AI_CONSUMER_PATHS.desktopCompanion;
    reason = 'This browser cannot use the reviewed Local Lite path, so the desktop companion is the supported local route.';
  }

  const chat = verifiedRuntime
    ? Object.freeze({ state: 'ready', path: 'desktop-runtime', label: `${text(verifiedRuntime.runtime || verifiedRuntime.runtimeId)} ready`, action: 'use-runtime' })
    : evidence.browserLiteReady === true
      ? Object.freeze({ state: 'ready', path: 'browser-lite', label: 'Local Lite ready', action: 'use-browser-lite' })
      : liteSupported
        ? Object.freeze({ state: 'setup', path: 'browser-lite', label: 'Local Lite available', action: 'prepare-browser-lite' })
        : Object.freeze({ state: 'setup', path: 'desktop-companion', label: 'Desktop setup required', action: 'setup-companion' });

  const image = mobile
    ? Object.freeze({ state: 'not-on-this-device', path: 'desktop-companion', label: 'Use a capable desktop for local images', action: 'learn-more' })
    : comfyReady
      ? Object.freeze({ state: 'ready', path: 'desktop-companion', label: 'Local images ready', action: 'open-image-lab' })
      : Object.freeze({ state: 'setup', path: 'desktop-companion', label: 'Set up local images', action: 'setup-companion' });

  const video = mobile
    ? Object.freeze({ state: 'not-on-this-device', path: 'desktop-companion', label: 'Use a capable desktop for local video', action: 'learn-more' })
    : videoReady
      ? Object.freeze({ state: 'ready', path: 'desktop-companion', label: 'Local video ready', action: 'open-video-lab' })
      : Object.freeze({ state: 'gated', path: 'desktop-companion', label: 'Video needs a separate capability check', action: 'check-video' });

  return Object.freeze({
    schema: LOCAL_AI_CONSUMER_EXPERIENCE_SCHEMA,
    reviewedAt: LOCAL_AI_CONSUMER_EXPERIENCE_REVIEWED_AT,
    profile: Object.freeze({
      platformFamily: text(profile.platformFamily),
      computeClass: text(profile.computeClass),
      memoryGB: Number(profile.memoryGB || profile.memoryGb || 0) || 0,
      cpuCores: Number(profile.cpuCores || profile.cores || 0) || 0,
      hasWebGPU: bool(profile.hasWebGPU),
      mobile,
      lowPower: lowPower(profile)
    }),
    primaryPath,
    reason,
    capabilities: Object.freeze({ chat, image, video }),
    boundaries: Object.freeze({
      setupRequiresUserIntent: true,
      boundedApprovedRuntimeDetectionAfterIntent: true,
      boundedSelfTestAfterIntent: true,
      automaticSelectionAfterPassingSelfTest: true,
      silentThirdPartyInstall: false,
      silentModelDownload: false,
      silentOsElevation: false,
      arbitraryShellExecution: false,
      arbitraryLanProbe: false,
      silentCloudFallback: false,
      creatorCapabilitiesIndependent: true
    })
  });
}

export function getLocalAiConsumerExperienceTruth() {
  return Object.freeze({
    schema: LOCAL_AI_CONSUMER_EXPERIENCE_SCHEMA,
    onePrimarySetupAction: true,
    browserLocalLite: true,
    desktopCompanion: true,
    supportsExistingOllamaOrLmStudio: true,
    mobileDesktopRuntimeInstall: false,
    mobileBrowserLocalText: true,
    heavyCreatorHardwareGated: true,
    automaticDetectionAfterExplicitSetupTap: true,
    automaticSelfTestAfterExplicitSetupTap: true,
    automaticProviderSelectionAfterPassingProof: true,
    silentInstall: false,
    silentDownload: false,
    silentCloudFallback: false
  });
}

export function validateLocalAiConsumerExperienceContract() {
  const errors = [];
  if (!LOCAL_AI_LITE_PACK.model || !LOCAL_AI_LITE_PACK.libraryModuleUrl.startsWith('https://') || !LOCAL_AI_LITE_PACK.libraryModuleUrl.endsWith('/+esm')) errors.push('Local Lite must use the reviewed HTTPS ESM model/library source.');
  if (LOCAL_AI_LITE_PACK.inferenceLeavesDevice !== false) errors.push('Local Lite must remain on-device inference.');
  const mobile = buildLocalAiConsumerPlan({ computeClass: 'mobile', platformFamily: 'android-mobile', memoryGB: 4 }, { browserLiteSupported: true });
  if (mobile.primaryPath.id !== 'browser-lite') errors.push('Mobile must prefer Local Lite when supported.');
  if (mobile.capabilities.image.state === 'ready' || mobile.capabilities.video.state === 'ready') errors.push('Mobile browser hints must not imply heavy Creator readiness.');
  const desktop = buildLocalAiConsumerPlan({ computeClass: 'cpu-local', platformFamily: 'windows', memoryGB: 16 }, { verifiedRuntime: { ok: true, runtime: 'LM Studio' } });
  if (desktop.primaryPath.id !== 'desktop-runtime') errors.push('A verified installed desktop runtime must win over downloading another text runtime.');
  if (desktop.boundaries.silentCloudFallback !== false || desktop.boundaries.arbitraryShellExecution !== false) errors.push('Security boundaries must remain fail-closed.');
  return errors;
}
