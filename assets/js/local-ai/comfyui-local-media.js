/**
 * W625A/W625B — proof-gated ComfyUI loopback adapter for local images.
 *
 * The adapter never starts ComfyUI, downloads a model, probes the LAN, reads a
 * provider key, uploads source media, imports an arbitrary workflow, or silently
 * falls back to a cloud service. Every scan, render and cancellation request is
 * initiated by a user action against an allowlisted loopback endpoint.
 */
import {
  getLocalAiRuntimeContract,
  isApprovedLocalAiLoopbackEndpoint,
  normalizeApprovedLocalAiEndpoint
} from '../../../config/local-ai-browser-contract.mjs';
import {
  chooseProofEligibleComfyUiCheckpoint,
  getComfyUiImageDeviceProfile,
  listComfyUiCheckpointOptions,
  resolveComfyUiImageRecipe
} from './comfyui-image-workflow-registry.js';
import { fetchLocalAiWithBridgeFallback } from './eon-local-bridge-client.js';

export const COMFYUI_MEDIA_STATUS_KEY = 'eon:local-ai:comfyui-media-status:v1';
export const COMFYUI_MEDIA_STATUS_SCHEMA = 'eon.local-ai.comfyui-media-status.v1';
export const COMFYUI_DEFAULT_ENDPOINT = 'http://127.0.0.1:8188';
const COMFYUI_RUNTIME_ID = 'comfyui';
const REQUIRED_IMAGE_NODES = Object.freeze([
  'CheckpointLoaderSimple',
  'CLIPTextEncode',
  'EmptyLatentImage',
  'KSampler',
  'VAEDecode',
  'SaveImage'
]);

function storage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function cleanText(value = '', max = 240) {
  return Array.from(String(value || ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code >= 32 && code !== 127 ? character : ' ';
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function boundedNumber(value, fallback, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function normalizeEndpoint(value = '') {
  return normalizeApprovedLocalAiEndpoint(value || COMFYUI_DEFAULT_ENDPOINT, COMFYUI_RUNTIME_ID);
}

function createRequestController(externalSignal, timeoutMs = 12000) {
  const controller = new AbortController();
  let reason = '';
  const abortFromExternal = () => {
    reason = 'cancelled';
    try { controller.abort(); } catch {}
  };
  if (externalSignal?.aborted) abortFromExternal();
  else externalSignal?.addEventListener?.('abort', abortFromExternal, { once: true });
  const timer = setTimeout(() => {
    reason = 'timeout';
    try { controller.abort(); } catch {}
  }, Math.max(1000, Number(timeoutMs) || 12000));
  return Object.freeze({
    signal: controller.signal,
    finish() {
      clearTimeout(timer);
      externalSignal?.removeEventListener?.('abort', abortFromExternal);
    },
    reason() { return reason; }
  });
}

async function fetchResponse(url, options = {}, timeoutMs = 12000) {
  const request = createRequestController(options.signal, timeoutMs);
  try {
    return await fetchLocalAiWithBridgeFallback(url, { ...options, signal: request.signal }, { timeoutMs });
  } catch (error) {
    if (request.reason() === 'cancelled') throw new Error('comfyui_cancelled');
    if (request.reason() === 'timeout') throw new Error('comfyui_timeout');
    throw error;
  } finally {
    request.finish();
  }
}

async function fetchJson(url, options = {}, timeoutMs = 12000) {
  const response = await fetchResponse(url, {
    ...options,
    headers: { accept: 'application/json', ...(options.headers || {}) }
  }, timeoutMs);
  if (!response.ok) throw new Error(`comfyui_http_${response.status}`);
  return response.json();
}

function humanError(error) {
  const message = cleanText(error?.message || error || '', 220).toLowerCase();
  if (/cancelled|abort/.test(message)) return 'The local image request was cancelled.';
  if (/timeout/.test(message)) return 'ComfyUI did not respond before the local timeout.';
  if (/http_401|http_403/.test(message)) return 'This ComfyUI endpoint requires authorization or rejected this browser origin.';
  if (/cors|private network|mixed content/.test(message)) return 'The browser blocked direct loopback access. Connect EON Local Companion and try again; no ComfyUI CORS change is required.';
  if (/failed to fetch|network/.test(message)) return 'ComfyUI was not reachable through the approved local path. Open or connect EON Local Companion, then try again; no port or CORS editing is required.';
  return 'The ComfyUI request could not complete.';
}

function checkpointNames(payload = {}) {
  const node = payload?.CheckpointLoaderSimple || payload;
  const raw = node?.input?.required?.ckpt_name?.[0];
  return Array.isArray(raw)
    ? Object.freeze(raw.map((name) => cleanText(name, 220)).filter(Boolean).slice(0, 120))
    : Object.freeze([]);
}

function normalizeDevice(row = {}) {
  const total = Math.max(0, Number(row.vram_total || row.vramTotal || 0) || 0);
  const free = Math.max(0, Number(row.vram_free || row.vramFree || 0) || 0);
  return Object.freeze({
    name: cleanText(row.name || row.type || 'Compute device', 160),
    type: cleanText(row.type || '', 80),
    vramTotalBytes: total,
    vramFreeBytes: free,
    torchVramTotalBytes: Math.max(0, Number(row.torch_vram_total || 0) || 0),
    torchVramFreeBytes: Math.max(0, Number(row.torch_vram_free || 0) || 0)
  });
}

function queuePromptIds(rows = []) {
  return new Set((Array.isArray(rows) ? rows : []).map((row) => cleanText(Array.isArray(row) ? row[1] : row?.prompt_id || row?.promptId, 120)).filter(Boolean));
}

function notify(onState, state, detail = {}) {
  try { onState?.(Object.freeze({ state, at: new Date().toISOString(), ...detail })); } catch {}
}

function wait(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error('comfyui_cancelled')); return; }
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener?.('abort', () => { clearTimeout(timer); reject(new Error('comfyui_cancelled')); }, { once: true });
  });
}

