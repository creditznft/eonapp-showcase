import { LOCAL_AI_LITE_PACK, LOCAL_AI_LITE_TIERS, recommendLocalLiteTier } from '../../../config/local-ai-consumer-experience-contract.mjs';
import {
  EON_LOCAL_LITE_WORKER_MAX,
  EON_LOCAL_LITE_WORKER_SCHEMA,
  isEonLocalLiteWorkerMessage
} from './browser-local-lite-worker-contract.js';

export const BROWSER_LOCAL_LITE_RECEIPT_KEY = 'eon:local-ai:browser-lite:v1';
export const BROWSER_LOCAL_LITE_RECEIPT_SCHEMA = 'eon.local-ai.browser-lite.rt90.v1';
const WORKER_REQUEST_TIMEOUT_MS = 180000;
let worker = null;
let requestSequence = 0;
const pending = new Map();
let lifecycleBound = false;
let lastLifecycleEvent = 'initial';
let lastLifecycleAt = 0;

function storage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function cleanText(value = '', max = 6000) {
  return [...String(value || '')]
    .filter((char) => { const code = char.charCodeAt(0); return code >= 9 && code !== 127; })
    .join('').trim().slice(0, max);
}

function nowIso() {
  return new Date().toISOString();
}

function tierPackFor(tier = 'lite') {
  return LOCAL_AI_LITE_TIERS[String(tier || 'lite')] || LOCAL_AI_LITE_TIERS.lite;
}

export function getBrowserLocalLiteApproximateWeightMb({ tier = 'lite', backend = 'webgpu' } = {}) {
  const pack = tierPackFor(tier);
  return Math.max(1, Number(backend === 'wasm' ? pack.wasmMb : pack.webgpuMb) || (backend === 'wasm' ? LOCAL_AI_LITE_PACK.approximatePrimaryWeightMb.wasm : LOCAL_AI_LITE_PACK.approximatePrimaryWeightMb.webgpu));
}

export function evaluateBrowserLocalLiteStorageFit({ quota = 0, usage = 0 } = {}, { tier = 'lite', backend = 'webgpu' } = {}) {
  const safeQuota = Math.max(0, Number(quota) || 0);
  const safeUsage = Math.max(0, Number(usage) || 0);
  const approximateWeightMb = getBrowserLocalLiteApproximateWeightMb({ tier, backend });
  // Browser model caches need room beyond the primary weights for tokenizer,
  // shards, compilation and rollback/retry. This is a conservative admission
  // threshold, not a claim about exact final disk use.
  const requiredFreeBytes = Math.ceil((approximateWeightMb * 1.3 + 128) * 1024 * 1024);
  const availableBytes = safeQuota > 0 ? Math.max(0, safeQuota - safeUsage) : 0;
  const known = safeQuota > 0;
  return Object.freeze({
    known,
    ok: !known || availableBytes >= requiredFreeBytes,
    tier: String(tier || 'lite'),
    backend: String(backend || 'webgpu'),
    approximateWeightMb,
    requiredFreeBytes,
    availableBytes
  });
}

export async function inspectBrowserLocalLiteStorage({ tier = 'lite', backend = 'webgpu', navigatorRef = globalThis.navigator } = {}) {
  let estimate = null;
  try { estimate = await navigatorRef?.storage?.estimate?.(); } catch {}
  return evaluateBrowserLocalLiteStorageFit(estimate || {}, { tier, backend });
}

function normalizeReceipt(value = {}) {
  const checkedAt = cleanText(value.checkedAt || '', 80);
  const timestamp = Date.parse(checkedAt || '');
  if (!value || value.schema !== BROWSER_LOCAL_LITE_RECEIPT_SCHEMA || value.ok !== true || !Number.isFinite(timestamp)) return null;
  return Object.freeze({
    schema: BROWSER_LOCAL_LITE_RECEIPT_SCHEMA,
    ok: true,
    providerId: 'browserlocal',
    runtime: 'EON Local Lite',
    model: cleanText(value.model || LOCAL_AI_LITE_PACK.model, 180),
    tier: ['lite', 'balanced'].includes(String(value.tier || '')) ? String(value.tier) : 'lite',
    backend: cleanText(value.backend || '', 24),
    checkedAt,
    cached: value.cached === true,
    local: true,
    cloudFallback: false
  });
}

