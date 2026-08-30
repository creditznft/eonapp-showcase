import { getCachedProfile } from './device-detection.js';
import { detectLocalAiPlatformFamily } from '../../../config/local-ai-platform-support-contract.mjs';

export const LOCAL_WORKLOADS = Object.freeze([
  { id: 'text-chat', label: 'Text chat', desc: 'General local assistant, guide escalation, and private drafting.' },
  { id: 'coding', label: 'Coding', desc: 'Local coding help, refactors, and website/app drafting.' },
  { id: 'transcription', label: 'Transcription', desc: 'Speech-to-text and note transcription.' },
  { id: 'tts', label: 'Voice output', desc: 'Spoken replies through browser or local voice stacks.' },
  { id: 'image', label: 'Image generation', desc: 'Posters, thumbnails, social visuals, and product images.' },
  { id: 'image-edit', label: 'Image editing', desc: 'Upscale, remix, background edits, and image refinement.' },
  { id: 'image-to-video', label: 'Image to video', desc: 'Short image-to-video clips and motion previews.' },
  { id: 'full-video', label: 'Full video generation', desc: 'Heavier local video generation and creator rendering.' },
  { id: 'music-audio', label: 'Music / audio', desc: 'Music prompting, voice prep, and lighter audio pipelines.' },
  { id: 'rag-data', label: 'Private RAG / data', desc: 'Local embeddings, retrieval, and workflow/data packages.' }
]);

export const CURATED_LOCAL_CHANNELS = Object.freeze([
  {
    id: 'text-open',
    label: 'Open local text / coding models',
    publishers: ['Qwen', 'Gemma', 'Llama', 'Mistral', 'DeepSeek-distill'],
    runtimes: ['Ollama', 'LM Studio', 'Jan', 'llama.cpp-compatible local servers'],
    workloads: ['text-chat', 'coding', 'rag-data']
  },
  {
    id: 'mlx-apple',
    label: 'Apple Silicon local models',
    publishers: ['MLX / MLX LM ecosystem', 'ported open-weight text families'],
    runtimes: ['MLX', 'LM Studio', 'Ollama'],
    workloads: ['text-chat', 'coding', 'transcription', 'rag-data']
  },
  {
    id: 'speech-local',
    label: 'Local speech / transcription',
    publishers: ['Whisper-family', 'browser speech APIs', 'local STT/TTS stacks'],
    runtimes: ['Browser speech', 'Local STT services', 'OpenAI-compatible local servers'],
    workloads: ['transcription', 'tts']
  },
  {
    id: 'image-pipelines',
    label: 'Local image creator pipelines',
    publishers: ['FLUX-class', 'SDXL-class', 'curated open creator pipelines'],
    runtimes: ['ComfyUI', 'GPU-native creator runtimes'],
    workloads: ['image', 'image-edit']
  },
  {
    id: 'video-pipelines',
    label: 'Local image-to-video / video pipelines',
    publishers: ['LTX-class', 'curated image-to-video pipelines'],
    runtimes: ['ComfyUI', 'GPU-native video runtimes'],
    workloads: ['image-to-video', 'full-video']
  },
  {
    id: 'music-pipelines',
    label: 'Local music / audio pipelines',
    publishers: ['curated open music-generation models', 'browser Web Audio synthesis'],
    runtimes: ['ComfyUI-compatible audio workflows', 'Browser Web Audio'],
    workloads: ['music-audio']
  }
]);

function detectPlatformFamily(renderer = '', context = {}) {
  const family = detectLocalAiPlatformFamily({
    userAgent: context.userAgent || '',
    userAgentDataPlatform: context.userAgentDataPlatform || '',
    platform: context.platform || '',
    maxTouchPoints: context.maxTouchPoints || 0,
    mobile: context.mobile === true
  });
  const lowerRenderer = String(renderer || '').toLowerCase();
  const lowerUa = String(context.userAgent || '').toLowerCase();
  if (family === 'ios') return 'ios-mobile';
  if (family === 'android') return 'android-mobile';
  if (family === 'macos' && (/apple|m1|m2|m3|m4|m5/.test(lowerRenderer) || /apple silicon/.test(lowerUa))) return 'apple-silicon';
  if (family === 'macos') return 'mac-desktop';
  if (family === 'windows') return 'windows';
  if (family === 'linux') return 'linux';
  if (family === 'mobile-other') return 'mobile';
  return 'desktop';
}

