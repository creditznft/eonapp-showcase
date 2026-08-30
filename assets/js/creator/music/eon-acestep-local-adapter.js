/**
 * Institutional AI V2 — proof-first ACE-Step 1.5 local music adapter.
 *
 * This browser adapter talks only to the canonical `acestep` loopback runtime
 * contract after an explicit user action. It supports the official asynchronous
 * text-to-music path only: model discovery -> release_task -> query_result ->
 * generated audio fetch. It does not start ACE-Step, initialize/switch models,
 * download weights, train adapters, submit local file paths, upload reference
 * audio, publish media or fall back to a hosted provider.
 */
import {
  isApprovedLocalAiLoopbackEndpoint,
  normalizeApprovedLocalAiEndpoint
} from '../../../../config/local-ai-browser-contract.mjs';
import {
  requestLocalRuntime,
  requestLocalRuntimeJson
} from '../../local-ai/eon-local-connection-authority.js';
import { classifyEonLocalBridgeTarget } from '../../../../config/eon-local-bridge-contract.mjs';

export const EON_ACESTEP_LOCAL_MUSIC_SCHEMA = 'eonapp.creator.music.acestep-local.v1';
export const EON_ACESTEP_DEFAULT_ENDPOINT = 'http://127.0.0.1:8001';
export const EON_ACESTEP_MAX_PROMPT_CHARS = 1200;
export const EON_ACESTEP_MAX_LYRICS_CHARS = 6000;
export const EON_ACESTEP_MAX_DURATION_SEC = 180;
export const EON_ACESTEP_MAX_OUTPUT_BYTES = 160 * 1024 * 1024;
const OUTPUT_FORMATS = Object.freeze(['wav', 'mp3', 'flac', 'opus', 'aac']);
const AUDIO_MIME = /^(?:audio\/|application\/octet-stream$)/i;
const MODEL_RE = /^[A-Za-z0-9][A-Za-z0-9._:+/-]{0,119}$/;

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 240) => [...String(value || '')]
  .filter((character) => { const code = character.charCodeAt(0); return code >= 32 && code !== 127; })
  .join('').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanMultiline = (value = '', max = 6000) => String(value || '')
  // Sanitization deliberately strips C0 controls before a local runtime request.
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
  .trim().slice(0, max);
const bounded = (value, fallback, min, max) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
};
const waitDefault = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) { reject(new globalThis.DOMException('Aborted', 'AbortError')); return; }
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener?.('abort', () => { clearTimeout(timer); reject(new globalThis.DOMException('Aborted', 'AbortError')); }, { once: true });
});

function normalizeEndpoint(value = '') {
  return normalizeApprovedLocalAiEndpoint(value || EON_ACESTEP_DEFAULT_ENDPOINT, 'acestep');
}

export function isApprovedAceStepEndpoint(value = '') {
  return isApprovedLocalAiLoopbackEndpoint(value || EON_ACESTEP_DEFAULT_ENDPOINT, 'acestep');
}

