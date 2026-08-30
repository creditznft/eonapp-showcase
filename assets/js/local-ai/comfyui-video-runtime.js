/** W625E — loopback-only ComfyUI video job lifecycle. */
import {
  isApprovedLocalAiLoopbackEndpoint,
  normalizeApprovedLocalAiEndpoint
} from '../../../config/local-ai-browser-contract.mjs';
import { fetchLocalAiWithBridgeFallback } from './eon-local-bridge-client.js';
import { cancelComfyUiJob } from './comfyui-local-media.js';
import { evaluateLocalVideoCapability } from './comfyui-video-capability.js';
import { prepareComfyUiVideoApiWorkflow, reviewComfyUiVideoApiWorkflow } from './comfyui-video-workflow-registry.js';

export const COMFYUI_VIDEO_RUNTIME_SCHEMA = 'eon.local-ai.comfyui-video-runtime.w625e.v1';
export const COMFYUI_VIDEO_DEFAULT_ENDPOINT = 'http://127.0.0.1:8188';
const RUNTIME_ID = 'comfyui';

function clean(value = '', max = 240) {
  const printable = Array.from(String(value || ''), (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  }).join('');
  return printable.replace(/\s+/g, ' ').trim().slice(0, max);
}

function endpoint(value = '') {
  return normalizeApprovedLocalAiEndpoint(value || COMFYUI_VIDEO_DEFAULT_ENDPOINT, RUNTIME_ID);
}

function approved(value = '') {
  return isApprovedLocalAiLoopbackEndpoint(value || COMFYUI_VIDEO_DEFAULT_ENDPOINT, RUNTIME_ID);
}

function requestController(externalSignal, timeoutMs = 12000) {
  const controller = new AbortController();
  let reason = '';
  const abort = () => { reason = 'cancelled'; try { controller.abort(); } catch {} };
  if (externalSignal?.aborted) abort();
  else externalSignal?.addEventListener?.('abort', abort, { once: true });
  const timer = setTimeout(() => { reason = 'timeout'; try { controller.abort(); } catch {} }, Math.max(1000, Number(timeoutMs) || 12000));
  return {
    signal: controller.signal,
    reason: () => reason,
    finish() { clearTimeout(timer); externalSignal?.removeEventListener?.('abort', abort); }
  };
}

async function fetchResponse(url, options = {}, timeoutMs = 12000) {
  const request = requestController(options.signal, timeoutMs);
  try { return await fetchLocalAiWithBridgeFallback(url, { ...options, signal: request.signal }, { timeoutMs }); }
  catch (error) {
    if (request.reason() === 'cancelled') throw new Error('comfyui-video-cancelled');
    if (request.reason() === 'timeout') throw new Error('comfyui-video-timeout');
    throw error;
  } finally { request.finish(); }
}

async function fetchJson(url, options = {}, timeoutMs = 12000) {
  const response = await fetchResponse(url, { ...options, headers: { accept: 'application/json', ...(options.headers || {}) } }, timeoutMs);
  if (!response.ok) throw new Error(`comfyui-video-http-${response.status}`);
  return response.json();
}

function humanError(error) {
  const message = clean(error?.message || error, 220).toLowerCase();
  if (/cancel/.test(message)) return 'The local video request was cancelled.';
  if (/timeout/.test(message)) return 'The local video runtime did not respond before the reviewed timeout.';
  if (/failed to fetch|network/.test(message)) return 'ComfyUI was not reachable through the approved local path. Open or connect EON Local Companion and try again; no port or CORS editing is required.';
  if (/401|403/.test(message)) return 'ComfyUI rejected this browser origin or requires authorization.';
  return 'The local video request could not complete.';
}

function normalizeDevice(row = {}) {
  return Object.freeze({
    name: clean(row.name || row.type || 'compute-device', 120),
    type: clean(row.type || '', 80),
    vramTotalBytes: Math.max(0, Number(row.vram_total || row.vramTotalBytes || 0) || 0),
    vramFreeBytes: Math.max(0, Number(row.vram_free || row.vramFreeBytes || 0) || 0),
    torchVramTotalBytes: Math.max(0, Number(row.torch_vram_total || row.torchVramTotalBytes || 0) || 0),
    torchVramFreeBytes: Math.max(0, Number(row.torch_vram_free || row.torchVramFreeBytes || 0) || 0)
  });
}