export function isApprovedComfyUiEndpoint(value = '') {
  return isApprovedLocalAiLoopbackEndpoint(value || COMFYUI_DEFAULT_ENDPOINT, COMFYUI_RUNTIME_ID);
}

export async function discoverComfyUiCapabilities({ endpoint = COMFYUI_DEFAULT_ENDPOINT, timeoutMs = 12000, signal } = {}) {
  if (!isApprovedComfyUiEndpoint(endpoint)) {
    return Object.freeze({ ok: false, error: 'endpoint-not-approved-loopback', endpoint: '', checkpoints: Object.freeze([]), checkpointOptions: Object.freeze([]), message: 'Use an approved ComfyUI loopback endpoint. LAN, public and arbitrary ports are blocked.' });
  }
  const base = normalizeEndpoint(endpoint);
  try {
    const [stats, checkpointInfo] = await Promise.all([
      fetchJson(`${base}/system_stats`, { signal }, timeoutMs),
      fetchJson(`${base}/object_info/CheckpointLoaderSimple`, { signal }, timeoutMs)
    ]);
    const checkpoints = checkpointNames(checkpointInfo);
    const checkpointOptions = listComfyUiCheckpointOptions(checkpoints);
    const devices = Object.freeze((Array.isArray(stats?.devices) ? stats.devices : []).map(normalizeDevice));
    const profile = getComfyUiImageDeviceProfile(devices);
    const recommendedCheckpoint = chooseProofEligibleComfyUiCheckpoint(checkpoints);
    const missingNodes = Object.freeze(checkpoints.length ? [] : ['CheckpointLoaderSimple/model-list']);
    return Object.freeze({
      ok: true,
      schema: 'eon.local-ai.comfyui-capabilities.w625b.v1',
      endpoint: base,
      version: cleanText(stats?.system?.comfyui_version || stats?.system?.version || '', 80),
      pythonVersion: cleanText(stats?.system?.python_version || '', 80),
      devices,
      deviceProfile: profile,
      checkpoints,
      checkpointOptions,
      recommendedCheckpoint,
      requiredImageNodes: REQUIRED_IMAGE_NODES,
      missingNodes,
      imageReady: checkpoints.length > 0,
      proofReady: Boolean(recommendedCheckpoint),
      videoReady: false,
      message: !checkpoints.length
        ? 'ComfyUI is reachable, but no checkpoint was exposed by the built-in checkpoint loader.'
        : recommendedCheckpoint
          ? `ComfyUI is reachable and ${checkpoints.length} installed checkpoint${checkpoints.length === 1 ? ' is' : 's are'} available. A conservative proof-compatible checkpoint was found.`
          : `ComfyUI is reachable and ${checkpoints.length} checkpoint${checkpoints.length === 1 ? ' is' : 's are'} installed, but none is automatically recognised for the SD 1.5 proof lane. Review and select a compatible checkpoint explicitly.`
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      error: cleanText(error?.message || 'comfyui-scan-failed', 120),
      endpoint: base,
      checkpoints: Object.freeze([]),
      checkpointOptions: Object.freeze([]),
      imageReady: false,
      proofReady: false,
      videoReady: false,
      message: humanError(error)
    });
  }
}

