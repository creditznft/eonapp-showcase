/**
 * W625B — versioned, allowlisted local-image workflow and device registry.
 *
 * The registry is descriptive and deterministic. It does not import arbitrary
 * workflows, download checkpoints, install nodes, start ComfyUI, or make a
 * network request. Only workflows declared here may be submitted by EONAPP.
 */

export const COMFYUI_IMAGE_WORKFLOW_REGISTRY_SCHEMA = 'eonapp.local-ai.comfyui-image-workflow-registry.w625b.v1';
export const COMFYUI_IMAGE_WORKFLOW_REGISTRY_AS_OF = '2026-07-11';

const GIB = 1024 ** 3;
const freeze = (value) => Object.freeze(value);

export const COMFYUI_IMAGE_DEVICE_PROFILES = freeze([
  freeze({
    id: 'low-vram',
    label: 'Low VRAM',
    minimumVramBytes: 0,
    maximumVramBytes: 6 * GIB,
    defaultWidth: 512,
    defaultHeight: 512,
    maximumDimension: 512,
    defaultSteps: 12,
    maximumSteps: 18,
    defaultCfg: 6,
    queueConcurrency: 1,
    proofEligible: true,
    note: 'Conservative 512×512, batch-one defaults for approximately 4–6 GB GPUs and unknown devices.'
  }),
  freeze({
    id: 'medium',
    label: 'Medium',
    minimumVramBytes: 6 * GIB,
    maximumVramBytes: 12 * GIB,
    defaultWidth: 640,
    defaultHeight: 640,
    maximumDimension: 768,
    defaultSteps: 20,
    maximumSteps: 28,
    defaultCfg: 6.5,
    queueConcurrency: 1,
    proofEligible: false,
    note: 'Larger still-image presets remain secondary until the 512×512 proof lane passes on the owner machine.'
  }),
  freeze({
    id: 'high-end',
    label: 'High end',
    minimumVramBytes: 12 * GIB,
    maximumVramBytes: Number.POSITIVE_INFINITY,
    defaultWidth: 768,
    defaultHeight: 768,
    maximumDimension: 1024,
    defaultSteps: 28,
    maximumSteps: 36,
    defaultCfg: 7,
    queueConcurrency: 1,
    proofEligible: false,
    note: 'High-resolution still-image settings require separate real-device evidence; concurrency remains one.'
  })
]);

export const COMFYUI_IMAGE_ASPECT_PRESETS = freeze([
  freeze({ id: 'square', label: 'Square', ratio: '1:1', widthFactor: 1, heightFactor: 1 }),
  freeze({ id: 'portrait', label: 'Portrait', ratio: '4:5', widthFactor: 0.8, heightFactor: 1 }),
  freeze({ id: 'landscape', label: 'Landscape', ratio: '5:4', widthFactor: 1, heightFactor: 0.8 }),
  freeze({ id: 'story', label: 'Story', ratio: '9:16', widthFactor: 0.5625, heightFactor: 1 }),
  freeze({ id: 'wide', label: 'Wide', ratio: '16:9', widthFactor: 1, heightFactor: 0.5625 })
]);

export const COMFYUI_IMAGE_QUALITY_PRESETS = freeze([
  freeze({ id: 'proof', label: 'Proof', stepFactor: 1, cfgOffset: 0, proofEligible: true, note: 'Fixed conservative lane used for the first local-image verification.' }),
  freeze({ id: 'draft', label: 'Draft', stepFactor: 0.7, cfgOffset: -0.5, proofEligible: false, note: 'Faster preview after the first proof passes.' }),
  freeze({ id: 'balanced', label: 'Balanced', stepFactor: 1.25, cfgOffset: 0.25, proofEligible: false, note: 'General creator preset after the first proof passes.' }),
  freeze({ id: 'detail', label: 'Detail', stepFactor: 1.6, cfgOffset: 0.5, proofEligible: false, note: 'Higher workload; capped by the selected device profile.' })
]);

