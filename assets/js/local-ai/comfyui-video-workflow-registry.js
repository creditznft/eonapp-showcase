/**
 * W625E/W625F — strict source-owned contract for a reviewed native ComfyUI
 * image-to-video API workflow. Arbitrary graphs are rejected before upload.
 */
import { normalizeLocalVideoRecipe } from './local-video-efficiency-governor.js';

export const COMFYUI_VIDEO_WORKFLOW_SCHEMA = 'eon.local-ai.comfyui-video-workflow-registry.w625f.v1';
export const COMFYUI_VIDEO_WORKFLOW_ID = 'eon-wan22-ti2v5b-native-i2v-v1';
export const COMFYUI_VIDEO_WORKFLOW_VERSION = '1.0.0-review-contract';

const MAX_WORKFLOW_BYTES = 1_500_000;
const MAX_NODE_COUNT = 96;
const FORBIDDEN_CLASS_PATTERN = /(http|websocket|api|cloud|upload.*url|download|shell|terminal|python.*exec|javascript|customscript|subprocess|commandline)/i;
const ALLOWED_NATIVE_CLASS_TYPES = Object.freeze(new Set([
  'LoadImage',
  'CLIPTextEncode',
  'CLIPLoader',
  'DualCLIPLoader',
  'TripleCLIPLoader',
  'UNETLoader',
  'VAELoader',
  'CheckpointLoaderSimple',
  'ModelSamplingSD3',
  'KSampler',
  'KSamplerAdvanced',
  'RandomNoise',
  'BasicScheduler',
  'BasicGuider',
  'CFGGuider',
  'SamplerCustom',
  'SamplerCustomAdvanced',
  'WanImageToVideo',
  'WanVideoImageToVideo',
  'EmptyHunyuanLatentVideo',
  'EmptyMochiLatentVideo',
  'VAEDecode',
  'CreateVideo',
  'SaveVideo',
  'SaveWEBM',
  'SaveAnimatedWEBP',
  'VideoCombine',
  'PreviewImage',
  'SaveImage'
]));

const ROLE_MATCHERS = Object.freeze({
  inputImage: Object.freeze(['LoadImage']),
  prompt: Object.freeze(['CLIPTextEncode']),
  sampler: Object.freeze(['KSampler', 'KSamplerAdvanced', 'SamplerCustom', 'SamplerCustomAdvanced']),
  decode: Object.freeze(['VAEDecode']),
  output: Object.freeze(['SaveVideo', 'SaveWEBM', 'SaveAnimatedWEBP', 'VideoCombine', 'CreateVideo'])
});

function clean(value = '', max = 240) {
  const printable = Array.from(String(value || ''), (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  }).join('');
  return printable.replace(/\s+/g, ' ').trim().slice(0, max);
}

function stableClone(value) {
  if (Array.isArray(value)) return value.map(stableClone);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableClone(value[key])]));
  return value;
}

async function digestText(value = '') {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await globalThis.crypto?.subtle?.digest?.('SHA-256', bytes);
  if (!digest) throw new Error('sha256-unavailable');
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function nodeEntries(workflow = {}) {
  return Object.entries(workflow && typeof workflow === 'object' && !Array.isArray(workflow) ? workflow : {})
    .filter(([, row]) => row && typeof row === 'object' && typeof row.class_type === 'string');
}

function nodesForRole(entries, role) {
  const allowed = new Set(ROLE_MATCHERS[role] || []);
  return entries.filter(([, row]) => allowed.has(row.class_type));
}

function hasCustomNodeHint(row = {}) {
  const classType = clean(row.class_type, 120);
  const metadata = clean(`${row?._meta?.title || ''} ${row?._meta?.category || ''}`, 200);
  return FORBIDDEN_CLASS_PATTERN.test(classType) || FORBIDDEN_CLASS_PATTERN.test(metadata) || /custom|extension|impact|was|vhs/i.test(metadata);
}

export async function reviewComfyUiVideoApiWorkflow(input = {}) {
  let workflow = input;
  let rawBytes = 0;
  if (typeof input === 'string') {
    rawBytes = new TextEncoder().encode(input).byteLength;
    try { workflow = JSON.parse(input); } catch { return Object.freeze({ ok: false, error: 'workflow-json-invalid', message: 'Choose a valid ComfyUI API-format JSON workflow.' }); }
  } else {
    rawBytes = new TextEncoder().encode(JSON.stringify(input || {})).byteLength;
  }
  if (rawBytes < 20 || rawBytes > MAX_WORKFLOW_BYTES) return Object.freeze({ ok: false, error: 'workflow-size-invalid', message: 'The workflow file is empty or larger than the reviewed local limit.' });
  const entries = nodeEntries(workflow);
  if (!entries.length || entries.length > MAX_NODE_COUNT) return Object.freeze({ ok: false, error: 'workflow-node-count-invalid', message: 'The workflow must be API format and stay within the reviewed node-count limit.' });
  const classTypes = [...new Set(entries.map(([, row]) => clean(row.class_type, 120)))].sort();
  const forbiddenClassTypes = classTypes.filter((classType) => FORBIDDEN_CLASS_PATTERN.test(classType));
  const unapprovedClassTypes = classTypes.filter((classType) => !ALLOWED_NATIVE_CLASS_TYPES.has(classType));
  const customHints = entries.filter(([, row]) => hasCustomNodeHint(row)).map(([id, row]) => `${id}:${clean(row.class_type, 120)}`);
  const missingRoles = Object.keys(ROLE_MATCHERS).filter((role) => nodesForRole(entries, role).length === 0);
  const blockers = [];
  if (forbiddenClassTypes.length) blockers.push('forbidden-network-or-execution-node');
  if (unapprovedClassTypes.length) blockers.push('unapproved-node-class-present');
  if (customHints.length) blockers.push('custom-node-hint-present');
  if (missingRoles.length) blockers.push('required-workflow-role-missing');
  const canonical = JSON.stringify(stableClone(workflow));
  let sha256 = '';
  try { sha256 = await digestText(canonical); } catch { blockers.push('sha256-unavailable'); }
  return Object.freeze({
    ok: blockers.length === 0,
    schema: COMFYUI_VIDEO_WORKFLOW_SCHEMA,
    workflowId: COMFYUI_VIDEO_WORKFLOW_ID,
    version: COMFYUI_VIDEO_WORKFLOW_VERSION,
    sha256,
    nodeCount: entries.length,
    classTypes: Object.freeze(classTypes),
    unapprovedClassTypes: Object.freeze(unapprovedClassTypes),
    forbiddenClassTypes: Object.freeze(forbiddenClassTypes),
    customNodeHints: Object.freeze(customHints),
    missingRoles: Object.freeze(missingRoles),
    blockers: Object.freeze(blockers),
    workflow: blockers.length ? null : workflow,
    standardCoreNodesOnly: blockers.length === 0,
    sourceOwnedContract: true,
    arbitraryWorkflowExecutionAllowed: false,
    message: blockers.length
      ? 'This workflow is not eligible for the reviewed local-video lane. EONAPP will not submit it.'
      : 'The API workflow matches the source-owned node and role allowlist. Confirm the exact digest for this session before submission.'
  });
}

function cloneWorkflow(workflow) {
  return JSON.parse(JSON.stringify(workflow || {}));
}

function patchInput(row, keys, value) {
  if (!row?.inputs || typeof row.inputs !== 'object') return false;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row.inputs, key) && !Array.isArray(row.inputs[key])) {
      row.inputs[key] = value;
      return true;
    }
  }
  return false;
}

