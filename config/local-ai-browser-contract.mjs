import { getEonLocalBridgeCspSources } from './eon-local-bridge-contract.mjs';

/**
 * W476-A5 — Canonical browser-to-loopback contract for Local AI.
 *
 * This is deliberately a small allowlist. EONAPP only speaks to a runtime after
 * a user tap, only on this device's loopback interface, and only on one of the
 * documented runtime ports below. It never probes LAN/RFC1918 addresses, starts
 * a process, downloads a model, or falls back to a cloud provider.
 */
export const LOCAL_AI_BROWSER_CONTRACT_SCHEMA = 'eonapp.w623.local-ai-browser-contract.v2';
export const LOCAL_AI_BROWSER_CONTRACT_AS_OF = '2026-07-11';

export const LOCAL_AI_LOOPBACK_HOSTS = Object.freeze(['127.0.0.1', 'localhost']);

const freezeRuntime = (row) => Object.freeze({
  scheme: 'http',
  discoveryUserActionRequired: true,
  backgroundProbeAllowed: false,
  cloudFallbackAllowed: false,
  runtimeKind: 'text',
  textChat: 'discover-self-test-select',
  imageGeneration: 'not-connected',
  videoGeneration: 'not-connected',
  musicGeneration: 'not-connected',
  ...row
});

export const LOCAL_AI_RUNTIME_CONTRACTS = Object.freeze({
  ollama: freezeRuntime({
    id: 'ollama',
    label: 'Ollama',
    defaultEndpoint: 'http://127.0.0.1:11434',
    allowedPorts: Object.freeze([11434]),
    discoveryPath: '/api/tags',
    chatPath: '/api/chat',
    officialDocs: 'https://docs.ollama.com/api',
    note: 'Installed local text/vision-capable tags are discovered only after a user scan. EONAPP does not infer image-generation support from a text tag.'
  }),
  lmstudio: freezeRuntime({
    id: 'lmstudio',
    label: 'LM Studio',
    defaultEndpoint: 'http://127.0.0.1:1234/v1',
    allowedPorts: Object.freeze([1234]),
    discoveryPath: '/v1/models',
    metadataDiscoveryPath: '/api/v1/models',
    chatPath: '/v1/chat/completions',
    officialDocs: 'https://lmstudio.ai/docs',
    note: 'Use the Local Server you started yourself. EONAPP may read the native v1 model manifest for context/capability metadata, while inference remains on the OpenAI-compatible text-chat surface. It never downloads or loads a model automatically.'
  }),
  jan: freezeRuntime({
    id: 'jan',
    label: 'Jan',
    defaultEndpoint: 'http://127.0.0.1:1337/v1',
    allowedPorts: Object.freeze([1337, 6767]),
    discoveryPath: '/v1/models',
    chatPath: '/v1/chat/completions',
    officialDocs: 'https://www.jan.ai/docs/desktop/api-server',
    note: 'Jan Desktop commonly serves on 1337; Jan CLI may serve a selected local model on 6767. Both are loopback-only and require user-started server/CORS readiness.'
  }),
  comfyui: freezeRuntime({
    id: 'comfyui',
    label: 'ComfyUI',
    runtimeKind: 'media',
    defaultEndpoint: 'http://127.0.0.1:8188',
    allowedPorts: Object.freeze([8000, 8188, 8189]),
    discoveryPath: '/object_info/CheckpointLoaderSimple',
    chatPath: '',
    textChat: 'not-connected',
    imageGeneration: 'discover-self-test-generate',
    videoGeneration: 'capability-and-reviewed-workflow-proof-gated',
    officialDocs: 'https://docs.comfy.org/',
    note: 'After an explicit Local AI setup action, EONAPP may discover installed checkpoints and a paired EON Local Companion may request a fixed reviewed start of already-installed ComfyUI. Video additionally requires supported capability, a session-confirmed source allowlist review and real proof. EON never installs ComfyUI/nodes, downloads media models without separate approval, probes LAN addresses, accepts arbitrary start commands, or silently enables cloud fallback.'
  }),
  acestep: freezeRuntime({
    id: 'acestep',
    label: 'ACE-Step 1.5',
    runtimeKind: 'media',
    defaultEndpoint: 'http://127.0.0.1:8001',
    allowedPorts: Object.freeze([8001]),
    discoveryPath: '/v1/models',
    chatPath: '',
    textChat: 'not-connected',
    musicGeneration: 'discover-explicit-generate-proof-gated',
    officialDocs: 'https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/API.md',
    note: 'EONAPP may connect only to a user-started ACE-Step API on loopback, list already-loaded models and submit an explicit bounded text-to-music job. It never starts ACE-Step, initializes a new model slot, downloads model weights, trains adapters, uploads reference audio, probes LAN addresses, or silently falls back to cloud.'
  })
});

export const LOCAL_AI_RUNTIME_IDS = Object.freeze(Object.keys(LOCAL_AI_RUNTIME_CONTRACTS));
export const LOCAL_AI_TEXT_RUNTIME_IDS = Object.freeze(LOCAL_AI_RUNTIME_IDS.filter((id) => LOCAL_AI_RUNTIME_CONTRACTS[id].runtimeKind === 'text'));
export const LOCAL_AI_MEDIA_RUNTIME_IDS = Object.freeze(LOCAL_AI_RUNTIME_IDS.filter((id) => LOCAL_AI_RUNTIME_CONTRACTS[id].runtimeKind === 'media'));