function detectAcceleration(renderer = '', hasWebGPU = false) {
  const lower = String(renderer || '').toLowerCase();
  if (/rtx|quadro rtx|geforce rtx/.test(lower)) return 'rtx';
  if (/nvidia|radeon|rx |arc |intel arc|quadro|geforce/.test(lower)) return 'discrete-gpu';
  if (/apple/.test(lower)) return 'apple-gpu';
  if (/iris|uhd|intel/.test(lower)) return hasWebGPU ? 'integrated-webgpu' : 'integrated-gpu';
  if (hasWebGPU) return 'webgpu';
  return 'cpu-only';
}

function decideComputeClass(platformFamily, acceleration, memoryGB, cpuCores) {
  if (String(platformFamily).endsWith('mobile')) return 'mobile';
  if (platformFamily === 'apple-silicon') return 'apple-silicon';
  if (acceleration === 'rtx' && memoryGB >= 16 && cpuCores >= 8) return 'workstation';
  if (acceleration === 'rtx') return 'rtx-creator';
  if (acceleration === 'discrete-gpu' || acceleration === 'integrated-webgpu') return 'gpu-standard';
  if (memoryGB >= 8 || cpuCores >= 8) return 'cpu-local';
  return 'browser-light';
}

function mapTier(computeClass, memoryGB) {
  if (computeClass === 'workstation' || computeClass === 'rtx-creator') return 'high';
  if (computeClass === 'apple-silicon' || computeClass === 'gpu-standard') return 'medium';
  if (computeClass === 'cpu-local') return memoryGB >= 16 ? 'medium' : 'low';
  return 'low';
}

export const LOCAL_AI_DEVICE_SAFETY_SCHEMA = 'eon.local-ai.device-safety-guidance.v1';

/**
 * Produces a small, device-local support boundary for Local AI setup. Browser
 * hints help choose a conservative first step but cannot measure temperature,
 * battery health, actual free storage or other-app memory pressure reliably.
 */
export function buildLocalAiDeviceSafetyGuidance(profile = detectLocalAiCapabilityProfile()) {
  const mobile = String(profile?.computeClass || '').toLowerCase() === 'mobile';
  const lowMemory = Number(profile?.memoryGB || 0) > 0 && Number(profile?.memoryGB || 0) <= 4;
  const route = mobile || lowMemory ? 'browser-local-lite-first' : 'consumer-setup-then-compact-local-runtime';
  return Object.freeze({
    schema: LOCAL_AI_DEVICE_SAFETY_SCHEMA,
    scope: 'device-local-guidance-only',
    route,
    localModelBrowserInstaller: false,
    temperatureTelemetryAvailable: false,
    batteryHealthTelemetryAvailable: false,
    storageHeadroomTelemetryAvailable: false,
    guidance: Object.freeze([
      'EON can check approved local capabilities after you tap setup. Software installation, model downloads and OS permission prompts remain visible user-approved actions.',
      'Browser capability hints are estimates. EONAPP does not measure device temperature, battery health, actual free storage, or other-app memory pressure.',
      'Before a self-test, confirm enough local storage for the runtime, model and normal system use. Stop or choose a smaller profile if the device is hot, low on battery, warns about heat, or becomes unresponsive.',
      mobile || lowMemory
        ? 'Start with EON Local Lite when this browser supports it. Do not try to install desktop runtimes on a phone; heavy Creator media remains desktop/hardware-gated.'
        : 'Use the one-click Local AI setup first. EON reuses supported installed runtimes and selects a model only after a conservative fit check and local self-test.'
    ])
  });
}

