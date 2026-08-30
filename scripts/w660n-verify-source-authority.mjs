#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'W660N_R2_CONTROLLED_REBUILD_MANIFEST_2026-07-21.json');
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const normalizeRelativePath = (value) => value.replaceAll('\\', '/').normalize('NFC');
const utf8Compare = (left, right) => Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));

function enumeratePayload(directory, excludedAuthority) {
  const records = [];
  const symlinks = [];
  const caseFoldPaths = new Map();
  const caseCollisions = [];
  function walk(current, relative = '') {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const rel = normalizeRelativePath(relative ? `${relative}/${entry.name}` : entry.name);
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      if (entry.name.startsWith('.env')) continue;
      if (excludedAuthority.has(rel)) continue;
      const folded = rel.toLocaleLowerCase('en-US');
      const prior = caseFoldPaths.get(folded);
      if (prior && prior !== rel) caseCollisions.push([prior, rel]);
      else caseFoldPaths.set(folded, rel);
      const absolute = path.join(current, entry.name);
      if (entry.isSymbolicLink()) {
        symlinks.push(rel);
        continue;
      }
      if (entry.isDirectory()) walk(absolute, rel);
      else if (entry.isFile()) {
        const data = fs.readFileSync(absolute);
        records.push({ path: rel, bytes: data.length, sha256: sha256(data) });
      }
    }
  }
  walk(directory);
  records.sort((a, b) => utf8Compare(a.path, b.path));
  return { records, symlinks, caseCollisions };
}

function canonicalTreeSha(records) {
  const hash = crypto.createHash('sha256');
  for (const entry of records) hash.update(`${entry.path}\0${entry.bytes}\0${entry.sha256}\n`, 'utf8');
  return hash.digest('hex');
}

function leafSetSha(records) {
  const leaves = records.map((entry) => crypto.createHash('sha256')
    .update(`${entry.path}\0${entry.bytes}\0${entry.sha256}`, 'utf8')
    .digest());
  leaves.sort(Buffer.compare);
  const hash = crypto.createHash('sha256');
  for (const leaf of leaves) hash.update(leaf);
  return hash.digest('hex');
}

