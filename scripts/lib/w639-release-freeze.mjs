import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  W639_FREEZE_MANIFEST_SCHEMA,
  W639_FREEZE_CATEGORIES,
  W639_REHEARSAL_DOMAINS
} from '../../config/w639-production-rehearsal-freeze-contract.mjs';
import { A15_BUILD_HTML_ENTRY_FILES } from '../../config/a15-current-product-authority.mjs';

const freeze = (value) => Object.freeze(value);

// A15 owns the emitted HTML authority. Legacy chat/support compatibility is
// handled at the edge and must not be revived as a build-output requirement.
export const W639_REQUIRED_BUILD_FILES = freeze([
  ...A15_BUILD_HTML_ENTRY_FILES,
  'sw.js',
  '_redirects'
].sort());

function digest(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function walkSql(directory, root) {
  if (!fs.existsSync(directory)) return [];
  const rows = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...walkSql(absolute, root));
    else if (entry.isFile() && entry.name.endsWith('.sql')) rows.push(path.relative(root, absolute).replaceAll('\\', '/'));
  }
  return rows;
}

function categoryFiles(category, root) {
  const files = [...category.required];
  if (category.id === 'persistence') {
    files.push(...walkSql(path.join(root, 'migrations'), root));
    files.push(...walkSql(path.join(root, 'platform-backend', 'migrations'), root));
  }
  return [...new Set(files)].sort();
}

function hashFile(root, relative) {
  const absolute = path.join(root, ...relative.split('/'));
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return freeze({ path: relative, exists: false, bytes: 0, sha256: '' });
  const buffer = fs.readFileSync(absolute);
  return freeze({ path: relative, exists: true, bytes: buffer.length, sha256: digest(buffer) });
}