export function detectLocalAiCapabilityProfile(context = {}) {
  let cached = {};
  try { cached = typeof getCachedProfile === 'function' ? (getCachedProfile() || {}) : {}; } catch {}
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const ua = String(context.userAgent || nav.userAgent || '');
  const renderer = String(context.gpuRenderer || context.gpu || cached?.webgl?.renderer || '');
  const memoryGB = Number(context.ram || context.memoryGB || cached?.ram || nav.deviceMemory || 0);
  const cpuCores = Number(context.cpuCores || cached?.cpuCores || nav.hardwareConcurrency || 0);
  const hasWebGPU = context.hasWebGPU === true || Boolean(nav?.gpu);
  const supportsSpeechInput = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const supportsTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const platformFamily = detectPlatformFamily(renderer, {
    userAgent: ua,
    userAgentDataPlatform: context.userAgentDataPlatform || nav.userAgentData?.platform || '',
    platform: context.platform || nav.platform || '',
    maxTouchPoints: context.maxTouchPoints ?? nav.maxTouchPoints ?? 0,
    mobile: context.mobile === true || nav.userAgentData?.mobile === true
  });
  const acceleration = detectAcceleration(renderer, hasWebGPU);
  const computeClass = decideComputeClass(platformFamily, acceleration, memoryGB, cpuCores);
  const tier = mapTier(computeClass, memoryGB);

  const labels = {
    mobile: 'Mobile browser',
    'browser-light': 'Browser-first / low local power',
    'cpu-local': 'CPU-capable local device',
    'apple-silicon': 'Apple Silicon local AI device',
    'gpu-standard': 'Standard GPU local device',
    'rtx-creator': 'RTX creator device',
    workstation: 'Workstation / multi-GPU style device'
  };

  const summaries = {
    mobile: 'Use EON Local Lite for basic on-device text where supported. Heavy local image/video remains a desktop-class workload.',
    'browser-light': 'Start with EON Local Lite. Add a desktop runtime only if the device and workload need more capability.',
    'cpu-local': 'Local text, coding, embeddings, and some transcription are realistic. Image and video should stay conservative.',
    'apple-silicon': 'Local text/coding can be strong. Local image work may be possible, while heavier video stays selective.',
    'gpu-standard': 'Local text plus some image pipelines are realistic. Video should remain selective; a hosted provider is a separate explicit choice when local capability is insufficient.',
    'rtx-creator': 'Local image pipelines are realistic and image-to-video becomes viable. Full video still needs careful presets.',
    workstation: 'This device can support serious local creator workflows. A hosted provider remains a separate explicit option, never an automatic fallback.'
  };

  return {
    platformFamily,
    acceleration,
    computeClass,
    tier,
    memoryGB,
    cpuCores,
    gpuRenderer: renderer || 'Unknown',
    hasWebGPU,
    supportsSpeechInput,
    supportsTTS,
    label: labels[computeClass] || 'Hybrid local AI device',
    summary: summaries[computeClass] || 'Use a hybrid local + provider strategy for the best results.'
  };
}

function chooseStatus(profile, workloadId, runtimeDetected) {
  const cls = profile.computeClass;
  const browserNative = workloadId === 'tts'
    ? profile.supportsTTS
    : workloadId === 'transcription'
      ? profile.supportsSpeechInput
      : false;
  if (browserNative) {
    return { status: 'browser-native', path: 'browser', reason: 'This can start through built-in browser capabilities on this device.' };
  }

  const installable = runtimeDetected ? 'ready-local' : 'installable-local';
  const advanced = runtimeDetected ? 'advanced-local' : 'cloud-preferred';

  if (['text-chat', 'coding', 'rag-data'].includes(workloadId)) {
    if (['cpu-local', 'apple-silicon', 'gpu-standard', 'rtx-creator', 'workstation'].includes(cls)) {
      return { status: installable, path: 'local', reason: 'This is a strong fit for a local runtime on this device class.' };
    }
    if (cls === 'mobile' || cls === 'browser-light') {
      return { status: 'browser-local-lite', path: 'browser-local', reason: 'Use the reviewed small browser-local model for basic private text; larger reasoning/coding can still require a stronger desktop or explicitly chosen hosted model.' };
    }
    return { status: 'cloud-preferred', path: 'cloud', reason: 'Start with Make Local AI ready. Use a hosted provider only when the user deliberately selects that separate path because local capability is insufficient.' };
  }

  if (workloadId === 'music-audio') {
    if (['apple-silicon', 'gpu-standard', 'rtx-creator', 'workstation'].includes(cls)) {
      return { status: installable, path: 'hybrid', reason: 'Audio prompting and lighter music workflows can use local preparation; hosted finishing happens only after an explicit provider choice.' };
    }
    return { status: 'cloud-preferred', path: 'cloud', reason: 'Keep heavy audio generation outside the local-ready claim on this device; a hosted provider is available only by explicit selection.' };
  }

  if (['image', 'image-edit'].includes(workloadId)) {
    if (cls === 'workstation' || cls === 'rtx-creator') {
      return { status: installable, path: 'local', reason: 'This device class is a realistic fit for local image pipelines and creator tooling.' };
    }
    if (cls === 'apple-silicon' || cls === 'gpu-standard') {
      return { status: 'installable-local', path: 'hybrid', reason: 'Local image work can be viable. A hosted image provider is a separate explicit option for different quality or speed needs.' };
    }
    return { status: 'cloud-preferred', path: 'cloud', reason: 'Do not claim dependable local image generation on this device class; use a hosted provider only when the user explicitly selects one.' };
  }

  if (workloadId === 'image-to-video') {
    if (cls === 'workstation') {
      return { status: installable, path: 'hybrid', reason: 'Image-to-video can be realistic locally here. Hosted video remains a separate explicit provider choice.' };
    }
    if (cls === 'rtx-creator') {
      return { status: advanced, path: 'hybrid', reason: 'Image-to-video is possible, but should be treated as an advanced local creator workflow.' };
    }
    return { status: 'cloud-preferred', path: 'cloud', reason: 'Do not claim local image-to-video readiness on this device class; hosted video requires an explicit provider choice.' };
  }

  if (workloadId === 'full-video') {
    if (cls === 'workstation') {
      return { status: 'advanced-local', path: 'hybrid', reason: 'Full video generation is plausible here, but still needs curated pipelines and careful presets.' };
    }
    if (cls === 'rtx-creator') {
      return { status: 'cloud-preferred', path: 'hybrid', reason: 'Use local video selectively. Full-production hosted video is a separate explicit provider path, never an automatic fallback.' };
    }
    return { status: 'cloud-preferred', path: 'cloud', reason: 'Full video generation should not be promised locally on this device class.' };
  }

  return { status: 'cloud-preferred', path: 'cloud', reason: 'Use a provider-connected path only after the user explicitly chooses it for this workload.' };
}

