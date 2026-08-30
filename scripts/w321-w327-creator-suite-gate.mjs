#!/usr/bin/env node
/** W321–W327 — verifies Creator Suite 2 remains a Workspace-local draft/export surface. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W321_W327_CREATOR_SUITE_CONTRACT } from '../config/w321-w327-creator-suite-contract.mjs';
import { getCreatorSuite2Truth } from '../assets/js/creator-suite-2/creator-suite-2-engine.js';
import { getCreatorSuite2SessionTruth } from '../assets/js/creator-suite-2/creator-suite-2-workspace.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW321W327CreatorSuiteGate(root = ROOT) {
  const errors = [];
  const contract = W321_W327_CREATOR_SUITE_CONTRACT;
  for (const relative of contract.requiredFiles) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) { errors.push(`Required Creator Suite file missing: ${relative}`); continue; }
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of contract.forbiddenPatterns) if (source.toLowerCase().includes(pattern.toLowerCase())) errors.push(`Creator Suite source contains forbidden capability ${pattern}: ${relative}`);
  }
  const workspace = fs.readFileSync(path.join(root, 'assets/js/eon-workspace-pages.js'), 'utf8');
  if (!workspace.includes("from './creator-suite-2/creator-suite-2-workspace.js'")) errors.push('Workspace does not host Creator Suite 2.');
  if (/href=["']\/(?:creator-studio|video-editor|music-studio|workbench)/i.test(workspace)) errors.push('Workspace restored a retired Creator/Video/Music/Workbench route.');
  const truth = getCreatorSuite2Truth();
  const session = getCreatorSuite2SessionTruth();
  const expected = contract.expectedTruth;
  for (const [key, value] of Object.entries(expected)) {
    const target = key in truth ? truth[key] : session[key];
    if (target !== value) errors.push(`Creator Suite truth mismatch for ${key}.`);
  }
  return Object.freeze({ schema: contract.schema, ok: errors.length === 0, errors, truth, session });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW321W327CreatorSuiteGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W321–W327 Creator Suite gate passed: Workspace-local briefs and user-triggered exports only.');
  process.exitCode = report.ok ? 0 : 1;
}
