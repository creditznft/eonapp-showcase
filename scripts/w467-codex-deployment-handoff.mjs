#!/usr/bin/env node
/** W467 — generate a compact, redaction-safe deployment handoff template. */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT } from '../config/w467-codex-deployment-handoff-contract.mjs';
import { getEonW466ProductionReleaseTruth } from '../assets/js/release/eon-w466-production-release-evidence.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const freeze = (value) => Object.freeze(value);

function normalizeOutput(args = process.argv.slice(2)) {
  const at = args.indexOf('--out');
  if (at === -1 || !args[at + 1]) return path.join(root, 'artifacts', 'w467-codex-deployment-handoff-template.json');
  const value = path.resolve(root, args[at + 1]);
  if (!value.startsWith(`${root}${path.sep}`)) throw new Error('W467 output must remain inside the source workspace.');
  return value;
}

export function buildW467CodexDeploymentHandoff() {
  const releaseTruth = getEonW466ProductionReleaseTruth();
  return freeze({
    schema: W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.schema,
    wave: W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.wave,
    sourceOnly: true,
    canonicalRoutes: W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.canonicalRoutes,
    localValidationCommands: W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.requiredLocalCommands,
    postDeployReadOnlyProofCommands: W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.requiredPostDeployCommands,
    reportRows: W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.requiredEvidenceRows,
    excludedFromSourceBundle: W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.excludedFromSourceBundle,
    defaultReleaseTruth: releaseTruth,
    instructions: freeze([
      'Merge only the clean source root into the canonical repository branch.',
      'Do not deploy from copied dist output or attach source-bundle artifacts to production.',
      'Report source validation, deployment, read-only edge proof, browser/device proof, Sync, legacy quarantine, commercial status, and human GO/NO-GO separately.',
      'Keep commerce disabled unless merchant approval and the entire commercial lifecycle evidence matrix are complete.',
      'Never place secrets, cookies, sessions, customer data, D1 rows, provider payloads, browser profiles, or raw device evidence in the source bundle.'
    ]),
    deploymentPerformedByScript: false,
    sourceBundleApprovesRelease: false,
    sourceBundleApprovesCommerce: false
  });
}

export function writeW467CodexDeploymentHandoff({ out = normalizeOutput() } = {}) {
  const payload = buildW467CodexDeploymentHandoff();
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
  return freeze({ out, payload });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = writeW467CodexDeploymentHandoff();
  process.stdout.write(`W467 Codex deployment handoff template written: ${path.relative(root, result.out)}\n`);
  process.stdout.write('The template is source-only. Deployment and release approval remain externally blocked.\n');
}