export function prepareComfyUiVideoApiWorkflow(review = {}, input = {}) {
  if (review?.ok !== true || !review.workflow || !review.sha256) throw new Error('reviewed-workflow-required');
  if (input.confirmedWorkflowSha256 !== review.sha256) throw new Error('workflow-digest-confirmation-required');
  const recipe = normalizeLocalVideoRecipe(input);
  if (recipe.mode !== 'image-to-video') throw new Error('image-to-video-required-for-first-proof');
  const workflow = cloneWorkflow(review.workflow);
  const entries = nodeEntries(workflow);
  let inputImagePatched = false;
  let promptPatched = false;
  let seedPatched = false;
  let dimensionsPatched = 0;
  let framesPatched = false;
  let fpsPatched = false;
  for (const [, row] of entries) {
    if (row.class_type === 'LoadImage') inputImagePatched = patchInput(row, ['image'], clean(input.uploadedImageName, 220)) || inputImagePatched;
    if (row.class_type === 'CLIPTextEncode' && !promptPatched) promptPatched = patchInput(row, ['text'], clean(input.prompt, 1400)) || promptPatched;
    if (['KSampler', 'KSamplerAdvanced', 'RandomNoise'].includes(row.class_type)) seedPatched = patchInput(row, ['seed', 'noise_seed'], recipe.seed ?? 1) || seedPatched;
    dimensionsPatched += patchInput(row, ['width'], recipe.width) ? 1 : 0;
    dimensionsPatched += patchInput(row, ['height'], recipe.height) ? 1 : 0;
    framesPatched = patchInput(row, ['length', 'frames', 'num_frames'], recipe.frames) || framesPatched;
    fpsPatched = patchInput(row, ['fps', 'frame_rate'], recipe.fps) || fpsPatched;
  }
  const missingPatches = [];
  if (!inputImagePatched) missingPatches.push('input-image');
  if (!promptPatched) missingPatches.push('prompt');
  if (!seedPatched) missingPatches.push('seed');
  if (dimensionsPatched < 2) missingPatches.push('dimensions');
  if (!framesPatched) missingPatches.push('frames');
  if (!fpsPatched) missingPatches.push('fps');
  if (missingPatches.length) throw new Error(`workflow-parameter-slot-missing:${missingPatches.join(',')}`);
  return Object.freeze({ workflow, recipe, workflowId: review.workflowId, workflowVersion: review.version, workflowSha256: review.sha256 });
}

export function getComfyUiVideoWorkflowRegistryTruth() {
  return Object.freeze({
    schema: COMFYUI_VIDEO_WORKFLOW_SCHEMA,
    workflowId: COMFYUI_VIDEO_WORKFLOW_ID,
    version: COMFYUI_VIDEO_WORKFLOW_VERSION,
    firstProofMode: 'image-to-video',
    arbitraryWorkflowExecutionAllowed: false,
    maximumWorkflowBytes: MAX_WORKFLOW_BYTES,
    maximumNodeCount: MAX_NODE_COUNT,
    standardCoreNodesOnly: true,
    customNodesAllowed: false,
    automaticWorkflowDownload: false,
    automaticModelDownload: false,
    digestConfirmationRequiredEverySession: true,
    allowedClassTypes: Object.freeze([...ALLOWED_NATIVE_CLASS_TYPES].sort())
  });
}