export function readBrowserLocalLiteReceipt() {
  try {
    const raw = storage()?.getItem(BROWSER_LOCAL_LITE_RECEIPT_KEY);
    return normalizeReceipt(raw ? JSON.parse(raw) : {});
  } catch {
    return null;
  }
}

function rejectPending(reason = 'browser-local-lite-worker-reset') {
  const error = new Error(reason);
  for (const entry of pending.values()) {
    globalThis.clearTimeout?.(entry.timer);
    try { entry.reject(error); } catch {}
  }
  pending.clear();
}

function terminateWorker(reason = 'browser-local-lite-worker-reset') {
  rejectPending(reason);
  try { worker?.terminate?.(); } catch {}
  worker = null;
}

export function clearBrowserLocalLiteReceipt() {
  try { storage()?.removeItem(BROWSER_LOCAL_LITE_RECEIPT_KEY); } catch {}
  terminateWorker('browser-local-lite-cleared');
}

export function cancelBrowserLocalLite() {
  const active = Boolean(worker || pending.size);
  terminateWorker('browser-local-lite-cancelled');
  return Object.freeze({ ok: true, cancelled: active });
}

export function resetBrowserLocalLiteRuntime() {
  terminateWorker('browser-local-lite-reset');
  return Object.freeze({ ok: true });
}

function noteLifecycle(event = '') {
  lastLifecycleEvent = cleanText(event || 'unknown', 64);
  lastLifecycleAt = Date.now();
}

export function bindBrowserLocalLiteLifecycle(environment = globalThis) {
  if (lifecycleBound) return Object.freeze({ ok: true, bound: true, reused: true });
  const documentRef = environment?.document;
  const onVisibility = () => {
    if (documentRef?.visibilityState === 'hidden') {
      noteLifecycle('document-hidden-worker-released');
      terminateWorker('browser-local-lite-backgrounded');
    } else noteLifecycle('document-visible');
  };
  const onPageHide = () => { noteLifecycle('pagehide-worker-released'); terminateWorker('browser-local-lite-pagehide'); };
  documentRef?.addEventListener?.('visibilitychange', onVisibility);
  environment?.addEventListener?.('pagehide', onPageHide);
  lifecycleBound = true;
  noteLifecycle('lifecycle-bound');
  return Object.freeze({ ok: true, bound: true, reused: false });
}

export function readBrowserLocalLiteLifecycleSnapshot() {
  return Object.freeze({
    workerActive: Boolean(worker),
    pendingRequests: pending.size,
    lastLifecycleEvent,
    lastLifecycleAt,
    cachedReceiptPresent: Boolean(readBrowserLocalLiteReceipt()),
    silentCloudFallback: false
  });
}

const APPROVED_MODEL_PATH_FRAGMENTS = Object.freeze([
  '/onnx-community/SmolLM2-135M-Instruct-ONNX-MHA/',
  '/onnx-community/SmolLM2-360M-ONNX/'
]);

