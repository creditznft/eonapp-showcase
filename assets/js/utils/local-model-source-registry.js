
import { detectLocalAiCapabilityProfile, buildLocalModelDiscoveryPlan } from './local-ai-capability-matrix.js';

export const TRUSTED_MODEL_PUBLISHERS = Object.freeze([
  {
    id: 'ollama-library',
    label: 'Ollama Library',
    kind: 'runtime-catalog',
    homepage: 'https://ollama.com/library',
    installUrl: 'https://ollama.com',
    notes: 'Curated one-command pulls for local text, coding, and some multimodal models.',
    rails: ['text-chat', 'coding', 'rag-data', 'vision']
  },
  {
    id: 'lmstudio-catalog',
    label: 'LM Studio Catalog',
    kind: 'runtime-catalog',
    homepage: 'https://lmstudio.ai/models',
    installUrl: 'https://lmstudio.ai/download',
    notes: 'Discover, download, and run local models through a GUI-first workflow.',
    rails: ['text-chat', 'coding', 'rag-data', 'vision']
  },
  {
    id: 'huggingface-hub',
    label: 'Hugging Face Hub',
    kind: 'open-hub',
    homepage: 'https://huggingface.co/models',
    installUrl: 'https://huggingface.co/docs/huggingface_hub/guides/cli',
    notes: 'Broadest open ecosystem for models, datasets, and creator assets.',
    rails: ['text-chat', 'coding', 'rag-data', 'vision', 'image', 'audio']
  },
  {
    id: 'comfy',
    label: 'Comfy / ComfyUI',
    kind: 'creator-runtime',
    homepage: 'https://comfy.org/download/',
    installUrl: 'https://comfy.org/download/',
    notes: 'GPU-oriented image and video creator workflows with extension management.',
    rails: ['image', 'image-edit', 'image-to-video', 'full-video']
  },
  {
    id: 'mlx-apple',
    label: 'MLX ecosystem',
    kind: 'apple-local',
    homepage: 'https://lmstudio.ai/docs/app/basics',
    installUrl: 'https://lmstudio.ai/download',
    notes: 'Apple Silicon path for strong local text/coding with efficient memory use.',
    rails: ['text-chat', 'coding', 'rag-data', 'transcription']
  }
]);

export const TRUSTED_RUNTIME_RAILS = Object.freeze([
  {
    id: 'ollama',
    label: 'Ollama',
    installUrl: 'https://ollama.com',
    detectIds: ['ollama'],
    bestFor: ['text-chat', 'coding', 'rag-data', 'vision'],
    platformHints: ['windows', 'linux', 'mac-desktop', 'apple-silicon', 'cpu-local', 'gpu-standard', 'rtx-creator', 'workstation']
  },
  {
    id: 'lmstudio',
    label: 'LM Studio',
    installUrl: 'https://lmstudio.ai/download',
    detectIds: ['lmstudio'],
    bestFor: ['text-chat', 'coding', 'rag-data', 'vision'],
    platformHints: ['windows', 'linux', 'mac-desktop', 'apple-silicon', 'cpu-local', 'gpu-standard', 'rtx-creator', 'workstation']
  },
  {
    id: 'jan',
    label: 'Jan',
    installUrl: 'https://jan.ai',
    detectIds: ['jan'],
    bestFor: ['text-chat', 'coding'],
    platformHints: ['windows', 'linux', 'mac-desktop', 'apple-silicon', 'cpu-local', 'gpu-standard']
  },
  {
    id: 'comfy',
    label: 'ComfyUI',
    installUrl: 'https://comfy.org/download/',
    detectIds: ['comfy', 'custom'],
    bestFor: ['image', 'image-edit', 'image-to-video', 'full-video'],
    platformHints: ['gpu-standard', 'rtx-creator', 'workstation', 'apple-silicon']
  }
]);

export function buildInstallTruthPolicy() {
  return {
    canSilentlyInstall: false,
    oneClickMeaning: 'EON can prefill the right download links, runtime choices, and model-family guidance, but it should not silently install local runtimes from a browser tab without explicit user action.',
    futureProofing: 'Future-proofing should come from capability detection + trusted model publishers + runtime families, not hardcoded model names.',
    trustRule: 'Only official or curated open-source sources should be recommended by default.'
  };
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((v) => String(v || '').trim()).filter(Boolean))];
}

export function buildTrustedPublisherPlan(profile = detectLocalAiCapabilityProfile(), options = {}) {
  const discovery = buildLocalModelDiscoveryPlan(profile, options);
  const workloadIds = new Set((discovery.channels || []).flatMap((row) => Array.isArray(row.workloads) ? row.workloads : []));
  const runtimeIds = new Set((discovery.recommendedRuntimes || []).map((x) => String(x).toLowerCase()));
  const publishers = TRUSTED_MODEL_PUBLISHERS.filter((pub) => pub.rails.some((rail) => workloadIds.has(rail)));
  const runtimeRails = TRUSTED_RUNTIME_RAILS.filter((rail) => {
    const runtimeMatch = rail.detectIds.some((id) => [...runtimeIds].some((r) => r.includes(id)));
    const platformMatch = rail.platformHints.includes(profile.computeClass) || rail.platformHints.includes(profile.platformFamily);
    return runtimeMatch || platformMatch;
  });

  return {
    profileLabel: profile.label,
    publishers,
    runtimeRails,
    recommendedInstallUrls: uniqueStrings(runtimeRails.map((row) => row.installUrl).concat(publishers.map((row) => row.installUrl))),
    recommendedPublisherLabels: uniqueStrings(publishers.map((row) => row.label)),
    runtimeLabels: uniqueStrings(runtimeRails.map((row) => row.label))
  };
}

export function buildGuidedInstallPlan(profile = detectLocalAiCapabilityProfile(), options = {}) {
  const trusted = buildTrustedPublisherPlan(profile, options);
  const truth = buildInstallTruthPolicy();
  const cls = profile.computeClass;

  /** @type {string[]} */
  let steps = [];
  if (cls === 'mobile') {
    steps = [
      'Stay in Guide Mode or provider-connected mode by default.',
      'Use browser voice and lightweight AI tasks first.',
      'Do not promise heavy local image/video generation on this device class.'
    ];
  } else if (cls === 'apple-silicon') {
    steps = [
      'Offer LM Studio or Ollama first for text/coding and private data tasks.',
      'Offer Apple-optimized rails before generic GPU messaging.',
      'Treat creator image/video pipelines as optional and device-dependent.'
    ];
  } else if (['rtx-creator', 'workstation', 'gpu-standard'].includes(cls)) {
    steps = [
      'Offer Ollama or LM Studio first for text/coding.',
      'Offer ComfyUI-style image pipelines only after the user confirms they want local creator media.',
      'Treat image-to-video and full video as advanced local paths; a hosted provider remains a separate explicit choice.'
    ];
  } else {
    steps = [
      'Offer Ollama, LM Studio, or Jan for text/coding.',
      'Do not claim local image/video readiness unless a compatible local creator runtime passes proof; hosted media requires an explicit provider choice.',
      'Use guided install links and explain why each runtime fits the device.'
    ];
  }

  return {
    summary: `${profile.label}. ${profile.summary}`,
    steps,
    trustedPublishers: trusted.publishers,
    runtimeRails: trusted.runtimeRails,
    truthPolicy: truth
  };
}
