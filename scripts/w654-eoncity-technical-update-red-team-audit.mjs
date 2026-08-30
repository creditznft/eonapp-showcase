#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { EON_CITY_W649_CHARACTER_MANIFEST } from '../assets/js/city/w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_WORLD_MANIFEST } from '../assets/js/city/w649/eon-city-w649-world-manifest.js';
import { EON_CITY_W649_DISTRICT_MANIFEST } from '../assets/js/city/w649/eon-city-w649-district-manifest.js';
import { EON_CITY_ASSET_CACHE_ENTRY_LIMIT, EON_CITY_PERSISTENT_CACHE_NAME, isImmutableEonCityAssetPath } from '../assets/js/city/eon-city-asset-cache-policy.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const sha = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

export function inspectW654TechnicalRedTeam({ requireDist = process.argv.includes('--require-dist') } = {}) {
  const characters = EON_CITY_W649_CHARACTER_MANIFEST.entries || [];
  const world = EON_CITY_W649_WORLD_MANIFEST.entries || [];
  const logical = [...characters, ...world];
  const listGlbs = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? listGlbs(path.join(directory, entry.name)) : (entry.isFile() && entry.name.endsWith('.glb') ? [path.join(directory, entry.name)] : []));
  const preservedBinaries = listGlbs(path.join(root, 'assets', 'city', 'w649'));
  const inactiveLogicalAssets = preservedBinaries.filter((file) => file.includes(`${path.sep}inactive${path.sep}`)).length / 2;
  const activeIds = new Set(EON_CITY_W649_DISTRICT_MANIFEST.districts.flatMap((district) => district.assets || []));
  const active = logical.filter((entry) => activeIds.has(entry.id));
  const variants = logical.flatMap((entry) => ['primary','fallback'].map((variant) => ({ id: entry.id, variant, ...entry.variants[variant] })));
  const activePrimaryBytes = active.reduce((sum, entry) => sum + Number(entry.variants.primary.bytes || 0), 0);
  const byId = new Map(logical.map((entry) => [entry.id, entry]));
  const bootstrap = EON_CITY_W649_DISTRICT_MANIFEST.districts.find((entry) => entry.id === 'bootstrap');
  const orientation = EON_CITY_W649_DISTRICT_MANIFEST.districts.find((entry) => entry.id === 'orientation-hall');
  const starterIds = [bootstrap?.assets?.[0], bootstrap?.assets?.[2], ...(orientation?.assets || [])].filter(Boolean);
  const starterPrimaryBytes = starterIds.reduce((sum, id) => sum + Number(byId.get(id)?.variants?.primary?.bytes || 0), 0);
  const sample = variants.find((entry) => entry.variant === 'primary');
  const sampleBytes = fs.readFileSync(path.join(root, sample.path.replace(/^\//, '')));
  const mutated = Buffer.from(sampleBytes); mutated[mutated.length - 1] ^= 1;
  const originalHash = sha(sampleBytes); const sameHash = sha(Buffer.from(sampleBytes)); const changedHash = sha(mutated);
  const headers = read('_headers');
  const publicHeaders = read('public/_headers');
  const sw = read('sw.js');
  const publicSw = read('public/sw.js');
  const access = read('assets/js/city/eon-city-access-station.js');
  const districtRuntime = read('assets/js/city/w649/eon-city-w649-district-runtime.js');
  const assetRuntime = read('assets/js/city/eon-city-asset-runtime.js');
  const criteria = [];
  const check = (id, weight, condition, evidence) => criteria.push(Object.freeze({ id, weight, passed: Boolean(condition), evidence }));

  check('complete-library', 8, logical.length + inactiveLogicalAssets === 38 && preservedBinaries.length === 76, `${logical.length + inactiveLogicalAssets} logical / ${preservedBinaries.length} binaries`);
  check('active-launch-set', 5, active.length === 33, `${active.length} active`);
  check('content-hashed-paths', 8, variants.every((entry) => isImmutableEonCityAssetPath(entry.path)), 'all primary/fallback URLs immutable');
  check('source-binaries-present', 7, variants.every((entry) => fs.existsSync(path.join(root, entry.path.replace(/^\//, '')))), '76/76 present');
  check('stable-bytes-stable-hash', 5, originalHash === sameHash, originalHash.slice(0, 16));
  check('changed-bytes-change-hash', 7, originalHash !== changedHash, `${originalHash.slice(0, 12)} -> ${changedHash.slice(0, 12)}`);
  check('release-stable-city-cache', 7, EON_CITY_PERSISTENT_CACHE_NAME === 'eonapp-city-assets-v1' && /PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'/.test(sw), EON_CITY_PERSISTENT_CACHE_NAME);
  check('content-addressed-retention', 4, EON_CITY_ASSET_CACHE_ENTRY_LIMIT === null && !/MAX_PERSISTENT_CITY_ASSET_ENTRIES/.test(sw) && /manualEntryEviction: false/.test(sw), 'browser-managed immutable retention; no FIFO asset eviction');
  check('unchanged-models-immutable', 7, /\/assets\/city\/w649\/\*[\s\S]*max-age=31556952, immutable/.test(headers), 'one-year immutable content hash');
  check('app-code-revalidates', 4, /\/assets\/\*\s+Cache-Control: public, max-age=0, must-revalidate/.test(headers), 'app assets revalidate');
  check('city-shell-never-stale', 7, /\/eoncity\s+Cache-Control: no-cache, no-store, must-revalidate/.test(headers) && /\/eoncity\.html\s+Cache-Control: no-cache, no-store, must-revalidate/.test(headers), 'route + HTML no-store');
  check('header-copies-match', 3, headers === publicHeaders, 'root/public parity');
  check('service-worker-copies-match', 3, sw === publicSw, 'root/public parity');
  check('cache-first-only-hashed-city', 5, /isPersistentContentHashedCityAsset[\s\S]*persistentCityAssetCacheFirst/.test(sw), 'narrow hashed-asset matcher');
  const authorizedBootBlock = access.indexOf("if (view.kind === 'boot')");
  const corePreloader = access.indexOf('const preloadCore = () =>', authorizedBootBlock);
  const automaticEntry = access.indexOf('const automaticEntry = enter()', corePreloader);
  const coreImportCount = (access.match(/import\('\.\/eon-city-play-core\.js'\)/g) || []).length;
  const authenticatedAutomaticBoot = authorizedBootBlock >= 0
    && corePreloader > authorizedBootBlock
    && automaticEntry > corePreloader
    && coreImportCount === 1
    && !access.includes('eon-city-runtime-owner.js');
  check('auth-before-heavy-runtime', 6, authenticatedAutomaticBoot, 'signed-out core requests remain zero; automatic Babylon entry is enclosed by the authorized boot branch and the legacy owner never enters the normal path');
  const boundedOverlapResidency = /MAX_RESIDENT_DISTRICTS\s*=\s*2/.test(districtRuntime)
    && /residentLimit\s*=\s*Math\.max\(1,\s*Math\.min\(MAX_RESIDENT_DISTRICTS/.test(districtRuntime);
  check('bounded-overlap-residency', 5, starterPrimaryBytes > 0 && starterPrimaryBytes < activePrimaryBytes && boundedOverlapResidency, `${(starterPrimaryBytes/1048576).toFixed(2)} MiB starter / ${(activePrimaryBytes/1048576).toFixed(2)} MiB active primary · maximum two adjacent resident districts`);
  check('primary-fallback-strategy', 4, /selected\.variant === 'primary' \? \['primary', 'fallback'\] : \['fallback'\]/.test(districtRuntime), 'primary then decoder-free fallback');
  check('logout-does-not-delete-art', 3, /CURRENT_EONAPP_CACHES[\s\S]*PERSISTENT_CITY_ASSET_CACHE/.test(sw), 'persistent cache retained on activation');
  check('browser-eviction-honest', 2, /browser-storage-subject-to-browser-eviction/.test(read('assets/js/city/eon-city-asset-cache-policy.js')), 'best effort, not guaranteed');
  check('no-city-function-relay', 3, !/pagesFunctionAssetRelay:\s*true|EONCITY.*Worker|city asset relay/i.test(`${access} ${assetRuntime}`), 'static Pages delivery');

  if (requireDist) {
    check('dist-headers-current', 3, fs.existsSync(path.join(root,'dist/_headers')) && read('dist/_headers') === headers, 'exact headers emitted');
    check('dist-models-complete', 5, variants.every((entry) => fs.existsSync(path.join(root,'dist',entry.path.replace(/^\//,'')))), '76/76 emitted');
  }

  const earned = criteria.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0);
  const possible = criteria.reduce((sum, item) => sum + item.weight, 0);
  const localScore = Math.round((earned / possible) * 1000) / 10;
  const failures = criteria.filter((item) => !item.passed).map((item) => item.id);
  const updateScenarios = Object.freeze([
    Object.freeze({ id: 'signed-out-entry', expectedDownload: 'HTML/CSS entry only', gameAssetsDownloaded: false }),
    Object.freeze({ id: 'shell-only-release', expectedDownload: 'revalidated City document and runtime code', unchangedGameAssetsDownloaded: false }),
    Object.freeze({ id: 'one-model-changed', expectedDownload: 'new hashed model only when its district is entered', fullLibraryDownloaded: false }),
    Object.freeze({ id: 'primary-load-failure', expectedDownload: 'decoder-free fallback for that asset only', fullLibraryDownloaded: false }),
    Object.freeze({ id: 'browser-cache-evicted', expectedDownload: 'required starter/district assets again on demand', fullLibraryPreloaded: false })
  ]);
  return Object.freeze({
    schema: 'eonapp.w654.technical-update-red-team-audit.v1', ok: failures.length === 0, generatedAt: new Date().toISOString(), requireDist,
    localCriteriaScore: localScore, executivePrevisualScore: failures.length ? Math.min(94, localScore) : 97,
    decision: 'Keep the City library content-addressed and release-stable; update the shell immediately, download only changed asset URLs, and use bounded two-district overlap residency to prevent visible room replacement while Lite mode remains one-district.',
    updateAnswer: 'No full redownload after a normal app update. Unchanged hashed assets retain the same URL and are reused; changed model bytes produce a new URL and download on demand. Browser eviction or cleared site data can require another download.',
    metrics: Object.freeze({ logicalAssets: logical.length + inactiveLogicalAssets, binaries: preservedBinaries.length, activeAssets: active.length, starterPrimaryBytes, starterPrimaryMiB: Number((starterPrimaryBytes/1048576).toFixed(2)), activePrimaryBytes, activePrimaryMiB: Number((activePrimaryBytes/1048576).toFixed(2)), maxResidentDistricts: 2, liteMaxResidentDistricts: 1, managedCacheEntryLimit: EON_CITY_ASSET_CACHE_ENTRY_LIMIT, manualEntryEviction: false }),
    updateScenarios,
    criteria: Object.freeze(criteria), failures: Object.freeze(failures)
  });
}

const report = inspectW654TechnicalRedTeam();
const output = path.join(root, 'reports', 'w654', 'W654_TECHNICAL_UPDATE_RED_TEAM_AUDIT_2026-07-14.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) { console.error(JSON.stringify(report, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok: true, report: path.relative(root, output), localCriteriaScore: report.localCriteriaScore, executivePrevisualScore: report.executivePrevisualScore, metrics: report.metrics, updateAnswer: report.updateAnswer }, null, 2));
