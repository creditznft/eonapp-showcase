#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { EON_CITY_W659F_FUNCTIONAL_ASSETS, validateEonCityW659fFunctionalAssetManifest } from '../assets/js/city/w659f/eon-city-w659f-functional-asset-manifest.js';
import { validateEonCityW659gFunctionalStations } from '../assets/js/city/w659g/eon-city-w659g-functional-station-registry.js';
import { validateEonCityW659gNpcOperators } from '../assets/js/city/w659g/eon-city-w659g-npc-operator-registry.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const sha256 = (relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
const requireDist = process.argv.includes('--require-dist');
const checks = [];
const check = (id, pass, detail = '') => checks.push(Object.freeze({ id, pass: Boolean(pass), detail: String(detail) }));

const access = read('assets/js/city/eon-city-access-station.js');
const core = read('assets/js/city/eon-city-play-core.js');
const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
const functionalRuntime = read('assets/js/city/w659f/eon-city-w659f-functional-asset-runtime.js');
const sync = read('scripts/sync-public-assets.mjs');
const manifest = validateEonCityW659fFunctionalAssetManifest();
const stations = validateEonCityW659gFunctionalStations();
const npcs = validateEonCityW659gNpcOperators();

check('six-anchor-manifest', manifest.ok && manifest.count === 6, manifest.errors?.join(',') || 'six assets');
check('six-functional-stations', stations.ok && stations.stationCount === 6, stations.errors?.join(',') || 'six stations');
check('complete-npc-role-coverage', npcs.ok && npcs.roleCount === 13 && npcs.effectiveCharacterCount === 14 && npcs.coveredCharacterCount === 14, npcs.errors?.join(',') || `${npcs.coveredCharacterCount}/${npcs.effectiveCharacterCount} characters across ${npcs.roleCount} roles`);
check('authorized-core-only-entry', (access.match(/import\('\.\/eon-city-play-core\.js'\)/g) || []).length === 1 && !access.includes('eon-city-runtime-owner.js'), 'one core import; legacy owner excluded');
check('progressive-product-import', core.includes("import('./w659n/eon-city-w659n-product-layer.js')") && core.indexOf("import('./w649/eon-city-w649-babylon-core-runtime.js')") < core.indexOf('void startProductLayer()') && core.indexOf("import('./w649/eon-city-w649-district-runtime.js')") < core.indexOf('void startProductLayer()'), 'W649 before W659N');
check('one-babylon-owner', (core.match(/runRenderLoop/g) || []).length === 1 && !product.includes('runRenderLoop'), 'core owns render loop');
check('six-system-bindings', ['bindEonCityW659gProgression','bindEonCityW659gCreatorCapture','bindEonCityW659gMembershipConsole','bindEonCitySharingCenter','bindEonCityEonbotQuickWork','bindEonCityW659hOverlayCoordinator'].every((token) => product.includes(token)), 'progression/capture/membership/share/eonbot/overlay');
check('agent-and-transit-bindings', product.includes('createEonCityGenuineAgentTheatreController') && product.includes('createEonCityW659fTransportRuntime'), 'Agent Theatre + Transit');
check('collision-and-disposal', product.includes('createEonCityW659fCollisionRegistry') && core.includes('productLayer?.resolveMovement') && core.includes('productLayer?.dispose'), 'fixed collision + disposal');
check('district-residency-all-qualities', functionalRuntime.includes('preferFallbackVariant') && functionalRuntime.includes('districtResidencyEnabled') && functionalRuntime.includes('cinematicAllAssetsPinned: false') && functionalRuntime.includes('left-district-residency'), 'lite uses fallback variants; all qualities stream by district');
check('non-recursive-residency-summary', core.includes('getCoreResidencySummary: readCoreResidencySummary') && product.includes('getCoreResidencySummary?.()') && !product.includes('coreRuntime?.getRuntimeSummary'), 'product residency cannot recurse through full core summary');
check('asset-public-sync', sync.includes("['assets/city/w659f', 'assets/city/w659f']") && sync.includes("['assets/css/eon-city-product-layer.css', 'assets/css/eon-city-product-layer.css']") && sync.includes("['assets/css/eon-city-auto-loader.css', 'assets/css/eon-city-auto-loader.css']"), 'runtime files emitted from public');

let totalBytes = 0;
for (const entry of EON_CITY_W659F_FUNCTIONAL_ASSETS) {
  for (const variantName of ['primary', 'fallback']) {
    const variant = entry.variants[variantName];
    const sourcePath = variant.path.replace(/^\//, '');
    const publicPath = `public/${sourcePath}`;
    check(`source:${entry.id}:${variantName}`, exists(sourcePath), sourcePath);
    check(`public:${entry.id}:${variantName}`, exists(publicPath), publicPath);
    if (exists(sourcePath)) {
      const stat = fs.statSync(path.join(root, sourcePath));
      totalBytes += stat.size;
      check(`bytes:${entry.id}:${variantName}`, stat.size === variant.bytes, `${stat.size}/${variant.bytes}`);
      check(`sha:${entry.id}:${variantName}`, sha256(sourcePath) === variant.sha256, variant.sha256);
    }
  }
}
check('asset-total-bytes', totalBytes === 7_600_660, String(totalBytes));
check('stylesheet-mirrors', exists('public/assets/css/eon-city-auto-loader.css') && exists('public/assets/css/eon-city-product-layer.css') && sha256('assets/css/eon-city-auto-loader.css') === sha256('public/assets/css/eon-city-auto-loader.css') && sha256('assets/css/eon-city-product-layer.css') === sha256('public/assets/css/eon-city-product-layer.css'), 'source/public byte parity');

if (requireDist) {
  check('dist-styles', exists('dist/assets/css/eon-city-auto-loader.css') && exists('dist/assets/css/eon-city-product-layer.css'), 'both dynamic styles emitted');
  for (const entry of EON_CITY_W659F_FUNCTIONAL_ASSETS) for (const variantName of ['primary', 'fallback']) {
    const sourcePath = entry.variants[variantName].path.replace(/^\//, '');
    check(`dist:${entry.id}:${variantName}`, exists(`dist/${sourcePath}`), `dist/${sourcePath}`);
  }
  const emittedProductChunk = exists('dist/assets') && fs.readdirSync(path.join(root, 'dist/assets')).some((name) => /^eon-city-w659n-product-layer-.*\.js$/.test(name));
  check('dist-product-chunk', emittedProductChunk, 'hashed W659N chunk');
}

const receipt = Object.freeze({ schema: 'eonapp.w659n.productive-city-gate.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, requireDist, assetBytes: totalBytes, checks: Object.freeze(checks) });
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const entry of checks) console.log(`${entry.pass ? 'PASS' : 'FAIL'} ${entry.id} — ${entry.detail}`);
  console.log(`\nW659N Productive City: ${receipt.passed}/${receipt.total}`);
  if (!receipt.ok) process.exitCode = 1;
}
export function inspectW659nProductiveCity() { return receipt; }
