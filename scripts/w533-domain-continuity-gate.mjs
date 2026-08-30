#!/usr/bin/env node
/** W533 source gate — an explicit Capsule is the only cross-origin move path. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W533_DOMAIN_CONTINUITY_CONTRACT,
  validateW533DomainContinuityContract
} from '../config/w533-domain-continuity-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED = Object.freeze([
  'capsule.html',
  'assets/js/local-first/eon-domain-continuity.js',
  'assets/js/local-first/eon-workspace-capsule-page.js',
  'config/w533-domain-continuity-contract.mjs'
]);
const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW533DomainContinuity({ root = ROOT } = {}) {
  const issues = [...validateW533DomainContinuityContract()];
  for (const relative of REQUIRED) if (!fs.existsSync(path.join(root, relative))) issues.push(`missing:${relative}`);
  if (issues.length) return Object.freeze({ wave: 'W533', sourceOnly: true, ok: false, issues: Object.freeze(issues.sort()) });
  const capsule = read(root, 'capsule.html');
  const helper = read(root, 'assets/js/local-first/eon-domain-continuity.js');
  const page = read(root, 'assets/js/local-first/eon-workspace-capsule-page.js');
  const requirements = [
    [capsule, 'data-eon-capsule-card="advanced-recovery"', 'move-assistant-card-missing'],
    [capsule, 'Advanced recovery', 'move-assistant-disclosure-missing'],
    [capsule, 'No website can open this browser’s local workspace on your behalf.', 'cross-origin-truth-missing'],
    [capsule, 'EON.HUB Trust &amp; Rescue page', 'trust-hub-blocked-choice-missing'],
    [read(root, 'config/w533-domain-continuity-contract.mjs'), 'explicit-user-held-encrypted-capsule-only', 'manual-file-transfer-contract-missing'],
    [helper, 'trustHubCanReadBrowserData: false', 'trust-hub-storage-boundary-missing'],
    [helper, 'automaticSyncActive: false', 'automatic-sync-boundary-missing'],
    [helper, 'automaticRestoreActive: false', 'automatic-restore-boundary-missing'],
    [page, 'createDomainContinuityMovePlan', 'move-plan-renderer-missing'],
    [page, 'eon-capsule-show-move-plan', 'move-plan-control-missing']
  ];
  for (const [source, needle, issue] of requirements) if (!source.includes(needle)) issues.push(issue);
  const liveTransferPatterns = [
    [/\bfetch\s*\(/, 'fetch'],
    [/\blocalStorage\s*(?:\.|\[)/, 'localStorage-operation'],
    [/\bindexedDB\s*(?:\.|\[)/, 'indexeddb-operation'],
    [/\bpostMessage\s*\(/, 'postMessage'],
    [/\bwindow\.open\s*\(/, 'window-open']
  ];
  for (const [pattern, label] of liveTransferPatterns) if (pattern.test(helper)) issues.push(`continuity-helper-has-live-transfer:${label}`);
  return Object.freeze({
    wave: 'W533', schema: W533_DOMAIN_CONTINUITY_CONTRACT.schema, sourceOnly: true,
    automaticSyncActive: false, automaticRestoreActive: false, trustHubCanReadBrowserData: false,
    ok: issues.length === 0, checked: REQUIRED, issues: Object.freeze(issues.sort())
  });
}

function main() {
  const result = inspectW533DomainContinuity();
  const output = path.join(ROOT, 'tmp', 'w533-domain-continuity-gate.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) throw new Error(`W533 domain continuity source gate failed:\n${result.issues.map((item) => `- ${item}`).join('\n')}`);
  console.log('W533 domain continuity source gate passed. Explicit user-held Capsule only; no cross-origin storage, automatic sync, upload, or restore.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
