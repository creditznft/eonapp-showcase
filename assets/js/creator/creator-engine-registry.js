/**
 * W400/W402 — Creator Engine capability registry.
 *
 * This module is intentionally declarative. It describes safe creation paths
 * without installing models, reading provider secrets, uploading media, or
 * calling a generation service from the browser.
 */
import { buildLocalWorkloadMatrix, detectLocalAiCapabilityProfile } from '../utils/local-ai-capability-matrix.js';

export const CREATOR_ENGINE_SCHEMA = 'eonapp.creator-engine.registry.v1';

export const CREATOR_EXECUTION_MODES = Object.freeze([
  Object.freeze({
    id: 'draft-only',
    label: 'Draft and package',
    state: 'available',
    description: 'Prepare a brief, prompt deck, storyboard, shot list, captions, and export package without generating or uploading media.',
    requires: Object.freeze([]),
    externalEffect: false,
    keyCustody: 'none'
  }),
  Object.freeze({
    id: 'local-runtime',
    label: 'Local creator runtime',
    state: 'conditional',
    description: 'Use a user-installed, self-tested creator runtime on this device. EONAPP does not install runtimes or download models.',
    requires: Object.freeze(['user-installed-runtime', 'user-reviewed-model', 'device-self-test']),
    externalEffect: false,
    keyCustody: 'none'
  }),
  Object.freeze({
    id: 'byok-provider',
    label: 'Connected provider',
    state: 'planned',
    description: 'Use a user-selected provider only after a media-specific adapter, explicit compatibility proof, and Vault-only credential setup exist.',
    requires: Object.freeze(['vault-only-credential', 'provider-media-compatibility', 'explicit-user-run']),
    externalEffect: true,
    keyCustody: 'vault-only'
  })
]);

export const CREATOR_TASKS = Object.freeze([
  Object.freeze({
    id: 'image',
    label: 'Image generation',
    workloadId: 'image',
    output: 'Image concept, thumbnail, social visual, or poster.',
    localRail: 'ComfyUI-style image workflow',
    providerRail: 'Media-capable provider adapter (later)'
  }),
  Object.freeze({
    id: 'image-edit',
    label: 'Image editing',
    workloadId: 'image-edit',
    output: 'Background edit, refinement, layout pass, or variant.',
    localRail: 'ComfyUI-style image edit workflow',
    providerRail: 'Media-capable provider adapter (later)'
  }),
  Object.freeze({
    id: 'image-to-video',
    label: 'Image to video',
    workloadId: 'image-to-video',
    output: 'Short motion concept from a still image.',
    localRail: 'Advanced local image-to-video workflow',
    providerRail: 'Media-capable video provider adapter (later)'
  }),
  Object.freeze({
    id: 'video',
    label: 'Video generation',
    workloadId: 'full-video',
    output: 'Short-form video concept and render plan.',
    localRail: 'Advanced workstation video workflow',
    providerRail: 'Media-capable video provider adapter (later)'
  }),
  Object.freeze({
    id: 'music',
    label: 'Music generation',
    workloadId: 'music-audio',
    output: 'Music brief, sequencer pattern, soundtrack direction, or explicit local generative track.',
    localRail: 'Web Audio pattern engine plus optional user-started ACE-Step 1.5 loopback generation',
    providerRail: 'Music-capable BYOK adapter after verification'
  }),
  Object.freeze({
    id: 'auto-dj',
    label: 'Auto DJ',
    workloadId: 'music-audio',
    output: 'Rights-gated set order and transition plan for user-authorized audio.',
    localRail: 'Browser metadata analysis and deterministic transition planning',
    providerRail: 'Optional stem/analysis provider only after verification'
  }),
  Object.freeze({
    id: 'radio',
    label: 'EON Radio',
    workloadId: 'music-audio',
    output: 'Private personal station profile for EON-generated and user-authorized tracks.',
    localRail: 'Local station profile and preference plan',
    providerRail: 'Generative music adapter for new station tracks after verification'
  }),
  Object.freeze({
    id: 'voice-audio',
    label: 'Voice and audio direction',
    workloadId: 'music-audio',
    output: 'Voiceover script, cue sheet, audio direction, or caption timing.',
    localRail: 'Local or hybrid audio workflow',
    providerRail: 'Audio-capable provider adapter (later)'
  }),
  Object.freeze({
    id: 'content-package',
    label: 'Creator package',
    workloadId: 'text-chat',
    output: 'Hooks, captions, CTA variants, storyboard, disclosure reminders, and share brief.',
    localRail: 'Local text runtime or Guide Mode',
    providerRail: 'Current chat provider after its own verification'
  })
]);