if (!fs.existsSync(manifestPath)) throw new Error(`W660N-R2 manifest missing: ${manifestPath}`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const ledgerPath = path.join(root, manifest.authority.ledger.path);
if (!fs.existsSync(ledgerPath)) throw new Error(`W660N-R2 ledger missing: ${ledgerPath}`);
const ledgerBytes = fs.readFileSync(ledgerPath);
const ledger = JSON.parse(ledgerBytes.toString('utf8'));
const excludedAuthority = new Set(manifest.payload.excludesAuthorityFiles.map(normalizeRelativePath));
const { records: actual, symlinks, caseCollisions } = enumeratePayload(root, excludedAuthority);
const expected = [...ledger.files].sort((a, b) => utf8Compare(a.path, b.path));

const actualByPath = new Map(actual.map((entry) => [entry.path, entry]));
const expectedByPath = new Map(expected.map((entry) => [entry.path, entry]));
const missing = expected.filter((entry) => !actualByPath.has(entry.path)).map((entry) => entry.path);
const added = actual.filter((entry) => !expectedByPath.has(entry.path)).map((entry) => entry.path);
const changed = [];
for (const entry of expected) {
  const found = actualByPath.get(entry.path);
  if (!found) continue;
  if (found.bytes !== entry.bytes || found.sha256 !== entry.sha256) {
    changed.push({
      path: entry.path,
      expectedBytes: entry.bytes,
      actualBytes: found.bytes,
      expectedSha256: entry.sha256,
      actualSha256: found.sha256
    });
  }
}

const payload = {
  fileCount: actual.length,
  bytes: actual.reduce((sum, entry) => sum + entry.bytes, 0),
  canonicalTreeSha256: canonicalTreeSha(actual),
  leafSetSha256: leafSetSha(actual)
};
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
add('manifest-schema', manifest.schema === 'eonapp.w660n-r2.controlled-rebuild-manifest.v3', manifest.schema || 'missing');
add('authority-revision', manifest.authorityRevision === 'W660N-R2', manifest.authorityRevision || 'missing');
add('algorithm-id', manifest.payload.algorithm === 'sha256-path-null-bytes-null-filehash-lf:utf8-byte-sort:v3-windows-case-safe', manifest.payload.algorithm || 'missing');
add('ledger-schema', ledger.schema === 'eonapp.w660n-r2.full-file-ledger.v2', ledger.schema || 'missing');
add('ledger-sha256', sha256(ledgerBytes) === manifest.authority.ledger.sha256, sha256(ledgerBytes));
add('ledger-record-count', expected.length === manifest.payload.fileCount, `${expected.length}/${manifest.payload.fileCount}`);
add('no-symlinks-or-case-collisions', symlinks.length === 0 && caseCollisions.length === 0, `symlinks=${symlinks.length}; caseCollisions=${caseCollisions.length}`);
add('exact-file-ledger', missing.length === 0 && added.length === 0 && changed.length === 0, `missing=${missing.length}; added=${added.length}; changed=${changed.length}`);
add('payload-file-count', payload.fileCount === manifest.payload.fileCount, `${payload.fileCount}/${manifest.payload.fileCount}`);
add('payload-bytes', payload.bytes === manifest.payload.bytes, `${payload.bytes}/${manifest.payload.bytes}`);
add('payload-canonical-tree-sha256', payload.canonicalTreeSha256 === manifest.payload.canonicalTreeSha256, payload.canonicalTreeSha256);
add('payload-leaf-set-sha256', payload.leafSetSha256 === manifest.payload.leafSetSha256, payload.leafSetSha256);

for (const authorityFile of manifest.authority.files || []) {
  const absolute = path.join(root, authorityFile.path);
  const exists = fs.existsSync(absolute) && fs.statSync(absolute).isFile();
  add(`authority-file:${authorityFile.path}`, exists, exists ? '' : 'missing');
  if (!exists) continue;
  const data = fs.readFileSync(absolute);
  add(`authority-bytes:${authorityFile.path}`, data.length === authorityFile.bytes, `${data.length}/${authorityFile.bytes}`);
  add(`authority-sha256:${authorityFile.path}`, sha256(data) === authorityFile.sha256, sha256(data));
}

for (const expectedFile of manifest.changedFiles || []) {
  const actualFile = actualByPath.get(expectedFile.path);
  add(`changed-file:${expectedFile.path}`, Boolean(actualFile), actualFile ? '' : 'missing');
  if (!actualFile) continue;
  add(`changed-bytes:${expectedFile.path}`, actualFile.bytes === expectedFile.bytes, `${actualFile.bytes}/${expectedFile.bytes}`);
  add(`changed-sha256:${expectedFile.path}`, actualFile.sha256 === expectedFile.sha256, actualFile.sha256);
}

const provenancePath = path.join(root, 'dist', 'build-provenance.json');
if (fs.existsSync(provenancePath)) {
  const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
  add('distribution-file-count', provenance?.distribution?.fileCount === manifest.distribution.fileCount, `${provenance?.distribution?.fileCount}/${manifest.distribution.fileCount}`);
  add('distribution-bytes', provenance?.distribution?.bytes === manifest.distribution.bytes, `${provenance?.distribution?.bytes}/${manifest.distribution.bytes}`);
  add('distribution-sha256', provenance?.distribution?.sha256 === manifest.distribution.sha256, provenance?.distribution?.sha256 || 'missing');
} else {
  add('distribution-provenance', false, 'dist/build-provenance.json missing');
}

const failed = checks.filter((entry) => !entry.pass);
const report = {
  schema: 'eonapp.w660n-r2.source-authority-verifier.v3',
  ok: failed.length === 0,
  root,
  payload,
  passed: checks.length - failed.length,
  total: checks.length,
  diagnostics: {
    missing: missing.slice(0, 50),
    added: added.slice(0, 50),
    changed: changed.slice(0, 50),
    symlinks: symlinks.slice(0, 50),
    caseCollisions: caseCollisions.slice(0, 50),
    truncated: missing.length > 50 || added.length > 50 || changed.length > 50 || symlinks.length > 50 || caseCollisions.length > 50
  },
  checks
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