export const COMFYUI_IMAGE_WORKFLOWS = freeze([
  freeze({
    id: 'builtin-checkpoint-txt2img-v1',
    version: 1,
    label: 'Built-in checkpoint text to image',
    task: 'text-to-image',
    status: 'allowlisted',
    proofEligible: true,
    standardNodesOnly: true,
    nodeTypes: freeze(['CheckpointLoaderSimple', 'CLIPTextEncode', 'EmptyLatentImage', 'KSampler', 'VAEDecode', 'SaveImage']),
    sampler: 'euler',
    scheduler: 'normal',
    batchSize: 1,
    checkpointFamilies: freeze(['sd15']),
    candidateCheckpointFamilies: freeze(['sdxl']),
    source: 'EONAPP-authored built-in graph; no imported workflow file.',
    licenseNote: 'The owner must review the selected checkpoint source and licence. EONAPP does not download or redistribute a checkpoint.',
    limitations: freeze([
      'The first local-image verification uses only the low-VRAM 512×512, 12-step recipe.',
      'Reference image, inpaint, outpaint and upscale require separate allowlisted workflows and real proof.',
      'Unknown or custom checkpoint families are never auto-selected as proof evidence.'
    ])
  })
]);

function cleanText(value = '', max = 240) {
  return Array.from(String(value || ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code >= 32 && code !== 127 ? character : ' ';
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function roundTo64(value, minimum = 256, maximum = 1024) {
  const bounded = Math.max(minimum, Math.min(maximum, Number(value) || minimum));
  return Math.max(minimum, Math.round(bounded / 64) * 64);
}

function findById(rows, id, fallbackId) {
  return rows.find((row) => row.id === String(id || '').trim()) || rows.find((row) => row.id === fallbackId) || rows[0];
}

export function classifyComfyUiCheckpoint(name = '') {
  const value = cleanText(name, 220);
  const lower = value.toLowerCase();
  let family = 'unknown';
  if (/(?:^|[^a-z0-9])(?:sd[-_. ]?1[._-]?5|v1[-_. ]?5|stable[-_. ]?diffusion[-_. ]?1[._-]?5)(?:[^a-z0-9]|$)/i.test(value)) family = 'sd15';
  else if (/sdxl|stable[-_. ]?diffusion[-_. ]?xl/i.test(value)) family = 'sdxl';
  else if (/flux/i.test(value)) family = 'flux';
  return freeze({
    name: value,
    family,
    proofEligible: family === 'sd15',
    candidate: family === 'sdxl',
    blockedForAutomaticProof: !['sd15'].includes(family),
    reason: family === 'sd15'
      ? 'Name appears compatible with the conservative SD 1.5 proof lane.'
      : family === 'sdxl'
        ? 'SDXL is a candidate for later device-specific evidence, not the first low-VRAM proof.'
        : lower
          ? 'Checkpoint family is not recognised for automatic local-image verification selection.'
          : 'Checkpoint name is empty.'
  });
}

export function getComfyUiImageDeviceProfile(devices = [], requestedId = '') {
  if (requestedId) return findById(COMFYUI_IMAGE_DEVICE_PROFILES, requestedId, 'low-vram');
  const rows = Array.isArray(devices) ? devices : [];
  const vram = Math.max(0, ...rows.map((row) => Number(row?.vramTotalBytes || row?.torchVramTotalBytes || 0) || 0));
  return COMFYUI_IMAGE_DEVICE_PROFILES.find((profile) => vram >= profile.minimumVramBytes && vram < profile.maximumVramBytes)
    || COMFYUI_IMAGE_DEVICE_PROFILES[0];
}

export function getComfyUiImageWorkflow(id = '') {
  return findById(COMFYUI_IMAGE_WORKFLOWS, id, 'builtin-checkpoint-txt2img-v1');
}

export function listComfyUiCheckpointOptions(names = []) {
  return freeze((Array.isArray(names) ? names : [])
    .map((name) => classifyComfyUiCheckpoint(name))
    .filter((row) => row.name)
    .slice(0, 120));
}

export function chooseProofEligibleComfyUiCheckpoint(names = []) {
  return listComfyUiCheckpointOptions(names).find((row) => row.proofEligible)?.name || '';
}

export function resolveComfyUiImageRecipe(options = {}) {
  const workflow = getComfyUiImageWorkflow(options.workflowId);
  const profile = getComfyUiImageDeviceProfile(options.devices, options.profileId);
  const proofMode = options.proofMode !== false;
  const aspect = findById(COMFYUI_IMAGE_ASPECT_PRESETS, proofMode ? 'square' : options.aspectId, 'square');
  const quality = findById(COMFYUI_IMAGE_QUALITY_PRESETS, proofMode ? 'proof' : options.qualityId, 'proof');
  const checkpoint = classifyComfyUiCheckpoint(options.checkpoint);
  const baseDimension = proofMode ? 512 : profile.defaultWidth;
  const maximumDimension = proofMode ? 512 : profile.maximumDimension;
  const width = roundTo64(baseDimension * aspect.widthFactor, 256, maximumDimension);
  const height = roundTo64((proofMode ? 512 : profile.defaultHeight) * aspect.heightFactor, 256, maximumDimension);
  const requestedSteps = proofMode ? 12 : Math.round(profile.defaultSteps * quality.stepFactor);
  const steps = Math.max(4, Math.min(proofMode ? 12 : profile.maximumSteps, requestedSteps));
  const cfg = Math.max(1, Math.min(15, Number((profile.defaultCfg + quality.cfgOffset).toFixed(2))));
  const requestedSeed = Number(options.seed);
  const seed = Number.isInteger(requestedSeed) && requestedSeed >= 0 && requestedSeed <= 2_147_483_647
    ? requestedSeed
    : Math.floor(Math.random() * 2_147_483_647);
  return freeze({
    schema: 'eonapp.local-ai.comfyui-image-recipe.w625b.v1',
    workflowId: workflow.id,
    workflowVersion: workflow.version,
    profileId: profile.id,
    aspectId: aspect.id,
    qualityId: quality.id,
    checkpointFamily: checkpoint.family,
    checkpointProofEligible: checkpoint.proofEligible,
    proofMode,
    width,
    height,
    steps,
    cfg,
    seed,
    sampler: workflow.sampler,
    scheduler: workflow.scheduler,
    batchSize: workflow.batchSize,
    standardNodesOnly: workflow.standardNodesOnly,
    videoEnabled: false,
    importedWorkflowAccepted: false
  });
}

export function getComfyUiImageWorkflowRegistryTruth() {
  return freeze({
    schema: COMFYUI_IMAGE_WORKFLOW_REGISTRY_SCHEMA,
    asOf: COMFYUI_IMAGE_WORKFLOW_REGISTRY_AS_OF,
    workflowCount: COMFYUI_IMAGE_WORKFLOWS.length,
    deviceProfileCount: COMFYUI_IMAGE_DEVICE_PROFILES.length,
    automaticWorkflowImport: false,
    automaticModelInstall: false,
    automaticNodeInstall: false,
    lanOrPublicRuntime: false,
    cloudFallback: false,
    queueConcurrencyDefault: 1,
    firstProof: freeze({ profileId: 'low-vram', aspectId: 'square', qualityId: 'proof', width: 512, height: 512, steps: 12, batchSize: 1 }),
    laterTasks: freeze({
      referenceImage: 'not-enabled-pending-allowlisted-workflow-and-proof',
      variation: 'seed-and-prompt-variation-source-ready-after-first-proof',
      editInpaint: 'not-enabled-pending-allowlisted-workflow-and-proof',
      outpaint: 'not-enabled-pending-allowlisted-workflow-and-proof',
      upscale: 'not-enabled-pending-allowlisted-workflow-and-proof',
      video: 'disabled-in-w625a-w625c'
    })
  });
}