export const CREATOR_ADAPTERS = Object.freeze([
  Object.freeze({
    id: 'local-comfyui',
    label: 'Local ComfyUI-style media runtime',
    mode: 'local-runtime',
    supports: Object.freeze(['image', 'image-edit', 'image-to-video', 'video']),
    state: 'setup-guidance-only',
    connection: 'not-connected',
    secretHandling: 'none',
    userAction: 'Install, choose models, and self-test outside this browser before any later adapter is enabled.'
  }),
  Object.freeze({
    id: 'music-browser',
    label: 'Browser music pattern engine',
    mode: 'local-runtime',
    supports: Object.freeze(['music', 'auto-dj', 'radio']),
    state: 'available',
    connection: 'browser-native',
    secretHandling: 'none',
    userAction: 'Generate or edit deterministic sequencer patterns locally. This adapter does not claim text-to-audio generation.'
  }),
  Object.freeze({
    id: 'local-acestep',
    label: 'Local ACE-Step 1.5 music runtime',
    mode: 'local-runtime',
    supports: Object.freeze(['music', 'radio']),
    state: 'source-integrated-proof-pending',
    connection: 'explicit-loopback-scan-and-run',
    secretHandling: 'optional-api-key-session-only',
    userAction: 'Start ACE-Step yourself, optionally store its API key for this browser session, scan already-loaded models, then explicitly generate. EONAPP does not initialize/download models, train adapters, submit reference audio, or fall back to cloud.'
  }),
  Object.freeze({
    id: 'music-generative-adapter',
    label: 'Generative music adapter authority',
    mode: 'local-runtime',
    supports: Object.freeze(['music', 'radio']),
    state: 'source-integrated-proof-pending',
    connection: 'local-acestep-plus-hosted-direct-byok-companion',
    secretHandling: 'runtime-specific',
    userAction: 'Only call a track model-generated after an explicit adapter run returns playable audio. Source integration alone is not launch certification.'
  }),
  Object.freeze({
    id: 'hosted-music-direct-byok',
    label: 'Hosted Music Direct BYOK',
    mode: 'byok-provider',
    supports: Object.freeze(['music', 'radio']),
    state: 'source-integrated-proof-pending',
    connection: 'paired-loopback-creator-companion',
    secretHandling: 'os-secure-credential-store',
    userAction: 'Pair the local Creator Companion, explicitly store your provider key in the OS vault, review your provider plan/credits, then approve one Music v2 request. No EONAPP server proxy, upload/inpainting rail, automatic paid retry or silent provider switch is allowed.'
  }),
  Object.freeze({
    id: 'vault-media-provider',
    label: 'Vault-connected media provider',
    mode: 'byok-provider',
    supports: Object.freeze(['image', 'image-edit', 'image-to-video', 'video', 'music', 'auto-dj', 'radio', 'voice-audio']),
    state: 'mixed-provider-programme',
    connection: 'image-video-design-plus-hosted-music-companion',
    secretHandling: 'vault-only',
    userAction: 'Image/video provider activation remains separately proof-gated. Hosted Music now uses the local Creator Companion OS vault instead of browser or EONAPP-server credential custody; no media model is globally certified by source integration alone.'
  }),
  Object.freeze({
    id: 'creator-draft',
    label: 'Creator draft package',
    mode: 'draft-only',
    supports: Object.freeze(['image', 'image-edit', 'image-to-video', 'video', 'music', 'auto-dj', 'radio', 'voice-audio', 'content-package']),
    state: 'available',
    connection: 'none',
    secretHandling: 'none',
    userAction: 'Prepare a local brief and export it when ready.'
  })
]);

