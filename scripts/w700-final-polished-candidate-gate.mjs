#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateEonAppW700FinalPolishedCandidate } from '../assets/js/city/w700/eonapp-w700-final-polished-candidate.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));
const exists = (relative) => fs.existsSync(path.join(root, relative));
function currentFiles() {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
    .split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
    .filter((entry) => entry !== 'config/w700-source-reconciliation-manifest.json' && !entry.startsWith('node_modules/') && !entry.startsWith('dist/') && !entry.startsWith('reports/') && !entry.startsWith('test-results/') && !entry.startsWith('playwright-report/'))
    .filter((entry) => exists(entry)).sort();
}
export function inspectW700FinalPolishedCandidate() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const required = ['config/w700-final-polished-local-candidate.json','config/w700-source-reconciliation-manifest.json','config/w700-owner-recording-matrix.json','assets/js/city/w700/eonapp-w700-final-polished-candidate.js','scripts/generate-w700-source-reconciliation.mjs','tests/unit/w700-final-polished-candidate.test.mjs'];
  add('required-files', required.every(exists), 'W700 candidate, manifest, matrix, generator, gate authority and tests exist');
  const candidate = readJson('config/w700-final-polished-local-candidate.json');
  const source = readJson('config/w700-source-reconciliation-manifest.json');
  const maintained = readJson('config/w624d-current-unit-test-manifest.json');
  const owner = readJson('config/w700-owner-recording-matrix.json');
  const validation = validateEonAppW700FinalPolishedCandidate(candidate, source, maintained, owner);
  add('candidate-valid', validation.ok, validation.errors.join(', ') || 'final polished local candidate validates');
  const listed = source.files.map((entry) => entry.path).sort();
  const current = currentFiles();
  add('complete-file-list', JSON.stringify(listed) === JSON.stringify(current), `${listed.length}/${current.length} source files reconciled`);
  let hashesOk = true; let totalBytes = 0; const aggregate = crypto.createHash('sha256');
  for (const entry of source.files) {
    if (!exists(entry.path)) { hashesOk = false; break; }
    const body = fs.readFileSync(path.join(root, entry.path));
    const hash = crypto.createHash('sha256').update(body).digest('hex');
    if (body.length !== entry.bytes || hash !== entry.sha256) { hashesOk = false; break; }
    totalBytes += body.length; aggregate.update(`${entry.path}\0${entry.bytes}\0${entry.sha256}\n`);
  }
  add('exact-hashes', hashesOk && totalBytes === source.totalBytes && aggregate.digest('hex') === source.aggregateSha256, 'all current candidate source bytes and aggregate hash match');
  const runner = read('scripts/run-current-unit-suite.mjs');
  add('maintained-alignment', maintained.currentWave === 'W700' && maintained.testFileCount === maintained.testFiles.length && maintained.testFiles.every((entry) => runner.includes(`'${entry}'`)), `${maintained.testFileCount} maintained tests align with the permanent runner`);
  add('historical-test-archive', exists('archive/w700-superseded-w694-exact-candidate/tests/unit/w694-final-local-candidate.archived.mjs') && !maintained.testFiles.some((entry) => entry.includes('archived')), 'superseded W694 exact-tree test is explicit and non-certifying');
  const social = source.files.filter((entry) => /^assets\/media\/social\/eonapp-.*-social-v1\.png$/.test(entry.path));
  add('social-cards-frozen', social.length === 12, 'all 12 canonical social-preview PNGs are frozen');
  add('owner-proof-pending', owner.recordings.length >= 20 && owner.recordings.every((entry) => entry.status === 'pending') && candidate.releaseBoundaries.productionReleaseAllowed === false, 'expanded headed-browser owner proof remains a release blocker');
  return Object.freeze({ schema: 'eonapp.w700.final-polished-candidate-gate.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: Object.freeze(checks), sourceFileCount: source.sourceFileCount, aggregateSha256: source.aggregateSha256 });
}
const report = inspectW700FinalPolishedCandidate();
for (const check of report.checks) console.log(`[W700-FINAL] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W700-FINAL] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total} · files=${report.sourceFileCount}`);
if (!report.ok) process.exitCode = 1;
