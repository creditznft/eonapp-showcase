#!/usr/bin/env node
/** W301 — source-only guard for the remote history remediation handoff. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNBOOK = 'docs/W301_GIT_HISTORY_SECRET_REMEDIATION_RUNBOOK_2026-06-26.md';
const STATUS = 'CURRENT_HANDOFF_2026-06-26/DEPLOY_AND_CI_STATUS.md';

function read(root, relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }

export function runW301HistorySecretRemediationGate(root = ROOT) {
  const errors = [];
  const runbook = read(root, RUNBOOK);
  const status = read(root, STATUS);
  for (const required of [
    'Rotate any credential',
    'git filter-repo',
    'node scripts/secret-scan.mjs --mode=ci',
    'No force-push',
    'Preview remains prohibited'
  ]) {
    if (!runbook.includes(required)) errors.push(`W301 runbook is missing: ${required}`);
  }
  if (!/Reachable Git history still contains secret-shaped values/i.test(status)) errors.push('W301 must retain the recorded remote history blocker.');
  if (/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bAIza[A-Za-z0-9_-]{30,}\b/.test(runbook)) errors.push('W301 runbook contains a secret-shaped literal.');
  return { schema: 'eonapp.w301.history-remediation-gate.v1', ok: errors.length === 0, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW301HistorySecretRemediationGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W301 history-secret remediation handoff gate passed: remote rewrite remains explicitly owner-gated.');
  process.exitCode = report.ok ? 0 : 1;
}
