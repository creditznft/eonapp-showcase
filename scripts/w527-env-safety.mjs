#!/usr/bin/env node
/** W527 redacted environment safety receipt. It never reads or prints .env.local values. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  W527_ENV_LOCAL_AI_CONTRACT,
  W527_LOCAL_AI_PROVIDERS,
  validateW527EnvLocalAiContract
} from '../config/w527-env-local-ai-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;
const sha256 = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

function configuredEnvName(provider, input = env) {
  return provider.env.find((name) => String(input[name] || '').trim()) || '';
}

export function isLoopbackEndpoint(value) {
  try {
    const url = new URL(String(value || ''));
    const hostname = url.hostname === '::1' ? '[::1]' : url.hostname;
    const allowed = new Set(['127.0.0.1', 'localhost', '[::1]']);
    return Boolean(url.protocol === 'http:' && allowed.has(hostname) && !url.username && !url.password && !url.search && !url.hash);
  } catch {
    return false;
  }
}

export function buildW527EnvSafetyReceipt({ root = ROOT, inputEnv = env, recordedAt = new Date().toISOString() } = {}) {
  const issues = [...validateW527EnvLocalAiContract()];
  const gitignore = fs.existsSync(path.join(root, '.gitignore')) ? fs.readFileSync(path.join(root, '.gitignore'), 'utf8') : '';
  const environmentFile = path.join(root, '.env.local');
  if (!gitignore.split(/\r?\n/).map((line) => line.trim()).includes('.env.local')) issues.push('gitignore-missing-env-local');
  const localRuntimes = W527_LOCAL_AI_PROVIDERS.map((provider) => {
    const name = configuredEnvName(provider, inputEnv);
    const endpoint = name ? String(inputEnv[name] || '').trim() : provider.fallback;
    return Object.freeze({
      id: provider.id,
      endpointSource: name ? 'configured-loopback' : 'default-loopback',
      configuredVariable: name || null,
      endpointValid: isLoopbackEndpoint(endpoint),
      endpointFingerprint: sha256(endpoint).slice(0, 16)
    });
  });
  if (localRuntimes.some((entry) => !entry.endpointValid)) issues.push('local-runtime-endpoint-not-loopback');
  return Object.freeze({
    schema: W527_ENV_LOCAL_AI_CONTRACT.schema,
    wave: 'W527',
    sourceOnly: true,
    recordedAt,
    environmentFile: Object.freeze({ present: fs.existsSync(environmentFile), ignoredByGitRule: !issues.includes('gitignore-missing-env-local'), valuesRead: false, valuesPrinted: false }),
    localRuntimes,
    safety: Object.freeze({ noNetworkProbe: true, noSecretValues: true, noModelMutation: true }),
    ok: issues.length === 0,
    issues: Object.freeze(issues.sort())
  });
}

function main() {
  const receipt = buildW527EnvSafetyReceipt();
  const output = path.join(ROOT, 'tmp', 'w527-env-safety-receipt.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  if (!receipt.ok) throw new Error(`W527 environment safety failed: ${receipt.issues.join(', ')}`);
  console.log(JSON.stringify({ ...receipt, localRuntimes: receipt.localRuntimes.map(({ id, endpointSource, configuredVariable, endpointValid }) => ({ id, endpointSource, configuredVariable, endpointValid })) }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
