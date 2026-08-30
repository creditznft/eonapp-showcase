import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateBrowserLocalLiteStorageFit,
  getBrowserLocalLiteApproximateWeightMb,
  getBrowserLocalLiteCapability
} from '../../assets/js/local-ai/browser-local-lite.js';

test('RT97 Local Lite keeps Auto conservative until Balanced has local proof', () => {
  const nav = { gpu: {}, deviceMemory: 8, hardwareConcurrency: 8 };
  const fresh = getBrowserLocalLiteCapability({ navigator: nav, hasWebGPU: true, hasWebAssembly: true, secureContext: true });
  const proven = getBrowserLocalLiteCapability({ navigator: nav, hasWebGPU: true, hasWebAssembly: true, secureContext: true, knownGoodBalanced: true });
  assert.equal(fresh.recommendedTier, 'lite');
  assert.equal(proven.recommendedTier, 'balanced');
});

test('RT97 storage admission uses tier/backend-specific model weight and conservative headroom', () => {
  assert.equal(getBrowserLocalLiteApproximateWeightMb({ tier: 'balanced', backend: 'webgpu' }), 272);
  assert.equal(getBrowserLocalLiteApproximateWeightMb({ tier: 'balanced', backend: 'wasm' }), 386);
  const tooSmall = evaluateBrowserLocalLiteStorageFit({ quota: 500 * 1024 ** 2, usage: 200 * 1024 ** 2 }, { tier: 'balanced', backend: 'webgpu' });
  assert.equal(tooSmall.known, true);
  assert.equal(tooSmall.ok, false);
  const enough = evaluateBrowserLocalLiteStorageFit({ quota: 2 * 1024 ** 3, usage: 500 * 1024 ** 2 }, { tier: 'balanced', backend: 'webgpu' });
  assert.equal(enough.ok, true);
});

test('RT97 unknown storage quota does not invent an incompatibility', () => {
  const fit = evaluateBrowserLocalLiteStorageFit({}, { tier: 'lite', backend: 'wasm' });
  assert.equal(fit.known, false);
  assert.equal(fit.ok, true);
});

import {
  bindBrowserLocalLiteLifecycle,
  deleteBrowserLocalLiteCachedModel,
  detectBrowserLocalLiteAdvancedCapabilities,
  readBrowserLocalLiteLifecycleSnapshot
} from '../../assets/js/local-ai/browser-local-lite.js';

test('RT97 Local Lite reports advanced browser evidence without turning hints into cloud or larger-model authority', () => {
  const evidence = detectBrowserLocalLiteAdvancedCapabilities({ navigator: { gpu: {}, deviceMemory: 8, hardwareConcurrency: 8 }, wasmSimd: true, crossOriginIsolated: true, sharedArrayBuffer: true });
  assert.equal(evidence.hasWebGPU, true);
  assert.equal(evidence.hasWebAssembly, true);
  assert.equal(evidence.wasmSimd, true);
  assert.equal(evidence.wasmThreads, true);
});

test('RT97 Local Lite releases worker lifecycle on background/pagehide and keeps a local-only receipt boundary', () => {
  const listeners = new Map();
  const documentRef = { visibilityState: 'visible', addEventListener(type, fn) { listeners.set(type, fn); } };
  const environment = { document: documentRef, addEventListener(type, fn) { listeners.set(type, fn); } };
  const bound = bindBrowserLocalLiteLifecycle(environment);
  assert.equal(bound.ok, true);
  documentRef.visibilityState = 'hidden';
  listeners.get('visibilitychange')?.();
  assert.equal(readBrowserLocalLiteLifecycleSnapshot().lastLifecycleEvent, 'document-hidden-worker-released');
  assert.equal(readBrowserLocalLiteLifecycleSnapshot().silentCloudFallback, false);
});

test('RT97 Local Lite cache deletion is explicit and only removes approved Hugging Face model entries', async () => {
  const deleted = [];
  const cache = {
    async keys() { return [
      { url: 'https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX-MHA/resolve/main/model.onnx' },
      { url: 'https://huggingface.co/other/model/resolve/main/model.onnx' },
      { url: 'https://example.test/onnx-community/SmolLM2-360M-ONNX/model.onnx' }
    ]; },
    async delete(request) { deleted.push(request.url); return true; }
  };
  const cachesRef = { async keys() { return ['transformers-cache']; }, async open() { return cache; } };
  assert.equal((await deleteBrowserLocalLiteCachedModel({ explicitUserAction: false, cachesRef })).ok, false);
  const result = await deleteBrowserLocalLiteCachedModel({ explicitUserAction: true, cachesRef });
  assert.equal(result.ok, true);
  assert.equal(result.deletedEntries, 1);
  assert.equal(deleted.length, 1);
  assert.match(deleted[0], /SmolLM2-135M/);
});


test('RT97 Local Lite cache deletion tolerates malformed URL encoding without aborting later approved entries', async () => {
  const deleted = [];
  const cache = {
    async keys() { return [
      { url: 'https://huggingface.co/%E0%A4%A/other/model.onnx' },
      { url: 'https://huggingface.co/onnx-community/SmolLM2-360M-ONNX/resolve/main/model.onnx' }
    ]; },
    async delete(request) { deleted.push(request.url); return true; }
  };
  const cachesRef = { async keys() { return ['transformers-cache']; }, async open() { return cache; } };
  const result = await deleteBrowserLocalLiteCachedModel({ explicitUserAction: true, cachesRef });
  assert.equal(result.ok, true);
  assert.equal(result.deletedEntries, 1);
  assert.equal(deleted.length, 1);
  assert.match(deleted[0], /SmolLM2-360M/);
});
