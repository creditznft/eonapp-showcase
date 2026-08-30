import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getW634PublicFiles, W634_ROUTE_LAYOUT_OWNERS } from './w634-responsive-accessibility-input-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = Object.freeze(JSON.parse(fs.readFileSync(path.join(root, 'config/w635-performance-cache-update-safety-contract.json'), 'utf8')));

export const W635_PERFORMANCE_CACHE_UPDATE_SAFETY_CONTRACT = contract;
export const W635_PUBLIC_FILES = getW634PublicFiles();
export const W635_THEME_BOOTSTRAP_RELEASE = 'w722-2026-07-27';
export const W635_FILE_BUDGETS = Object.freeze(Object.fromEntries(Object.entries(W634_ROUTE_LAYOUT_OWNERS).flatMap(([owner, files]) => files.map((file) => [file, Object.freeze({ owner, initialTransferGzipBytes: contract.initialTransferGzipBudgets[owner] })]))));

export function getW635FileBudget(file = '') {
  return W635_FILE_BUDGETS[String(file || '')] || null;
}

export function validateW635PerformanceCacheUpdateSafetyContract() {
  const checks = [];
  const add = (id, pass, detail = '') => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  add('identity', contract.wave === 'W635' && /w635\.performance-cache-update-safety/.test(contract.schema), contract.schema);
  add('release-id', /^w635-2026-07-11-[a-z0-9-]+$/.test(contract.releaseId), contract.releaseId);
  add('public-file-count', W635_PUBLIC_FILES.length === 49 && Object.keys(W635_FILE_BUDGETS).length === 49, `${W635_PUBLIC_FILES.length}/49`);
  add('budget-owner-count', Object.keys(contract.initialTransferGzipBudgets || {}).length === 6, `${Object.keys(contract.initialTransferGzipBudgets || {}).length}/6`);
  add('positive-budgets', Object.values(contract.initialTransferGzipBudgets || {}).every((value) => Number.isInteger(value) && value >= 30000 && value <= 110000), JSON.stringify(contract.initialTransferGzipBudgets));
  add('bounded-caches', contract.cache.assetEntriesMax === 160 && contract.cache.pageEntriesMax === 32 && contract.cache.persistentCityAssetEntriesMax === 192 && contract.cache.navigationTimeoutMs === 4500, '160/32/192/4500');
  add('cache-fences', contract.cache.currentReleaseCacheReadsOnly === true && contract.cache.persistentContentAddressedCacheReadsOnly === true && contract.cache.persistentContentAddressedCaches?.includes('eonapp-city-assets-v1') && contract.cache.redirectResponsesStored === false && contract.cache.privateOrNoStoreResponsesStored === false && contract.cache.queryBearingAssetsStored === false && contract.cache.unknownCachesDeleted === false, 'fail-closed cache rules');
  add('explicit-update', contract.update.registrationUpdateViaCache === 'none' && contract.update.explicitActivationActionRequired === true && contract.update.explicitReloadActionRequired === true && contract.update.automaticActivation === false && contract.update.automaticReload === false, 'two user actions');
  add('source-check-count', contract.requiredSourceChecks?.length === 10, `${contract.requiredSourceChecks?.length || 0}/10`);
  add('external-evidence-count', contract.externalEvidenceRequired?.length === 7 && contract.productionCertified === false, `${contract.externalEvidenceRequired?.length || 0}/7; production false`);
  return Object.freeze({
    schema: 'eonapp.validation.w635.performance-cache-update-safety.2026-07-11.v1',
    wave: 'W635',
    ok: checks.every((row) => row.pass),
    total: checks.length,
    passed: checks.filter((row) => row.pass).length,
    checks: Object.freeze(checks),
    publicFileCount: W635_PUBLIC_FILES.length,
    productionCertified: false
  });
}
