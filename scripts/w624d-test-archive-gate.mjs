#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W624D_ARCHIVED_CONTRACT_ASSERTIONS } from '../config/w624d-current-contract-alignment-contract.mjs';
import { CURRENT_UNIT_TESTS } from './run-current-unit-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const sha256 = (relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
const freeze = (value) => Object.freeze(value);

export function inspectW624dTestArchive() {
  const manifestPath = 'archive/tests/superseded-exact-copy/W624D_2026-07-11/MANIFEST.json';
  const currentManifestPath = 'config/w624d-current-unit-test-manifest.json';
  const packageJson = JSON.parse(read('package.json'));
  const manifest = JSON.parse(read(manifestPath));
  const currentManifest = JSON.parse(read(currentManifestPath));
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const expectedByFile = new Map();
  for (const entry of W624D_ARCHIVED_CONTRACT_ASSERTIONS) {
    if (!expectedByFile.has(entry.file)) expectedByFile.set(entry.file, []);
    expectedByFile.get(entry.file).push(entry);
  }
  const manifestFiles = new Map(manifest.files.map((entry) => [entry.sourceFile, entry]));
  const manifestCurrentTests = new Set(currentManifest.testFiles);
  const runtimeCurrentTests = new Set(CURRENT_UNIT_TESTS);

  add('archive-is-non-certifying', manifest.certifying === false && manifest.releaseGate === false && manifest.classification === 'superseded-exact-copy', 'archive explicitly cannot certify a release');
  add('archive-counts-match', manifest.fileCount === expectedByFile.size && manifest.assertionCount === W624D_ARCHIVED_CONTRACT_ASSERTIONS.length, `${manifest.fileCount} files / ${manifest.assertionCount} assertions`);
  add('archive-readme-warning', /NON-CERTIFYING ARCHIVE/.test(read('archive/tests/superseded-exact-copy/W624D_2026-07-11/README.md')) && /NOT A RELEASE GATE/.test(read('archive/tests/superseded-exact-copy/W624D_2026-07-11/README.md')), 'archive warning is prominent');
  add('archive-files-complete', [...expectedByFile].every(([sourceFile, entries]) => {
    const row = manifestFiles.get(sourceFile);
    return row && row.assertionCount === entries.length && exists(row.archiveFile) && sha256(row.archiveFile) === row.sha256;
  }), 'every archived source copy exists and matches its SHA-256');
  add('archive-originals-untouched', [...expectedByFile].every(([sourceFile, entries]) => {
    const row = manifestFiles.get(sourceFile);
    const archived = read(row.archiveFile);
    return !/W624D archived contract snapshot/.test(archived) && entries.every((entry) => archived.includes(`test('${entry.name}'`) || archived.includes(`test(\"${entry.name}\"`));
  }), 'archive copies retain original test declarations without current skip markers');
  add('current-sources-explicitly-skipped', W624D_ARCHIVED_CONTRACT_ASSERTIONS.every((entry) => {
    const source = read(entry.file);
    return source.includes('W624D archived contract snapshot: superseded by current canonical alignment coverage.') && (source.includes(`test.skip('${entry.name}'`) || source.includes(`test.skip(\"${entry.name}\"`));
  }), 'current source has an explicit skip for every superseded assertion');
  add('current-manifest-matches-runner', currentManifest.testFileCount === CURRENT_UNIT_TESTS.length && currentManifest.testFiles.length === CURRENT_UNIT_TESTS.length && [...runtimeCurrentTests].every((entry) => manifestCurrentTests.has(entry)) && [...manifestCurrentTests].every((entry) => runtimeCurrentTests.has(entry)), `${CURRENT_UNIT_TESTS.length} maintained test files`);
  add('stable-codex-command-present', packageJson.scripts?.['verify:codex-predeploy'] === 'npm run verify:w624d-codex-predeploy', 'stable Codex alias resolves to the current wave predeploy gate');
  add('diagnostic-command-non-certifying', /run-archived-legacy-diagnostic/.test(packageJson.scripts?.['test:unit:archived-diagnostic'] || '') && /NOT CERTIFIED/.test(read('scripts/run-archived-legacy-diagnostic.mjs')), 'archive diagnostic remains informational');
  add('archive-not-in-current-runner', manifest.files.every((entry) => !runtimeCurrentTests.has(entry.archiveFile)), 'archive files cannot enter the maintained unit runner');

  return freeze({ schema: 'eonapp.w624d-test-archive-report.2026-07-11.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, archiveFiles: manifest.fileCount, archivedAssertions: manifest.assertionCount, currentTestFiles: CURRENT_UNIT_TESTS.length, checks: freeze(checks) });
}

const report = inspectW624dTestArchive();
for (const check of report.checks) console.log(`[W624D-ARCHIVE] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W624D-ARCHIVE] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}; ${report.archiveFiles} files / ${report.archivedAssertions} assertions; ${report.currentTestFiles} maintained test files.`);
if (!report.ok) process.exitCode = 1;