function collectOutputRows(record = {}, base = '') {
  const rows = [];
  for (const output of Object.values(record?.outputs || {})) {
    for (const key of ['videos', 'gifs', 'images']) {
      for (const item of Array.isArray(output?.[key]) ? output[key] : []) {
        const filename = clean(item?.filename, 220);
        if (!filename) continue;
        const subfolder = clean(item?.subfolder, 220);
        const type = clean(item?.type || 'output', 40);
        const query = new URLSearchParams({ filename, subfolder, type });
        rows.push(Object.freeze({
          filename,
          subfolder,
          type,
          outputKind: key,
          url: `${base}/view?${query.toString()}`
        }));
      }
    }
  }
  return Object.freeze(rows);
}

function queueIds(rows = []) {
  return new Set((Array.isArray(rows) ? rows : []).map((row) => clean(Array.isArray(row) ? row[1] : row?.prompt_id || row?.promptId, 120)).filter(Boolean));
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error('comfyui-video-cancelled')); return; }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener?.('abort', () => { clearTimeout(timer); reject(new Error('comfyui-video-cancelled')); }, { once: true });
  });
}

function notify(onState, state, detail = {}) {
  try { onState?.(Object.freeze({ state, at: new Date().toISOString(), ...detail })); } catch {}
}

export async function discoverComfyUiVideoRuntime(input = {}) {
  if (!approved(input.endpoint)) return Object.freeze({ ok: false, error: 'endpoint-not-approved-loopback', message: 'LAN, public and unapproved ComfyUI ports are blocked.' });
  const base = endpoint(input.endpoint);
  try {
    const stats = await fetchJson(`${base}/system_stats`, { signal: input.signal }, input.timeoutMs || 12000);
    const devices = Object.freeze((Array.isArray(stats?.devices) ? stats.devices : []).map(normalizeDevice));
    const capability = evaluateLocalVideoCapability({
      devices,
      runtimeReached: true,
      systemRamBytes: input.systemRamBytes,
      freeStorageBytes: input.freeStorageBytes,
      workflowReviewed: input.workflowReviewed,
      requiredModelsReady: input.requiredModelsReady,
      acPower: input.acPower,
      batteryPercent: input.batteryPercent,
      thermalMonitoring: input.thermalMonitoring
    });
    return Object.freeze({
      ok: true,
      schema: COMFYUI_VIDEO_RUNTIME_SCHEMA,
      endpoint: base,
      version: clean(stats?.system?.comfyui_version || stats?.system?.version, 80),
      pythonVersion: clean(stats?.system?.python_version, 80),
      devices,
      capability,
      message: capability.reason
    });
  } catch (error) {
    const capability = evaluateLocalVideoCapability({ runtimeReached: false });
    return Object.freeze({ ok: false, error: clean(error?.message || 'video-runtime-scan-failed', 120), endpoint: base, capability, message: humanError(error) });
  }
}

export async function uploadComfyUiVideoInput({ endpoint: endpointValue, file, explicitUserAction = false, timeoutMs = 30000, signal } = {}) {
  if (explicitUserAction !== true) return Object.freeze({ ok: false, error: 'explicit-user-action-required', message: 'Uploading the first frame requires an explicit user action.' });
  if (!approved(endpointValue)) return Object.freeze({ ok: false, error: 'endpoint-not-approved-loopback', message: 'Use an approved ComfyUI loopback endpoint.' });
  if (!(file instanceof Blob) || !file.size) return Object.freeze({ ok: false, error: 'input-file-required', message: 'Choose a valid first-frame image.' });
  const form = new FormData();
  const filename = clean(file.name || 'eonapp-video-first-frame.png', 180);
  form.append('image', file, filename);
  form.append('type', 'input');
  form.append('overwrite', 'false');
  try {
    const response = await fetchResponse(`${endpoint(endpointValue)}/upload/image`, { method: 'POST', body: form, signal }, timeoutMs);
    if (!response.ok) throw new Error(`comfyui-video-http-${response.status}`);
    const payload = await response.json();
    const uploadedName = clean(payload?.name || filename, 220);
    if (!uploadedName) throw new Error('uploaded-image-name-missing');
    return Object.freeze({ ok: true, uploadedName, subfolder: clean(payload?.subfolder, 220), type: clean(payload?.type || 'input', 40), message: 'The first frame was sent only to the approved loopback ComfyUI runtime.' });
  } catch (error) {
    return Object.freeze({ ok: false, error: clean(error?.message || 'input-upload-failed', 120), message: humanError(error) });
  }
}