function findTask(taskId = '') {
  return CREATOR_TASKS.find((item) => item.id === String(taskId || '').trim()) || CREATOR_TASKS[0];
}

function findMode(modeId = '') {
  return CREATOR_EXECUTION_MODES.find((item) => item.id === String(modeId || '').trim()) || CREATOR_EXECUTION_MODES[0];
}

function workloadFor(task, profile, localRuntimeDetected = false) {
  const matrix = buildLocalWorkloadMatrix(profile, { localProviders: localRuntimeDetected ? [{ available: true, provider: 'creator-runtime' }] : [] });
  return matrix.find((item) => item.id === task.workloadId) || { status: 'cloud-preferred', path: 'cloud', reason: 'Use a draft-first or connected-provider path for this workload.' };
}

function localModeFor(workload = {}) {
  const localReady = ['ready-local', 'installable-local', 'advanced-local'].includes(String(workload.status || ''));
  const locallySafe = localReady && ['local', 'hybrid'].includes(String(workload.path || ''));
  return Object.freeze({
    ...findMode('local-runtime'),
    state: locallySafe ? (workload.status === 'advanced-local' ? 'advanced' : 'candidate') : 'not-recommended',
    available: locallySafe,
    reason: workload.reason || 'Local creator runtime is not recommended for this task on this device.'
  });
}

function providerModeFor(task = {}) {
  return Object.freeze({
    ...findMode('byok-provider'),
    state: 'adapter-design-only',
    available: false,
    reason: `${task.providerRail} is intentionally not connected in this release. Keep credentials in Vault; do not paste them into Chat or a creator brief.`
  });
}

export function buildCreatorTaskPlan(taskId = 'image', options = {}) {
  const task = findTask(taskId);
  const profile = options.profile || detectLocalAiCapabilityProfile();
  const workload = workloadFor(task, profile, Boolean(options.localRuntimeDetected));
  return Object.freeze({
    schema: CREATOR_ENGINE_SCHEMA,
    task,
    device: Object.freeze({
      label: profile.label,
      computeClass: profile.computeClass,
      acceleration: profile.acceleration,
      summary: profile.summary
    }),
    workload: Object.freeze({ status: workload.status, path: workload.path, reason: workload.reason }),
    modes: Object.freeze([
      Object.freeze({ ...findMode('draft-only'), available: true, reason: 'Always available locally. It makes a brief, not media.' }),
      localModeFor(workload),
      providerModeFor(task)
    ]),
    limitations: Object.freeze([
      'No model installer, model download, provider call, upload, render, or publish happens from this plan.',
      'Device capability is an estimate. Free storage, VRAM, heat, battery health, and provider model availability still require user review.',
      'A media provider is not considered ready merely because a key exists in Vault.'
    ])
  });
}

export function buildCreatorEngineOverview(options = {}) {
  const profile = options.profile || detectLocalAiCapabilityProfile();
  const localRuntimeDetected = Boolean(options.localRuntimeDetected);
  const taskPlans = CREATOR_TASKS.map((task) => buildCreatorTaskPlan(task.id, { profile, localRuntimeDetected }));
  return Object.freeze({
    schema: CREATOR_ENGINE_SCHEMA,
    profile,
    executionModes: CREATOR_EXECUTION_MODES,
    adapters: CREATOR_ADAPTERS,
    taskPlans,
    truth: Object.freeze({
      providerCalls: false,
      providerCredentialsRead: false,
      localModelInstaller: false,
      modelDownloads: false,
      upload: false,
      publish: false,
      durableMediaStorage: false
    })
  });
}

export function getCreatorTask(taskId = '') {
  return findTask(taskId);
}

export function getCreatorExecutionMode(modeId = '') {
  return findMode(modeId);
}
