#!/usr/bin/env node
/** W534 source gate — a current entrypoint, deterministic historical index, and physical retirement of stale runnable P2P diagnostics. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W534_HISTORICAL_DOCUMENTATION_CONTRACT,
  W534_HISTORICAL_DOCUMENTATION_SCHEMA,
  validateW534HistoricalDocumentationContract
} from '../config/w534-historical-documentation-contract.mjs';
import { buildW534HistoricalDocumentIndex } from './w534-historical-document-index.mjs';
import { W519_QUARANTINED_SOURCE_PATHS, W519_QUARANTINE_ROOT } from '../config/w519-legacy-transport-quarantine-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (root, relative) => fs.existsSync(path.join(root, relative));

export function inspectW534HistoricalDocumentation({ root = ROOT } = {}) {
  const issues = [...validateW534HistoricalDocumentationContract()];
  const contract = W534_HISTORICAL_DOCUMENTATION_CONTRACT;
  for (const relative of [...contract.currentEntrypoints, contract.generatedIndex]) if (!exists(root, relative)) issues.push(`missing-current-or-index:${relative}`);
  const rootReadme = exists(root, 'README.md') ? read(root, 'README.md') : '';
  const currentStart = exists(root, 'CURRENT_PRODUCT_START_HERE.md') ? read(root, 'CURRENT_PRODUCT_START_HERE.md') : '';
  const w524 = exists(root, '00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md') ? read(root, '00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md') : '';
  const index = exists(root, contract.generatedIndex) ? read(root, contract.generatedIndex) : '';
  if (!rootReadme.includes('CURRENT_PRODUCT_START_HERE.md')) issues.push('root-readme-does-not-point-current');
  for (const phrase of ['canonical daily app origin', 'Portable Workspace Capsule', 'Google Login is identity-only', 'EON.HUB is a separately packaged']) if (!currentStart.includes(phrase)) issues.push(`current-start-truth-missing:${phrase}`);
  if (!/^# Historical W524/m.test(w524) || !w524.includes('Historical only')) issues.push('w524-stale-entrypoint-not-marked-historical');
  if (index !== buildW534HistoricalDocumentIndex({ root })) issues.push('historical-index-stale');
  const retired = contract.retiredRunnableDiagnostic;
  if (exists(root, retired)) issues.push(`retired-runnable-diagnostic-still-active:${retired}`);
  if (!W519_QUARANTINED_SOURCE_PATHS.includes(retired)) issues.push('retired-runnable-diagnostic-not-in-w519-inventory');
  if (!exists(root, path.posix.join(W519_QUARANTINE_ROOT, retired))) issues.push('retired-runnable-diagnostic-not-physically-quarantined');
  const packageJson = JSON.parse(read(root, 'package.json'));
  for (const [name, command] of Object.entries(packageJson.scripts || {})) {
    if (/(?:NEXT_CHAT|CANONICAL_HANDOVER|CURRENT_HANDOFF)/.test(String(command))) issues.push(`package-script-historical-handoff-dependency:${name}`);
  }
  return Object.freeze({
    wave: 'W534', schema: W534_HISTORICAL_DOCUMENTATION_SCHEMA, sourceOnly: true,
    currentEntrypoint: 'CURRENT_PRODUCT_START_HERE.md', historicalIndex: contract.generatedIndex,
    retiredRunnableDiagnostic: retired, ok: issues.length === 0, issues: Object.freeze(issues.sort())
  });
}

function main() {
  const result = inspectW534HistoricalDocumentation();
  const output = path.join(ROOT, 'tmp', 'w534-historical-documentation-gate.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) throw new Error(`W534 historical documentation gate failed:\n${result.issues.map((item) => `- ${item}`).join('\n')}`);
  console.log('W534 historical documentation gate passed. Historical provenance is indexed; stale P2P runnable diagnostic is physically quarantined.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
