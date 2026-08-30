import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildOllamaPullCommand, findPreferredDiscoveredLocalModel, getLocalAiStarterCatalog } from '../../assets/js/local-ai/local-ai-catalog.js';
import { discoverLocalRuntimeModels, isDeviceLocalRuntimeEndpoint, isLocalOnlyModelTag, markLocalRuntimeAsChatRuntime, runLocalRuntimeSelfTest } from '../../assets/js/local-ai/local-runtime-status.js';
import { buildEonbotCommandHubPlan, detectEonbotCommandHubAction } from '../../assets/js/chat/eonbot-command-hub.js';
import { assessCity3dPerformance, CITY_3D_QUALITY_PRESETS } from '../../assets/js/city/eon-city-3d-model.js';
import { buildCity3dLocalProofExport, readCity3dLocalProofs, saveCity3dLocalProof } from '../../assets/js/city/eon-city-3d-proof.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

class MemoryStorage {
  constructor() { this.rows = new Map(); }
  getItem(key) { return this.rows.has(String(key)) ? this.rows.get(String(key)) : null; }
  setItem(key, value) { this.rows.set(String(key), String(value)); }
  removeItem(key) { this.rows.delete(String(key)); }
}

test('W233 keeps local model guidance conservative, device-aware, and user-install only', () => {
  const catalog = getLocalAiStarterCatalog({ device: { label: 'Desktop', computeClass: 'cpu-local', memoryGB: 16, cpuCores: 8 } });
  assert.equal(catalog.schema, 'eon.local-ai.catalog.v1');
  assert.ok(catalog.profiles.some((row) => row.model === 'gemma3:4b' && row.fit.level === 'recommended'));
  assert.ok(catalog.profiles.some((row) => row.model === 'qwen3-coder:30b' && row.fit.level !== 'recommended'));
  assert.equal(buildOllamaPullCommand('compact-private-chat'), 'ollama pull gemma3:4b');
  const mobile = getLocalAiStarterCatalog({ device: { label: 'Phone', computeClass: 'mobile', memoryGB: 8, cpuCores: 8 } });
  assert.ok(mobile.profiles.every((row) => row.fit.level === 'not-recommended'));
});

