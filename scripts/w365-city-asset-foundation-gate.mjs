#!/usr/bin/env node
/** W365 — source gate for EON City Asset Foundation. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import {
  CITY_ASSET_CATALOG,
  CITY_ASSET_CATALOG_SCHEMA,
  CITY_ASSET_QUALITY_BUDGETS,
  getCityAssetCatalogSummary,
  getCityAssetLoadPlan,
  validateCityAssetCatalog
} from '../assets/js/city/eon-city-asset-catalog.js';
import { createCityAssetRuntime } from '../assets/js/city/eon-city-asset-runtime.js';
import { W365_CITY_ASSET_FOUNDATION_CONTRACT } from '../config/w365-city-asset-foundation-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const catalog = validateCityAssetCatalog();
const summary = getCityAssetCatalogSummary();
const planned = getCityAssetLoadPlan({ quality: 'balanced' });
const babylon = read('assets/js/city/eon-city-play-babylon.js');
const three = read('assets/js/city/eon-city-3d-renderer.js');
const runtime = read('assets/js/city/eon-city-asset-runtime.js');
const material = read('assets/js/city/eon-city-material-policy.js');
const catalogSource = read('assets/js/city/eon-city-asset-catalog.js');
const docs = read('docs/W365_CITY_ASSET_FOUNDATION_2026-06-26.md');
const assetReadme = read('assets/city/README.md');
const imports = auditActiveSurfaceImports({ root: ROOT });

check(CITY_ASSET_CATALOG_SCHEMA === 'eon.city.asset-catalog.w365.v1', 'W365 asset catalog schema is unexpected.');
check(catalog.ok, `W365 asset catalog failed validation: ${catalog.errors.join(' | ')}`);
check(CITY_ASSET_CATALOG.length >= 12, 'W365 needs a meaningful asset foundation, not a single placeholder.');
check(summary.shippedBinaryCount === 0, 'W365 must not claim unprovided binary assets are shipped.');
check(summary.byStatus.planned === CITY_ASSET_CATALOG.length, 'W365 entries must remain planned until provenance evidence and binaries exist.');
check(planned.shippedCount === 0 && planned.entries.every((entry) => entry.sourcePath === null && entry.loadable === false), 'W365 planned entries must resolve to local procedural fallbacks only.');
for (const [quality, budget] of Object.entries(CITY_ASSET_QUALITY_BUDGETS)) {
  check(budget.maxAssets > 0 && budget.maxAssets <= 14, `${quality} asset cap is unsafe.`);
  check(budget.maxTextureDimension <= 2048, `${quality} texture dimension cap is unsafe.`);
  check(budget.maxMaterialsPerAsset <= 8, `${quality} material budget is unsafe.`);
  check(budget.maxDrawCallsForAsset <= 90, `${quality} draw-call budget is unsafe.`);
}
for (const entry of CITY_ASSET_CATALOG) {
  check(entry.provenance.humanReviewRequired === true, `${entry.id} must require human visual/provenance review.`);
  check(entry.provenance.derivativeOfThirdParty === false, `${entry.id} cannot be a third-party derivative.`);
  check(entry.constraints.allowExternalNetwork === false, `${entry.id} cannot use remote network.`);
  check(entry.constraints.containsUserData === false, `${entry.id} cannot contain user data.`);
  check(entry.fallback.remoteNetwork === false && entry.fallback.userData === false, `${entry.id} fallback must be local and data-free.`);
}
check(!/https?:\/\//i.test(catalogSource), 'W365 catalog must not contain a remote asset URL.');
check(/loadBabylonAsset/.test(runtime) && /loadThreeAsset/.test(runtime) && /disposeBabylonCityAsset/.test(runtime) && /disposeThreeCityAsset/.test(runtime) && /cacheKey/.test(runtime) && /signal/.test(runtime), 'W365 lifecycle adapters are incomplete.');
check(/CITY_MATERIAL_POLICY_SCHEMA/.test(material) && /validateCityMaterialSpec/.test(material) && /remoteTexture/.test(material), 'W365 material policy is incomplete.');
check(/createCityAssetRuntime/.test(babylon) && /assetPipeline/.test(babylon) && /assetRuntime\.dispose/.test(babylon), 'Babylon must expose the W365 local asset lifecycle summary.');
check(/createCityAssetRuntime/.test(three) && /assetPipeline/.test(three) && /assetRuntime\?\.dispose/.test(three), 'Three.js must expose the W365 local asset lifecycle summary.');
check(/No binary art is included/i.test(docs) && /does not claim/i.test(docs), 'W365 documentation must disclose the current art limitations.');
check(/No binary art is included/i.test(assetReadme), 'The asset folder must explain its safe handoff rule.');
check(W365_CITY_ASSET_FOUNDATION_CONTRACT.releaseRules.prohibitRemoteNetwork === true, 'W365 contract must prohibit remote asset network access.');
check(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const runtimeInstance = createCityAssetRuntime({ engine: 'babylon', quality: 'balanced' });
let loaderCalls = 0;
const plannedLoad = await runtimeInstance.loadBabylonAsset('operator-hero', {
  loadAssetContainer: async () => { loaderCalls += 1; return null; }
});
check(plannedLoad.ok === false && plannedLoad.reason === 'asset-not-shipped-or-not-provenanced', 'Planned assets must be blocked before a loader is called.');
check(loaderCalls === 0, 'A planned asset must not invoke its loader adapter.');
runtimeInstance.dispose();
check(runtimeInstance.getSummary().disposed === true, 'Asset runtime must dispose deterministically.');

const report = {
  schema: 'eonapp.w365.city-asset-foundation-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  catalog: summary,
  loadPlan: { quality: planned.quality, plannedCount: planned.plannedCount, shippedCount: planned.shippedCount },
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  limitations: [
    'W365 proves source contracts and lifecycle adapters, not the quality or licence of a future binary asset.',
    'W365 ships no character, environment, prop, texture, animation or audio binary.',
    'No browser, device, GPU, production or human art review proof is created by this source gate.'
  ],
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W365_CITY_ASSET_FOUNDATION_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
