import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'W660O_SOURCE_AUTHORITY_MANIFEST_2026-07-21.json');
const EXCLUDED_DIR_NAMES = new Set([
  'node_modules', '.git', '.wrangler', '.cache', 'playwright-report', 'test-results', 'coverage'
]);
const AUTHORITY_PATHS = new Set([
  'W660O_SOURCE_AUTHORITY_MANIFEST_2026-07-21.json',
  'scripts/w660o-verify-source-authority.mjs'
]);

function normalizeRelative(value) {
  return value.split(path.sep).join('/').replace(/^\.\//, '');
}

function utf8Compare(a, b) {
  return Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

function isExcluded(relativePath, dirent = null) {
  const normalized = normalizeRelative(relativePath);
  if (!normalized) return false;
  if (AUTHORITY_PATHS.has(normalized)) return true;
  const parts = normalized.split('/');
  if (parts.some((part) => EXCLUDED_DIR_NAMES.has(part))) return true;
  const base = parts.at(-1) || '';
  if (base === '.env' || base.startsWith('.env.')) return true;
  if (dirent?.isSymbolicLink()) return false;
  return false;
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

function collectFiles(directory = ROOT, relativeBase = '') {
  const files = [];
  const symlinks = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => utf8Compare(a.name, b.name));
  for (const entry of entries) {
    const relative = normalizeRelative(path.join(relativeBase, entry.name));
    if (isExcluded(relative, entry)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      symlinks.push(relative);
      continue;
    }
    if (entry.isDirectory()) {
      const child = collectFiles(absolute, relative);
      files.push(...child.files);
      symlinks.push(...child.symlinks);
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return { files, symlinks };
}

function canonicalLine(item) {
  return `${item.path}\0${item.size}\0${item.sha256}\n`;
}

function rootsFor(items) {
  const sorted = [...items].sort((a, b) => utf8Compare(a.path, b.path));
  const canonicalHash = crypto.createHash('sha256');
  const leafDigests = [];
  for (const item of sorted) {
    const line = Buffer.from(canonicalLine(item), 'utf8');
    canonicalHash.update(line);
    leafDigests.push(sha256Buffer(line));
  }
  leafDigests.sort(utf8Compare);
  const leafSetHash = crypto.createHash('sha256');
  for (const digest of leafDigests) leafSetHash.update(Buffer.from(`${digest}\n`, 'utf8'));
  return {
    canonicalTreeSha256: canonicalHash.digest('hex'),
    orderIndependentLeafSetSha256: leafSetHash.digest('hex')
  };
}

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('Missing W660O source authority manifest.');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const expected = new Map(manifest.files.map((item) => [item.path, item]));
const { files, symlinks } = collectFiles();
const actualItems = files.map((relativePath) => {
  const absolute = path.join(ROOT, ...relativePath.split('/'));
  const stat = fs.statSync(absolute);
  return { path: relativePath, size: stat.size, sha256: sha256File(absolute) };
});
const actual = new Map(actualItems.map((item) => [item.path, item]));
const missing = [...expected.keys()].filter((key) => !actual.has(key)).sort(utf8Compare);
const added = [...actual.keys()].filter((key) => !expected.has(key)).sort(utf8Compare);
const changed = [...expected.keys()].filter((key) => {
  const got = actual.get(key);
  const wanted = expected.get(key);
  return got && (got.size !== wanted.size || got.sha256 !== wanted.sha256);
}).sort(utf8Compare);

const lowerMap = new Map();
for (const item of files) {
  const key = item.toLocaleLowerCase('en-US');
  const values = lowerMap.get(key) || [];
  values.push(item);
  lowerMap.set(key, values);
}
const caseCollisions = [...lowerMap.values()].filter((values) => new Set(values).size > 1);
const roots = rootsFor(actualItems);
const verifierPath = path.join(ROOT, 'scripts', 'w660o-verify-source-authority.mjs');
const verifierSha256 = sha256File(verifierPath);
const checks = [
  missing.length === 0,
  added.length === 0,
  changed.length === 0,
  symlinks.length === 0,
  caseCollisions.length === 0,
  actualItems.length === manifest.payload.fileCount,
  actualItems.reduce((sum, item) => sum + item.size, 0) === manifest.payload.totalBytes,
  roots.canonicalTreeSha256 === manifest.payload.canonicalTreeSha256,
  roots.orderIndependentLeafSetSha256 === manifest.payload.orderIndependentLeafSetSha256,
  verifierSha256 === manifest.authorityTooling.verifierSha256
];
const result = {
  ok: checks.every(Boolean),
  passed: checks.filter(Boolean).length,
  total: checks.length,
  payload: {
    fileCount: actualItems.length,
    totalBytes: actualItems.reduce((sum, item) => sum + item.size, 0),
    ...roots
  },
  missing,
  added,
  changed: changed.map((key) => ({
    path: key,
    expected: expected.get(key),
    actual: actual.get(key)
  })),
  symlinks,
  caseCollisions,
  verifierSha256
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
