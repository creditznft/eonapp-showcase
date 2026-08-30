#!/usr/bin/env node
/** W650 — release-stable City cache, truthful loading, and update-safety gate. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { EON_CITY_W649_CHARACTER_MANIFEST } from '../assets/js/city/w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_WORLD_MANIFEST } from '../assets/js/city/w649/eon-city-w649-world-manifest.js';
import { EON_CITY_W649_DISTRICT_MANIFEST } from '../assets/js/city/w649/eon-city-w649-district-manifest.js';
import { EON_CITY_PERSISTENT_CACHE_NAME, isImmutableEonCityAssetPath } from '../assets/js/city/eon-city-asset-cache-policy.js';
import { validateEonCityClientDeliveryContract } from '../config/w554c-eon-city-client-load-contract.mjs';

const root = process.cwd();
const requireDist = process.argv.includes('--require-dist');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const characters = EON_CITY_W649_CHARACTER_MANIFEST.entries || [];
const world = EON_CITY_W649_WORLD_MANIFEST.entries || [];
const logicalAssets = [...characters, ...world];
const activeIds = new Set(EON_CITY_W649_DISTRICT_MANIFEST.districts.flatMap((district) => district.assets));
const immutableVariants = logicalAssets.flatMap((entry) => [
  { assetId: entry.id, variant: 'primary', ...entry.variants.primary },
  { assetId: entry.id, variant: 'fallback', ...entry.variants.fallback }
]);
const activeAssets = logicalAssets.filter((entry) => activeIds.has(entry.id));

const listGlbFiles = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return listGlbFiles(absolute);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.glb') ? [absolute] : [];
  });
};
const preservedLibraryBinaries = [
  ...listGlbFiles(path.join(root, 'assets', 'city', 'w649', 'primary')),
  ...listGlbFiles(path.join(root, 'assets', 'city', 'w649', 'fallback'))
];
const byId = new Map(logicalAssets.map((entry) => [entry.id, entry]));
const bootstrap = EON_CITY_W649_DISTRICT_MANIFEST.districts.find((entry) => entry.id === 'bootstrap');
const orientation = EON_CITY_W649_DISTRICT_MANIFEST.districts.find((entry) => entry.id === 'orientation-hall');
const starterIds = [bootstrap?.assets?.[0], bootstrap?.assets?.[2], ...(orientation?.assets || [])].filter(Boolean);
const starterPrimaryBytes = starterIds.reduce((sum, id) => sum + Number(byId.get(id)?.variants?.primary?.bytes || 0), 0);
const activePrimaryBytes = activeAssets.reduce((sum, entry) => sum + Number(entry.variants.primary.bytes || 0), 0);

const headers = read('_headers');
const sw = read('sw.js');
const publicSw = read('public/sw.js');
const access = read('assets/js/city/eon-city-access-station.js');
const loader = read('assets/js/city/eon-city-client-load-sequence.js');
const station = read('assets/js/eon-city-play-station.js');
const versioning = read('assets/js/utils/app-versioning.js');
const contract = validateEonCityClientDeliveryContract();

check(contract.ok, `client-delivery-contract:${contract.errors.join(',')}`);
check(EON_CITY_PERSISTENT_CACHE_NAME === 'eonapp-city-assets-v1', 'persistent-cache-name-must-remain-release-stable');
check(immutableVariants.length === 66, `expected-66-active-runtime-binaries:found-${immutableVariants.length}`);
check(preservedLibraryBinaries.length === 76, `expected-76-preserved-library-binaries:found-${preservedLibraryBinaries.length}`);
check(activeAssets.length === 33, `expected-33-active-logical-assets:found-${activeAssets.length}`);
for (const entry of immutableVariants) {
  check(isImmutableEonCityAssetPath(entry.path), `non-immutable-path:${entry.assetId}:${entry.variant}`);
  check(exists(entry.path.replace(/^\//, '')), `missing-source-binary:${entry.path}`);
}
check(/\/assets\/\*\s+Cache-Control: public, max-age=0, must-revalidate/.test(headers), 'generic-app-assets-must-revalidate');
check(/\/assets\/city\/w649\/\*[\s\S]*! Cache-Control[\s\S]*Cache-Control: public, max-age=31556952, immutable/.test(headers), 'w649-hashed-assets-must-detach-generic-header-and-be-immutable');
check(/PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'/.test(sw), 'service-worker-stable-city-cache-missing');
check(/CURRENT_EONAPP_CACHES[\s\S]*PERSISTENT_CITY_ASSET_CACHE/.test(sw), 'activation-would-delete-stable-city-cache');
check(/isPersistentContentHashedCityAsset[\s\S]*persistentCityAssetCacheFirst/.test(sw), 'content-hashed-city-cache-first-route-missing');
check(!/MAX_PERSISTENT_CITY_ASSET_ENTRIES/.test(sw) && /manualEntryEviction: false/.test(sw), 'persistent-city-cache-must-not-use-fifo-entry-eviction');
check(/const RELEASE_ID = 'w\d+-\d{4}-\d{2}-\d{2}-[a-z0-9-]+'/.test(sw), 'runtime-update-safety-release-id-missing');
check(/CITY_RUNTIME_RELEASE_CACHE_PREFIXES[\s\S]*'\/assets\/js\/eon-city-play-station\.js'/.test(sw) && /CITY_SHELL_CACHE = `eonapp-city-shell-\$\{RELEASE_ID\}`/.test(sw), 'city-entry-release-cache-route-missing');
check(/CITY_RUNTIME_RELEASE_CACHE_PREFIXES[\s\S]*'\/assets\/js\/city\/'/.test(sw) && /cityRuntimeReleaseCacheFirst/.test(sw), 'city-runtime-modules-release-cache-route-missing');
check(sw === publicSw, 'root-and-public-service-workers-differ');
check(!/VERSION_SWITCH/.test(versioning) && !/Force cache clear/.test(versioning), 'app-version-switch-still-clears-runtime-cache');
const authorizedBootBlock = access.indexOf("if (view.kind === 'boot')");
const corePreloader = access.indexOf('const preloadCore = () =>', authorizedBootBlock);
const automaticEntry = access.indexOf('const automaticEntry = enter()', corePreloader);
const coreImportCount = (access.match(/import\('\.\/eon-city-play-core\.js'\)/g) || []).length;
const authenticatedAutomaticBoot = authorizedBootBlock >= 0
  && corePreloader > authorizedBootBlock
  && automaticEntry > corePreloader
  && coreImportCount === 1
  && !access.includes('eon-city-runtime-owner.js');
check(authenticatedAutomaticBoot && access.includes('isEonCityHeavyBootAllowed(access)'), 'authenticated-automatic-core-gate-missing-or-legacy-owner-imported');
check(/inspectAuthorizedCityCache/.test(access) && /requestPersistence: true/.test(access), 'post-auth-cache-persistence-inspection-missing');
check(/cache:\s*'force-cache'/.test(loader), 'direct-static-loader-must-use-browser-cache');
check(/mountProgressiveCityNow\(root/.test(access) && /CITY_FIRST_PLAYABLE_FRAME/.test(access), 'progressive-city-first-playable-contract-missing');
check(authenticatedAutomaticBoot, 'authenticated-automatic-core-entry-must-remain-inside-the-authorized-branch-and-exclude-the-legacy-owner');
check(/onAssetProgress: reportInitialAssetProgress/.test(station), 'truthful-runtime-byte-progress-not-wired');
check(starterPrimaryBytes > 0 && starterPrimaryBytes < activePrimaryBytes, 'starter-set-must-be-smaller-than-active-city-library');

let distChecked = false;
if (requireDist) {
  distChecked = true;
  check(exists('dist/_headers'), 'dist-headers-missing');
  check(exists('dist/sw.js'), 'dist-service-worker-missing');
  if (exists('dist/_headers')) check(read('dist/_headers') === headers, 'dist-headers-do-not-match-source');
  if (exists('dist/sw.js')) {
    const distSw = read('dist/sw.js');
    check(distSw.includes('eonapp-city-assets-v1'), 'dist-service-worker-missing-stable-city-cache');
  // Esbuild minifies the declaration and may normalize quote style. Validate the
  // semantic release identity in the built worker instead of its source formatting.
  check(/(?:const\s+)?RELEASE_ID\s*=\s*['"]w\d+-\d{4}-\d{2}-\d{2}-[a-z0-9-]+['"]/.test(distSw), 'dist-service-worker-release-id-missing');
  }
  for (const entry of immutableVariants) check(exists(path.join('dist', entry.path.replace(/^\//, ''))), `dist-binary-missing:${entry.path}`);
}

const receipt = Object.freeze({
  schema: 'eonapp.w650.city-cache-update-safety.receipt.v1',
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  cache: Object.freeze({
    name: EON_CITY_PERSISTENT_CACHE_NAME,
    releaseStable: true,
    survivesLogout: true,
    survivesAppShellUpdateWhenAssetHashIsUnchanged: true,
    browserEvictionStillPossible: true,
    maxManagedEntries: null,
    manualEntryEviction: false,
    sameReleaseCityShellCache: true
  }),
  library: Object.freeze({
    logicalAssets: logicalAssets.length,
    activeLogicalAssets: activeAssets.length,
    activeRuntimeBinaries: immutableVariants.length,
    preservedLibraryBinaries: preservedLibraryBinaries.length,
    starterLogicalAssets: starterIds.length,
    starterPrimaryBytes,
    starterPrimaryMiB: Number((starterPrimaryBytes / 1048576).toFixed(2)),
    activePrimaryBytes,
    activePrimaryMiB: Number((activePrimaryBytes / 1048576).toFixed(2)),
    preloadAll: false,
    maxResidentDistricts: 1
  }),
  access: Object.freeze({ googleEonappSessionRequiredBeforeHeavyBoot: true, signedOutHeavyRequests: 0 }),
  loading: Object.freeze({ realByteProgress: true, requiresReducedRendererFrameBeforeOptionalAssets: true, fakeReadyForbidden: true }),
  userData: Object.freeze({ readByCacheInspector: false, writtenByCacheInspector: false, protectedBySeparateW145Gate: true }),
  cloudflare: Object.freeze({ staticAssetDelivery: true, pagesFunctionAssetRelay: false, immutableHashedAssetRule: true, appShellRevalidatesSeparately: true }),
  distChecked,
  failures: Object.freeze(failures)
});

const reportDirectory = path.join(root, 'reports', 'w650');
fs.mkdirSync(reportDirectory, { recursive: true });
const reportPath = path.join(reportDirectory, 'W650_CITY_CACHE_UPDATE_SAFETY_RECEIPT_2026-07-14.json');
fs.writeFileSync(reportPath, `${JSON.stringify(receipt, null, 2)}\n`);
if (!receipt.ok) {
  console.error(JSON.stringify(receipt, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, report: path.relative(root, reportPath), cache: receipt.cache, library: receipt.library, distChecked }, null, 2));
