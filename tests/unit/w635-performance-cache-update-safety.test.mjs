import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { registerEonServiceWorker } from '../../assets/js/utils/eon-service-worker-registration.js';
import {
  getW635FileBudget,
  validateW635PerformanceCacheUpdateSafetyContract,
  W635_PUBLIC_FILES,
  W635_THEME_BOOTSTRAP_RELEASE
} from '../../config/w635-performance-cache-update-safety-contract.mjs';
import { inspectW635PerformanceCacheUpdateSafety } from '../../scripts/w635-performance-cache-update-safety-gate.mjs';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W635 owns every current public document with a bounded initial-transfer budget', () => {
  const validation = validateW635PerformanceCacheUpdateSafetyContract();
  assert.equal(validation.ok, true);
  assert.equal(W635_PUBLIC_FILES.length, 49);
  for (const file of W635_PUBLIC_FILES) {
    const budget = getW635FileBudget(file);
    assert.ok(budget);
    assert.ok(budget.initialTransferGzipBytes >= 30000);
    assert.ok(budget.initialTransferGzipBytes <= 110000);
  }
});

test('W635 central registration bypasses the HTTP cache and never auto-applies an update', async () => {
  let call = null;
  const registration = { scope: 'https://eonapp.ch/' };
  const result = await registerEonServiceWorker({ navigatorRef: { serviceWorker: { register: async (...args) => { call = args; return registration; } } } });
  assert.equal(result.ok, true);
  assert.deepEqual(call, ['/sw.js', { scope: '/', updateViaCache: 'none' }]);
  assert.equal(result.automaticUpdateApplication, false);
  assert.equal(result.automaticReload, false);
  const unavailable = await registerEonServiceWorker({ navigatorRef: {} });
  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.reason, 'service-worker-unavailable');
});

test('W635 service worker reads only release-scoped app caches and rejects unsafe responses', () => {
  const source = read('sw.js');
  assert.doesNotMatch(source, /\bcaches\.match\s*\(/);
  assert.match(source, /matchCurrentCache\(PAGE_CACHE/);
  assert.match(source, /matchCurrentCache\(ASSET_CACHE/);
  assert.match(source, /PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'/);
  assert.match(source, /isPersistentContentHashedCityAsset/);
  assert.match(source, /persistentCityAssetCacheFirst/);
  assert.match(source, /response\.redirected/);
  assert.match(source, /no-store\|private\|no-cache/);
  assert.match(source, /if \(url\.search\) return staticNetworkOnly/);
  assert.match(source, /cache\.addAll\(CRITICAL_PRECACHE/);
});

test('W635 requires separate explicit activation and reload actions', () => {
  const manager = read('assets/js/eon-pwa-manager.js');
  const profile = read('assets/js/profile-page.js');
  const worker = read('sw.js');
  assert.match(manager, /applyEonPwaUpdate\(\{ explicitUserAction = false \}/);
  assert.match(manager, /reloadEonPwaAfterUpdate\(\{ explicitUserAction = false/);
  assert.match(worker, /explicitUserAction === true/);
  assert.match(profile, /Reload updated app/);
  assert.doesNotMatch(manager, /controllerchange[\s\S]{0,350}location\.reload/);
});

test('W635 version-busts the one stable bootstrap and defers optional shell workloads', () => {
  const shell = read('assets/js/eon-app-shell.js');
  assert.doesNotMatch(shell, /^import .*eon-share-sheet/m);
  assert.doesNotMatch(shell, /^import .*eonbot-job-activity-bridge/m);
  assert.match(shell, /openShellShareSheet/);
  assert.match(shell, /scheduleWorkflowBridges/);
  for (const file of W635_PUBLIC_FILES) {
    const html = read(file);
    if (html.includes('eon-theme-bootstrap.js')) assert.match(html, new RegExp(`eon-theme-bootstrap\\.js\\?release=${W635_THEME_BOOTSTRAP_RELEASE}`));
  }
});

test('W635 source gate passes while production and physical evidence remain pending', () => {
  const result = inspectW635PerformanceCacheUpdateSafety({ writeArtifact: false });
  assert.equal(result.ok, true, result.checks.filter((row) => !row.pass).map((row) => `${row.id}: ${row.detail}`).join('\n'));
  assert.equal(result.productionCertified, false);
  assert.match(result.limitations.join(' '), /cloudflare|installed|device/i);
});

test('W635 build accounting excludes protocol-relative third-party provider resources from the local candidate graph', () => {
  const gate = read('scripts/w635-performance-cache-update-safety-gate.mjs');
  assert.match(gate, /https\?:\|data:\|#\|\\\/\\\//);
});

test('W759 keeps the bounded install page on its focused explicit PWA controller', () => {
  const install = read('install.html');
  const controller = read('assets/js/install-page.js');
  assert.match(install, /assets\/js\/install-page\.js/);
  assert.doesNotMatch(install, /assets\/js\/eon-app-shell\.js/);
  assert.match(install, /data-eon-install-request/);
  assert.match(install, /data-eon-install-status/);
  assert.match(controller, /initEonPwaManager/);
  assert.match(controller, /requestEonPwaInstall/);
  assert.doesNotMatch(controller, /eon-app-shell/);
});
