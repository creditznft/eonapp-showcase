/**
 * W605 — conservative local image/video test profiles.
 * Profiles are setup and benchmark guidance only. They never download models,
 * connect a media runtime, or promise a render on a particular GPU.
 */
export const EON_LOCAL_CREATOR_MEDIA_PROFILE_SCHEMA = 'eonapp.w605.local-creator-media-profiles.v1';

const PROFILE_CATALOG = Object.freeze([
  Object.freeze({
    id: 'image-sd15-512-baseline',
    task: 'image',
    label: '512px image baseline',
    runtime: 'ComfyUI',
    modelFamily: 'Stable Diffusion 1.5-class checkpoint',
    hardware: '4 GB+ VRAM trial baseline',
    output: 'One 512×512 image, batch 1',
    state: 'candidate-local',
    reason: 'A deliberately small image baseline for confirming installation, GPU visibility, output saving and basic prompt quality before larger models.',
    highLoad: false,
    externalReferences: Object.freeze(['ComfyUI API workflow export'])
  }),
  Object.freeze({
    id: 'video-ltx-2b-microclip-trial',
    task: 'image-to-video',
    label: 'LTX-Video 2B micro-clip trial',
    runtime: 'ComfyUI',
    modelFamily: 'LTX-Video 2B distilled-class workflow',
    hardware: 'Low-VRAM experimental trial only',
    output: 'One very short low-resolution image-to-video micro-clip',
    state: 'trial-only',
    reason: 'Use only after the image baseline passes. This is an explicit high-load experiment, not a promise that 4 GB VRAM can support dependable image-to-video work.',
    highLoad: true,
    externalReferences: Object.freeze(['LTX-Video 2B model card and official ComfyUI workflow'])
  }),
  Object.freeze({
    id: 'video-wan-13b-480',
    task: 'video',
    label: 'Wan 1.3B 480p video path',
    runtime: 'ComfyUI or official Wan runtime',
    modelFamily: 'Wan 2.1 T2V 1.3B-class',
    hardware: '8 GB+ VRAM category',
    output: 'One short 480p text-to-video output',
    state: 'higher-vram-required',
    reason: 'Keep this outside a 4 GB GPU default. Model documentation reports a larger VRAM requirement before optimisation, so it belongs on a better-equipped local device or a connected provider route.',
    highLoad: true,
    externalReferences: Object.freeze(['Wan 2.1 model card'])
  }),
  Object.freeze({
    id: 'video-wan-i2v-14b',
    task: 'image-to-video',
    label: 'Wan I2V 14B quality path',
    runtime: 'ComfyUI or official Wan runtime',
    modelFamily: 'Wan image-to-video 14B-class',
    hardware: '16 GB+ VRAM / workstation category',
    output: 'Short quality image-to-video sequence',
    state: 'workstation-or-provider',
    reason: 'For users with high-VRAM hardware or a user-chosen connected provider. Never make this the default for small laptops.',
    highLoad: true,
    externalReferences: Object.freeze(['Wan 2.1 model card'])
  }),
  Object.freeze({
    id: 'video-ltx-13b-quality',
    task: 'image-to-video',
    label: 'LTX-Video 13B quality path',
    runtime: 'ComfyUI',
    modelFamily: 'LTX-Video 13B-class',
    hardware: 'High-VRAM creator/workstation category',
    output: 'High-quality image-to-video sequence',
    state: 'workstation-or-provider',
    reason: 'A larger quality-oriented route for users who can prove device fit or choose a connected provider. It is not a small-laptop profile.',
    highLoad: true,
    externalReferences: Object.freeze(['LTX-Video model card'])
  })
]);

function asFinite(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function classifyCreatorMediaHardware(options = {}) {
  const systemMemoryGb = asFinite(options.systemMemoryGb || options.memoryGB || options.memoryGb);
  const gpuVramGb = asFinite(options.gpuVramGb || options.gpuVRAMGb || options.vramGb);
  if (!gpuVramGb) return Object.freeze({ id: 'vram-unknown', label: 'GPU VRAM not verified', gpuVramGb: 0, systemMemoryGb, reason: 'Browser RAM is not GPU VRAM. Do not promise local media performance until VRAM is known or a real self-test passes.' });
  if (gpuVramGb < 6) return Object.freeze({ id: 'low-vram', label: 'Low-VRAM creator device', gpuVramGb, systemMemoryGb, reason: 'Use the 512px image baseline. Keep local video locked on this device and move video to a proven 8 GB+ reference device or a future user-chosen provider route.' });
  if (gpuVramGb < 12) return Object.freeze({ id: 'mid-vram', label: 'Mid-VRAM creator device', gpuVramGb, systemMemoryGb, reason: 'Images and some optimized video workflows may be practical after proof; use output tests and preserve a provider path.' });
  if (gpuVramGb < 20) return Object.freeze({ id: 'high-vram', label: 'High-VRAM creator device', gpuVramGb, systemMemoryGb, reason: 'Broader local image/video workflows may be practical, but model-specific evidence and thermal/storage checks remain required.' });
  return Object.freeze({ id: 'workstation-vram', label: 'Workstation creator device', gpuVramGb, systemMemoryGb, reason: 'High-end local video routes are possible subject to model-specific proof, storage, heat and workflow validation.' });
}

function eligible(profile, hardware) {
  if (profile.id === 'image-sd15-512-baseline') return hardware.id !== 'vram-unknown' ? 'candidate' : 'needs-vram-check';
  if (profile.id === 'video-ltx-2b-microclip-trial') return hardware.id === 'low-vram' ? 'not-recommended' : ['mid-vram', 'high-vram', 'workstation-vram'].includes(hardware.id) ? 'trial-only' : 'needs-vram-check';
  if (profile.id === 'video-wan-13b-480') return ['mid-vram', 'high-vram', 'workstation-vram'].includes(hardware.id) ? 'candidate' : 'not-recommended';
  return ['high-vram', 'workstation-vram'].includes(hardware.id) ? 'candidate' : 'not-recommended';
}

export function buildLocalCreatorMediaProfilePlan(options = {}) {
  const hardware = classifyCreatorMediaHardware(options);
  const profiles = PROFILE_CATALOG.map((profile) => Object.freeze({ ...profile, eligibility: eligible(profile, hardware) }));
  const recommended = profiles.filter((profile) => profile.eligibility === 'candidate' || profile.eligibility === 'trial-only');
  return Object.freeze({
    schema: EON_LOCAL_CREATOR_MEDIA_PROFILE_SCHEMA,
    hardware,
    profiles: Object.freeze(profiles),
    recommendedIds: Object.freeze(recommended.map((profile) => profile.id)),
    firstTest: hardware.id === 'low-vram'
      ? 'Run the 512px image baseline first. Local video stays locked on this 4 GB-class device; use a proven 8 GB+ reference device for video.'
      : 'Run a small image baseline, verify saved output, then choose one media profile that fits the proven VRAM tier.',
    truth: Object.freeze({
      browserInstallsModels: false,
      adapterConnected: false,
      liveGenerationProven: false,
      vramDerivedFromBrowserRam: false,
      outputRequiresHumanReview: true
    })
  });
}

export function getLocalCreatorMediaProfileCatalog() {
  return PROFILE_CATALOG;
}