export function normalizeLocalAiRuntimeId(value = '') {
  const raw = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (raw === 'lmstudio') return 'lmstudio';
  if (raw === 'ollama' || raw === 'jan') return raw;
  if (raw === 'comfyui' || raw === 'comfy' || raw === 'comfydesktop') return 'comfyui';
  if (raw === 'acestep' || raw === 'acestep15' || raw === 'ace') return 'acestep';
  return '';
}

export function getLocalAiRuntimeContract(value = '') {
  const id = normalizeLocalAiRuntimeId(value);
  return LOCAL_AI_RUNTIME_CONTRACTS[id] || null;
}

function cleanHost(host = '') {
  return String(host || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
}

export function isApprovedLocalAiLoopbackEndpoint(value = '', runtimeValue = '') {
  const runtime = getLocalAiRuntimeContract(runtimeValue);
  if (!runtime) return false;
  try {
    const url = new URL(String(value || ''));
    const host = cleanHost(url.hostname);
    const port = Number(url.port || (url.protocol === 'http:' ? 80 : 443));
    return url.protocol === 'http:'
      && LOCAL_AI_LOOPBACK_HOSTS.map(cleanHost).includes(host)
      && runtime.allowedPorts.includes(port)
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

export function normalizeApprovedLocalAiEndpoint(value = '', runtimeValue = '') {
  const runtime = getLocalAiRuntimeContract(runtimeValue);
  if (!runtime) return '';
  const fallback = runtime.defaultEndpoint;
  const raw = String(value || fallback).trim();
  if (!isApprovedLocalAiLoopbackEndpoint(raw, runtime.id)) return fallback;
  const url = new URL(raw);
  url.username = '';
  url.password = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

export function getLocalAiCspLoopbackSources() {
  const rows = new Set(getEonLocalBridgeCspSources());
  for (const runtime of Object.values(LOCAL_AI_RUNTIME_CONTRACTS)) {
    for (const host of LOCAL_AI_LOOPBACK_HOSTS) {
      for (const port of runtime.allowedPorts) rows.add(`http://${host}:${port}`);
    }
  }
  return Object.freeze([...rows].sort());
}

export function getLocalAiRuntimeTruth() {
  return Object.freeze({
    schema: LOCAL_AI_BROWSER_CONTRACT_SCHEMA,
    asOf: LOCAL_AI_BROWSER_CONTRACT_AS_OF,
    localTextRuntimeIds: LOCAL_AI_TEXT_RUNTIME_IDS,
    localMediaRuntimeIds: LOCAL_AI_MEDIA_RUNTIME_IDS,
    textModelDiscovery: 'user-triggered-installed-model-list',
    textModelSelection: 'requires-self-test',
    imageModelSelection: 'user-triggered-installed-checkpoint-list',
    imageGeneration: 'proof-gated-comfyui-loopback',
    imageWorkflowRegistry: 'allowlisted-versioned-w625b',
    imageOutputProof: 'digest-matched-save-reopen-w625a',
    imageCancellation: 'explicit-queue-or-interrupt-w625a',
    imageCreatorFoundation: 'proof-gated-aspect-quality-seed-w625c',
    videoModelSelection: 'reviewed-native-workflow-session-confirmation',
    videoCapabilityDetection: 'supported-experimental-unsupported-w625d',
    videoOutputProof: 'digest-matched-save-reopen-playback-w625e',
    videoEfficiencyGovernor: 'bounded-one-job-explicit-cleanup-w625g',
    videoCertification: 'real-reference-device-and-owner-four-gb-fallback-w625h',
    musicRuntimeDiscovery: 'user-triggered-acestep-v15-api-model-list',
    musicGeneration: 'explicit-text-to-music-proof-gated-acestep-loopback',
    musicModelDownload: 'never-started-by-eonapp',
    arbitraryLanOrPrivateNetwork: false,
    cloudFallbackWithoutNewUserChoice: false,
    mediaRuntimeAdapter: 'comfyui-image-video-plus-acestep-music-proof'
  });
}

/**
 * Only these application routes may connect to a user-started Local AI
 * loopback runtime. This keeps the exception small and makes the header policy
 * reviewable rather than allowing generic private-network access site-wide.
 */
export const LOCAL_AI_RUNTIME_ROUTE_PATHS = Object.freeze([
  '/',
  '/index.html',
  '/chat',
  '/chat/',
  '/chat.html',
  '/local-ai',
  '/local-ai/',
  '/local-ai.html'
]);

export function getLocalAiRouteContentSecurityPolicy() {
  const loopbackSources = getLocalAiCspLoopbackSources().join(' ');
  return [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://telegram.org https://www.googletagmanager.com https://challenges.cloudflare.com",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' https: wss: ${loopbackSources}`,
    "font-src 'self' data: https://cdn.jsdelivr.net",
    "manifest-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-src 'self' https: blob:",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-to csp-endpoint",
    "report-uri /csp-report"
  ].join('; ');
}

export const BROWSER_LOCAL_LITE_WORKER_PATH = '/assets/js/local-ai/browser-local-lite-worker.js';

/**
 * Dedicated Local Lite inference worker CSP. The worker needs the reviewed
 * Transformers.js module, HTTPS model assets and WebAssembly compilation, but
 * it never needs loopback runtime access, forms, frames, media, fonts or Vault.
 */
export function getBrowserLocalLiteWorkerContentSecurityPolicy() {
  return [
    "default-src 'none'",
    "script-src 'self' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net",
    "connect-src 'self' https:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "report-to csp-endpoint",
    "report-uri /csp-report"
  ].join('; ');
}
