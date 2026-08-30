#!/usr/bin/env node
/** Build one immutable W641 candidate directory for exact Preview -> production promotion. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildW638EvidenceIndex, loadW638EvidenceBoard } from './lib/w638-evidence-index.mjs';
import { createW639ReleaseFreezeManifest } from './lib/w639-release-freeze.mjs';
import { buildW641PredeployReceiptDigest } from './lib/w641-predeploy-receipt-identity.mjs';
import {
  buildCandidateFileRows,
  buildCandidatePayloadDigest,
  sha256,
  stableDigest,
  validateCandidateProvenance
} from './lib/w641-release-governance.mjs';
import { W641_CANDIDATE_MANIFEST_SCHEMA, W641_CANDIDATE_PROVENANCE_SCHEMA } from '../config/w641-release-governance-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const key = process.argv[index];
  if (!key.startsWith('--')) continue;
  const value = process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[++index] : 'true';
  args.set(key.slice(2), value);
}
const output = path.resolve(root, args.get('output') || 'artifacts/w641-release-candidate');
const dist = path.join(root, 'dist');
const receiptPath = path.join(root, 'reports/w624d-codex-predeploy/receipt.json');

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function copyTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}
function gitValue(argsList, fallback = '') {
  try { return execFileSync('git', argsList, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return fallback; }
}
function sqlDigest() {
  const rows = [];
  const walk = (directory) => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && entry.name.endsWith('.sql')) {
        const relative = path.relative(root, absolute).replaceAll('\\', '/');
        rows.push({ path: relative, sha256: sha256(fs.readFileSync(absolute)) });
      }
    }
  };
  walk(path.join(root, 'migrations'));
  walk(path.join(root, 'platform-backend/migrations'));
  return stableDigest(rows);
}

if (!fs.existsSync(receiptPath)) throw new Error('Permanent predeploy receipt is missing. Run npm run verify:codex-predeploy first.');
const predeploy = readJson(receiptPath);
if (predeploy.ok !== true || predeploy.stepCount < 82 || !/^[a-f0-9]{64}$/.test(predeploy?.sourceFingerprint?.digest || '')) throw new Error('Permanent predeploy receipt is not a PASS receipt.');
if (!fs.existsSync(dist)) throw new Error('dist is missing. The permanent predeploy runner must build before candidate packaging.');

const commitSha = String(args.get('commit') || process.env.GITHUB_SHA || gitValue(['rev-parse', 'HEAD'])).toLowerCase();
if (!/^[a-f0-9]{40}$/.test(commitSha)) throw new Error('A 40-character commit SHA is required.');
const generatedAt = String(args.get('generated-at') || process.env.EON_CANDIDATE_GENERATED_AT || gitValue(['show', '-s', '--format=%cI', commitSha]) || new Date(0).toISOString());
if (!Number.isFinite(Date.parse(generatedAt))) throw new Error('Candidate generatedAt is invalid.');

const evidenceIndex = buildW638EvidenceIndex(loadW638EvidenceBoard(root), { root, generatedAt });
const freezeManifest = createW639ReleaseFreezeManifest({ root, generatedAt });
fs.rmSync(output, { recursive: true, force: true });
copyTree(dist, path.join(output, 'dist'));
fs.mkdirSync(path.join(output, 'dist/release'), { recursive: true });

const payloadRows = buildCandidateFileRows(path.join(output, 'dist'), { excludeReleaseMetadata: true });
const distPayloadDigest = buildCandidatePayloadDigest(payloadRows);
const core = {
  schema: W641_CANDIDATE_PROVENANCE_SCHEMA,
  wave: 'W641',
  commitSha,
  sourceFingerprint: predeploy.sourceFingerprint.digest,
  predeployReceiptDigest: buildW641PredeployReceiptDigest(predeploy),
  packageLockDigest: sha256(fs.readFileSync(path.join(root, 'package-lock.json'))),
  routeContractDigest: sha256(fs.readFileSync(path.join(root, 'config/route-contract.mjs'))),
  migrationDigest: sqlDigest(),
  w638IndexDigest: evidenceIndex.indexDigest,
  w639FreezeDigest: freezeManifest.freezeDigest,
  distPayloadDigest,
  fileCount: payloadRows.length,
  generatedAt
};
const candidateDigest = stableDigest(core);
const provenance = { ...core, candidateDigest };
const validation = validateCandidateProvenance(provenance);
if (!validation.ok) throw new Error(`Candidate provenance failed: ${validation.issues.join(', ')}`);
const manifest = {
  schema: W641_CANDIDATE_MANIFEST_SCHEMA,
  wave: 'W641',
  candidateDigest,
  distPayloadDigest,
  fileCount: payloadRows.length,
  files: payloadRows
};

for (const relative of ['dist/release/candidate-provenance.json', 'candidate-provenance.json']) {
  fs.writeFileSync(path.join(output, relative), `${JSON.stringify(provenance, null, 2)}\n`);
}
for (const relative of ['dist/release/candidate-manifest.json', 'candidate-manifest.json']) {
  fs.writeFileSync(path.join(output, relative), `${JSON.stringify(manifest, null, 2)}\n`);
}
fs.copyFileSync(receiptPath, path.join(output, 'predeploy-receipt.json'));
fs.writeFileSync(path.join(output, 'w638-evidence-index.json'), `${JSON.stringify(evidenceIndex, null, 2)}\n`);
fs.writeFileSync(path.join(output, 'w639-freeze-manifest.json'), `${JSON.stringify(freezeManifest, null, 2)}\n`);
fs.writeFileSync(path.join(output, 'CANDIDATE_SHA256.txt'), `${candidateDigest}  candidate-provenance.json\n`);
console.log(JSON.stringify({ ok: true, output, candidateDigest, distPayloadDigest, fileCount: payloadRows.length, commitSha }, null, 2));
