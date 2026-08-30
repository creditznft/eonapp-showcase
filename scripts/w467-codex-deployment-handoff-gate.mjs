#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT, validateW467CodexDeploymentHandoffContract } from '../config/w467-codex-deployment-handoff-contract.mjs';
import { buildW467CodexDeploymentHandoff } from './w467-codex-deployment-handoff.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');

export function inspectW467CodexDeploymentHandoff() {
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    assert.equal(Boolean(value), true, `${id}: ${detail}`);
  };
  const scriptSource = read('scripts/w467-codex-deployment-handoff.mjs');
  const prompt = read('CODEX_W466_W467_DEPLOYMENT_AND_EXTERNAL_PROOF_PROMPT_2026-07-01.md');
  const handoff = buildW467CodexDeploymentHandoff();

  check('required-files', [
    'config/w467-codex-deployment-handoff-contract.mjs',
    'scripts/w467-codex-deployment-handoff.mjs',
    'scripts/w467-codex-deployment-handoff-gate.mjs',
    'tests/unit/w467-codex-deployment-handoff.test.mjs',
    'CODEX_W466_W467_DEPLOYMENT_AND_EXTERNAL_PROOF_PROMPT_2026-07-01.md'
  ].every((file) => existsSync(path.join(root, file))), 'W467 handoff contract, generator, gate, test and operator prompt exist');
  check('contract-valid', validateW467CodexDeploymentHandoffContract().length === 0, 'W467 contract remains valid and source-only');
  check('canonical-route-boundary', handoff.canonicalRoutes.join(',') === '/,/eoncity,/insights', 'handoff preserves canonical routes');
  check('separate-evidence-rows', handoff.reportRows.length === W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.requiredEvidenceRows.length && handoff.reportRows.includes('humanGoNoGo'), 'handoff requires separated evidence reporting');
  check('safe-post-deploy-probes', handoff.postDeployReadOnlyProofCommands.every((command) => !/cookie|token|secret|wrangler secret|--env/.test(command)), 'post-deploy commands remain read-only and secret-free');
  check('no-deployment-script', handoff.deploymentPerformedByScript === false && handoff.sourceBundleApprovesRelease === false && handoff.sourceBundleApprovesCommerce === false, 'generator cannot deploy or approve release/commercial activation');
  check('prompt-boundaries', /Do not inspect or print secret values/.test(prompt) && /Report each evidence row separately/.test(prompt), 'operator prompt retains redaction and evidence-separation rules');
  check('workspace-bound-output', /output must remain inside the source workspace/i.test(scriptSource), 'generator cannot write outside the workspace');

  return Object.freeze({
    schema: 'eon.release.codex-deployment-handoff-gate.w467.v1',
    wave: 'W467',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    limitations: Object.freeze(['This gate validates a deployment handoff generator only. It is not a deployment, edge probe, D1 binding, device proof, merchant approval, checkout, payment lifecycle, or human release approval.'])
  });
}

export function runW467CodexDeploymentHandoffGate({ writeArtifact = true } = {}) {
  const result = inspectW467CodexDeploymentHandoff();
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w467-codex-deployment-handoff-gate');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW467CodexDeploymentHandoffGate();
  process.stdout.write(`W467 Codex deployment handoff gate passed (${result.checkCount}/${result.checkCount}). Deployment remains an external action.\n`);
}
