#!/usr/bin/env node
/** W527 optional loopback-only local AI discovery. No prompt, model download, mutation, or secret output. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { W527_ENV_LOCAL_AI_CONTRACT, W527_LOCAL_AI_PROVIDERS } from '../config/w527-env-local-ai-contract.mjs';
import { isLoopbackEndpoint } from './w527-env-safety.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const intValue = (flag, fallback) => {
  const index = args.indexOf(flag);
  const value = index >= 0 ? Number(args[index + 1]) : Number.NaN;
  return Number.isFinite(value) ? Math.max(500, Math.floor(value)) : fallback;
};
const timeoutMs = intValue('--timeout-ms', 3500);
const probeLoopback = has('--probe-loopback');
const sha256 = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

function configuredBase(provider, inputEnv = process.env) {
  const configured = provider.env.find((name) => String(inputEnv[name] || '').trim());
  return { base: configured ? String(inputEnv[configured]).trim() : provider.fallback, configuredVariable: configured || null };
}

function endpointFor(provider, inputEnv) {
  const { base, configuredVariable } = configuredBase(provider, inputEnv);
  const normalized = String(base || '').replace(/\/$/, '');
  return Object.freeze({ url: `${normalized}${provider.path}`, configuredVariable });
}

function modelIds(provider, body) {
  if (provider.kind === 'ollama') return Array.isArray(body?.models) ? body.models.map((entry) => String(entry?.name || '')).filter(Boolean) : [];
  return Array.isArray(body?.data) ? body.data.map((entry) => String(entry?.id || '')).filter(Boolean) : [];
}

function statusForError(error) {
  const message = String(error?.name || error?.message || '').toLowerCase();
  if (message.includes('abort') || message.includes('timeout')) return 'not-detected';
  if (message.includes('connect') || message.includes('refused') || message.includes('network')) return 'not-detected';
  return 'probe-error';
}

export async function collectW527LocalAiEvidence({ inputEnv = process.env, allowProbe = probeLoopback, fetchImpl = globalThis.fetch, recordedAt = new Date().toISOString() } = {}) {
  const rows = [];
  for (const provider of W527_LOCAL_AI_PROVIDERS) {
    const endpoint = endpointFor(provider, inputEnv);
    if (!isLoopbackEndpoint(endpoint.url)) {
      rows.push(Object.freeze({ id: provider.id, status: 'blocked-invalid-endpoint', configuredVariable: endpoint.configuredVariable, modelCount: 0, modelListDigest: null }));
      continue;
    }
    if (!allowProbe) {
      rows.push(Object.freeze({ id: provider.id, status: 'not-detected', reason: 'loopback-probe-not-requested', configuredVariable: endpoint.configuredVariable, modelCount: 0, modelListDigest: null }));
      continue;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(endpoint.url, { method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal, redirect: 'error' });
      if (!response.ok) {
        rows.push(Object.freeze({ id: provider.id, status: response.status === 404 ? 'not-detected' : 'probe-error', httpStatus: response.status, configuredVariable: endpoint.configuredVariable, modelCount: 0, modelListDigest: null }));
        continue;
      }
      const body = await response.json();
      const models = modelIds(provider, body).sort();
      rows.push(Object.freeze({ id: provider.id, status: 'detected-models', configuredVariable: endpoint.configuredVariable, modelCount: models.length, modelListDigest: sha256(models.join('\n')).slice(0, 24) }));
    } catch (error) {
      rows.push(Object.freeze({ id: provider.id, status: statusForError(error), configuredVariable: endpoint.configuredVariable, modelCount: 0, modelListDigest: null }));
    } finally {
      clearTimeout(timer);
    }
  }
  return Object.freeze({
    schema: W527_ENV_LOCAL_AI_CONTRACT.schema,
    wave: 'W527',
    sourceOnly: !allowProbe,
    recordedAt,
    probeLoopbackRequested: allowProbe,
    noPromptSent: true,
    noModelMutation: true,
    noSecretValues: true,
    results: Object.freeze(rows)
  });
}

async function main() {
  const receipt = await collectW527LocalAiEvidence();
  const output = path.join(ROOT, 'tmp', 'w527-local-ai-evidence.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error?.stack || error); process.exitCode = 1; });
}
