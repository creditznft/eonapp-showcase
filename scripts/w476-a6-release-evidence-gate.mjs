#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W476_A6_RELEASE_EVIDENCE_CONTRACT, validateW476A6ReleaseEvidenceContract } from '../config/w476-a6-release-evidence-contract.mjs';
import { inspectW476ApiSurfaceContract, writeW476ApiSurfaceArtifacts } from './w476-api-surface-contract-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDirectory = path.join(root, 'EVIDENCE', 'W476_A6');
const sourceRoots = Object.freeze(['assets', 'functions']);
const sourceExtensions = new Set(['.js', '.mjs', '.css', '.html', '.json']);
const rootSourceFiles = Object.freeze(['_headers', 'index.html', 'chat.html', 'local-ai.html', 'sw.js', 'manifest.webmanifest']);
const approvedLocalLoopbackOrigins = new Set(['http://127.0.0.1:11434', 'http://127.0.0.1:1234', 'http://127.0.0.1:1337', 'http://127.0.0.1:6767', 'http://localhost:11434', 'http://localhost:1234', 'http://localhost:1337', 'http://localhost:6767']);

const knownOriginPolicy = Object.freeze({
  'https://accounts.google.com': 'Optional Google OAuth authorization endpoint.',
  'https://oauth2.googleapis.com': 'Server-side Google OAuth token exchange endpoint.',
  'https://www.googleapis.com': 'Server-side Google public JWKS endpoint.',
  'https://cdn.jsdelivr.net': 'Explicit browser library/font CDN allowlist.',
  'https://cdnjs.cloudflare.com': 'Explicit browser library CDN allowlist.',
  'https://telegram.org': 'Telegram Mini App script host.',
  'https://web.telegram.org': 'Telegram Web embedding allowlist.',
  'https://webk.telegram.org': 'Telegram Web embedding allowlist.',
  'https://webz.telegram.org': 'Telegram Web embedding allowlist.',
  'https://www.googletagmanager.com': 'Optional Google Analytics script host; network proof remains required.',
  'https://fonts.googleapis.com': 'Optional Google font stylesheet host.',
  'https://fonts.gstatic.com': 'Optional Google font file host.'
});

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function read(relative) {
  return readFileSync(path.join(root, relative), 'utf8');
}

function listFiles(relative) {
  const absolute = path.join(root, relative);
  if (!existsSync(absolute)) return [];
  const files = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(child));
    else if (sourceExtensions.has(path.extname(entry.name).toLowerCase())) files.push(child);
  }
  return files;
}

function normalizeOrigin(value = '') {
  try {
    const parsed = new URL(String(value));
    if (!parsed.hostname || parsed.hostname === '...') return '';
    return parsed.origin;
  } catch { return ''; }
}

function classifyOrigin(origin = '') {
  if (origin === 'http://www.w3.org') return Object.freeze({ classification: 'non-network-namespace', purpose: 'Static SVG/XML namespace literal; not a network endpoint.' });
  if (origin.endsWith('.eonapp.ch') || origin === 'https://eonapp.ch') return Object.freeze({ classification: 'first-party', purpose: 'EONAPP first-party origin or API subdomain.' });
  if (origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost')) {
    if (approvedLocalLoopbackOrigins.has(origin)) return Object.freeze({ classification: 'approved-local-loopback', purpose: 'Approved W476 Local AI text runtime loopback origin; browser/device proof remains required.' });
    return Object.freeze({ classification: 'legacy-local-literal', purpose: 'Observed local literal outside the reviewed W476 Local AI loopback contract; cleanup or explicit separate adapter review is required.' });
  }
  if (knownOriginPolicy[origin]) return Object.freeze({ classification: 'reviewed-external', purpose: knownOriginPolicy[origin] });
  return Object.freeze({ classification: 'unreviewed-observed-literal', purpose: 'Observed in active source but not yet an approved runtime origin. It blocks release approval until route/runtime and browser-network review classify or remove it.' });
}

