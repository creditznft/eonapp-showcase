import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const freeze = (value) => Object.freeze(value);
const sha256 = (input) => crypto.createHash('sha256').update(input).digest('hex');
const stable = (value) => Array.isArray(value)
  ? `[${value.map(stable).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
    : JSON.stringify(value);
export const stableDigest = (value) => sha256(Buffer.from(stable(value), 'utf8'));

function listFiles(directory, prefix = '') {
  if (!fs.existsSync(directory)) return [];
  const rows = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(directory, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) rows.push(...listFiles(absolute, relative));
    else if (entry.isFile()) rows.push(relative.replaceAll('\\', '/'));
  }
  return rows;
}

function copyTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const relative of listFiles(source)) {
    const from = path.join(source, ...relative.split('/'));
    const to = path.join(destination, ...relative.split('/'));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function resolveRelativeModule(root, importer, specifier) {
  if (!specifier.startsWith('.')) return null;
  const unresolved = path.resolve(path.dirname(importer), specifier);
  const candidates = [unresolved, `${unresolved}.js`, `${unresolved}.mjs`, `${unresolved}.json`, path.join(unresolved, 'index.js'), path.join(unresolved, 'index.mjs')];
  const resolved = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!resolved) throw new Error(`Unresolved Pages Function import: ${path.relative(root, importer)} -> ${specifier}`);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Pages Function import escapes source root: ${specifier}`);
  return resolved;
}

function parseModuleSpecifiers(body = '') {
  const values = new Set();
  const patterns = [
    /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of body.matchAll(pattern)) values.add(match[1]);
  }
  return [...values];
}

export function collectPagesFunctionSupportFiles(sourceRoot) {
  const root = path.resolve(sourceRoot);
  const functionsRoot = path.join(root, 'functions');
  if (!fs.existsSync(functionsRoot)) throw new Error('Source functions/ directory is missing.');
  const queue = listFiles(functionsRoot)
    .filter((relative) => /\.(?:js|mjs)$/.test(relative))
    .map((relative) => path.join(functionsRoot, ...relative.split('/')));
  const visited = new Set();
  const support = new Set();
  while (queue.length) {
    const absolute = queue.shift();
    if (visited.has(absolute)) continue;
    visited.add(absolute);
    const body = fs.readFileSync(absolute, 'utf8');
    for (const specifier of parseModuleSpecifiers(body)) {
      const resolved = resolveRelativeModule(root, absolute, specifier);
      if (!resolved) continue;
      if (!resolved.startsWith(`${functionsRoot}${path.sep}`)) support.add(path.relative(root, resolved).replaceAll('\\', '/'));
      if (/\.(?:js|mjs)$/.test(resolved)) queue.push(resolved);
    }
  }
  return freeze([...support].sort());
}

function validateCandidateMetadata(candidateRoot) {
  const provenanceFile = path.join(candidateRoot, 'candidate-provenance.json');
  const manifestFile = path.join(candidateRoot, 'candidate-manifest.json');
  const distRoot = path.join(candidateRoot, 'dist');
  if (!fs.existsSync(provenanceFile) || !fs.existsSync(manifestFile) || !fs.existsSync(distRoot)) throw new Error('Candidate root is incomplete.');
  const provenance = readJson(provenanceFile);
  const manifest = readJson(manifestFile);
  const issues = [];
  if (provenance.candidateDigest !== manifest.candidateDigest) issues.push('candidate-manifest-digest-mismatch');
  if (provenance.distPayloadDigest !== manifest.distPayloadDigest) issues.push('candidate-manifest-payload-mismatch');
  if (provenance.fileCount !== manifest.fileCount || manifest.files?.length !== manifest.fileCount) issues.push('candidate-file-count-mismatch');
  for (const row of manifest.files || []) {
    const file = path.join(distRoot, ...String(row.path || '').split('/'));
    if (!fs.existsSync(file)) { issues.push(`candidate-file-missing:${row.path}`); continue; }
    const body = fs.readFileSync(file);
    if (body.length !== row.bytes) issues.push(`candidate-file-size:${row.path}`);
    if (sha256(body) !== row.sha256) issues.push(`candidate-file-sha:${row.path}`);
  }
  const digest = stableDigest((manifest.files || []).map(({ path: filePath, bytes, sha256: digestValue }) => ({ path: filePath, bytes, sha256: digestValue })));
  if (digest !== provenance.distPayloadDigest) issues.push('candidate-payload-digest-invalid');
  if (issues.length) throw new Error(`Candidate verification failed: ${issues.join(', ')}`);
  return freeze({ provenance, manifest, distRoot });
}