export async function deleteBrowserLocalLiteCachedModel({ explicitUserAction = false, cachesRef = globalThis.caches } = {}) {
  if (explicitUserAction !== true) return Object.freeze({ ok: false, error: 'explicit-user-action-required', deletedEntries: 0 });
  terminateWorker('browser-local-lite-cache-delete');
  let deletedEntries = 0;
  let inspectedCaches = 0;
  try {
    const names = typeof cachesRef?.keys === 'function' ? await cachesRef.keys() : [];
    for (const name of names) {
      const cache = await cachesRef.open(name);
      const requests = await cache.keys();
      inspectedCaches += 1;
      for (const request of requests) {
        let url = null;
        try { url = new URL(request.url || request); } catch { continue; }
        const host = url.hostname.toLowerCase();
        if (host !== 'huggingface.co' && !host.endsWith('.huggingface.co')) continue;
        let pathname = url.pathname;
        try { pathname = decodeURIComponent(pathname); } catch {}
        if (!APPROVED_MODEL_PATH_FRAGMENTS.some((fragment) => pathname.includes(fragment))) continue;
        if (await cache.delete(request)) deletedEntries += 1;
      }
    }
  } catch {}
  try { storage()?.removeItem(BROWSER_LOCAL_LITE_RECEIPT_KEY); } catch {}
  noteLifecycle('explicit-model-cache-delete');
  return Object.freeze({ ok: true, deletedEntries, inspectedCaches, receiptCleared: true, sharedLibraryCachePreserved: true });
}

const SIMD_PROBE = new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,9,1,7,0,65,0,253,15,26,11]);

export function detectBrowserLocalLiteAdvancedCapabilities(context = {}) {
  const nav = context.navigator || globalThis.navigator || {};
  const wasm = context.hasWebAssembly !== false && typeof globalThis.WebAssembly !== 'undefined';
  let wasmSimd = false;
  try { wasmSimd = context.wasmSimd === true || Boolean(wasm && globalThis.WebAssembly.validate?.(SIMD_PROBE)); } catch {}
  const crossOriginIsolated = context.crossOriginIsolated === true || globalThis.crossOriginIsolated === true;
  const sharedArrayBuffer = context.sharedArrayBuffer === true || typeof globalThis.SharedArrayBuffer === 'function';
  return Object.freeze({
    hasWebGPU: context.hasWebGPU === true || Boolean(nav?.gpu),
    hasWebAssembly: wasm,
    wasmSimd,
    wasmThreads: Boolean(wasm && crossOriginIsolated && sharedArrayBuffer),
    crossOriginIsolated,
    deviceMemory: Number(nav?.deviceMemory || 0) || 0,
    hardwareConcurrency: Number(nav?.hardwareConcurrency || 0) || 0
  });
}

export async function benchmarkBrowserLocalLiteDevice({ durationMs = 80, onStatus = () => {} } = {}) {
  const capability = getBrowserLocalLiteCapability();
  if (!capability.supported) return Object.freeze({ ok: false, error: 'browser-local-lite-benchmark-unsupported', capability });
  try {
    onStatus({ phase: 'benchmark', message: 'Checking Local Lite worker responsiveness on this device…' });
    const result = await requestWorker('benchmark', { durationMs }, { onStatus, timeoutMs: 5000 });
    return Object.freeze({
      ok: result?.ok === true,
      elapsedMs: Math.max(0, Number(result?.elapsedMs || 0)),
      iterations: Math.max(0, Number(result?.iterations || 0)),
      iterationsPerMs: Math.max(0, Number(result?.iterationsPerMs || 0)),
      capability: detectBrowserLocalLiteAdvancedCapabilities()
    });
  } catch (error) {
    return Object.freeze({ ok: false, error: cleanText(error?.message || 'browser-local-lite-benchmark-failed', 120), capability: detectBrowserLocalLiteAdvancedCapabilities() });
  }
}

