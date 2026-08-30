#!/usr/bin/env node
/**
 * W605 explicit, loopback-only live output matrix.
 * Default state: BLOCKED without contacting any endpoint. It never downloads a
 * model, reads env.local, posts media, or persists raw prompts/model replies.
 */
import crypto from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { EON_AI_OUTPUT_TEST_MATRIX } from '../config/eon-ai-output-test-matrix.mjs';

const args = new Set(process.argv.slice(2));
const enabled = process.env.EON_W605_CONFIRM_LIVE === '1' && args.has('--confirm-live');
const allowMedia = process.env.EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD === '1' && args.has('--confirm-high-load');
const strict = args.has('--strict');
const root = process.cwd();
const outputDir = resolve(root, 'reports/w605-ai-output-matrix');
const ollamaBase = String(process.env.EON_LOCAL_OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const comfyBase = String(process.env.EON_LOCAL_COMFYUI_URL || 'http://127.0.0.1:8188').replace(/\/+$/, '');
const textModel = String(process.env.EON_W605_TEXT_MODEL || '').trim();
const timeoutMs = Math.max(8_000, Math.min(Number(process.env.EON_W605_TIMEOUT_MS || 90_000), 15 * 60_000));
const imageWorkflow = String(process.env.EON_LOCAL_IMAGE_WORKFLOW_FILE || '').trim();
const videoWorkflow = String(process.env.EON_LOCAL_VIDEO_WORKFLOW_FILE || '').trim();

function isLoopback(raw = '') {
  try {
    const parsed = new URL(raw);
    return ['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname.toLowerCase()) && ['http:', 'https:'].includes(parsed.protocol);
  } catch { return false; }
}
function redactDigest(value = '') { return crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 20); }
function writeReceipt(name, value) {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(resolve(outputDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
async function fetchJson(url, options = {}, timeout = timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* JSON not required */ }
    return { ok: response.ok, status: response.status, json, text };
  } catch (error) { return { ok: false, status: 0, json: null, text: '', error: String(error?.message || error) }; }
  finally { clearTimeout(timer); }
}
function cloneAndReplacePrompt(value, prompt) {
  if (typeof value === 'string') return value === '{{EON_W605_PROMPT}}' ? prompt : value;
  if (Array.isArray(value)) return value.map((entry) => cloneAndReplacePrompt(entry, prompt));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneAndReplacePrompt(entry, prompt)]));
}
function summarizeMediaOutputs(record = {}) {
  const records = Object.values(record?.outputs || {}).flatMap((node) => Object.values(node || {}).flatMap((entry) => Array.isArray(entry) ? entry : []));
  return records.map((entry) => ({ filename: String(entry?.filename || '').slice(0, 180), subfolder: String(entry?.subfolder || '').slice(0, 120), type: String(entry?.type || '').slice(0, 60) })).slice(0, 12);
}
async function runText() {
  if (!textModel) return { channel: 'text', status: 'BLOCKED', reason: 'EON_W605_TEXT_MODEL-not-set', rawPromptPersisted: false, rawReplyPersisted: false };
  if (!isLoopback(ollamaBase)) return { channel: 'text', status: 'BLOCKED', reason: 'non-loopback-ollama-endpoint', rawPromptPersisted: false, rawReplyPersisted: false };
  const prompt = 'In two bullets, explain EONAPP local AI truth: web research and private secrets.';
  const started = Date.now();
  const result = await fetchJson(`${ollamaBase}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: textModel, prompt, stream: false, options: { temperature: 0.2, num_predict: 180 } }) });
  const reply = String(result.json?.response || '');
  return {
    channel: 'text', status: result.ok && reply ? 'PASS' : (result.status ? 'FAIL' : 'BLOCKED'), reason: result.ok && reply ? null : 'ollama-text-output-unavailable', model: textModel, endpointIsLoopback: true, durationMs: Date.now() - started,
    responseChars: reply.length, responseDigest: reply ? redactDigest(reply) : null, promptDigest: redactDigest(prompt), rawPromptPersisted: false, rawReplyPersisted: false
  };
}
async function runMedia(kind) {
  const workflowPath = kind === 'image' ? imageWorkflow : videoWorkflow;
  if (!allowMedia) return { channel: kind, status: 'BLOCKED', reason: 'explicit-high-load-confirmation-not-supplied', rawPromptPersisted: false, rawWorkflowPersisted: false, outputCopied: false };
  if (!isLoopback(comfyBase)) return { channel: kind, status: 'BLOCKED', reason: 'non-loopback-comfy-endpoint', rawPromptPersisted: false, rawWorkflowPersisted: false, outputCopied: false };
  if (!workflowPath || !existsSync(workflowPath)) return { channel: kind, status: 'BLOCKED', reason: 'workflow-file-not-provided-or-missing', requiredEnv: kind === 'image' ? 'EON_LOCAL_IMAGE_WORKFLOW_FILE' : 'EON_LOCAL_VIDEO_WORKFLOW_FILE', rawPromptPersisted: false, rawWorkflowPersisted: false, outputCopied: false };
  let workflow; try { workflow = JSON.parse(readFileSync(workflowPath, 'utf8')); } catch { return { channel: kind, status: 'FAIL', reason: 'workflow-json-invalid', rawPromptPersisted: false, rawWorkflowPersisted: false, outputCopied: false }; }
  const prompt = kind === 'image'
    ? 'Cinematic wet graphite EON City command beacon, cyan and violet light, no text, no people, single subject.'
    : 'Cinematic slow dolly around a wet graphite EON City command beacon, cyan and violet light, no text, no people.';
  const clientId = `eonapp-w605-${crypto.randomBytes(7).toString('hex')}`;
  const started = Date.now();
  const submit = await fetchJson(`${comfyBase}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: cloneAndReplacePrompt(workflow, prompt), client_id: clientId }) });
  const promptId = String(submit.json?.prompt_id || '');
  if (!submit.ok || !promptId) return { channel: kind, status: submit.status ? 'FAIL' : 'BLOCKED', reason: 'comfy-workflow-not-accepted', endpointIsLoopback: true, durationMs: Date.now() - started, rawPromptPersisted: false, rawWorkflowPersisted: false, outputCopied: false };
  const deadline = Date.now() + timeoutMs;
  let record = null;
  while (Date.now() < deadline) {
    const poll = await fetchJson(`${comfyBase}/history/${encodeURIComponent(promptId)}`, {}, Math.min(30_000, timeoutMs));
    record = poll.json?.[promptId] || null;
    if (record?.outputs && Object.keys(record.outputs).length) break;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  const outputs = summarizeMediaOutputs(record || {});
  return {
    channel: kind, status: outputs.length ? 'PASS' : 'WARN', reason: outputs.length ? null : 'workflow-history-no-output-before-timeout', endpointIsLoopback: true, durationMs: Date.now() - started,
    promptDigest: redactDigest(prompt), workflowFileName: basename(workflowPath), outputMetadata: outputs, rawPromptPersisted: false, rawWorkflowPersisted: false, rawResponsePersisted: false, outputCopied: false, autoposted: false
  };
}
function inspectAuthorizedVideo() {
  const input = String(process.env.EON_W605_AUTHORIZED_CREATOR_OUTPUT || '').trim();
  if (!input) return { channel: 'creator-edit', status: 'BLOCKED', reason: 'authorized-output-path-not-provided', authorizationAssumed: false, mediaCopied: false, autoposted: false };
  if (!existsSync(input)) return { channel: 'creator-edit', status: 'FAIL', reason: 'authorized-output-path-missing', authorizationAssumed: true, mediaCopied: false, autoposted: false };
  try {
    const raw = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,width,height', '-of', 'json', input], { encoding: 'utf8', timeout: 15_000 });
    const info = JSON.parse(raw);
    return { channel: 'creator-edit', status: 'PASS', authorizationAssumed: true, outputFileName: basename(input), outputDigest: redactDigest(readFileSync(input)), metadata: info, mediaCopied: false, autoposted: false };
  } catch {
    return { channel: 'creator-edit', status: 'WARN', reason: 'ffprobe-unavailable-or-output-not-readable', authorizationAssumed: true, outputFileName: basename(input), mediaCopied: false, autoposted: false };
  }
}
async function main() {
  const base = { schema: 'eonapp.w605.live-ai-output-matrix.v1', generatedAt: new Date().toISOString(), explicitConfirmationRequired: true, liveEnabled: enabled, loopbackOnly: true, downloadsPerformed: false, modelMutationPerformed: false, rawPromptPersisted: false, rawModelReplyPersisted: false, outputCopied: false, automaticPosting: false, matrix: EON_AI_OUTPUT_TEST_MATRIX.map((row) => ({ id: row.id, channel: row.channel })) };
  if (!enabled) {
    const blocked = { ...base, status: 'BLOCKED', reason: 'Set EON_W605_CONFIRM_LIVE=1 and pass --confirm-live. No endpoint was contacted.', results: [] };
    writeReceipt('SUMMARY.json', blocked); console.log(JSON.stringify(blocked, null, 2)); return;
  }
  const results = [await runText(), await runMedia('image'), await runMedia('video'), inspectAuthorizedVideo()];
  const status = results.some((row) => row.status === 'FAIL') ? 'FAIL' : results.some((row) => row.status === 'PASS') ? 'PARTIAL' : 'BLOCKED';
  const receipt = { ...base, status, highLoadMediaEnabled: allowMedia, results };
  writeReceipt('SUMMARY.json', receipt); console.log(JSON.stringify(receipt, null, 2));
  if (strict && results.some((row) => ['BLOCKED', 'FAIL', 'WARN'].includes(row.status))) process.exitCode = 1;
}
main().catch((error) => { const fatal = { schema: 'eonapp.w605.live-ai-output-matrix.v1', status: 'FAIL', reason: String(error?.stack || error), rawPromptPersisted: false, rawModelReplyPersisted: false, outputCopied: false, automaticPosting: false }; try { writeReceipt('SUMMARY.json', fatal); } catch {} console.error(JSON.stringify(fatal, null, 2)); process.exitCode = 1; });