export async function readComfyUiVideoQueue({ endpoint: endpointValue, promptId = '', timeoutMs = 10000, signal } = {}) {
  if (!approved(endpointValue)) return Object.freeze({ ok: false, state: 'blocked', error: 'endpoint-not-approved-loopback' });
  try {
    const payload = await fetchJson(`${endpoint(endpointValue)}/queue`, { signal }, timeoutMs);
    const id = clean(promptId, 120);
    const running = queueIds(payload?.queue_running);
    const pending = queueIds(payload?.queue_pending);
    return Object.freeze({ ok: true, state: running.has(id) ? 'running' : pending.has(id) ? 'queued' : 'not-listed', runningCount: running.size, pendingCount: pending.size });
  } catch (error) {
    return Object.freeze({ ok: false, state: 'unknown', error: clean(error?.message || 'queue-read-failed', 120) });
  }
}

export async function waitForComfyUiVideoJob({ endpoint: endpointValue, promptId, timeoutMs = 1_800_000, pollIntervalMs = 1500, signal, onState } = {}) {
  if (!approved(endpointValue)) return Object.freeze({ ok: false, error: 'endpoint-not-approved-loopback', outputs: Object.freeze([]) });
  const id = clean(promptId, 120);
  if (!id) return Object.freeze({ ok: false, error: 'prompt-id-required', outputs: Object.freeze([]) });
  const base = endpoint(endpointValue);
  const started = Date.now();
  let progressObserved = false;
  let lastState = '';
  while (Date.now() - started < Math.max(5000, Number(timeoutMs) || 1_800_000)) {
    if (signal?.aborted) return Object.freeze({ ok: false, cancelled: true, error: 'comfyui-video-cancelled', promptId: id, outputs: Object.freeze([]), progressObserved, durationMs: Date.now() - started });
    try {
      const payload = await fetchJson(`${base}/history/${encodeURIComponent(id)}`, { signal }, Math.min(20000, timeoutMs));
      const record = payload?.[id];
      if (record) {
        const outputs = collectOutputRows(record, base);
        const status = record?.status || {};
        if (status.status_str === 'error' || (Array.isArray(status.messages) && status.messages.some((row) => row?.[0] === 'execution_error'))) {
          notify(onState, 'failed', { promptId: id });
          return Object.freeze({ ok: false, error: 'comfyui-video-execution-error', promptId: id, outputs, progressObserved, durationMs: Date.now() - started });
        }
        if (outputs.length || status.completed === true) {
          notify(onState, 'completed', { promptId: id, outputCount: outputs.length });
          return Object.freeze({ ok: outputs.length > 0, promptId: id, outputs, progressObserved, historyCompleted: true, durationMs: Date.now() - started, message: outputs.length ? 'Local video generation completed.' : 'ComfyUI completed but returned no video output.' });
        }
      }
    } catch (error) {
      if (/cancel/.test(String(error?.message || ''))) return Object.freeze({ ok: false, cancelled: true, error: 'comfyui-video-cancelled', promptId: id, outputs: Object.freeze([]), progressObserved, durationMs: Date.now() - started });
      if (!/404/.test(String(error?.message || ''))) return Object.freeze({ ok: false, error: clean(error?.message || 'history-read-failed', 120), promptId: id, outputs: Object.freeze([]), progressObserved, durationMs: Date.now() - started, message: humanError(error) });
    }
    const queue = await readComfyUiVideoQueue({ endpoint: base, promptId: id, timeoutMs: Math.min(10000, timeoutMs), signal });
    const state = queue.ok && ['queued', 'running'].includes(queue.state) ? queue.state : 'waiting';
    if (['queued', 'running'].includes(state)) progressObserved = true;
    if (state !== lastState) { lastState = state; notify(onState, state, { promptId: id }); }
    try { await wait(Math.max(500, Number(pollIntervalMs) || 1500), signal); }
    catch { return Object.freeze({ ok: false, cancelled: true, error: 'comfyui-video-cancelled', promptId: id, outputs: Object.freeze([]), progressObserved, durationMs: Date.now() - started }); }
  }
  notify(onState, 'timeout', { promptId: id });
  return Object.freeze({ ok: false, error: 'comfyui-video-job-timeout', promptId: id, outputs: Object.freeze([]), progressObserved, durationMs: Date.now() - started, message: 'The local video job did not finish before the reviewed timeout.' });
}