function unwrap(payload = null) {
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

function normalizeModels(payload = null) {
  const data = unwrap(payload) || {};
  const rows = Array.isArray(data?.models) ? data.models : Array.isArray(data) ? data : [];
  return freeze(rows.map((row) => freeze({
    id: clean(typeof row === 'string' ? row : row?.name || row?.id, 120),
    isDefault: Boolean(row?.is_default ?? row?.isDefault),
    isLoaded: row?.is_loaded == null ? true : Boolean(row.is_loaded)
  })).filter((row) => MODEL_RE.test(row.id)).slice(0, 32));
}

function normalizeGenerationInput(input = {}) {
  const prompt = cleanMultiline(input.prompt || input.description || '', EON_ACESTEP_MAX_PROMPT_CHARS);
  const lyrics = cleanMultiline(input.lyrics || '', EON_ACESTEP_MAX_LYRICS_CHARS);
  const duration = Math.round(bounded(input.durationSec ?? input.duration, 30, 10, EON_ACESTEP_MAX_DURATION_SEC));
  const bpmRaw = Number(input.bpm);
  const bpm = Number.isFinite(bpmRaw) && bpmRaw > 0 ? Math.round(bounded(bpmRaw, 120, 30, 300)) : null;
  const model = clean(input.model || '', 120);
  const vocalLanguage = clean(input.vocalLanguage || 'en', 20).toLowerCase() || 'en';
  const format = OUTPUT_FORMATS.includes(String(input.format || '').toLowerCase()) ? String(input.format).toLowerCase() : 'wav';
  return freeze({
    prompt,
    lyrics,
    duration,
    bpm,
    model: MODEL_RE.test(model) ? model : '',
    vocalLanguage,
    format,
    enhanced: input.enhanced !== false
  });
}

function requestBody(input = {}) {
  return {
    prompt: input.prompt,
    lyrics: input.lyrics,
    thinking: input.enhanced,
    use_cot_caption: input.enhanced,
    use_cot_language: input.enhanced,
    vocal_language: input.vocalLanguage,
    audio_format: input.format,
    audio_duration: input.duration,
    inference_steps: 8,
    batch_size: 1,
    task_type: 'text2music',
    ...(input.bpm ? { bpm: input.bpm } : {}),
    ...(input.model ? { model: input.model } : {})
  };
}

function parseTask(payload = null) {
  const data = unwrap(payload) || {};
  const taskId = clean(data?.task_id || data?.taskId, 160);
  return taskId ? freeze({ taskId, queuePosition: Math.max(0, Number(data?.queue_position || data?.queuePosition || 0) || 0) }) : null;
}

function parseResultRow(payload = null, taskId = '') {
  const data = unwrap(payload);
  const rows = Array.isArray(data) ? data : [];
  const row = rows.find((candidate) => clean(candidate?.task_id || candidate?.taskId, 160) === taskId) || rows[0] || null;
  if (!row) return freeze({ state: 'running', output: null });
  const status = Number(row.status);
  if (status === 2) return freeze({ state: 'failed', output: null });
  if (status !== 1) return freeze({ state: 'running', output: null });
  let results = row.result;
  if (typeof results === 'string') {
    try { results = JSON.parse(results); } catch { results = []; }
  }
  const resultRows = Array.isArray(results) ? results : [];
  const output = resultRows.find((candidate) => Number(candidate?.status ?? 1) === 1 && candidate?.file) || resultRows.find((candidate) => candidate?.file) || null;
  if (!output) return freeze({ state: 'failed', output: null });
  return freeze({
    state: 'succeeded',
    output: freeze({
      file: clean(output.file, 520),
      model: clean(output.dit_model || output.model, 120),
      lmModel: clean(output.lm_model, 120),
      bpm: Math.max(0, Number(output?.metas?.bpm || 0) || 0),
      duration: Math.max(0, Number(output?.metas?.duration || 0) || 0),
      key: clean(output?.metas?.keyscale || output?.metas?.key_scale, 80),
      timeSignature: clean(output?.metas?.timesignature || output?.metas?.time_signature, 20)
    })
  });
}

function normalizeOutputUrl(file = '', endpoint = EON_ACESTEP_DEFAULT_ENDPOINT) {
  try {
    const base = normalizeEndpoint(endpoint);
    const url = new URL(file, `${base}/`);
    if (url.origin !== new URL(base).origin) return '';
    const target = classifyEonLocalBridgeTarget(url.toString(), 'GET');
    return target?.runtimeId === 'acestep' && target.pathname === '/v1/audio' ? target.url : '';
  } catch {
    return '';
  }
}

function redactedReceipt({ endpoint = '', model = '', output = null, connection = null, elapsedMs = 0 } = {}) {
  return freeze({
    schema: `${EON_ACESTEP_LOCAL_MUSIC_SCHEMA}.receipt`,
    runtimeId: 'acestep',
    endpointClass: isApprovedAceStepEndpoint(endpoint) ? new URL(normalizeEndpoint(endpoint)).host : '',
    model: clean(output?.model || model, 120),
    lmModelUsed: Boolean(output?.lmModel),
    bpm: Math.max(0, Number(output?.bpm || 0) || 0),
    durationSec: Math.max(0, Number(output?.duration || 0) || 0),
    transport: clean(connection?.transport || '', 60),
    elapsedMs: Math.max(0, Number(elapsedMs) || 0),
    containsPrompt: false,
    containsLyrics: false,
    containsCredential: false,
    containsAudio: false,
    externalRuntimeCertification: false
  });
}

export async function discoverAceStepLocalMusic(options = {}) {
  if (options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', models: freeze([]), endpoint: '' });
  if (!isApprovedAceStepEndpoint(options.endpoint || EON_ACESTEP_DEFAULT_ENDPOINT)) return freeze({ ok: false, reason: 'endpoint-not-approved-loopback', models: freeze([]), endpoint: '' });
  const endpoint = normalizeEndpoint(options.endpoint);
  const requestJson = options.requestJson || requestLocalRuntimeJson;
  try {
    const [health, models] = await Promise.all([
      requestJson({ runtimeId: 'acestep', url: `${endpoint}/health`, method: 'GET', timeoutMs: options.timeoutMs || 8000, signal: options.signal, store: options.store }),
      requestJson({ runtimeId: 'acestep', url: `${endpoint}/v1/models`, method: 'GET', timeoutMs: options.timeoutMs || 8000, signal: options.signal, store: options.store })
    ]);
    const discovered = normalizeModels(models.data);
    const healthData = unwrap(health.data) || {};
    return freeze({
      ok: discovered.length > 0,
      reason: discovered.length ? null : 'no-loaded-music-models',
      endpoint,
      version: clean(healthData?.version, 60),
      service: clean(healthData?.service || 'ACE-Step API', 80),
      models: discovered,
      defaultModel: discovered.find((row) => row.isDefault)?.id || discovered[0]?.id || '',
      connectionReceipt: models.receipt || health.receipt || null,
      modelDownloadStarted: false,
      modelInitializationStarted: false
    });
  } catch (error) {
    return freeze({ ok: false, reason: clean(error?.message || 'acestep-unreachable', 120), endpoint, models: freeze([]), connectionReceipt: error?.localConnectionReceipt || null, modelDownloadStarted: false, modelInitializationStarted: false });
  }
}

export async function generateAceStepLocalMusic(input = {}, options = {}) {
  if (options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', blob: null });
  const normalized = normalizeGenerationInput(input);
  if (!normalized.prompt) return freeze({ ok: false, reason: 'music-prompt-required', blob: null });
  if (!isApprovedAceStepEndpoint(options.endpoint || EON_ACESTEP_DEFAULT_ENDPOINT)) return freeze({ ok: false, reason: 'endpoint-not-approved-loopback', blob: null });
  const endpoint = normalizeEndpoint(options.endpoint);
  const requestJson = options.requestJson || requestLocalRuntimeJson;
  const request = options.request || requestLocalRuntime;
  const wait = options.wait || waitDefault;
  const pollMs = Math.round(bounded(options.pollIntervalMs, 1200, 250, 5000));
  const maxWaitMs = Math.round(bounded(options.maxWaitMs, 10 * 60 * 1000, 5_000, 15 * 60 * 1000));
  const startedAt = Date.now();
  let lastReceipt = null;
  try {
    options.onState?.(freeze({ state: 'submitting', containsPrompt: false }));
    const submitted = await requestJson({
      runtimeId: 'acestep',
      url: `${endpoint}/release_task`,
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(requestBody(normalized)),
      timeoutMs: options.submitTimeoutMs || 30_000,
      signal: options.signal,
      store: options.store,
      model: normalized.model
    });
    lastReceipt = submitted.receipt;
    const task = parseTask(submitted.data);
    if (!task) return freeze({ ok: false, reason: 'acestep-task-not-accepted', blob: null, receipt: redactedReceipt({ endpoint, model: normalized.model, connection: lastReceipt, elapsedMs: Date.now() - startedAt }) });
    options.onState?.(freeze({ state: 'queued', queuePosition: task.queuePosition, containsPrompt: false }));

    let finished = null;
    while (Date.now() - startedAt < maxWaitMs) {
      if (options.signal?.aborted) throw new globalThis.DOMException('Aborted', 'AbortError');
      await wait(pollMs, options.signal);
      const queried = await requestJson({
        runtimeId: 'acestep',
        url: `${endpoint}/query_result`,
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ task_id_list: [task.taskId] }),
        timeoutMs: options.queryTimeoutMs || 15_000,
        signal: options.signal,
        store: options.store,
        model: normalized.model
      });
      lastReceipt = queried.receipt;
      const parsed = parseResultRow(queried.data, task.taskId);
      if (parsed.state === 'failed') return freeze({ ok: false, reason: 'acestep-generation-failed', blob: null, receipt: redactedReceipt({ endpoint, model: normalized.model, connection: lastReceipt, elapsedMs: Date.now() - startedAt }) });
      if (parsed.state === 'succeeded') { finished = parsed.output; break; }
      options.onState?.(freeze({ state: 'running', elapsedMs: Date.now() - startedAt, containsPrompt: false }));
    }
    if (!finished) return freeze({ ok: false, reason: 'acestep-generation-timeout-local-job-may-continue', blob: null, receipt: redactedReceipt({ endpoint, model: normalized.model, connection: lastReceipt, elapsedMs: Date.now() - startedAt }) });

    const outputUrl = normalizeOutputUrl(finished.file, endpoint);
    if (!outputUrl) return freeze({ ok: false, reason: 'acestep-output-url-rejected', blob: null, receipt: redactedReceipt({ endpoint, model: normalized.model, output: finished, connection: lastReceipt, elapsedMs: Date.now() - startedAt }) });
    options.onState?.(freeze({ state: 'fetching-output', containsPrompt: false }));
    const fetched = await request({
      runtimeId: 'acestep',
      url: outputUrl,
      method: 'GET',
      headers: { accept: 'audio/*,application/octet-stream' },
      timeoutMs: options.outputTimeoutMs || 60_000,
      signal: options.signal,
      store: options.store,
      model: finished.model || normalized.model
    });
    lastReceipt = fetched.receipt;
    if (!fetched.response.ok) return freeze({ ok: false, reason: `acestep-output-http-${fetched.response.status}`, blob: null, receipt: redactedReceipt({ endpoint, model: normalized.model, output: finished, connection: lastReceipt, elapsedMs: Date.now() - startedAt }) });
    const contentLength = Number(fetched.response.headers.get('content-length') || 0) || 0;
    if (contentLength > EON_ACESTEP_MAX_OUTPUT_BYTES) return freeze({ ok: false, reason: 'acestep-output-too-large', blob: null, receipt: redactedReceipt({ endpoint, model: normalized.model, output: finished, connection: lastReceipt, elapsedMs: Date.now() - startedAt }) });
    const blob = await fetched.response.blob();
    const type = clean(blob.type || fetched.response.headers.get('content-type') || '', 120).toLowerCase();
    if (!blob.size || blob.size > EON_ACESTEP_MAX_OUTPUT_BYTES || !AUDIO_MIME.test(type || 'application/octet-stream')) return freeze({ ok: false, reason: 'acestep-output-not-audio', blob: null, receipt: redactedReceipt({ endpoint, model: normalized.model, output: finished, connection: lastReceipt, elapsedMs: Date.now() - startedAt }) });
    const receipt = redactedReceipt({ endpoint, model: normalized.model, output: finished, connection: lastReceipt, elapsedMs: Date.now() - startedAt });
    options.onState?.(freeze({ state: 'output-ready', bytes: blob.size, containsPrompt: false }));
    return freeze({
      ok: true,
      reason: null,
      blob,
      filename: `eon-music-${Date.now()}.${normalized.format}`,
      mimeType: type || `audio/${normalized.format}`,
      metadata: freeze({ model: receipt.model, bpm: receipt.bpm, durationSec: receipt.durationSec, key: finished.key, timeSignature: finished.timeSignature }),
      receipt,
      proofState: 'generated-fetched-preview-or-save-pending',
      serverJobCancellationSupported: false
    });
  } catch (error) {
    const aborted = options.signal?.aborted || String(error?.name || '') === 'AbortError';
    return freeze({
      ok: false,
      reason: aborted ? 'acestep-wait-cancelled-local-job-may-continue' : clean(error?.message || 'acestep-generation-error', 120),
      blob: null,
      receipt: redactedReceipt({ endpoint, model: normalized.model, connection: error?.localConnectionReceipt || lastReceipt, elapsedMs: Date.now() - startedAt }),
      serverJobCancellationSupported: false
    });
  }
}

export function getAceStepLocalMusicTruth() {
  return freeze({
    schema: EON_ACESTEP_LOCAL_MUSIC_SCHEMA,
    runtimeId: 'acestep',
    defaultEndpoint: EON_ACESTEP_DEFAULT_ENDPOINT,
    loopbackOnly: true,
    userStartedRuntimeOnly: true,
    explicitDiscoveryRequired: true,
    explicitGenerationRequired: true,
    supportedTaskTypes: freeze(['text2music']),
    loadedModelDiscovery: true,
    modelInitialization: false,
    modelDownload: false,
    adapterTraining: false,
    referenceAudioUpload: false,
    sourceAudioUpload: false,
    serverFilePathsAccepted: false,
    cloudFallback: false,
    outputFetchedToBrowser: true,
    promptPersistedByEonapp: false,
    lyricsPersistedByEonapp: false,
    receiptContainsPrompt: false,
    liveReferenceDeviceProof: false,
    serverJobCancellationSupported: false
  });
}

export default freeze({
  EON_ACESTEP_LOCAL_MUSIC_SCHEMA,
  discoverAceStepLocalMusic,
  generateAceStepLocalMusic,
  getAceStepLocalMusicTruth
});