function scanOrigins(relative, text) {
  const values = new Set();
  const regex = /https?:\/\/(?:\*\.)?[a-z0-9.-]+(?::\d{1,5})?(?:[/?#][^\s'"<>)]*)?/gi;
  for (const match of text.matchAll(regex)) {
    const raw = match[0].replace(/[;,]$/, '');
    const origin = normalizeOrigin(raw.replace('*.', ''));
    if (origin) values.add(origin);
  }
  return [...values].sort();
}

function collectBroadCspSchemes(headers = '') {
  const hits = [];
  for (const value of headers.matchAll(/Content-Security-Policy:\s*([^\n]+)/g)) {
    const policy = value[1];
    for (const directive of ['connect-src', 'img-src', 'frame-src']) {
      const found = policy.match(new RegExp(`${directive}\\s+([^;]+)`));
      if (found && /(^|\s)https:(?=\s|$)/.test(found[1])) hits.push(directive);
    }
  }
  return [...new Set(hits)].sort();
}

export function buildW476A6Sbom() {
  const lock = JSON.parse(read('package-lock.json'));
  const packages = Object.entries(lock.packages || {})
    .filter(([location]) => location)
    .map(([location, metadata]) => Object.freeze({
      name: String(metadata.name || location.replace(/^.*node_modules\//, '')),
      version: String(metadata.version || ''),
      location,
      developmentOnly: metadata.dev === true,
      optional: metadata.optional === true,
      integrity: String(metadata.integrity || ''),
      resolved: String(metadata.resolved || '')
    }))
    .sort((left, right) => `${left.name}@${left.version}:${left.location}`.localeCompare(`${right.name}@${right.version}:${right.location}`));
  const productionComponents = packages.filter((component) => !component.developmentOnly);
  return Object.freeze({
    schema: 'eonapp.w476.a6.sbom.package-lock.v1',
    generatedFrom: 'package-lock.json',
    lockfileVersion: lock.lockfileVersion,
    packageLockSha256: sha256(read('package-lock.json')),
    generatedAt: new Date().toISOString(),
    root: Object.freeze({
      name: String(lock.packages?.['']?.name || ''),
      version: String(lock.packages?.['']?.version || ''),
      directDependencies: Object.keys(lock.packages?.['']?.dependencies || {}).sort(),
      directDevDependencies: Object.keys(lock.packages?.['']?.devDependencies || {}).sort()
    }),
    componentCount: packages.length,
    productionComponentCount: productionComponents.length,
    components: Object.freeze(packages),
    productionComponents: Object.freeze(productionComponents)
  });
}

export function buildW476A6ExternalOriginInventory() {
  const files = [
    ...rootSourceFiles.filter((relative) => existsSync(path.join(root, relative))),
    ...readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith('.html')).map((entry) => entry.name),
    ...sourceRoots.flatMap(listFiles)
  ].filter((value, index, all) => all.indexOf(value) === index).sort();
  const originSources = new Map();
  for (const relative of files) {
    for (const origin of scanOrigins(relative, read(relative))) {
      if (!originSources.has(origin)) originSources.set(origin, new Set());
      originSources.get(origin).add(relative);
    }
  }
  const origins = [...originSources.entries()].map(([origin, sources]) => {
    const classification = classifyOrigin(origin);
    return Object.freeze({
      origin,
      classification: classification.classification,
      purpose: classification.purpose,
      sources: Object.freeze([...sources].sort())
    });
  }).sort((left, right) => left.origin.localeCompare(right.origin));
  const headers = read('_headers');
  return Object.freeze({
    schema: 'eonapp.w476.a6.external-origin-inventory.v1',
    generatedAt: new Date().toISOString(),
    scope: 'active browser/runtime source only; excludes docs, archives, tests, build scripts and dependencies',
    originCount: origins.length,
    origins: Object.freeze(origins),
    broadCspSchemes: Object.freeze(collectBroadCspSchemes(headers)),
    unreviewedOriginCount: origins.filter((entry) => entry.classification === 'unreviewed-observed-literal').length,
    legacyLocalLiteralCount: origins.filter((entry) => entry.classification === 'legacy-local-literal').length,
    releaseBoundary: 'A static inventory is not production network proof. Broad CSP https: scheme allowances, unreviewed observed literals and legacy local literals require W476-B/W477 browser-network and cleanup review.'
  });
}

function writeJson(name, value) {
  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(path.join(evidenceDirectory, name), `${JSON.stringify(value, null, 2)}\n`);
}

export function inspectW476A6ReleaseEvidence({ writeArtifacts = true } = {}) {
  const issues = [...validateW476A6ReleaseEvidenceContract()];
  const api = writeArtifacts ? writeW476ApiSurfaceArtifacts() : inspectW476ApiSurfaceContract();
  if (!api.ok) issues.push(...api.issues.map((issue) => `api:${issue}`));
  const sbom = buildW476A6Sbom();
  const originInventory = buildW476A6ExternalOriginInventory();
  if (sbom.componentCount < 1 || sbom.productionComponentCount < 1) issues.push('sbom-empty');
  if (!read('_headers').includes('Reporting-Endpoints: csp-endpoint="/csp-report"')) issues.push('reporting-endpoints-header-missing');
  const result = Object.freeze({
    schema: 'eonapp.w476.a6.release-evidence-gate.v1',
    wave: 'W476-A6',
    ok: issues.length === 0,
    sourceOnly: true,
    productionReleaseApproved: false,
    paymentActivationApproved: false,
    dodoActivationApproved: false,
    apiSurface: Object.freeze({ functionCount: api.functionCount, negativeCaseCount: api.negativeCaseCount }),
    sbom: Object.freeze({ componentCount: sbom.componentCount, productionComponentCount: sbom.productionComponentCount, packageLockSha256: sbom.packageLockSha256 }),
    externalOriginInventory: Object.freeze({ originCount: originInventory.originCount, broadCspSchemes: originInventory.broadCspSchemes, unreviewed: originInventory.origins.filter((entry) => entry.classification === 'unreviewed-observed-literal').map((entry) => entry.origin), legacyLocalLiterals: originInventory.origins.filter((entry) => entry.classification === 'legacy-local-literal').map((entry) => entry.origin) }),
    releaseBlockedBy: Object.freeze([
      ...W476_A6_RELEASE_EVIDENCE_CONTRACT.requiredExternalEvidence,
      ...(originInventory.broadCspSchemes.length ? ['broad-csp-scheme-review'] : []),
      ...(originInventory.unreviewedOriginCount ? ['unreviewed-external-origin-review'] : []),
      ...(originInventory.legacyLocalLiteralCount ? ['legacy-local-origin-cleanup'] : [])
    ]),
    issues: Object.freeze(issues)
  });
  if (writeArtifacts) {
    writeJson('SBOM_PACKAGE_LOCK.json', sbom);
    writeJson('SBOM_PRODUCTION_COMPONENTS.json', Object.freeze({ schema: sbom.schema, generatedAt: sbom.generatedAt, components: sbom.productionComponents }));
    writeJson('EXTERNAL_ORIGIN_INVENTORY.json', originInventory);
    writeJson('RELEASE_EVIDENCE_GATE.json', result);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW476A6ReleaseEvidence();
  if (!result.ok) {
    process.stderr.write(`W476-A6 release evidence gate failed:\n${result.issues.map((issue) => `- ${issue}`).join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write(`W476-A6 release evidence gate passed (${result.apiSurface.functionCount} Functions; ${result.sbom.componentCount} locked components; ${result.externalOriginInventory.originCount} inventoried origins). Release remains externally blocked.\n`);
}