export function getBrowserLocalLiteCapability(context = {}) {
  const nav = context.navigator || globalThis.navigator || {};
  const hasWebGPU = context.hasWebGPU === true || Boolean(nav?.gpu);
  const hasWebAssembly = context.hasWebAssembly !== false && typeof WebAssembly !== 'undefined';
  const secureContext = context.secureContext !== false && (typeof globalThis.isSecureContext === 'undefined' || globalThis.isSecureContext === true);
  const simulatedBrowserContext = Object.prototype.hasOwnProperty.call(context, 'navigator');
  const nonBrowserTestContext = typeof globalThis.window === 'undefined' && typeof globalThis.document === 'undefined';
  const hasWorker = context.hasWorker === true || typeof globalThis.Worker === 'function' || (simulatedBrowserContext && context.hasWorker !== false) || nonBrowserTestContext;
  const supported = secureContext && hasWorker && (hasWebGPU || hasWebAssembly);
  const tier = recommendLocalLiteTier({ hasWebGPU, deviceMemory: Number(nav?.deviceMemory || 0), hardwareConcurrency: Number(nav?.hardwareConcurrency || 0), knownGoodBalanced: context.knownGoodBalanced === true }, context.tier || 'auto');
  return Object.freeze({
    supported,
    hasWebGPU,
    hasWebAssembly,
    hasWorker,
    secureContext,
    preferredBackend: hasWebGPU ? 'webgpu' : hasWebAssembly ? 'wasm' : '',
    preferredDtype: hasWebGPU ? LOCAL_AI_LITE_PACK.preferredWebGpuDtype : LOCAL_AI_LITE_PACK.wasmDtype,
    model: (LOCAL_AI_LITE_TIERS[tier.tier] || LOCAL_AI_LITE_TIERS.lite).model,
    recommendedTier: tier.tier,
    tierReason: tier.reason,
    deviceMemory: Number(nav?.deviceMemory || 0) || 0,
    hardwareConcurrency: Number(nav?.hardwareConcurrency || 0) || 0,
    firstUseDownloadRequired: LOCAL_AI_LITE_PACK.firstUseDownloadRequired,
    mainThreadInference: false
  });
}

function createWorker() {
  if (worker) return worker;
  if (typeof globalThis.Worker !== 'function') throw new Error('browser-local-lite-worker-unavailable');
  // Keep the URL expression in the Worker constructor so production bundlers
  // include this worker's module graph rather than leaving source-only imports.
  const next = new globalThis.Worker(new URL('./browser-local-lite-worker.js', import.meta.url), { type: 'module', name: 'eon-local-lite' });
  next.addEventListener('message', (event) => {
    const message = event?.data;
    if (!isEonLocalLiteWorkerMessage(message)) return;
    const requestId = cleanText(message.requestId || '', EON_LOCAL_LITE_WORKER_MAX.requestIdChars);
    const entry = pending.get(requestId);
    if (!entry) return;
    if (message.type === 'progress') {
      try {
        entry.onStatus?.({
          phase: cleanText(message.phase || 'model', 32),
          message: cleanText(message.message || '', 220),
          progress: Number.isFinite(Number(message.progress)) ? Number(message.progress) : null,
          backend: cleanText(message.backend || '', 24)
        });
      } catch {}
      return;
    }
    globalThis.clearTimeout?.(entry.timer);
    pending.delete(requestId);
    if (message.type === 'error' || message.ok === false) {
      entry.reject(new Error(cleanText(message.error || 'browser-local-lite-worker-failed', 220)));
      return;
    }
    entry.resolve(message);
  });
  next.addEventListener('error', () => terminateWorker('browser-local-lite-worker-crashed'));
  next.addEventListener('messageerror', () => terminateWorker('browser-local-lite-worker-message-error'));
  worker = next;
  return worker;
}

function requestWorker(type, payload = {}, { onStatus = () => {}, timeoutMs = WORKER_REQUEST_TIMEOUT_MS } = {}) {
  const target = createWorker();
  requestSequence += 1;
  const requestId = `lite:${Date.now()}:${requestSequence}`;
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout?.(() => {
      pending.delete(requestId);
      reject(new Error('browser-local-lite-worker-timeout'));
      terminateWorker('browser-local-lite-worker-timeout');
    }, Math.max(5000, Number(timeoutMs) || WORKER_REQUEST_TIMEOUT_MS));
    pending.set(requestId, { resolve, reject, timer, onStatus });
    try {
      target.postMessage({ schema: EON_LOCAL_LITE_WORKER_SCHEMA, type, requestId, payload });
    } catch (error) {
      globalThis.clearTimeout?.(timer);
      pending.delete(requestId);
      reject(error);
    }
  });
}