export function buildLocalWorkloadMatrix(profile = detectLocalAiCapabilityProfile(), options = {}) {
  const localProviders = Array.isArray(options.localProviders) ? options.localProviders : [];
  const runtimeDetected = localProviders.some((row) => row && row.available);
  return LOCAL_WORKLOADS.map((workload) => ({
    ...workload,
    ...chooseStatus(profile, workload.id, runtimeDetected)
  }));
}

export function summarizeLocalCapabilityTruth(profile = detectLocalAiCapabilityProfile(), matrix = buildLocalWorkloadMatrix(profile)) {
  const localBest = matrix.filter((row) => ['ready-local', 'installable-local', 'browser-native', 'browser-local-lite'].includes(row.status)).slice(0, 3).map((row) => row.label);
  const cloudPreferred = matrix.filter((row) => row.status === 'cloud-preferred').slice(0, 2).map((row) => row.label);
  return {
    headline: `${profile.label} · ${profile.summary}`,
    summary: [
      localBest.length ? `Best local fits: ${localBest.join(', ')}.` : '',
      cloudPreferred.length ? `Explicit provider option when local is not ready: ${cloudPreferred.join(', ')}.` : ''
    ].filter(Boolean).join(' ')
  };
}

export function buildLocalModelDiscoveryPlan(profile = detectLocalAiCapabilityProfile(), options = {}) {
  const matrix = Array.isArray(options.workloadMatrix) ? options.workloadMatrix : buildLocalWorkloadMatrix(profile, options);
  const workloadIds = new Set(matrix.filter((row) => row.status !== 'cloud-preferred').map((row) => row.id));
  const channels = CURATED_LOCAL_CHANNELS.filter((channel) => channel.workloads.some((id) => workloadIds.has(id)));
  const runtimeHints = [];

  if (profile.computeClass === 'apple-silicon') {
    runtimeHints.push('Prefer MLX / MLX LM, Ollama, or LM Studio for text/coding; keep video selective.');
  } else if (profile.computeClass === 'rtx-creator' || profile.computeClass === 'workstation') {
    runtimeHints.push('Prefer Ollama or LM Studio for text, plus ComfyUI-style creator pipelines for image/video work.');
  } else if (profile.computeClass === 'gpu-standard') {
    runtimeHints.push('Use Ollama or LM Studio first. Treat image generation as optional; hosted video is a separate explicit provider choice.');
  } else if (profile.computeClass === 'cpu-local') {
    runtimeHints.push('Use Ollama, LM Studio, or Jan for text/coding. Do not claim local image/video readiness here; hosted media requires explicit provider selection.');
  } else {
    runtimeHints.push('Start with EON Local Lite for basic private text. Add a desktop runtime only when this device and workload justify it.');
  }

  return {
    profileLabel: profile.label,
    summary: profile.summary,
    channels,
    runtimeHints,
    recommendedRuntimes: [...new Set(channels.flatMap((channel) => channel.runtimes))].slice(0, 5)
  };
}