export function sanitizeComfyUiCapabilityEvidence(capabilities = {}) {
  const checkpointOptions = Array.isArray(capabilities?.checkpointOptions) ? capabilities.checkpointOptions : [];
  const familyCounts = checkpointOptions.reduce((counts, row) => {
    const family = cleanText(row?.family || 'unknown', 40) || 'unknown';
    counts[family] = (counts[family] || 0) + 1;
    return counts;
  }, {});
  return Object.freeze({
    schema: 'eon.local-ai.comfyui-capability-evidence.w625a.v1',
    endpoint: isApprovedComfyUiEndpoint(capabilities?.endpoint) ? normalizeEndpoint(capabilities.endpoint) : '',
    version: cleanText(capabilities?.version, 80),
    pythonVersion: cleanText(capabilities?.pythonVersion, 80),
    deviceCount: Array.isArray(capabilities?.devices) ? capabilities.devices.length : 0,
    devices: Object.freeze((Array.isArray(capabilities?.devices) ? capabilities.devices : []).map((row) => Object.freeze({ type: cleanText(row.type, 80), vramTotalBytes: Math.max(0, Number(row.vramTotalBytes || 0) || 0), vramFreeBytes: Math.max(0, Number(row.vramFreeBytes || 0) || 0) })).slice(0, 8)),
    checkpointCount: Array.isArray(capabilities?.checkpoints) ? capabilities.checkpoints.length : 0,
    checkpointFamilyCounts: Object.freeze(familyCounts),
    proofCompatibleCheckpointPresent: checkpointOptions.some((row) => row?.proofEligible === true),
    checkpointFilenamesIncluded: false,
    localPathsIncluded: false
  });
}

export function buildComfyUiImageWorkflow(options = {}) {
  const checkpoint = cleanText(options.checkpoint || '', 220);
  const prompt = cleanText(options.prompt || '', 1200);
  const negativePrompt = cleanText(options.negativePrompt || 'blurry, low quality, distorted, watermark, text artifacts', 800);
  if (!checkpoint) throw new Error('checkpoint-required');
  if (!prompt) throw new Error('prompt-required');
  const recipe = resolveComfyUiImageRecipe({
    workflowId: options.workflowId,
    profileId: options.profileId,
    aspectId: options.aspectId,
    qualityId: options.qualityId,
    devices: options.devices,
    checkpoint,
    seed: options.seed,
    proofMode: options.proofMode !== false
  });
  const width = options.proofMode === false ? recipe.width : Math.round(boundedNumber(options.width, recipe.width, 256, 512) / 64) * 64;
  const height = options.proofMode === false ? recipe.height : Math.round(boundedNumber(options.height, recipe.height, 256, 512) / 64) * 64;
  const steps = options.proofMode === false ? recipe.steps : Math.round(boundedNumber(options.steps, recipe.steps, 4, 12));
  const cfg = options.proofMode === false ? recipe.cfg : boundedNumber(options.cfg, recipe.cfg, 1, 15);
  const filenamePrefix = cleanText(options.filenamePrefix || 'EONAPP_Local_Image', 80).replace(/[^a-z0-9_-]+/gi, '_') || 'EONAPP_Local_Image';
  return Object.freeze({
    '4': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: checkpoint } },
    '6': { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['4', 1] } },
    '7': { class_type: 'CLIPTextEncode', inputs: { text: negativePrompt, clip: ['4', 1] } },
    '5': { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    '3': { class_type: 'KSampler', inputs: { seed: recipe.seed, steps, cfg, sampler_name: recipe.sampler, scheduler: recipe.scheduler, denoise: 1, model: ['4', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['5', 0] } },
    '8': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    '9': { class_type: 'SaveImage', inputs: { filename_prefix: filenamePrefix, images: ['8', 0] } }
  });
}

