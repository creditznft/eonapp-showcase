#!/usr/bin/env node
/**
 * Freeze one W719 candidate and complete Pages root. This script never deploys.
 * It reuses the established W641 candidate and W660L Pages-root authorities.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluateW718OwnerScorecard } from '../config/w718-independent-certification-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidateRoot = path.join(root, 'artifacts/w719-release-candidate');
const pagesRoot = path.join(root, 'artifacts/w719-pages-root');
const exactReceiptPath = path.join(root, 'reports/institutional/w718-exact-certification-receipt.json');
const scorecardPath = path.join(root, 'config/w718-owner-scorecard.json');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
function fail(message) { console.error(`[W719-freeze] FAIL ${message}`); process.exit(1); }
function run(script, args = []) {
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) fail(`${script} exited ${result.status}`);
}
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, out);
    else if (entry.isFile()) out.push(absolute);
  }
  return out;
}
function digestTree(dir) {
  const hash = crypto.createHash('sha256');
  const files = walk(dir).sort((a, b) => path.relative(dir, a).localeCompare(path.relative(dir, b)));
  for (const file of files) {
    const relative = path.relative(dir, file).replaceAll(path.sep, '/');
    hash.update(relative); hash.update('\0'); hash.update(fs.readFileSync(file)); hash.update('\0');
  }
  return { digest: hash.digest('hex'), fileCount: files.length };
}
if (!fs.existsSync(exactReceiptPath)) fail('W718 exact certification receipt is missing.');
const exact = readJson(exactReceiptPath);
if (exact.ok !== true) fail('W718 exact certification receipt is not a PASS.');
const score = evaluateW718OwnerScorecard(readJson(scorecardPath));
if (!score.ok) fail('W718 owner scorecard is not accepted.');
run('scripts/w641-build-release-candidate.mjs', ['--output', candidateRoot]);
run('scripts/w660l-stage-pages-deploy-root.mjs', ['--candidate', candidateRoot, '--output', pagesRoot]);
const candidateProvenance = readJson(path.join(candidateRoot, 'candidate-provenance.json'));
const pages = digestTree(pagesRoot);
const receipt = {
  schema: 'eonapp.w719.frozen-release-candidate-receipt.v1', wave: 'W719',
  frozenAt: new Date().toISOString(), sourceCommit: candidateProvenance.commitSha,
  candidateDigest: candidateProvenance.candidateDigest,
  pagesRootDigest: pages.digest, pagesRootFileCount: pages.fileCount,
  exactW718Receipt: true, ownerScore: score.weightedScore,
  previewDeployed: false, productionDeployed: false,
  rebuildAllowed: false, automaticDeployment: false
};
fs.writeFileSync(path.join(candidateRoot, 'W719_FREEZE_RECEIPT.json'), `${JSON.stringify(receipt, null, 2)}\n`);
fs.writeFileSync(path.join(pagesRoot, 'W719_PAGES_ROOT_SHA256.txt'), `${pages.digest}  .\n`);
console.log(JSON.stringify({ ok: true, candidateRoot, pagesRoot, ...receipt }, null, 2));
