import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  classifyEonOriginCache,
  getEonOriginStorageTruth,
  inspectEonOriginStorage
} from '../../assets/js/pwa/eon-origin-storage-authority.js';
import { inspectEonOfflineStorage } from '../../assets/js/eon-offline-manager.js';
import { buildEonDataSurvivalInventory } from '../../assets/js/data-survival/eon-data-survival-inventory.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const sha = (text) => createHash('sha256').update(text).digest('hex');

test('A15 I22 has one canonical service-worker source and two generated identical outputs', () => {
  const canonical = read('service-worker/eonapp-service-worker.js');
  const root = read('sw.js');
  const publicWorker = read('public/sw.js');
  assert.equal(root, canonical);
  assert.equal(publicWorker, canonical);
  assert.equal(sha(root), sha(publicWorker));
  assert.match(read('scripts/sync-public-assets.mjs'), /generateEonServiceWorker/);
  assert.doesNotMatch(read('scripts/sync-public-assets.mjs'), /\['sw\.js',\s*'sw\.js'\]/);
});

test('A15 I22 activation deletes only replaceable runtime/staging caches and preserves durable offline packs', () => {
  const worker = read('service-worker/eonapp-service-worker.js');
  assert.match(worker, /isReplaceableRuntimeCacheName\(key\).*CURRENT_EONAPP_CACHES/s);
  assert.match(worker, /isReplaceableStagingCacheName\(key\)/);
  assert.match(worker, /durableOfflineCachesPreservedDuringActivation/);
  assert.match(worker, /protectedBrowserDatabasesTouched:\s*false/);
  assert.doesNotMatch(worker, /indexedDB\.deleteDatabase|localStorage|sessionStorage/);
  const activation = worker.match(/sw\.addEventListener\('activate'[\s\S]*?sw\.addEventListener\('fetch'/)?.[0] || '';
  assert.doesNotMatch(activation, /isEonAppOwnedCacheName\(key\).*caches\.delete/s);
});

test('A15 I22 origin cache authority separates replaceable, durable and unowned caches', async () => {
  assert.equal(classifyEonOriginCache('eonapp-shell-r1'), 'replaceable-cache');
  assert.equal(classifyEonOriginCache('eonapp-offline-staging-temp'), 'replaceable-cache');
  assert.equal(classifyEonOriginCache('eonapp-offline-pack-digest'), 'durable-offline-cache');
  assert.equal(classifyEonOriginCache('eonapp-city-assets-v1'), 'durable-offline-cache');
  assert.equal(classifyEonOriginCache('other-app-cache'), 'unowned-cache');
  const result = await inspectEonOriginStorage({
    caches: { async keys() { return ['eonapp-shell-r1', 'eonapp-offline-pack-a', 'foreign']; } },
    indexedDb: { async databases() { return [{ name: 'eon-creator-library' }]; } }
  });
  assert.equal(result.replaceableCacheCount, 1);
  assert.equal(result.durableOfflineCacheCount, 1);
  assert.equal(result.unownedCacheCount, 1);
  assert.equal(result.protectedDatabaseCount, 1);
  assert.equal(result.serviceWorkerMayDeleteProtectedDatabases, false);
  assert.equal(result.valuesIncluded, false);
});

test('A15 I22 offline storage status includes redacted origin classification and requests persistence only explicitly', async () => {
  let persistCalls = 0;
  const navigatorRef = {
    storage: {
      async persist() { persistCalls += 1; return true; },
      async persisted() { return false; },
      async estimate() { return { usage: 25, quota: 100 }; }
    }
  };
  const status = await inspectEonOfflineStorage({ navigatorRef, requestPersistence: false });
  assert.equal(persistCalls, 0);
  assert.equal(status.storageUsageRatio, 0.25);
  assert.equal(status.originStorage.valuesIncluded, false);
  const requested = await inspectEonOfflineStorage({ navigatorRef, requestPersistence: true });
  assert.equal(persistCalls, 1);
  assert.equal(requested.storagePersistenceRequested, true);
});


test('A15 I22 data survival inventory distinguishes durable offline caches from replaceable runtime caches', async () => {
  const inventory = await buildEonDataSurvivalInventory({
    localStorage: null,
    sessionStorage: null,
    indexedDbNames: [],
    cacheNames: ['eonapp-shell-r1', 'eonapp-city-assets-v1', 'eonapp-offline-pack-digest']
  });
  const byName = new Map(inventory.items.filter((item) => item.medium === 'CacheStorage').map((item) => [item.name, item]));
  assert.equal(byName.get('eonapp-shell-r1')?.protectionClass, 'replaceable-cache');
  assert.equal(byName.get('eonapp-city-assets-v1')?.protectionClass, 'durable-offline-cache');
  assert.equal(byName.get('eonapp-offline-pack-digest')?.deletion, 'explicit-user-uninstall-only');
  assert.equal(inventory.declaredProtectionClasses.includes('durable-offline-cache'), true);
});

test('A15 I22 durable offline removal and update remain explicit while failed repair preserves the active pack', () => {
  const worker = read('service-worker/eonapp-service-worker.js');
  assert.match(worker, /EONAPP_OFFLINE_PACK_UNINSTALL/);
  assert.match(worker, /uninstallOfflinePack\(\{ explicitUserAction/);
  assert.match(worker, /if \(explicitUserAction !== true\) throw new Error\('explicit-user-action-required'\)/);
  assert.match(worker, /if \(!activated\)[\s\S]*caches\.delete\(finalName\)/);
  assert.match(worker, /previously active offline pack|previous working pack|previous\.cacheName/i);
  assert.match(worker, /EONAPP_APPLY_UPDATE[\s\S]*explicitUserAction === true/);
});

test('A15 I22 storage truth never models protected user records as service-worker cache data', () => {
  const truth = getEonOriginStorageTruth();
  assert.equal(truth.serviceWorkerSourceGenerated, true);
  assert.equal(truth.serviceWorkerMayReadUserRecordValues, false);
  assert.equal(truth.serviceWorkerMayDeleteProtectedDatabases, false);
  assert.equal(truth.activationDeletesReplaceableCachesOnly, true);
  assert.equal(truth.unknownCachesPreserved, true);
});