export async function prepareBrowserLocalLite({ userApprovedDownload = false, onStatus = () => {}, backend = '', tier = 'auto' } = {}) {
  const priorReceipt = readBrowserLocalLiteReceipt();
  const capability = getBrowserLocalLiteCapability({ tier, knownGoodBalanced: priorReceipt?.tier === 'balanced' });
  if (!capability.supported) return Object.freeze({ ok: false, error: 'not-supported', message: 'This browser cannot run the reviewed Local Lite engine without blocking the page.' });
  if (!userApprovedDownload && !readBrowserLocalLiteReceipt()) {
    return Object.freeze({
      ok: false,
      error: 'download-approval-required',
      message: 'Local Lite needs a one-time model download. Start setup to approve it.',
      approximateWeightMb: getBrowserLocalLiteApproximateWeightMb({ tier: capability.recommendedTier, backend: capability.preferredBackend })
    });
  }

  let selectedTier = capability.recommendedTier;
  let tierPack = LOCAL_AI_LITE_TIERS[selectedTier] || LOCAL_AI_LITE_TIERS.lite;
  const requested = ['webgpu', 'wasm'].includes(String(backend || '').toLowerCase()) ? String(backend).toLowerCase() : capability.preferredBackend;
  let storageFit = await inspectBrowserLocalLiteStorage({ tier: selectedTier, backend: requested });
  if (!storageFit.ok && selectedTier === 'balanced') {
    onStatus({ phase: 'storage-fallback', message: 'Balanced needs more browser storage headroom on this device. Using the reviewed Lite tier instead.', backend: requested });
    selectedTier = 'lite';
    tierPack = LOCAL_AI_LITE_TIERS.lite;
    storageFit = await inspectBrowserLocalLiteStorage({ tier: selectedTier, backend: requested });
  }
  if (!storageFit.ok) {
    const availableMb = Math.max(0, Math.floor(storageFit.availableBytes / (1024 * 1024)));
    return Object.freeze({
      ok: false,
      error: 'browser-local-lite-storage-insufficient',
      message: `Local Lite needs more free browser storage before download. About ${availableMb} MB is currently available to this origin.`,
      storage: storageFit
    });
  }
  try {
    let ready;
    try {
      ready = await requestWorker('prepare', { backend: requested, tier: selectedTier }, { onStatus });
    } catch (error) {
      if (requested !== 'webgpu' || !capability.hasWebAssembly) throw error;
      terminateWorker('browser-local-lite-webgpu-fallback');
      onStatus({ phase: 'fallback', message: 'WebGPU Local Lite did not start on this device. Trying the reviewed WASM fallback…', backend: 'wasm' });
      ready = await requestWorker('prepare', { backend: 'wasm', tier: selectedTier }, { onStatus });
    }
    const selectedBackend = cleanText(ready?.backend || requested, 24);
    const receipt = Object.freeze({
      schema: BROWSER_LOCAL_LITE_RECEIPT_SCHEMA,
      ok: true,
      providerId: 'browserlocal',
      runtime: 'EON Local Lite',
      model: cleanText(ready?.model || tierPack.model || LOCAL_AI_LITE_PACK.model, 180),
      tier: selectedTier,
      backend: selectedBackend,
      checkedAt: nowIso(),
      cached: true,
      local: true,
      cloudFallback: false,
      storageAdmission: storageFit.known ? 'checked' : 'browser-estimate-unavailable'
    });
    try { storage()?.setItem(BROWSER_LOCAL_LITE_RECEIPT_KEY, JSON.stringify(receipt)); } catch {}
    onStatus({ phase: 'ready', message: `Local Lite ${selectedTier} is ready on this device.`, backend: receipt.backend });
    return Object.freeze({ ok: true, receipt });
  } catch (error) {
    const message = cleanText(error?.message || error || 'Local Lite could not start.', 220);
    if (selectedTier === 'balanced') {
      // A reviewed larger local tier may fail from browser resources or backend
      // support. Downgrade only to the reviewed local Lite tier; never change
      // provider, endpoint, credentials, or locality boundary.
      terminateWorker('browser-local-lite-balanced-downgrade');
      onStatus({ phase: 'fallback', message: 'Balanced Local Lite could not start. Trying the reviewed local Lite fallback…', backend: capability.preferredBackend });
      const fallback = await prepareBrowserLocalLite({ userApprovedDownload: true, onStatus, backend: capability.preferredBackend, tier: 'lite' });
      return Object.freeze(fallback.ok ? { ...fallback, fallbackFrom: 'balanced' } : fallback);
    }
    onStatus({ phase: 'error', message });
    return Object.freeze({ ok: false, error: 'browser-local-lite-start-failed', message });
  }
}

