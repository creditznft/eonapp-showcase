#!/usr/bin/env node
/**
 * W592 — operator-owned local AI benchmark.
 *
 * This harness is deliberately outside EONAPP runtime. It validates local
 * loopback services on the owner's computer without downloading models,
 * exposing prompts or secrets, or pretending that image/video adapters are
 * already connected to EON City. Text probing is explicit. Image and video
 * workflow submission are doubly opt-in and write only metadata receipts.
 */
import crypto from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const has = (name) => args.includes(name);
const valueOf = (name, fallback = '') => {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : fallback;
};
const asInt = (value, fallback, min, max) => Math.min(max, Math.max(min, Math.floor(Number(value) || fallback)));
const enabled = process.env.EON_LOCAL_AI_BENCHMARK === '1' && has('--confirm-local');
const strict = process.env.EON_LOCAL_AI_BENCHMARK_STRICT === '1' || has('--strict');
const tag = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = path.resolve(valueOf('--out-dir', path.join(ROOT, 'reports', 'w592-local-ai-benchmark', tag)));
const textTimeoutMs = asInt(valueOf('--timeout-ms', process.env.EON_LOCAL_AI_TIMEOUT_MS || '90000'), 90000, 5_000, 300_000);
const pollTimeoutMs = asInt(valueOf('--media-timeout-ms', process.env.EON_LOCAL_MEDIA_TIMEOUT_MS || '600000'), 600000, 30_000, 1_800_000);
const maxModels = asInt(valueOf('--max-models', process.env.EON_LOCAL_AI_MODEL_LIMIT || '1'), 1, 1, 2);
const ollamaBase = String(process.env.EON_LOCAL_OLLAMA_URL || process.env.EON_OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const comfyBase = String(process.env.EON_LOCAL_COMFY_URL || 'http://127.0.0.1:8188').replace(/\/$/, '');
const requestImage = process.env.EON_LOCAL_IMAGE_BENCHMARK === '1' && process.env.EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD === '1';
const requestVideo = process.env.EON_LOCAL_VIDEO_BENCHMARK === '1' && process.env.EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD === '1';
const configuredModels = String(process.env.EON_LOCAL_AI_MODELS || '').split(',').map((item) => item.trim()).filter(Boolean);

const sha256 = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');
const safeStatus = (status) => ['PASS', 'FAIL', 'BLOCKED', 'SKIP', 'WARN'].includes(status) ? status : 'FAIL';

function isLoopback(value) {
  try {
    const url = new URL(value);
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function writeReceipt(name, value) {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function gpuSnapshot() {
  const result = spawnSync('nvidia-smi', ['--query-gpu=name,memory.total,memory.free,driver_version', '--format=csv,noheader,nounits'], { encoding: 'utf8', timeout: 5_000, windowsHide: true });
  if (result.status !== 0 || !String(result.stdout || '').trim()) {
    return Object.freeze({ detected: false, reason: result.error?.code || 'nvidia-smi-unavailable', gpuCount: 0, maximumFreeMemoryMb: 0 });
  }
  const gpus = String(result.stdout).trim().split(/\r?\n/).map((line) => {
    const [name, total, free, driver] = line.split(',').map((entry) => entry.trim());
    return Object.freeze({ name: name || 'NVIDIA GPU', totalMemoryMb: Number(total) || 0, freeMemoryMb: Number(free) || 0, driverVersion: driver || null });
  });
  return Object.freeze({ detected: true, gpuCount: gpus.length, maximumFreeMemoryMb: Math.max(0, ...gpus.map((gpu) => gpu.freeMemoryMb)), gpus });
}

function machineSnapshot() {
  const gpu = gpuSnapshot();
  return Object.freeze({
    os: process.platform,
    architecture: process.arch,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    cpuLogicalCores: os.cpus().length,
    gpu,
    imageEligibility: gpu.maximumFreeMemoryMb >= 3500 ? 'may-run-with-explicit-workflow' : 'blocked-insufficient-free-vram',
    videoEligibility: gpu.maximumFreeMemoryMb >= 7500 ? 'may-run-with-explicit-workflow' : 'blocked-insufficient-free-vram'
  });
}

async function fetchJson(url, options = {}, timeoutMs = textTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, redirect: 'error' });
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return Object.freeze({ ok: response.ok, status: response.status, json, textLength: text.length });
  } catch (error) {
    return Object.freeze({ ok: false, status: 0, json: null, error: String(error?.name || error?.message || 'network-error'), textLength: 0 });
  } finally {
    clearTimeout(timer);
  }
}

function modelsFromTags(body) {
  return Array.isArray(body?.models) ? body.models.map((entry) => String(entry?.name || '').trim()).filter(Boolean) : [];
}

async function runTextModel(modelId) {
  const token = `EON_W592_${crypto.randomBytes(8).toString('hex')}`;
  const started = Date.now();
  const response = await fetchJson(`${ollamaBase}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: `Reply with exactly this token and nothing else: ${token}` }],
      stream: false,
      options: { temperature: 0, num_predict: 32 }
    })
  });
  const output = String(response.json?.message?.content || '');
  const tokenSeen = output.includes(token);
  return Object.freeze({
    modelId,
    status: safeStatus(response.ok && tokenSeen ? 'PASS' : response.status === 0 ? 'BLOCKED' : 'FAIL'),
    httpStatus: response.status || null,
    durationMs: Date.now() - started,
    responseCharacters: output.length,
    responseDigest: sha256(output).slice(0, 24),
    tokenSeen,
    rawPromptPersisted: false,
    rawResponsePersisted: false
  });
}

function cloneAndReplacePrompt(value, prompt) {
  if (Array.isArray(value)) return value.map((entry) => cloneAndReplacePrompt(entry, prompt));
  if (!value || typeof value !== 'object') return value === '{{EON_W592_PROMPT}}' ? prompt : value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneAndReplacePrompt(entry, prompt)]));
}

function mediaWorkflowPath(kind) {
  const env = kind === 'image' ? 'EON_LOCAL_IMAGE_WORKFLOW_FILE' : 'EON_LOCAL_VIDEO_WORKFLOW_FILE';
  const candidate = String(process.env[env] || '').trim();
  return candidate && existsSync(candidate) ? candidate : '';
}

async function runMediaWorkflow(kind, machine) {
  const requiredVram = kind === 'image' ? 3500 : 7500;
  const requested = kind === 'image' ? requestImage : requestVideo;
  if (!requested) return Object.freeze({ kind, status: 'SKIP', reason: 'explicit-media-opt-in-not-supplied', requested: false });
  if (!isLoopback(comfyBase)) return Object.freeze({ kind, status: 'BLOCKED', reason: 'non-loopback-comfy-endpoint', requested: true });
  if (machine.gpu.maximumFreeMemoryMb < requiredVram) return Object.freeze({ kind, status: 'BLOCKED', reason: 'insufficient-free-vram', requested: true, requiredFreeMemoryMb: requiredVram, observedFreeMemoryMb: machine.gpu.maximumFreeMemoryMb });
  const file = mediaWorkflowPath(kind);
  if (!file) return Object.freeze({ kind, status: 'BLOCKED', reason: 'workflow-file-not-provided-or-missing', requested: true, requiredEnv: kind === 'image' ? 'EON_LOCAL_IMAGE_WORKFLOW_FILE' : 'EON_LOCAL_VIDEO_WORKFLOW_FILE' });
  let workflow;
  try { workflow = JSON.parse(readFileSync(file, 'utf8')); } catch { return Object.freeze({ kind, status: 'BLOCKED', reason: 'workflow-json-invalid', requested: true }); }
  const prompt = kind === 'image'
    ? 'A single cobalt glass cube on a neutral studio surface, no text, no people.'
    : 'A cobalt glass cube rotates slowly on a neutral studio surface, no text, no people.';
  const submitted = cloneAndReplacePrompt(workflow, prompt);
  const started = Date.now();
  const clientId = `eonapp-w592-${crypto.randomBytes(8).toString('hex')}`;
  const submit = await fetchJson(`${comfyBase}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: submitted, client_id: clientId }) }, textTimeoutMs);
  const promptId = String(submit.json?.prompt_id || '');
  if (!submit.ok || !promptId) return Object.freeze({ kind, status: submit.status === 0 ? 'BLOCKED' : 'FAIL', reason: 'workflow-not-accepted', httpStatus: submit.status || null, durationMs: Date.now() - started, rawWorkflowPersisted: false, rawPromptPersisted: false, outputCopied: false });
  const deadline = Date.now() + pollTimeoutMs;
  let history = null;
  while (Date.now() < deadline) {
    const poll = await fetchJson(`${comfyBase}/history/${encodeURIComponent(promptId)}`, {}, Math.min(textTimeoutMs, 30_000));
    history = poll.json;
    if (poll.ok && history && Object.keys(history).length) break;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  const record = history?.[promptId] || null;
  const status = record?.status?.status || '';
  const completed = /success/i.test(status) || Boolean(record?.outputs && Object.keys(record.outputs).length);
  return Object.freeze({
    kind,
    status: completed ? 'PASS' : 'WARN',
    reason: completed ? null : 'workflow-history-not-complete-before-timeout',
    durationMs: Date.now() - started,
    promptAccepted: true,
    rawWorkflowPersisted: false,
    rawPromptPersisted: false,
    rawResponsePersisted: false,
    outputCopied: false,
    workflowPathPersisted: false
  });
}

