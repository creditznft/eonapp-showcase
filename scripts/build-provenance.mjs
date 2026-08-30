#!/usr/bin/env node
/**
 * W612 build-provenance helper.
 *
 * Creates a public, non-secret manifest for the production artefact only. The
 * digest excludes the manifest itself to avoid a circular hash and lets the
 * normal-browser W600A runner reject stale or mismatched deployments.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EON_BUILD_PROVENANCE_SCHEMA = 'eon.build.provenance.v1';
export const EON_BUILD_PROVENANCE_FILE = 'build-provenance.json';
const SHA256_RE = /^[a-f0-9]{64}$/i;
const REVISION_RE = /^[a-f0-9]{7,64}$/i;

function toPosix(relative) {
  return relative.split(path.sep).join('/');
}

function normalizeRevision(value) {
  const candidate = String(value || '').trim();
  return REVISION_RE.test(candidate) ? candidate.toLowerCase() : null;
}

export function resolveBuildSourceRevision({ env = process.env, cwd = process.cwd() } = {}) {
  for (const key of ['EONAPP_SOURCE_REVISION', 'CF_PAGES_COMMIT_SHA', 'GITHUB_SHA']) {
    const revision = normalizeRevision(env?.[key]);
    if (revision) return revision;
  }
  try {
    return normalizeRevision(execFileSync('git', ['rev-parse', 'HEAD'], { cwd, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }));
  } catch {
    return null;
  }
}

async function walkFiles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(root, absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

async function sha256File(absolute) {
  const buffer = await readFile(absolute);
  return { sha256: createHash('sha256').update(buffer).digest('hex'), bytes: buffer.length };
}

export async function collectBuildDistributionEntries({ distDir, exclude = [EON_BUILD_PROVENANCE_FILE, 'release/candidate-provenance.json', '.eon-build-report.json'] } = {}) {
  const root = path.resolve(distDir || 'dist');
  const ignored = new Set(exclude.map((entry) => toPosix(String(entry))));
  const files = await walkFiles(root);
  const entries = [];
  for (const absolute of files) {
    const relative = toPosix(path.relative(root, absolute));
    if (ignored.has(relative)) continue;
    const hash = await sha256File(absolute);
    entries.push(Object.freeze({ path: relative, ...hash }));
  }
  return Object.freeze(entries.sort((left, right) => left.path.localeCompare(right.path)));
}

export function digestBuildDistribution(entries = []) {
  const digest = createHash('sha256');
  let bytes = 0;
  for (const entry of entries) {
    const relative = String(entry?.path || '');
    const sha256 = String(entry?.sha256 || '');
    const size = Number(entry?.bytes || 0);
    if (!relative || !SHA256_RE.test(sha256) || !Number.isSafeInteger(size) || size < 0) {
      throw new Error('Cannot fingerprint malformed build distribution entry.');
    }
    bytes += size;
    digest.update(`${relative}\u0000${sha256.toLowerCase()}\u0000${size}\n`);
  }
  return Object.freeze({ sha256: digest.digest('hex'), fileCount: entries.length, bytes });
}

function entryHash(entries, relative) {
  return entries.find((entry) => entry.path === relative)?.sha256 || null;
}

export async function createBuildProvenance({ distDir, sourceRevision = resolveBuildSourceRevision(), generatedAt = new Date().toISOString() } = {}) {
  const entries = await collectBuildDistributionEntries({ distDir });
  const distribution = digestBuildDistribution(entries);
  const revision = normalizeRevision(sourceRevision);
  return Object.freeze({
    schema: EON_BUILD_PROVENANCE_SCHEMA,
    generatedAt: new Date(generatedAt).toISOString(),
    sourceRevision: revision,
    distribution,
    city: Object.freeze({
      eoncityDocumentSha256: entryHash(entries, 'eoncity.html'),
      eoncityRouteDocumentSha256: entryHash(entries, 'eoncity/index.html'),
      serviceWorkerSha256: entryHash(entries, 'sw.js')
    }),
    privacy: Object.freeze({
      containsUserData: false,
      containsSecrets: false,
      purpose: 'deploy-candidate-parity-only'
    })
  });
}

export async function writeBuildProvenance({ distDir, sourceRevision, generatedAt } = {}) {
  const root = path.resolve(distDir || 'dist');
  await mkdir(root, { recursive: true });
  const provenance = await createBuildProvenance({ distDir: root, sourceRevision, generatedAt });
  const destination = path.join(root, EON_BUILD_PROVENANCE_FILE);
  await writeFile(destination, `${JSON.stringify(provenance, null, 2)}\n`, 'utf8');
  return Object.freeze({ destination, provenance });
}

export function validateBuildProvenance(value) {
  const issues = [];
  if (!value || typeof value !== 'object') return ['not-an-object'];
  if (value.schema !== EON_BUILD_PROVENANCE_SCHEMA) issues.push('schema');
  if (!SHA256_RE.test(String(value?.distribution?.sha256 || ''))) issues.push('distribution.sha256');
  if (!Number.isSafeInteger(value?.distribution?.fileCount) || value.distribution.fileCount < 1) issues.push('distribution.fileCount');
  if (!Number.isSafeInteger(value?.distribution?.bytes) || value.distribution.bytes < 1) issues.push('distribution.bytes');
  if (!SHA256_RE.test(String(value?.city?.eoncityDocumentSha256 || ''))) issues.push('city.eoncityDocumentSha256');
  if (!SHA256_RE.test(String(value?.city?.eoncityRouteDocumentSha256 || ''))) issues.push('city.eoncityRouteDocumentSha256');
  if (!SHA256_RE.test(String(value?.city?.serviceWorkerSha256 || ''))) issues.push('city.serviceWorkerSha256');
  if (value?.privacy?.containsUserData !== false || value?.privacy?.containsSecrets !== false) issues.push('privacy');
  if (value.sourceRevision !== null && !REVISION_RE.test(String(value.sourceRevision))) issues.push('sourceRevision');
  return Object.freeze(issues);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { destination, provenance } = await writeBuildProvenance({ distDir: path.join(root, 'dist') });
  console.log(JSON.stringify({ destination: toPosix(path.relative(root, destination)), provenance }, null, 2));
}