test('W233 only treats loopback endpoints as device-local and lists installed Ollama models by explicit scan', async () => {
  assert.equal(isDeviceLocalRuntimeEndpoint('http://127.0.0.1:11434'), true);
  assert.equal(isDeviceLocalRuntimeEndpoint('http://localhost:11434'), true);
  assert.equal(isDeviceLocalRuntimeEndpoint('https://example.com'), false);
  assert.equal(isDeviceLocalRuntimeEndpoint('http://192.168.1.4:11434'), false);
  assert.equal(isLocalOnlyModelTag('gemma3:4b'), true);
  assert.equal(isLocalOnlyModelTag('gpt-oss:120b-cloud'), false);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.match(String(url), /127\.0\.0\.1:11434\/api\/tags$/);
    return new Response(JSON.stringify({ models: [{ name: 'gemma3:4b', size: 3543348011, modified_at: '2026-06-24T12:00:00Z' }, { name: 'gpt-oss:120b-cloud', size: 1 }] }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const result = await discoverLocalRuntimeModels({ runtimeName: 'Ollama', endpoint: 'http://127.0.0.1:11434' });
    assert.equal(result.ok, true);
    assert.deepEqual(result.models.map((row) => row.model), ['gemma3:4b']);
    assert.equal(result.hiddenCloudModels, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('W233 prefers a conservative discovered text model over the first arbitrary scan result', () => {
  const preferred = findPreferredDiscoveredLocalModel([
    { model: 'qwen3:4b-gpu', localOnly: true },
    { model: 'phi4-mini:gpu', localOnly: true },
    { model: 'qwen2.5-coder:7b-gpu', localOnly: true }
  ], { device: { label: 'Desktop', computeClass: 'cpu-local', memoryGB: 16, cpuCores: 8 } });
  assert.equal(preferred?.model, 'phi4-mini:gpu');
});

test('W233 rejects cloud-backed model tags even when a runtime is listening on loopback', async () => {
  const selfTest = await runLocalRuntimeSelfTest({ runtimeName: 'Ollama', endpoint: 'http://127.0.0.1:11434', model: 'gpt-oss:120b-cloud' });
  assert.equal(selfTest.ok, false);
  assert.equal(selfTest.error, 'model-not-local-only');
  const selection = markLocalRuntimeAsChatRuntime({ runtimeName: 'Ollama', endpoint: 'http://127.0.0.1:11434', model: 'gpt-oss:120b-cloud' });
  assert.equal(selection.ok, false);
  assert.equal(selection.error, 'model-not-local-only');
});

test('W233 accepts an Ollama generate self-test reply that matches the neutral sentinel', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    assert.match(String(url), /127\.0\.0\.1:11434\/api\/generate$/);
    assert.equal(options.method, 'POST');
    const body = JSON.parse(String(options.body || '{}'));
    assert.equal(body.model, 'phi4-mini:gpu');
    return new Response(JSON.stringify({ response: 'EON LIVE OK' }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const selfTest = await runLocalRuntimeSelfTest({ runtimeName: 'Ollama', endpoint: 'http://127.0.0.1:11434', model: 'phi4-mini:gpu' });
    assert.equal(selfTest.ok, true);
    assert.equal(selfTest.reply, 'EON LIVE OK');
    assert.equal(selfTest.status?.ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('W233 gives EONBOT a truthful local-AI setup route with explicit download approval', () => {
  const action = detectEonbotCommandHubAction('scan installed local models for me');
  assert.equal(action?.id, 'open-local-ai');
  const plan = buildEonbotCommandHubPlan('which local model should I use?');
  assert.equal(plan.route, '/local-ai#eonbot-local-ai-setup');
  assert.equal(plan.commandReceipt.execution, 'prepared-user-tap');
  assert.match(plan.truthNote, /download stay visible and user-approved/i);
  assert.match(plan.truthNote, /does not install or download it for you/i);
});

test('W233 has a local-only 3D evidence record and a performance classification', () => {
  const storage = new MemoryStorage();
  const result = saveCity3dLocalProof({
    summary: { quality: 'balanced', averageFrameMs: 18, p95FrameMs: 28, estimatedFps: 55, elapsedMs: 12_000, resolutionScale: 1, worldId: 'city', districtCount: 7 },
    device: { webgl2: true, memoryGb: 16, cores: 8, recommendedQuality: 'high' }
  }, { storage, now: Date.UTC(2026, 5, 25) });
  assert.equal(result.ok, true);
  assert.equal(readCity3dLocalProofs({ storage }).length, 1);
  assert.equal(result.report.classification.state, 'stable');
  assert.match(buildCity3dLocalProofExport(result.report), /does not contain chat text/i);
  assert.equal(assessCity3dPerformance({ averageFrameMs: 60, p95FrameMs: 90, elapsedMs: 12_000 }, CITY_3D_QUALITY_PRESETS.balanced).state, 'unsafe');
});

test('W233 wires quality governor, local proof UI, and update-safe backup without remote telemetry', () => {
  const renderer = read('assets/js/city/eon-city-3d-renderer.js');
  const station = read('assets/js/eon-city-3d-station.js');
  const localPage = read('assets/js/local-ai/local-ai-page.js');
  const runtime = read('assets/js/local-ai/local-runtime-status.js');
  const localExport = read('assets/js/local-first/eon-local-encrypted-export.js');
  const survival = read('assets/js/utils/update-safe-user-data.js');
  assert.match(renderer, /resolutionScale/);
  assert.match(renderer, /onTelemetry/);
  assert.match(renderer, /addDistrictLandmark/);
  assert.match(station, /Save local evidence/);
  assert.match(station, /Nothing is sent to EONAPP or Cloudflare/i);
  assert.match(localPage, /Scan installed models/);
  assert.match(localPage, /Copy pull command/);
  assert.match(runtime, /isDeviceLocalRuntimeEndpoint/);
  assert.match(runtime, /isLocalOnlyModelTag/);
  assert.match(runtime, /cloud-backed model tags are not available/i);
  assert.doesNotMatch(runtime, /ollama\.com\/api\/tags/);
  assert.match(localExport, /eon:city:3d:local-proof:v1/);
  assert.match(survival, /eon:city:3d:local-proof:v1/);
});