export async function generateComfyUiVideo(options = {}) {
  if (options.explicitUserAction !== true) return Object.freeze({ ok: false, error: 'explicit-user-action-required', outputs: Object.freeze([]) });
  if (!approved(options.endpoint)) return Object.freeze({ ok: false, error: 'endpoint-not-approved-loopback', outputs: Object.freeze([]) });
  if (options.capability?.reviewedWorkflowSubmissionAllowed !== true || options.capability?.verdict !== 'supported') return Object.freeze({ ok: false, error: 'device-capability-not-supported', outputs: Object.freeze([]), message: 'The reviewed video workflow remains blocked on this device or evidence set.' });
  const review = options.workflowReview?.ok ? options.workflowReview : await reviewComfyUiVideoApiWorkflow(options.apiWorkflow || {});
  if (!review.ok) return Object.freeze({ ok: false, error: 'workflow-review-failed', review, outputs: Object.freeze([]), message: review.message });
  const uploaded = await uploadComfyUiVideoInput({ endpoint: options.endpoint, file: options.firstFrameFile, explicitUserAction: true, timeoutMs: options.uploadTimeoutMs || 30000, signal: options.signal });
  if (!uploaded.ok) return Object.freeze({ ok: false, error: uploaded.error, outputs: Object.freeze([]), message: uploaded.message });
  let prepared;
  try {
    prepared = prepareComfyUiVideoApiWorkflow(review, { ...options, uploadedImageName: uploaded.uploadedName, confirmedWorkflowSha256: options.confirmedWorkflowSha256 });
  } catch (error) {
    return Object.freeze({ ok: false, error: clean(error?.message || 'workflow-prepare-failed', 180), outputs: Object.freeze([]), message: 'The reviewed workflow did not expose every required parameter slot. Nothing was queued.' });
  }
  const base = endpoint(options.endpoint);
  const clientId = globalThis.crypto?.randomUUID?.() || `eon-video-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    const submitted = await fetchJson(`${base}/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: prepared.workflow, client_id: clientId }),
      signal: options.signal
    }, options.submitTimeoutMs || 20000);
    const promptId = clean(submitted?.prompt_id, 120);
    if (!promptId) return Object.freeze({ ok: false, error: 'comfyui-video-prompt-not-accepted', outputs: Object.freeze([]), prepared });
    notify(options.onState, 'submitted', { promptId });
    const result = await waitForComfyUiVideoJob({ endpoint: base, promptId, timeoutMs: options.timeoutMs || 1_800_000, pollIntervalMs: options.pollIntervalMs || 1500, signal: options.signal, onState: options.onState });
    return Object.freeze({ ...result, prepared, uploadedInput: Object.freeze({ nameRecorded: Boolean(uploaded.uploadedName), externalUpload: false }) });
  } catch (error) {
    const cancelled = /cancel/.test(String(error?.message || ''));
    return Object.freeze({ ok: false, cancelled, error: cancelled ? 'comfyui-video-cancelled' : clean(error?.message || 'comfyui-video-submit-failed', 120), outputs: Object.freeze([]), prepared, message: humanError(error) });
  }
}

export async function cancelComfyUiVideoJob(options = {}) {
  return cancelComfyUiJob({ endpoint: options.endpoint, promptId: options.promptId, explicitUserAction: options.explicitUserAction, timeoutMs: options.timeoutMs || 10000 });
}

export async function fetchComfyUiVideoOutputBlob(output = {}, { timeoutMs = 60000, signal } = {}) {
  try {
    const url = new URL(String(output?.url || ''));
    if (!approved(`${url.protocol}//${url.host}`) || url.pathname !== '/view' || url.username || url.password) throw new Error('output-url-not-approved');
    const response = await fetchResponse(url.toString(), { headers: { accept: 'video/*,image/gif,application/octet-stream' }, signal }, timeoutMs);
    if (!response.ok) throw new Error(`comfyui-video-http-${response.status}`);
    const blob = await response.blob();
    const filename = clean(output.filename || 'eonapp-local-video.webm', 220);
    const type = clean(blob.type, 80).toLowerCase();
    if (!blob.size) throw new Error('output-empty');
    if (!(type.startsWith('video/') || type === 'image/gif' || type === 'application/octet-stream' || /\.(mp4|webm|gif)$/i.test(filename))) throw new Error('output-not-video');
    return Object.freeze({ ok: true, blob, filename, type: type || 'application/octet-stream' });
  } catch (error) {
    return Object.freeze({ ok: false, error: clean(error?.message || 'output-read-failed', 120), message: humanError(error) });
  }
}

export function getComfyUiVideoRuntimeTruth() {
  return Object.freeze({
    schema: COMFYUI_VIDEO_RUNTIME_SCHEMA,
    approvedLoopbackOnly: true,
    explicitUserActionRequired: true,
    arbitraryWorkflowAllowed: false,
    uploadDestination: 'approved-comfyui-loopback-only',
    queueConcurrency: 1,
    cloudFallback: false,
    automaticInstall: false,
    automaticModelDownload: false,
    sourceIntegrationCanAwardRealProof: false
  });
}
