// This file is emitted as a standalone module by the production builder.
// Keep its bounded, public protocol and reviewed pack self-contained: a
// worker must never import a source-tree-only module after deployment.
const EON_LOCAL_LITE_WORKER_SCHEMA = 'eon.local-ai.browser-lite.worker.rt90.v1';
const EON_LOCAL_LITE_WORKER_TYPES = Object.freeze(['prepare', 'generate', 'benchmark', 'reset']);
const EON_LOCAL_LITE_WORKER_MAX = Object.freeze({
  requestIdChars: 80,
  inputChars: 4200,
  totalInputChars: 15000,
  systemChars: 5200,
  historyMessages: 6,
  outputTokens: 192,
  outputChars: 12000
});
const EON_LOCAL_LITE_WORKER_PACK = Object.freeze({
  task: 'text-generation',
  model: 'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA',
  libraryModuleUrl: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm',
  preferredWebGpuDtype: 'q4f16',
  wasmDtype: 'q4'
});
const EON_LOCAL_LITE_WORKER_TIERS = Object.freeze({
  lite: Object.freeze({ model: EON_LOCAL_LITE_WORKER_PACK.model, historyMessages: 2, totalInputChars: 4200 }),
  balanced: Object.freeze({ model: 'onnx-community/SmolLM2-360M-ONNX', historyMessages: 4, totalInputChars: 7600 })
});
function isEonLocalLiteWorkerMessage(value = {}) {
  return Boolean(
    value
    && typeof value === 'object'
    && value.schema === EON_LOCAL_LITE_WORKER_SCHEMA
    && typeof value.type === 'string'
    && typeof value.requestId === 'string'
  );
}

let generatorPromise = null;
let loadedBackend = '';
let loadedTier = '';

function cleanText(value = '', max = 6000) {
  return [...String(value || '')]
    .filter((char) => { const code = char.charCodeAt(0); return code >= 9 && code !== 127; })
    .join('').trim().slice(0, max);
}

function boundedBackend(value = '') {
  const requested = String(value || '').toLowerCase();
  const hasWebGpu = Boolean(globalThis.navigator?.gpu);
  const hasWasm = typeof WebAssembly !== 'undefined';
  if (requested === 'webgpu' && hasWebGpu) return 'webgpu';
  if (requested === 'wasm' && hasWasm) return 'wasm';
  if (hasWebGpu) return 'webgpu';
  if (hasWasm) return 'wasm';
  return '';
}

function normalizeMessages(messages = [], tier = 'lite') {
  const budget = EON_LOCAL_LITE_WORKER_TIERS[tier] || EON_LOCAL_LITE_WORKER_TIERS.lite;
  const rows = (Array.isArray(messages) ? messages : [])
    .filter((row) => row && ['system', 'user', 'assistant'].includes(String(row.role || '')));
  const systemSource = rows.find((row) => String(row.role) === 'system');
  const system = systemSource ? cleanText(systemSource.content || '', EON_LOCAL_LITE_WORKER_MAX.systemChars) : '';
  let remaining = Math.max(1000, budget.totalInputChars - system.length);
  const recent = [];
  for (const row of [...rows].reverse()) {
    if (String(row.role) === 'system' || recent.length >= budget.historyMessages + 1 || remaining <= 0) continue;
    const content = cleanText(row.content || '', Math.min(EON_LOCAL_LITE_WORKER_MAX.inputChars, remaining));
    if (!content) continue;
    recent.push({ role: String(row.role), content });
    remaining -= content.length;
  }
  recent.reverse();
  return [...(system ? [{ role: 'system', content: system }] : []), ...recent];
}

function extractGeneratedText(output = []) {
  const first = Array.isArray(output) ? output[0] : output;
  const generated = first?.generated_text;
  if (typeof generated === 'string') return cleanText(generated, EON_LOCAL_LITE_WORKER_MAX.outputChars);
  if (Array.isArray(generated)) {
    const assistant = [...generated].reverse().find((row) => row?.role === 'assistant');
    return cleanText(assistant?.content || '', EON_LOCAL_LITE_WORKER_MAX.outputChars);
  }
  return '';
}

function post(type, requestId, payload = {}) {
  globalThis.postMessage?.({
    schema: EON_LOCAL_LITE_WORKER_SCHEMA,
    type,
    requestId: cleanText(requestId, EON_LOCAL_LITE_WORKER_MAX.requestIdChars),
    ...payload
  });
}

function progressMessage(progress = {}) {
  const status = cleanText(progress.status || '', 48);
  const file = cleanText(progress.file || '', 90);
  const pct = Number(progress.progress);
  if (status === 'progress' && Number.isFinite(pct)) return `Downloading Local Lite · ${Math.max(0, Math.min(100, Math.round(pct)))}%`;
  if (status === 'ready') return file ? `Local Lite file ready · ${file}` : 'Local Lite files ready';
  if (status === 'initiate') return 'Preparing Local Lite download…';
  if (status === 'download') return 'Downloading Local Lite…';
  return status ? `Preparing Local Lite · ${status}` : 'Preparing Local Lite…';
}