export function stageCompletePagesDeployRoot({ sourceRoot, candidateRoot, outputRoot }) {
  const source = path.resolve(sourceRoot);
  const candidate = path.resolve(candidateRoot);
  const output = path.resolve(outputRoot);
  const { provenance, manifest, distRoot } = validateCandidateMetadata(candidate);
  const functionsRoot = path.join(source, 'functions');
  const supportFiles = collectPagesFunctionSupportFiles(source);
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  copyTree(distRoot, output);
  copyTree(functionsRoot, path.join(output, 'functions'));
  for (const relative of supportFiles) {
    const from = path.join(source, ...relative.split('/'));
    const to = path.join(output, ...relative.split('/'));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  const required = ['_routes.json', 'functions/api/auth/session.js', 'functions/api/city/access.js', 'functions/api/billing/status.js', 'functions/api/referrals.js'];
  for (const relative of required) if (!fs.existsSync(path.join(output, ...relative.split('/')))) throw new Error(`Required deployment file missing: ${relative}`);
  for (const row of manifest.files || []) {
    const staged = path.join(output, ...row.path.split('/'));
    const body = fs.readFileSync(staged);
    if (body.length !== row.bytes || sha256(body) !== row.sha256) throw new Error(`Staged immutable file changed: ${row.path}`);
  }
  return freeze({ provenance, manifest, supportFiles, outputRoot: output });
}

export function buildCompletePagesBundleManifest({ deployRoot, provenance, manifest, supportFiles = [], sourceAuthority = '', sourceCommit = '', generatedAt = new Date().toISOString() }) {
  const rows = listFiles(deployRoot).map((relative) => {
    const body = fs.readFileSync(path.join(deployRoot, ...relative.split('/')));
    return freeze({ path: relative, bytes: body.length, sha256: sha256(body) });
  });
  const functionFiles = rows.filter((row) => row.path.startsWith('functions/'));
  const core = {
    schema: 'eonapp.w660l.complete-pages-deploy-bundle.v1',
    wave: 'W660L',
    parentSourceAuthority: String(sourceAuthority || ''),
    sourceCommit: String(sourceCommit || ''),
    candidateDigest: provenance.candidateDigest,
    candidateCommitSha: provenance.commitSha,
    distPayloadDigest: provenance.distPayloadDigest,
    candidateStaticFileCount: manifest.fileCount,
    deployRootFileCount: rows.length,
    functionsFileCount: functionFiles.length,
    supportFileCount: supportFiles.length,
    generatedAt,
    files: rows
  };
  return freeze({ ...core, bundleDigest: stableDigest(core) });
}

export function verifyCompletePagesBundle(bundleRoot) {
  const root = path.resolve(bundleRoot);
  const deployRoot = path.join(root, 'deploy-root');
  const manifestFile = path.join(root, 'W660L_COMPLETE_DEPLOY_BUNDLE_MANIFEST.json');
  if (!fs.existsSync(deployRoot) || !fs.existsSync(manifestFile)) return freeze({ ok: false, issues: freeze(['bundle-root-incomplete']) });
  const bundle = readJson(manifestFile);
  const issues = [];
  const { bundleDigest, ...core } = bundle;
  if (stableDigest(core) !== bundleDigest) issues.push('bundle-digest-mismatch');
  const actualFiles = listFiles(deployRoot);
  const expectedPaths = (bundle.files || []).map((row) => row.path);
  if (actualFiles.length !== expectedPaths.length || actualFiles.some((value, index) => value !== expectedPaths[index])) issues.push('bundle-file-list-mismatch');
  for (const row of bundle.files || []) {
    const file = path.join(deployRoot, ...row.path.split('/'));
    if (!fs.existsSync(file)) { issues.push(`bundle-file-missing:${row.path}`); continue; }
    const body = fs.readFileSync(file);
    if (body.length !== row.bytes) issues.push(`bundle-file-size:${row.path}`);
    if (sha256(body) !== row.sha256) issues.push(`bundle-file-sha:${row.path}`);
  }
  const servedProvenanceFile = path.join(deployRoot, 'release/candidate-provenance.json');
  const servedManifestFile = path.join(deployRoot, 'release/candidate-manifest.json');
  if (!fs.existsSync(servedProvenanceFile) || !fs.existsSync(servedManifestFile)) {
    issues.push('served-candidate-metadata-missing');
  } else {
    const candidateProvenance = readJson(servedProvenanceFile);
    const candidateManifest = readJson(servedManifestFile);
    if (candidateProvenance.candidateDigest !== bundle.candidateDigest) issues.push('served-candidate-digest-mismatch');
    if (candidateProvenance.commitSha !== bundle.candidateCommitSha) issues.push('served-candidate-commit-mismatch');
    if (candidateProvenance.distPayloadDigest !== bundle.distPayloadDigest) issues.push('served-payload-digest-mismatch');
    for (const row of candidateManifest.files || []) {
      const staticFile = path.join(deployRoot, ...String(row.path || '').split('/'));
      if (!fs.existsSync(staticFile)) { issues.push(`immutable-static-missing:${row.path}`); continue; }
      const body = fs.readFileSync(staticFile);
      if (body.length !== row.bytes || sha256(body) !== row.sha256) issues.push(`immutable-static-mismatch:${row.path}`);
    }
  }
  for (const relative of ['_routes.json', 'functions/api/auth/session.js', 'functions/api/city/access.js', 'functions/api/billing/status.js', 'functions/api/referrals.js']) {
    if (!fs.existsSync(path.join(deployRoot, ...relative.split('/')))) issues.push(`required-file-missing:${relative}`);
  }
  return freeze({ ok: issues.length === 0, issues: freeze(issues), manifest: bundle, deployRoot });
}

export { sha256, listFiles };
