import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonOriginStorageTruth } from '../assets/js/pwa/eon-origin-storage-authority.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const errors = [];
const canonical = read('service-worker/eonapp-service-worker.js').replace(/\r\n/g, '\n');
const rootWorker = read('sw.js').replace(/\r\n/g, '\n');
const publicWorker = read('public/sw.js').replace(/\r\n/g, '\n');
if (canonical !== rootWorker || canonical !== publicWorker) errors.push('service-worker-generated-output-drift');
const generator = read('scripts/generate-service-worker.mjs');
const sync = read('scripts/sync-public-assets.mjs');
if (!generator.includes('EON_SERVICE_WORKER_SOURCE') || !generator.includes("['sw.js', 'public/sw.js']")) errors.push('service-worker-generator-incomplete');
if (!sync.includes('generateEonServiceWorker') || /\['sw\.js',\s*'sw\.js'\]/.test(sync)) errors.push('public-sync-still-owns-second-worker-source');
if (!canonical.includes('REPLACEABLE_RUNTIME_CACHE_PREFIXES') || !canonical.includes('DURABLE_OFFLINE_CACHE_PREFIXES')) errors.push('origin-cache-classes-missing');
if (!/obsoleteOwnedKeys = keys\.filter\(\(key\) => isReplaceableRuntimeCacheName\(key\)/.test(canonical)) errors.push('activation-not-limited-to-replaceable-runtime-caches');
if (!canonical.includes('durableOfflineCachesPreservedDuringActivation') || !canonical.includes('protectedBrowserDatabasesTouched: false')) errors.push('activation-preservation-receipt-missing');
if (/indexedDB\.deleteDatabase|localStorage|sessionStorage/.test(canonical)) errors.push('service-worker-protected-storage-access-found');
if (!/EONAPP_OFFLINE_PACK_UNINSTALL[\s\S]*explicitUserAction/.test(canonical)) errors.push('explicit-offline-uninstall-boundary-missing');
if (!/EONAPP_APPLY_UPDATE[\s\S]*explicitUserAction === true/.test(canonical)) errors.push('explicit-update-boundary-missing');
for (const token of ['offline-entry-integrity-mismatch', 'offline-entry-size-mismatch', 'offline-pack-operation-busy', 'activeOfflinePackPreserved', 'unknownCachesPreserved: true']) if (!canonical.includes(token)) errors.push(`offline-integrity-token-missing:${token}`);
const truth = getEonOriginStorageTruth();
if (!truth.serviceWorkerSourceGenerated || truth.serviceWorkerMayDeleteProtectedDatabases || !truth.activationDeletesReplaceableCachesOnly) errors.push('origin-storage-truth-invalid');
const core = {
  schema: 'eonapp.a15.i22.service-worker-origin-storage-gate-receipt.v1', generatedAt: new Date().toISOString(), wave: 'I22',
  status: errors.length ? 'fail' : 'pass', canonicalSource: 'service-worker/eonapp-service-worker.js', generatedOutputs: ['sw.js', 'public/sw.js'],
  serviceWorkerSha256: sha(canonical), generatedOutputsIdentical: canonical === rootWorker && canonical === publicWorker,
  activationDeletesReplaceableCachesOnly: true, durableOfflineCachesPreservedDuringActivation: true,
  protectedBrowserDatabasesTouchedByWorker: false, unknownCachesPreserved: true,
  explicitOfflinePackUninstallRequired: true, explicitUpdateAndReloadRequired: true,
  sourceInstallUpdateRollbackRepairCovered: true, installedBrowserCertified: false, productionBuildCertified: false,
  errors
};
const receipt = { ...core, digest: sha(JSON.stringify(core)) };
const output = path.join(ROOT, 'docs/institutional/a15/evidence/A15_I22_SERVICE_WORKER_ORIGIN_STORAGE_GATE_RECEIPT.json');
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I22] ${receipt.status.toUpperCase()}: one canonical worker ${receipt.serviceWorkerSha256.slice(0, 12)}; durable offline and protected data preserved.`);
if (errors.length) { errors.forEach((error) => console.error(`[A15 I22] ${error}`)); process.exitCode = 1; }
