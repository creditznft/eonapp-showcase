import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildEonCityW711DistrictStreetIdentity,
  getEonCityW711DistrictStreetIdentityTruth,
  validateEonCityW711DistrictStreetIdentity
} from '../../assets/js/city/w711/eon-city-w711-district-street-identity.js';
import { buildEonCityW690CompleteCoreIdentityPlan } from '../../assets/js/city/w690/eon-city-w690-complete-core-identity.js';
import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from '../../assets/js/city/eon-city-connected-core.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
function plan() { return buildEonCityW711DistrictStreetIdentity({ districts: buildEonCityW690CompleteCoreIdentityPlan().districts }); }

test('W711 gives all nine districts a unique street silhouette and purpose identity', () => {
  const result = plan();
  const validation = validateEonCityW711DistrictStreetIdentity(result);
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(result.districtCount, 9);
  assert.equal(result.uniqueFormCount, 9);
  assert.equal(new Set(result.districts.map((entry) => entry.purposeLine)).size, 9);
  assert.equal(result.districts.every((entry) => entry.purposeLine.includes(' · ')), true);
});

test('W711 connects every station to a district arrival court and identity gateway', () => {
  for (const district of plan().districts) {
    assert.ok(district.boulevard.length > 0, district.id);
    assert.equal(district.boulevard.pedestrianSafe, true, district.id);
    assert.equal(district.boulevard.automaticNavigation, false, district.id);
    assert.ok(district.identityGateway.pylonLeft, district.id);
    assert.ok(district.identityGateway.pylonRight, district.id);
    assert.equal(district.arrivalCourt.reviewFirst, true, district.id);
  }
});

test('W711 provides four truthful wayfinding targets per district', () => {
  for (const district of plan().districts) {
    assert.equal(district.wayfinding.length, 4, district.id);
    assert.deepEqual(new Set(district.wayfinding.map((entry) => entry.actionKind)), new Set(['station','nexus','eonbot-dock','terminal']));
    assert.equal(district.functionalFrontageCount >= 2, true, district.id);
    assert.equal(district.terminalCount >= 2, true, district.id);
  }
});

test('W711 is deterministic and consumed by the canonical Connected Core', () => {
  assert.deepEqual(plan(), plan());
  const core = buildEonCityConnectedCorePlan();
  const validation = validateEonCityConnectedCorePlan(core);
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(core.districtStreetIdentity.schema, 'eon.city.district-street-identity.w711.v1');
  assert.equal(validation.districtStreetIdentityCount, 9);
});

test('W711 renderer creates distinct landmarks, gateways and wayfinding in the existing scene', () => {
  const source = read('assets/js/city/eon-city-connected-core-babylon.js');
  for (const token of ['district-arrival-boulevard','district-arrival-court','district-street-identity-gateway','district-street-signature-landmark','district-street-wayfinding-marker']) assert.match(source, new RegExp(token));
  for (const form of ['arrival-spire','signal-ring','review-steps','creator-frame','forge-stack','command-prism','knowledge-canopy','vault-monolith','civic-dome']) assert.match(source, new RegExp(form));
  assert.doesNotMatch(source, /new Engine\(|new Scene\(|createElement\(['"]canvas/);
});

test('W711 purpose line is visible in the active-district HUD before opening a panel', () => {
  const productLayer = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const css = read('assets/css/eon-city-product-layer.css');
  const publicCss = read('public/assets/css/eon-city-product-layer.css');
  assert.match(productLayer, /W711_STREET_IDENTITY_BY_DISTRICT/);
  assert.match(productLayer, /streetIdentity\?\.purposeLine/);
  assert.match(productLayer, /dataset\.eonW711Form/);
  assert.match(css, /W711 — street-readable district purpose/);
  assert.match(css, /data-eon-w711-form/);
  assert.equal(publicCss, css);
});

test('W711 exposes the current district purpose in the existing City HUD with source-public style parity', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const sourceCss = read('assets/css/eon-city-product-layer.css');
  const publicCss = read('public/assets/css/eon-city-product-layer.css');
  assert.match(product, /W711_STREET_IDENTITY_BY_DISTRICT/);
  assert.match(product, /dataset\.eonW711Form/);
  assert.match(product, /streetIdentity\?\.purposeLine/);
  assert.match(sourceCss, /data-eon-w711-form/);
  assert.equal(sourceCss, publicCss);
});

test('W711 truth reuses existing buildings and forbids hidden work or navigation', () => {
  const truth = getEonCityW711DistrictStreetIdentityTruth();
  assert.equal(truth.nineStreetReadableDistricts, true);
  assert.equal(truth.distinctGeometryBeforeOpeningPanel, true);
  assert.equal(truth.purposeLineMetadataPresent, true);
  assert.equal(truth.existingFunctionalBuildingsRetained, true);
  assert.equal(truth.newAssetDownloadRequired, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticExecution, false);
  assert.equal(truth.readsPrivateWork, false);
});