export async function askBrowserLocalLite(messages = [], options = {}) {
  const receipt = readBrowserLocalLiteReceipt();
  if (!receipt?.ok) throw new Error('Prepare EON Local Lite in Local AI before using it in EONBOT.');
  const prepared = await prepareBrowserLocalLite({ userApprovedDownload: true, onStatus: options.onStatus || (() => {}), backend: receipt.backend, tier: receipt.tier || 'lite' });
  if (!prepared.ok) throw new Error(prepared.message || 'EON Local Lite is not ready.');
  const startedAt = globalThis.performance?.now?.() ?? Date.now();
  const result = await requestWorker('generate', {
    backend: prepared.receipt.backend,
    tier: prepared.receipt.tier || 'lite',
    messages: Array.isArray(messages) ? messages : [],
    maxOutputTokens: Math.max(16, Math.min(EON_LOCAL_LITE_WORKER_MAX.outputTokens, Number(options.maxOutputTokens || 128) || 128))
  }, { onStatus: options.onStatus || (() => {}), timeoutMs: options.timeoutMs || WORKER_REQUEST_TIMEOUT_MS });
  const text = cleanText(result?.text || '', EON_LOCAL_LITE_WORKER_MAX.outputChars);
  if (!text) throw new Error('Local Lite returned an empty response.');
  const elapsedMs = Math.max(0, Math.round((globalThis.performance?.now?.() ?? Date.now()) - startedAt));
  return Object.freeze({
    text,
    usage: null,
    providerRequestId: '',
    localConnectionReceipt: Object.freeze({
      schema: 'eon.local-ai.browser-lite.connection.rt90.v1',
      runtimeId: 'browserlocal',
      transport: prepared.receipt.backend || 'browser-worker',
      endpointClass: 'same-browser-on-device',
      path: 'transformers-js-worker-text-generation',
      authenticated: false,
      status: 200,
      ok: true,
      localityState: 'browser-on-device',
      elapsedMs,
      mainThreadInference: false,
      containsCredential: false,
      containsPrompt: false,
      containsReply: false
    })
  });
}

export function markBrowserLocalLiteForChat() {
  const receipt = readBrowserLocalLiteReceipt();
  if (!receipt?.ok) return Object.freeze({ ok: false, error: 'browser-local-lite-proof-required' });
  try {
    const existing = JSON.parse(storage()?.getItem('eon:ai-chat-settings:v1') || '{}');
    const next = {
      ...existing,
      provider: 'browserlocal',
      model: receipt.model || LOCAL_AI_LITE_PACK.model,
      endpoint: '',
      policyTier: 'local-private',
      runtimePreference: 'local-first',
      mode: 'local-first',
      localityState: 'browser-on-device',
      localTransport: receipt.backend || 'browser-worker',
      modelPinned: true
    };
    storage()?.setItem('eon:ai-chat-settings:v1', JSON.stringify(next));
    return Object.freeze({ ok: true, settings: next });
  } catch {
    return Object.freeze({ ok: false, error: 'unable-to-save-browser-local-chat' });
  }
}