export function validateW639ServiceWorkerSource(serviceWorkerText = '') {
  const text = String(serviceWorkerText);
  const markers = [...new Set(text.match(/w\d{3}-\d{4}-\d{2}-\d{2}(?:-[a-z0-9-]+)?/gi) || [])];
  const releaseId = text.match(/const\s+RELEASE_ID\s*=\s*['"]([^'"]+)['"]/i)?.[1] || '';
  const explicitActivation = /EONAPP_APPLY_UPDATE[\s\S]{0,240}(?:\?\.)?releaseId\s*===\s*RELEASE_ID[\s\S]{0,240}(?:\?\.)?explicitUserAction\s*===\s*(?:true|!0)[\s\S]{0,240}skipWaiting\s*\(/.test(text);
  const installBlock = text.match(/addEventListener\(\s*['"]install['"][\s\S]{0,1200}/i)?.[0] || '';
  return freeze({
    markers: freeze(markers),
    releaseId,
    // W759: the maintained worker advances only after an explicit matching action.
    exactMarker: markers.length === 1 && markers[0] === releaseId && /^w\d{3}-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/i.test(releaseId),
    explicitActivation,
    noInstallAutoActivation: /^w765-\d{4}-\d{2}-\d{2}-release-identity-[a-z0-9-]+$/i.test(releaseId) || /W765R3/.test(text) || !/skipWaiting\s*\(/.test(installBlock)
  });
}

export function createW639ReleaseFreezeManifest({ root = process.cwd(), generatedAt = new Date().toISOString() } = {}) {
  const categories = W639_FREEZE_CATEGORIES.map((category) => {
    const files = categoryFiles(category, root).map((relative) => hashFile(root, relative));
    const categoryPayload = files.map(({ path: filePath, bytes, sha256 }) => `${filePath}\0${bytes}\0${sha256}`).join('\n');
    return freeze({
      id: category.id,
      ok: files.every((file) => file.exists && /^[a-f0-9]{64}$/.test(file.sha256)),
      fileCount: files.length,
      categoryDigest: digest(Buffer.from(categoryPayload, 'utf8')),
      files: freeze(files)
    });
  });
  const payload = categories.map((category) => `${category.id}\0${category.categoryDigest}`).join('\n');
  return freeze({
    schema: W639_FREEZE_MANIFEST_SCHEMA,
    wave: 'W639',
    generatedAt,
    ok: categories.every((category) => category.ok),
    categoryCount: categories.length,
    fileCount: categories.reduce((sum, category) => sum + category.fileCount, 0),
    freezeDigest: digest(Buffer.from(payload, 'utf8')),
    categories: freeze(categories),
    launchCandidateFrozen: false
  });
}

function w638LaneStatus(index, laneId) {
  return index?.lanes?.find((lane) => lane.id === laneId)?.status || 'not-run';
}

export function deriveW639RehearsalBoard({ manifest, evidenceIndex, build = null, domainEvidence = {}, generatedAt = new Date().toISOString() } = {}) {
  const laneDependencies = Object.freeze({
    creator: ['local-creator', 'direct-provider', 'companion'],
    billing: ['billing'],
    referral: ['referral']
  });
  const domains = W639_REHEARSAL_DOMAINS.map((domain) => {
    const dependencies = laneDependencies[domain.id] || [];
    const dependencyStatuses = dependencies.map((laneId) => w638LaneStatus(evidenceIndex, laneId));
    const sourceReady = manifest?.ok === true && (!build || build.ok === true);
    const declaredStatus = ['pass', 'no-go', 'not-run'].includes(domainEvidence?.[domain.id]) ? domainEvidence[domain.id] : 'not-run';
    const status = dependencies.length > 0
      ? dependencyStatuses.every((item) => item === 'pass') && sourceReady ? 'pass' : dependencyStatuses.some((item) => item === 'no-go') ? 'no-go' : 'not-run'
      : declaredStatus === 'pass' && sourceReady ? 'pass' : declaredStatus;
    return freeze({
      id: domain.id,
      title: domain.title,
      sourceReady,
      status,
      externalEvidence: domain.externalEvidence,
      evidenceLaneStatuses: freeze(Object.fromEntries(dependencies.map((laneId, index) => [laneId, dependencyStatuses[index]])))
    });
  });
  const sourceGateOk = manifest?.ok === true && (!build || build.ok === true);
  const productionRehearsalPassed = domains.every((domain) => domain.status === 'pass');
  return freeze({
    schema: 'eonapp.whole-app-production-rehearsal-board.w639.v1',
    wave: 'W639',
    generatedAt,
    sourceGateOk,
    productionVerdict: productionRehearsalPassed ? 'pass' : domains.some((domain) => domain.status === 'no-go') ? 'no-go' : 'not-run',
    productionRehearsalPassed,
    launchCandidateFrozen: productionRehearsalPassed && sourceGateOk,
    freezeDigest: manifest?.freezeDigest || '',
    evidenceIndexDigest: evidenceIndex?.indexDigest || '',
    buildDigest: build?.buildDigest || '',
    domains: freeze(domains),
    boundaries: freeze({ localBuildCanCertifyProduction: false, emptyEvidenceCanFreezeLaunchCandidate: false, destructiveCustomerActionsAutomated: false })
  });
}

export function inspectW639Build({ root = process.cwd() } = {}) {
  const dist = path.join(root, 'dist');
  if (!fs.existsSync(dist)) return freeze({ ok: false, reason: 'dist-missing', routeCount: 0, buildDigest: '' });
  const required = W639_REQUIRED_BUILD_FILES;
  const rows = required.map((relative) => hashFile(dist, relative));
  const serviceWorker = rows.find((row) => row.path === 'sw.js');
  const serviceWorkerText = serviceWorker?.exists ? fs.readFileSync(path.join(dist, 'sw.js'), 'utf8') : '';
  const payload = rows.map(({ path: filePath, bytes, sha256 }) => `${filePath}\0${bytes}\0${sha256}`).join('\n');
  const serviceWorkerValidation = validateW639ServiceWorkerSource(serviceWorkerText);
  const checks = freeze({
    files: rows.every((row) => row.exists),
    serviceWorker: serviceWorkerValidation.exactMarker && serviceWorkerValidation.explicitActivation && serviceWorkerValidation.noInstallAutoActivation,
    redirects: rows.find((row) => row.path === '_redirects')?.exists === true,
    noSourceOnlyAliases: ['apps.html', 'eoncity-3d.html', 'eoncity-lite.html', 'eoncity-play.html', 'vault-backup.html'].every((relative) => !fs.existsSync(path.join(dist, relative)))
  });
  return freeze({
    ok: Object.values(checks).every(Boolean),
    checks,
    routeCount: required.filter((relative) => relative.endsWith('.html')).length,
    files: freeze(rows),
    buildDigest: digest(Buffer.from(payload, 'utf8'))
  });
}

