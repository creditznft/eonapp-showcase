#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateEonCityW694FinalCandidate } from '../assets/js/city/w694/eon-city-w694-final-candidate.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));
const exists = (relative) => fs.existsSync(path.join(root, relative));

function currentCandidateFiles() {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
    .split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
    .filter((entry) => entry !== 'config/w694-source-reconciliation-manifest.json' && !entry.startsWith('node_modules/') && !entry.startsWith('dist/') && !entry.startsWith('reports/') && !entry.startsWith('test-results/') && !entry.startsWith('playwright-report/'))
    .sort();
}

export function inspectW694FinalLocalCandidate() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const required = ['config/w694-final-local-candidate.json','config/w694-source-reconciliation-manifest.json','assets/js/city/w694/eon-city-w694-final-candidate.js','scripts/generate-w694-source-reconciliation.mjs','tests/unit/w694-final-local-candidate.test.mjs'];
  add('required-files', required.every(exists), 'W694 candidate, manifest, generator, gate authority and tests exist');
  const candidate = readJson('config/w694-final-local-candidate.json');
  const source = readJson('config/w694-source-reconciliation-manifest.json');
  const maintained = readJson('config/w624d-current-unit-test-manifest.json');
  const validation = validateEonCityW694FinalCandidate(candidate, source, maintained);
  add('candidate-valid', validation.ok, validation.errors.join(', ') || 'final local candidate validates');
  const listed = source.files.map((entry) => entry.path).sort();
  const current = currentCandidateFiles().filter((entry) => exists(entry));
  add('complete-file-list', JSON.stringify(listed) === JSON.stringify(current), `${listed.length}/${current.length} source files reconciled`);
  let hashesOk = true;
  const aggregate = crypto.createHash('sha256');
  let totalBytes = 0;
  for (const entry of source.files) {
    if (!exists(entry.path)) { hashesOk = false; break; }
    const body = fs.readFileSync(path.join(root, entry.path));
    const hash = crypto.createHash('sha256').update(body).digest('hex');
    if (body.length !== entry.bytes || hash !== entry.sha256) { hashesOk = false; break; }
    totalBytes += body.length;
    aggregate.update(`${entry.path}\0${entry.bytes}\0${entry.sha256}\n`);
  }
  add('exact-hashes', hashesOk && totalBytes === source.totalBytes && aggregate.digest('hex') === source.aggregateSha256, 'all listed source bytes and aggregate hash match');
  const runner = read('scripts/run-current-unit-suite.mjs');
  add('maintained-alignment', maintained.currentWave === 'W694' && maintained.testFileCount === maintained.testFiles.length && maintained.testFiles.every((entry) => runner.includes(`'${entry}'`)), `${maintained.testFileCount} maintained tests align with the permanent runner`);
  const social = source.files.filter((entry) => /^assets\/media\/social\/eonapp-.*-social-v1\.png$/.test(entry.path));
  add('social-cards-frozen', social.length === 12, 'all 12 canonical social-preview PNGs are frozen in final source');
  add('owner-proof-pending', candidate.evidence.headedBrowser === 'pending' && candidate.evidence.ownerDevice === 'pending' && candidate.releaseBoundaries.productionReleaseAllowed === false, 'headed-browser and owner-device proof remain release blockers');
  return Object.freeze({ schema: 'eonapp.w694.final-local-candidate-gate.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: Object.freeze(checks), sourceFileCount: source.sourceFileCount, aggregateSha256: source.aggregateSha256 });
}

const report = inspectW694FinalLocalCandidate();
for (const check of report.checks) console.log(`[W694] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W694] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total} · files=${report.sourceFileCount}`);
if (!report.ok) process.exitCode = 1;
