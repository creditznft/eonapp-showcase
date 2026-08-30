#!/usr/bin/env node
/** W527 source gate — redacted, loopback-only preflight tooling must not become a mutating model manager. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W527_ENV_LOCAL_AI_CONTRACT, validateW527EnvLocalAiContract } from '../config/w527-env-local-ai-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED = Object.freeze(['config/w527-env-local-ai-contract.mjs', 'scripts/w527-env-safety.mjs', 'scripts/w527-local-ai-evidence.mjs']);
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

export function inspectW527EnvLocalAi() {
  const issues = [...validateW527EnvLocalAiContract()];
  for (const relative of REQUIRED) if (!fs.existsSync(path.join(ROOT, relative))) issues.push(`missing:${relative}`);
  if (issues.length) return Object.freeze({ wave: 'W527', sourceOnly: true, ok: false, issues: Object.freeze(issues.sort()) });
  const safety = read('scripts/w527-env-safety.mjs');
  const probe = read('scripts/w527-local-ai-evidence.mjs');
  for (const [source, needle, issue] of [
    [safety, 'valuesRead: false', 'env-values-read-boundary-missing'],
    [safety, 'valuesPrinted: false', 'env-values-print-boundary-missing'],
    [probe, "has('--probe-loopback')", 'explicit-loopback-flag-missing'],
    [probe, "method: 'GET'", 'probe-not-read-only'],
    [probe, 'noPromptSent: true', 'no-prompt-boundary-missing'],
    [probe, 'noModelMutation: true', 'no-model-mutation-boundary-missing'],
    [probe, 'status: \'not-detected\'', 'not-detected-fallback-missing']
  ]) if (!source.includes(needle)) issues.push(issue);
  for (const marker of ["method: 'POST'", "method: 'PUT'", "method: 'PATCH'", "method: 'DELETE'", 'child_process', 'spawn(', 'exec(']) if (probe.includes(marker)) issues.push(`local-ai-probe-has-mutation-surface:${marker}`);
  return Object.freeze({
    wave: 'W527', schema: W527_ENV_LOCAL_AI_CONTRACT.schema, sourceOnly: true,
    activeProbeRequiresUserFlag: true, noSecretValues: true, noModelMutation: true,
    ok: issues.length === 0, issues: Object.freeze(issues.sort())
  });
}

function main() {
  const result = inspectW527EnvLocalAi();
  const output = path.join(ROOT, 'tmp', 'w527-env-local-ai-gate.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) throw new Error(`W527 environment/local AI gate failed:\n${result.issues.map((entry) => `- ${entry}`).join('\n')}`);
  console.log('W527 environment/local AI gate passed. No secret receipt, no probe without an explicit loopback flag, and no model mutation surface.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
