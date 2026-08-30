#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDirectory = path.join(root, 'EVIDENCE', 'W476_A6');

function runAudit(label, args) {
  const result = spawnSync('npm', ['audit', '--json', ...args], { cwd: root, encoding: 'utf8', shell: false });
  const stdout = String(result.stdout || '');
  let parsed = null;
  try { parsed = JSON.parse(stdout); } catch {}
  return Object.freeze({ label, exitCode: typeof result.status === 'number' ? result.status : 1, signal: result.signal || null, stderr: String(result.stderr || ''), parsed, raw: stdout });
}

function summary(run) {
  const vulnerabilities = run.parsed?.metadata?.vulnerabilities || null;
  return Object.freeze({
    command: run.label,
    exitCode: run.exitCode,
    parsed: Boolean(run.parsed),
    vulnerabilities,
    error: run.parsed?.error || (run.parsed ? null : 'audit-json-unavailable')
  });
}

function write(name, value) {
  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(path.join(evidenceDirectory, name), `${JSON.stringify(value, null, 2)}\n`);
}

const full = runAudit('npm audit --json', []);
const production = runAudit('npm audit --omit=dev --json', ['--omit=dev']);
write('NPM_AUDIT_FULL.json', full.parsed || { error: 'audit-json-unavailable', stderr: full.stderr.slice(0, 1000) });
write('NPM_AUDIT_PRODUCTION.json', production.parsed || { error: 'audit-json-unavailable', stderr: production.stderr.slice(0, 1000) });
const report = Object.freeze({
  schema: 'eonapp.w476.a6.npm-audit.v1',
  generatedAt: new Date().toISOString(),
  full: summary(full),
  production: summary(production),
  sourceOnly: false,
  note: 'This records the raw npm audit result for the checked package-lock. It is not browser, deployment, device or release approval evidence.'
});
write('NPM_AUDIT_SUMMARY.json', report);

const failedToRun = !full.parsed || !production.parsed;
const productionTotal = Number(report.production.vulnerabilities?.total || 0);
const fullCritical = Number(report.full.vulnerabilities?.critical || 0);
const fullHigh = Number(report.full.vulnerabilities?.high || 0);
if (failedToRun || productionTotal > 0 || fullCritical > 0 || fullHigh > 0) {
  process.stderr.write(`W476-A6 audit requires follow-up: full=${JSON.stringify(report.full.vulnerabilities)} production=${JSON.stringify(report.production.vulnerabilities)}\n`);
  process.exit(1);
}
process.stdout.write(`W476-A6 raw npm audit recorded: full=${JSON.stringify(report.full.vulnerabilities)} production=${JSON.stringify(report.production.vulnerabilities)}\n`);