async function buildGenerator(requestId, backend, tier = 'lite') {
  const selectedBackend = boundedBackend(backend);
  if (!selectedBackend) throw new Error('browser-local-lite-backend-unavailable');
  post('progress', requestId, { phase: 'library', message: 'Loading the Local Lite engine…', backend: selectedBackend });
  const module = await import(EON_LOCAL_LITE_WORKER_PACK.libraryModuleUrl);
  if (typeof module?.pipeline !== 'function') throw new Error('browser-local-lite-engine-invalid');
  if (module.env) {
    module.env.allowRemoteModels = true;
    module.env.allowLocalModels = false;
    module.env.useBrowserCache = true;
  }
  const dtype = selectedBackend === 'webgpu' ? EON_LOCAL_LITE_WORKER_PACK.preferredWebGpuDtype : EON_LOCAL_LITE_WORKER_PACK.wasmDtype;
  const selectedTier = EON_LOCAL_LITE_WORKER_TIERS[tier] || EON_LOCAL_LITE_WORKER_TIERS.lite;
  const generator = await module.pipeline(EON_LOCAL_LITE_WORKER_PACK.task, selectedTier.model, {
    device: selectedBackend,
    dtype,
    progress_callback: (progress) => post('progress', requestId, {
      phase: 'model',
      message: progressMessage(progress),
      progress: Number.isFinite(Number(progress?.progress)) ? Math.max(0, Math.min(100, Number(progress.progress))) : null,
      backend: selectedBackend
    })
  });
  loadedBackend = selectedBackend;
  return generator;
}

async function ensureGenerator(requestId, backend, tier = 'lite') {
  const selectedBackend = boundedBackend(backend);
  if (!selectedBackend) throw new Error('browser-local-lite-backend-unavailable');
  if (generatorPromise && (loadedBackend !== selectedBackend || loadedTier !== tier)) {
    generatorPromise = null;
    loadedBackend = '';
    loadedTier = '';
  }
  if (!generatorPromise) {
    generatorPromise = buildGenerator(requestId, selectedBackend, tier).catch((error) => {
      generatorPromise = null;
      loadedBackend = '';
      loadedTier = '';
      throw error;
    });
  }
  loadedTier = tier;
  return { generator: await generatorPromise, backend: loadedBackend || selectedBackend };
}

async function handlePrepare(requestId, payload) {
  const tier = EON_LOCAL_LITE_WORKER_TIERS[payload.tier] ? payload.tier : 'lite';
  const ready = await ensureGenerator(requestId, payload.backend || '', tier);
  post('ready', requestId, { ok: true, backend: ready.backend, model: EON_LOCAL_LITE_WORKER_TIERS[tier].model, tier });
}

async function handleGenerate(requestId, payload) {
  const tier = EON_LOCAL_LITE_WORKER_TIERS[payload.tier] ? payload.tier : 'lite';
  const input = normalizeMessages(payload.messages || [], tier);
  if (!input.length) throw new Error('browser-local-lite-empty-input');
  const maxNewTokens = Math.max(16, Math.min(EON_LOCAL_LITE_WORKER_MAX.outputTokens, Number(payload.maxOutputTokens || 128) || 128));
  const { generator, backend } = await ensureGenerator(requestId, payload.backend || '', tier);
  const output = await generator(input, {
    max_new_tokens: maxNewTokens,
    do_sample: false,
    repetition_penalty: 1.08,
    return_full_text: true
  });
  const text = extractGeneratedText(output);
  if (!text) throw new Error('browser-local-lite-empty-response');
  post('result', requestId, { ok: true, text, backend, model: EON_LOCAL_LITE_WORKER_TIERS[tier].model, tier });
}

function handleBenchmark(requestId, payload = {}) {
  const requested = Number(payload.durationMs || 80);
  const durationMs = Math.max(40, Math.min(160, Number.isFinite(requested) ? requested : 80));
  const started = globalThis.performance?.now?.() ?? Date.now();
  let iterations = 0;
  let value = 0x12345678;
  while ((globalThis.performance?.now?.() ?? Date.now()) - started < durationMs) {
    for (let index = 0; index < 2048; index += 1) {
      value = Math.imul(value ^ index, 2654435761) >>> 0;
      iterations += 1;
    }
  }
  const elapsedMs = Math.max(1, (globalThis.performance?.now?.() ?? Date.now()) - started);
  post('benchmark', requestId, { ok: true, elapsedMs: Math.round(elapsedMs), iterations, iterationsPerMs: Math.round(iterations / elapsedMs), checksum: value >>> 0 });
}

function handleReset(requestId) {
  generatorPromise = null;
  loadedBackend = '';
  loadedTier = '';
  post('reset', requestId, { ok: true });
}

globalThis.addEventListener?.('message', (event) => {
  const message = event?.data;
  if (!isEonLocalLiteWorkerMessage(message)) return;
  const requestId = cleanText(message.requestId, EON_LOCAL_LITE_WORKER_MAX.requestIdChars);
  const type = cleanText(message.type, 24);
  const payload = message.payload && typeof message.payload === 'object' ? message.payload : {};
  if (!EON_LOCAL_LITE_WORKER_TYPES.includes(type)) {
    post('error', requestId, { ok: false, error: 'browser-local-lite-worker-message-not-supported' });
    return;
  }
  void (async () => {
    try {
      if (type === 'prepare') return await handlePrepare(requestId, payload);
      if (type === 'generate') return await handleGenerate(requestId, payload);
      if (type === 'benchmark') return handleBenchmark(requestId, payload);
      return handleReset(requestId);
    } catch (error) {
      post('error', requestId, { ok: false, error: cleanText(error?.message || error || 'browser-local-lite-worker-failed', 180) });
    }
  })();
});