async function main() {
  const machine = machineSnapshot();
  const common = Object.freeze({
    schema: 'eonapp.w592.local-ai-benchmark.v1',
    generatedAt: new Date().toISOString(),
    enabled,
    confirmationRequired: true,
    loopbackOnly: true,
    downloadsPerformed: false,
    modelMutationPerformed: false,
    rawPromptPersisted: false,
    rawResponsePersisted: false,
    secretValuesPersisted: false,
    mediaAdaptersClaimedActive: false,
    machine
  });
  if (!enabled) {
    const blocked = Object.freeze({ ...common, status: 'BLOCKED', reason: 'Set EON_LOCAL_AI_BENCHMARK=1 and pass --confirm-local. No local endpoint was contacted.', text: [], media: [] });
    writeReceipt('SUMMARY.json', blocked);
    console.log(JSON.stringify(blocked, null, 2));
    return;
  }
  if (!isLoopback(ollamaBase)) {
    const blocked = Object.freeze({ ...common, status: 'BLOCKED', reason: 'EON_LOCAL_OLLAMA_URL must be a loopback URL.', text: [], media: [] });
    writeReceipt('SUMMARY.json', blocked);
    console.log(JSON.stringify(blocked, null, 2));
    if (strict) process.exitCode = 1;
    return;
  }
  const tags = await fetchJson(`${ollamaBase}/api/tags`, { headers: { Accept: 'application/json' } }, Math.min(textTimeoutMs, 20_000));
  const discovered = modelsFromTags(tags.json);
  const candidateModels = (configuredModels.length ? configuredModels : discovered).filter((model, index, list) => list.indexOf(model) === index).slice(0, maxModels);
  const text = [];
  if (!tags.ok) text.push(Object.freeze({ status: tags.status === 0 ? 'BLOCKED' : 'FAIL', modelId: null, reason: 'ollama-tags-unavailable', httpStatus: tags.status || null }));
  else if (!candidateModels.length) text.push(Object.freeze({ status: 'BLOCKED', modelId: null, reason: 'no-configured-or-discovered-ollama-model' }));
  else for (const modelId of candidateModels) text.push(await runTextModel(modelId));
  const media = [await runMediaWorkflow('image', machine), await runMediaWorkflow('video', machine)];
  const failures = [...text, ...media].filter((entry) => entry.status === 'FAIL');
  const blockedRequired = [requestImage, requestVideo].some(Boolean) && media.some((entry) => ['BLOCKED', 'FAIL'].includes(entry.status));
  const status = failures.length ? 'FAIL' : text.some((entry) => entry.status === 'PASS') ? 'PASS' : 'BLOCKED';
  const receipt = Object.freeze({
    ...common,
    status,
    ollama: { endpoint: ollamaBase, endpointIsLoopback: true, tagsHttpStatus: tags.status || null, discoveredModelCount: discovered.length, selectedModelCount: candidateModels.length },
    text: Object.freeze(text),
    media: Object.freeze(media),
    mediaExecution: { imageRequested: requestImage, videoRequested: requestVideo, highLoadOptIn: process.env.EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD === '1' },
    strictExitWouldFail: Boolean(failures.length || (strict && blockedRequired))
  });
  writeReceipt('SUMMARY.json', receipt);
  console.log(JSON.stringify(receipt, null, 2));
  if (strict && (failures.length || blockedRequired || !text.some((entry) => entry.status === 'PASS'))) process.exitCode = 1;
}

main().catch((error) => {
  const fatal = Object.freeze({ schema: 'eonapp.w592.local-ai-benchmark.v1', status: 'FAIL', reason: String(error?.stack || error), secretValuesPersisted: false });
  try { writeReceipt('SUMMARY.json', fatal); } catch { /* ignore secondary write failure */ }
  console.error(JSON.stringify(fatal, null, 2));
  process.exitCode = 1;
});
