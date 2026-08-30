#!/usr/bin/env node
import fs from 'node:fs';
import { buildEonCityW690CompleteCoreIdentityPlan } from '../assets/js/city/w690/eon-city-w690-complete-core-identity.js';
import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from '../assets/js/city/eon-city-connected-core.js';
import { buildEonCityW711DistrictStreetIdentity, getEonCityW711DistrictStreetIdentityTruth, validateEonCityW711DistrictStreetIdentity } from '../assets/js/city/w711/eon-city-w711-district-street-identity.js';
const renderer = fs.readFileSync(new URL('../assets/js/city/eon-city-connected-core-babylon.js', import.meta.url), 'utf8');
const product = fs.readFileSync(new URL('../assets/js/city/w659n/eon-city-w659n-product-layer.js', import.meta.url), 'utf8');
const sourceCss = fs.readFileSync(new URL('../assets/css/eon-city-product-layer.css', import.meta.url), 'utf8');
const publicCss = fs.readFileSync(new URL('../public/assets/css/eon-city-product-layer.css', import.meta.url), 'utf8');
const productLayer = fs.readFileSync(new URL('../assets/js/city/w659n/eon-city-w659n-product-layer.js', import.meta.url), 'utf8');
const productCss = fs.readFileSync(new URL('../assets/css/eon-city-product-layer.css', import.meta.url), 'utf8');
const publicProductCss = fs.readFileSync(new URL('../public/assets/css/eon-city-product-layer.css', import.meta.url), 'utf8');
const plan = buildEonCityW711DistrictStreetIdentity({ districts: buildEonCityW690CompleteCoreIdentityPlan().districts });
const core = buildEonCityConnectedCorePlan();
const truth = getEonCityW711DistrictStreetIdentityTruth();
const checks = [
  ['nine-distinct-street-identities', validateEonCityW711DistrictStreetIdentity(plan).ok && plan.uniqueFormCount === 9],
  ['purpose-frontages', plan.districts.every((entry) => entry.functionalFrontageCount >= 2 && entry.terminalCount >= 2)],
  ['arrival-boulevards-and-gateways', plan.districts.every((entry) => entry.boulevard.length > 0 && entry.identityGateway.pylonLeft && entry.identityGateway.pylonRight)],
  ['four-wayfinding-targets', plan.wayfindingMarkerCount === 36],
  ['connected-core-integration', core.districtStreetIdentity.districtCount === 9 && validateEonCityConnectedCorePlan(core).ok],
  ['purpose-visible-in-existing-hud', /W711_STREET_IDENTITY_BY_DISTRICT/.test(product) && /streetIdentity\?\.purposeLine/.test(product) && /data-eon-w711-form/.test(sourceCss) && sourceCss === publicCss],
  ['existing-scene-renderer', /district-street-signature-landmark/.test(renderer) && /district-street-wayfinding-marker/.test(renderer) && !/new Engine\(|new Scene\(|createElement\(['"]canvas/.test(renderer)],
  ['purpose-visible-before-panel', /W711_STREET_IDENTITY_BY_DISTRICT/.test(productLayer) && /streetIdentity\?\.purposeLine/.test(productLayer) && /data-eon-w711-form/.test(productCss) && productCss === publicProductCss],
  ['truth-boundaries', truth.existingFunctionalBuildingsRetained && !truth.newAssetDownloadRequired && !truth.automaticNavigation && !truth.automaticExecution && !truth.readsPrivateWork]
];
for (const [id, pass] of checks) console.log(`[W711] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W711] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
