#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import {
  getW635FileBudget,
  validateW635PerformanceCacheUpdateSafetyContract,
  W635_PERFORMANCE_CACHE_UPDATE_SAFETY_CONTRACT,
  W635_PUBLIC_FILES,
  W635_THEME_BOOTSTRAP_RELEASE
} from '../config/w635-performance-cache-update-safety-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

function sourceChecks() {
  const sw = read('sw.js');
  const publicSw = read('public/sw.js');
  const registration = read('assets/js/utils/eon-service-worker-registration.js');
  const manager = read('assets/js/eon-pwa-manager.js');
  const profile = read('assets/js/profile-page.js');
  const shell = read('assets/js/eon-app-shell.js');
  const headers = read('_headers');
  const activeJs = [];
  const stack = [path.join(root, 'assets/js')];
  while (stack.length) {
    const directory = stack.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else if (entry.isFile() && entry.name.endsWith('.js')) activeJs.push(fs.readFileSync(absolute, 'utf8'));
    }
  }
  const joinedJs = activeJs.join('\n');
  const releaseId = sw.match(/const RELEASE_ID = '([^']+)'/)?.[1] || '';
  const installHandler = sw.match(/sw\.addEventListener\('install',[\s\S]*?\n}\);/)?.[0] || '';
  const themeDocuments = W635_PUBLIC_FILES.filter((file) => /eon-theme-bootstrap\.js/.test(read(file)));
  const checks = [
    freeze({ id: 'contract', pass: validateW635PerformanceCacheUpdateSafetyContract().ok, detail: 'machine contract' }),
    freeze({ id: 'worker-mirror', pass: sw === publicSw, detail: 'root/public byte-identical' }),
    freeze({ id: 'release-scoped-caches', pass: /^w\d+-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(releaseId) && /PAGE_CACHE = `eonapp-pages-\$\{RELEASE_ID\}`/.test(sw) && /ASSET_CACHE = `eonapp-assets-\$\{RELEASE_ID\}`/.test(sw) && /CITY_SHELL_CACHE = `eonapp-city-shell-\$\{RELEASE_ID\}`/.test(sw) && /CURRENT_EONAPP_CACHES/.test(sw), detail: releaseId || 'missing-release-id' }),
    freeze({ id: 'release-stable-city-asset-cache', pass: /PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'/.test(sw) && !/MAX_PERSISTENT_CITY_ASSET_ENTRIES/.test(sw) && /isPersistentContentHashedCityAsset/.test(sw) && /persistentCityAssetCacheFirst/.test(sw) && /manualEntryEviction: false/.test(sw) && /CURRENT_EONAPP_CACHES[\s\S]*PERSISTENT_CITY_ASSET_CACHE/.test(sw), detail: 'release-stable content-addressed City art cache without arbitrary FIFO eviction' }),
    freeze({ id: 'current-cache-only-reads', pass: /matchCurrentCache\(PAGE_CACHE/.test(sw) && /matchCurrentCache\(ASSET_CACHE/.test(sw) && /matchCurrentCache\(CITY_SHELL_CACHE/.test(sw) && !/\bcaches\.match\s*\(/.test(sw), detail: 'release caches plus exact-release City shell and strict content-addressed City art only' }),
    freeze({ id: 'response-cache-fence', pass: /response\.redirected/.test(sw) && /no-store\|private\|no-cache/.test(sw) && /responseUrl\.origin !== sw\.location\.origin/.test(sw) && /navigation && responseUrl\.pathname/.test(sw), detail: 'redirect/private/cross-origin/canonical fences' }),
    freeze({ id: 'query-and-auth-fence', pass: /hasSensitiveQuery/.test(sw) && /request\.headers\.has\('authorization'\)/.test(sw) && /if \(url\.search\) return staticNetworkOnly/.test(sw), detail: 'query variants and credentials not cached' }),
    freeze({ id: 'critical-offline-precache', pass: /CRITICAL_PRECACHE/.test(sw) && /cache\.addAll\(CRITICAL_PRECACHE/.test(sw) && /Promise\.allSettled\(optional/.test(sw), detail: 'offline fallback required; warm routes optional' }),
    freeze({ id: 'navigation-revalidation', pass: /fetch\(request, \{ cache: 'no-cache'/.test(sw) && /AbortController/.test(sw), detail: 'bounded revalidation fetch' }),
    freeze({ id: 'explicit-update-worker', pass: /EONAPP_APPLY_UPDATE/.test(sw) && /event\.data\?\.explicitUserAction === true/.test(sw) && Boolean(installHandler) && !/skipWaiting\s*\(/.test(installHandler), detail: 'no install-time activation' }),
    freeze({ id: 'central-registration', pass: /updateViaCache:\s*'none'/.test(registration) && /scope:\s*EON_SERVICE_WORKER_SCOPE/.test(registration) && (joinedJs.match(/\.register\(EON_SERVICE_WORKER_SCRIPT/g) || []).length === 1 && !/navigator\.serviceWorker\.register\s*\(/.test(joinedJs), detail: 'one registration implementation' }),
    freeze({ id: 'explicit-apply-and-reload', pass: /applyEonPwaUpdate\(\{ explicitUserAction = false \}/.test(manager) && /reloadEonPwaAfterUpdate\(\{ explicitUserAction = false/.test(manager) && /explicitUserAction: true/.test(profile) && /Reload updated app/.test(profile) && !/controllerchange[\s\S]{0,350}location\.reload/.test(manager), detail: 'activation and reload are separate taps' }),
    freeze({ id: 'versioned-bootstrap', pass: themeDocuments.length >= 20 && themeDocuments.every((file) => new RegExp(`eon-theme-bootstrap\\.js\\?release=${W635_THEME_BOOTSTRAP_RELEASE}`).test(read(file))) && !W635_PUBLIC_FILES.some((file) => /eon-theme-bootstrap\.js["']/.test(read(file))), detail: `${themeDocuments.length} current documents` }),
    freeze({ id: 'deferred-shell-modules', pass: !/^import .*eon-share-sheet/m.test(shell) && !/^import .*eonbot-job-activity-bridge/m.test(shell) && !/^import .*eon-referral-server-client/m.test(shell) && /import\('\.\/utils\/eon-share-sheet\.js'\)/.test(shell) && /scheduleWorkflowBridges/.test(shell), detail: 'share/job/referral work is demand/page loaded' }),
    freeze({ id: 'worker-http-cache-fence', pass: /\/sw\.js[\s\S]{0,90}Cache-Control:\s*no-cache, no-store, must-revalidate/.test(headers), detail: 'edge/browser revalidation header' }),
    freeze({ id: 'source-files', pass: ['config/w635-performance-cache-update-safety-contract.json', 'config/w635-performance-cache-update-safety-contract.mjs', 'tests/unit/w635-performance-cache-update-safety.test.mjs'].every(exists), detail: 'contract/test set' }),
    freeze({ id: 'evidence-honesty', pass: W635_PERFORMANCE_CACHE_UPDATE_SAFETY_CONTRACT.productionCertified === false, detail: 'real browser/device/edge proof pending' })
  ];
  return freeze(checks);
}

function getAttr(tag, attribute) {
  const match = String(tag).match(new RegExp(`\\b${attribute}=["']([^"']+)["']`, 'i'));
  return match ? match[1] : '';
}
function normalizeAsset(value) {
  // Only same-origin files belong in the candidate filesystem. Protocol-relative
  // provider scripts (for example the reviewed guide-only Infolinks loader) are
  // external initial resources, not missing local build assets.
  if (!value || /^(?:https?:|data:|#|\/\/)/i.test(value)) return null;
  return value.split('#')[0].split('?')[0].replace(/^\/+/, '');
}
function initialAssets(html) {
  const refs = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = getAttr(tag, 'rel').toLowerCase();
    if (rel.includes('stylesheet') || rel.includes('modulepreload')) refs.push(normalizeAsset(getAttr(tag, 'href')));
  }
  for (const tag of html.match(/<script\b[^>]*\bsrc=[^>]*>/gi) || []) refs.push(normalizeAsset(getAttr(tag, 'src')));
  return [...new Set(refs.filter(Boolean))];
}
function gzipBytes(buffer) { return zlib.gzipSync(buffer).length; }

export function inspectW635BuildPerformance({ distDirectory = path.join(root, 'dist') } = {}) {
  const files = [];
  for (const file of W635_PUBLIC_FILES) {
    const absolute = path.join(distDirectory, file);
    const budget = getW635FileBudget(file);
    if (!fs.existsSync(absolute)) {
      files.push(freeze({ file, owner: budget?.owner || '', ok: false, initialTransferGzipBytes: 0, budgetBytes: budget?.initialTransferGzipBytes || 0, missing: [file] }));
      continue;
    }
    const raw = fs.readFileSync(absolute);
    const html = raw.toString('utf8');
    const refs = initialAssets(html);
    let transfer = gzipBytes(raw);
    const missing = [];
    for (const ref of refs) {
      const asset = path.join(distDirectory, ref);
      if (!fs.existsSync(asset)) { missing.push(ref); continue; }
      transfer += gzipBytes(fs.readFileSync(asset));
    }
    files.push(freeze({
      file,
      owner: budget.owner,
      ok: missing.length === 0 && transfer <= budget.initialTransferGzipBytes,
      htmlBytes: raw.length,
      initialAssetCount: refs.length,
      initialTransferGzipBytes: transfer,
      budgetBytes: budget.initialTransferGzipBytes,
      headroomBytes: budget.initialTransferGzipBytes - transfer,
      missing: freeze(missing)
    }));
  }
  const distWorkerPath = path.join(distDirectory, 'sw.js');
  const distWorker = fs.existsSync(distWorkerPath) ? fs.readFileSync(distWorkerPath, 'utf8') : '';
  const distWorkerSha256 = distWorker ? crypto.createHash('sha256').update(distWorker).digest('hex') : '';
  let provenance = null;
  try { provenance = JSON.parse(fs.readFileSync(path.join(distDirectory, 'build-provenance.json'), 'utf8')); } catch {}
  const distReleaseId = distWorker.match(/const RELEASE_ID\s*=\s*[\"']([^\"']+)[\"']/)?.[1] || '';
  const serviceWorkerContractInBuild = Boolean(
    distWorker
    && /^w\d+-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(distReleaseId)
    && distWorker.includes('EONAPP_APPLY_UPDATE')
    && distWorker.includes('EONAPP_SW_ACTIVATED')
    && distWorker.includes('eonapp-shell-')
    // Minification may normalize the declaration's quote style in dist.
    && /PERSISTENT_CITY_ASSET_CACHE\s*=\s*['\"]eonapp-city-assets-v1['\"]/.test(distWorker)
    && distWorker.includes('isPersistentContentHashedCityAsset')
    && distWorker.includes('/offline.html')
    && provenance?.city?.serviceWorkerSha256 === distWorkerSha256
  );
  const result = freeze({
    schema: 'eonapp.gate.w635.build-performance.2026-07-11.v1',
    wave: 'W635',
    ok: files.every((row) => row.ok) && serviceWorkerContractInBuild,
    publicFileCount: files.length,
    maxInitialTransferGzipBytes: Math.max(...files.map((row) => row.initialTransferGzipBytes)),
    files: freeze(files),
    serviceWorkerContractInBuild,
    serviceWorkerSha256: distWorkerSha256 || null,
    serviceWorkerReleaseId: distReleaseId || null,
    productionCertified: false,
    limitations: freeze(['Static build transfer accounting only; Lighthouse, Cloudflare edge, offline and installed-device evidence remains pending.'])
  });
  return result;
}

export function inspectW635PerformanceCacheUpdateSafety({ writeArtifact = false } = {}) {
  const checks = sourceChecks();
  const result = freeze({
    schema: 'eonapp.gate.w635.performance-cache-update-safety.2026-07-11.v1',
    wave: 'W635',
    ok: checks.every((row) => row.pass),
    total: checks.length,
    passed: checks.filter((row) => row.pass).length,
    checks,
    productionCertified: false,
    limitations: freeze(['Source certification only.', ...W635_PERFORMANCE_CACHE_UPDATE_SAFETY_CONTRACT.externalEvidenceRequired])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts/w635-performance-cache-update-safety');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'source-receipt.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

export function runW635BuildPerformanceGate({ writeArtifact = true } = {}) {
  const result = inspectW635BuildPerformance();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts/w635-performance-cache-update-safety');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'build-receipt.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const buildMode = process.argv.includes('--build');
  const result = buildMode ? runW635BuildPerformanceGate() : inspectW635PerformanceCacheUpdateSafety({ writeArtifact: true });
  if (buildMode) {
    for (const row of result.files) console.log(`${row.ok ? 'PASS' : 'FAIL'} ${row.file} — ${row.initialTransferGzipBytes}/${row.budgetBytes} gzip bytes; ${row.initialAssetCount || 0} initial assets`);
    console.log(`\nW635 build performance: ${result.files.filter((row) => row.ok).length}/${result.publicFileCount}; max ${result.maxInitialTransferGzipBytes} gzip bytes`);
  } else {
    for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id} — ${check.detail}`);
    console.log(`\nW635 source cache/update safety: ${result.passed}/${result.total}`);
  }
  if (!result.ok) process.exitCode = 1;
}