function collectImageOutputs(historyRecord = {}, endpoint = '') {
  const rows = [];
  for (const output of Object.values(historyRecord?.outputs || {})) {
    for (const image of Array.isArray(output?.images) ? output.images : []) {
      const filename = cleanText(image.filename || '', 220);
      if (!filename) continue;
      const subfolder = cleanText(image.subfolder || '', 220);
      const type = cleanText(image.type || 'output', 40) || 'output';
      const params = new URLSearchParams({ filename, type });
      if (subfolder) params.set('subfolder', subfolder);
      rows.push(Object.freeze({ filename, subfolder, type, url: `${endpoint}/view?${params.toString()}` }));
    }
  }
  return Object.freeze(rows.slice(0, 8));
}

export async function readComfyUiQueueState({ endpoint, promptId = '', timeoutMs = 10000, signal } = {}) {
  if (!isApprovedComfyUiEndpoint(endpoint)) return Object.freeze({ ok: false, error: 'endpoint-not-approved-loopback', state: 'blocked' });
  try {
    const base = normalizeEndpoint(endpoint);
    const payload = await fetchJson(`${base}/queue`, { signal }, timeoutMs);
    const running = queuePromptIds(payload?.queue_running);
    const pending = queuePromptIds(payload?.queue_pending);
    const id = cleanText(promptId, 120);
    return Object.freeze({
      ok: true,
      state: id ? running.has(id) ? 'running' : pending.has(id) ? 'queued' : 'not-listed' : 'available',
      runningCount: running.size,
      pendingCount: pending.size,
      promptId: id
    });
  } catch (error) {
    return Object.freeze({ ok: false, error: cleanText(error?.message || 'queue-read-failed', 120), state: 'unknown', message: humanError(error) });
  }
}

export async function waitForComfyUiJob({ endpoint, promptId, timeoutMs = 180000, pollIntervalMs = 900, signal, onState } = {}) {
  if (!isApprovedComfyUiEndpoint(endpoint)) return Object.freeze({ ok: false, error: 'endpoint-not-approved-loopback', outputs: Object.freeze([]), message: 'The saved ComfyUI endpoint is no longer approved.' });
  const id = cleanText(promptId, 120);
  if (!id) return Object.freeze({ ok: false, error: 'prompt-id-required', outputs: Object.freeze([]), message: 'ComfyUI did not return a job identifier.' });
  const base = normalizeEndpoint(endpoint);
  const started = Date.now();
  let lastState = '';
  while (Date.now() - started < Math.max(3000, Number(timeoutMs) || 180000)) {
    if (signal?.aborted) return Object.freeze({ ok: false, cancelled: true, error: 'comfyui-cancelled', promptId: id, outputs: Object.freeze([]), durationMs: Date.now() - started, message: 'The local image request was cancelled.' });
    try {
      const payload = await fetchJson(`${base}/history/${encodeURIComponent(id)}`, { signal }, Math.min(15000, timeoutMs));
      const record = payload?.[id];
      if (record) {
        const outputs = collectImageOutputs(record, base);
        const status = record?.status || {};
        if (status?.status_str === 'error' || status?.completed === false && Array.isArray(status?.messages) && status.messages.some((row) => row?.[0] === 'execution_error')) {
          notify(onState, 'failed', { promptId: id });
          return Object.freeze({ ok: false, error: 'comfyui-execution-error', promptId: id, outputs, durationMs: Date.now() - started, message: 'ComfyUI reported an execution error. Open ComfyUI to review the missing model/node detail.' });
        }
        if (outputs.length || status?.completed === true) {
          notify(onState, 'completed', { promptId: id, outputCount: outputs.length });
          return Object.freeze({ ok: outputs.length > 0, promptId: id, outputs, durationMs: Date.now() - started, historyCompleted: true, message: outputs.length ? 'Local image generation completed.' : 'ComfyUI completed the workflow but did not report an image output.' });
        }
      }
    } catch (error) {
      if (/cancelled/.test(String(error?.message || ''))) return Object.freeze({ ok: false, cancelled: true, error: 'comfyui-cancelled', promptId: id, outputs: Object.freeze([]), durationMs: Date.now() - started, message: 'The local image request was cancelled.' });
      if (!/http_404/.test(String(error?.message || ''))) return Object.freeze({ ok: false, error: cleanText(error?.message || 'history-read-failed', 120), promptId: id, outputs: Object.freeze([]), durationMs: Date.now() - started, message: humanError(error) });
    }
    const queue = await readComfyUiQueueState({ endpoint: base, promptId: id, timeoutMs: Math.min(8000, timeoutMs), signal });
    const state = queue.ok && ['queued', 'running'].includes(queue.state) ? queue.state : 'waiting';
    if (state !== lastState) {
      lastState = state;
      notify(onState, state, { promptId: id });
    }
    try { await wait(Math.max(250, Number(pollIntervalMs) || 900), signal); }
    catch { return Object.freeze({ ok: false, cancelled: true, error: 'comfyui-cancelled', promptId: id, outputs: Object.freeze([]), durationMs: Date.now() - started, message: 'The local image request was cancelled.' }); }
  }
  notify(onState, 'timeout', { promptId: id });
  return Object.freeze({ ok: false, error: 'comfyui-job-timeout', promptId: id, outputs: Object.freeze([]), durationMs: Date.now() - started, message: 'The local image job did not finish before the EONAPP timeout. It may still be running in ComfyUI.' });
}

export async function cancelComfyUiJob({ endpoint, promptId, explicitUserAction = false, timeoutMs = 10000 } = {}) {
  if (explicitUserAction !== true) return Object.freeze({ ok: false, error: 'explicit-user-action-required', message: 'Cancellation requires an explicit user action.' });
  if (!isApprovedComfyUiEndpoint(endpoint)) return Object.freeze({ ok: false, error: 'endpoint-not-approved-loopback', message: 'Use an approved ComfyUI loopback endpoint.' });
  const id = cleanText(promptId, 120);
  if (!id) return Object.freeze({ ok: false, error: 'prompt-id-required', message: 'No active ComfyUI job identifier is available.' });
  const base = normalizeEndpoint(endpoint);
  const queue = await readComfyUiQueueState({ endpoint: base, promptId: id, timeoutMs });
  try {
    if (queue.ok && queue.state === 'queued') {
      await fetchJson(`${base}/queue`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ delete: [id] }) }, timeoutMs);
      return Object.freeze({ ok: true, promptId: id, action: 'delete-pending', message: 'The queued ComfyUI job was removed after your cancellation click.' });
    }
    if (queue.ok && queue.state === 'running') {
      await fetchJson(`${base}/interrupt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }, timeoutMs);
      return Object.freeze({ ok: true, promptId: id, action: 'interrupt-running', message: 'EONAPP asked ComfyUI to interrupt the running job after your cancellation click.' });
    }
    return Object.freeze({ ok: false, promptId: id, error: 'job-not-listed', action: 'local-wait-only', message: 'The job was not listed as queued or running. EONAPP stopped waiting, but ComfyUI may already have completed it.' });
  } catch (error) {
    return Object.freeze({ ok: false, promptId: id, error: cleanText(error?.message || 'cancel-failed', 120), action: 'local-wait-only', message: 'EONAPP stopped waiting, but ComfyUI did not confirm server-side cancellation.' });
  }
}

export async function generateComfyUiImage(options = {}) {
  const endpoint = options.endpoint || COMFYUI_DEFAULT_ENDPOINT;
  if (options.explicitUserAction !== true) return Object.freeze({ ok: false, error: 'explicit-user-action-required', outputs: Object.freeze([]), message: 'Local generation requires an explicit user action.' });
  if (!isApprovedComfyUiEndpoint(endpoint)) return Object.freeze({ ok: false, error: 'endpoint-not-approved-loopback', outputs: Object.freeze([]), message: 'Use an approved ComfyUI loopback endpoint.' });
  let workflow;
  let recipe;
  try {
    recipe = resolveComfyUiImageRecipe({ ...options, proofMode: options.proofMode !== false });
    workflow = buildComfyUiImageWorkflow(options);
  } catch (error) {
    return Object.freeze({ ok: false, error: cleanText(error?.message || 'workflow-invalid', 120), outputs: Object.freeze([]), message: error?.message === 'checkpoint-required' ? 'Choose an installed checkpoint first.' : 'Write an image prompt before generating.' });
  }
  const base = normalizeEndpoint(endpoint);
  const clientId = globalThis.crypto?.randomUUID?.() || `eon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    const submitted = await fetchJson(`${base}/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: workflow, client_id: clientId }),
      signal: options.signal
    }, options.submitTimeoutMs || 15000);
    const promptId = cleanText(submitted?.prompt_id || '', 120);
    if (!promptId) return Object.freeze({ ok: false, error: 'comfyui-prompt-not-accepted', outputs: Object.freeze([]), recipe, message: 'ComfyUI did not accept the local image workflow.' });
    notify(options.onState, 'submitted', { promptId });
    const result = await waitForComfyUiJob({ endpoint: base, promptId, timeoutMs: options.timeoutMs || 180000, pollIntervalMs: options.pollIntervalMs || 900, signal: options.signal, onState: options.onState });
    return Object.freeze({ ...result, recipe });
  } catch (error) {
    const cancelled = /cancelled/.test(String(error?.message || ''));
    return Object.freeze({ ok: false, cancelled, error: cancelled ? 'comfyui-cancelled' : cleanText(error?.message || 'comfyui-submit-failed', 120), outputs: Object.freeze([]), recipe, message: humanError(error) });
  }
}

export async function fetchComfyUiOutputBlob(output = {}, { timeoutMs = 30000, signal } = {}) {
  const url = String(output?.url || '');
  try {
    const parsed = new URL(url);
    const contract = getLocalAiRuntimeContract(COMFYUI_RUNTIME_ID);
    if (!contract || !isApprovedComfyUiEndpoint(`${parsed.protocol}//${parsed.host}`) || parsed.pathname !== '/view' || parsed.username || parsed.password) throw new Error('output-url-not-approved');
    const response = await fetchResponse(url, { headers: { accept: 'image/*' }, signal }, timeoutMs);
    if (!response.ok) throw new Error(`comfyui_http_${response.status}`);
    const blob = await response.blob();
    if (!String(blob.type || '').startsWith('image/')) throw new Error('output-not-image');
    if (!blob.size) throw new Error('output-empty');
    return Object.freeze({ ok: true, blob, filename: cleanText(output.filename || 'eonapp-local-image.png', 220) });
  } catch (error) {
    return Object.freeze({ ok: false, error: cleanText(error?.message || 'output-read-failed', 120), message: humanError(error) });
  }
}

function normalizeStoredStatus(value = {}) {
  if (!value || typeof value !== 'object') return null;
  const endpoint = normalizeEndpoint(value.endpoint || '');
  const checkpoint = cleanText(value.checkpoint || '', 220);
  const checkedAt = cleanText(value.checkedAt || '', 80);
  if (!checkedAt) return null;
  return Object.freeze({
    schema: COMFYUI_MEDIA_STATUS_SCHEMA,
    endpoint,
    checkpoint,
    imageReady: value.imageReady === true,
    selfTestPassed: value.selfTestPassed === true,
    checkedAt,
    outputFilename: cleanText(value.outputFilename || '', 220)
  });
}

export function readComfyUiMediaStatus() {
  try {
    const raw = storage()?.getItem(COMFYUI_MEDIA_STATUS_KEY);
    return raw ? normalizeStoredStatus(JSON.parse(raw)) : null;
  } catch { return null; }
}

export function saveComfyUiMediaStatus(value = {}) {
  const status = normalizeStoredStatus({ ...value, checkedAt: value.checkedAt || new Date().toISOString() });
  if (!status) return null;
  try { storage()?.setItem(COMFYUI_MEDIA_STATUS_KEY, JSON.stringify(status)); }
  catch { return null; }
  return status;
}

export function clearComfyUiMediaStatus() {
  try { storage()?.removeItem(COMFYUI_MEDIA_STATUS_KEY); return { ok: true }; }
  catch { return { ok: false, error: 'storage-unavailable' }; }
}
