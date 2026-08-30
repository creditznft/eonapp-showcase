import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeEonCityDistrictId, getEonCityDistrictIdentity } from '../../assets/js/city/eon-city-district-identity.js';
import { createEonCityW659fTransportRuntime } from '../../assets/js/city/w659f/eon-city-w659f-transport-runtime.js';
import { EON_CITY_W659F_NPC_ROLES, validateEonCityW659fNpcRoles } from '../../assets/js/city/w659f/eon-city-w659f-npc-role-registry.js';
import {
  EON_CITY_W659G_NPC_OPERATORS,
  getEonCityW659gNpcActionsForDistrict,
  resolveEonCityW659gNpcOperatorsNearPosition,
  validateEonCityW659gNpcOperators
} from '../../assets/js/city/w659g/eon-city-w659g-npc-operator-registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('W659N P0 canonicalizes realm-relay to trade-dome before travel and receipts', () => {
  assert.equal(normalizeEonCityDistrictId('trade-dome'), 'trade-dome');
  assert.equal(normalizeEonCityDistrictId('realm-relay'), 'trade-dome');
  assert.deepEqual(getEonCityDistrictIdentity('realm-relay'), {
    schema: 'eon.city.district-identity.v1',
    requestedId: 'realm-relay',
    districtId: 'trade-dome',
    aliasApplied: true
  });
  let now = 10_000;
  const transport = createEonCityW659fTransportRuntime({ now: () => now });
  assert.equal(transport.listDestinations().some((entry) => entry.id === 'realm-relay'), false);
  assert.equal(transport.listDestinations().some((entry) => entry.id === 'trade-dome'), true);
  const review = transport.request('realm-relay', { explicitUserAction: true });
  assert.equal(review.ok, true);
  assert.equal(review.destination.id, 'trade-dome');
  now += 1;
  const result = transport.confirm(review.token, { explicitUserAction: true });
  assert.equal(result.receipt.destinationId, 'trade-dome');
});

test('W659N P0 uses one canonical NPC registry with exact assets, points, radii and pairings', () => {
  assert.equal(EON_CITY_W659G_NPC_OPERATORS, EON_CITY_W659F_NPC_ROLES);
  assert.equal(validateEonCityW659fNpcRoles().ok, true);
  const validation = validateEonCityW659gNpcOperators();
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(validation.count, EON_CITY_W659G_NPC_OPERATORS.length);
  assert.ok(validation.count >= 9);
  assert.equal(validation.canonicalRegistry, 'w659f-npc-role-registry');
  for (const entry of EON_CITY_W659G_NPC_OPERATORS) {
    assert.ok(entry.assetId, entry.id);
    assert.ok(Number.isFinite(entry.interactionPoint.x), entry.id);
    assert.ok(Number.isFinite(entry.interactionPoint.z), entry.id);
    assert.ok(entry.interactionRadius > 0, entry.id);
    assert.notEqual(Boolean(entry.nearbyStationId), Boolean(entry.nearbyBuildingId), entry.id);
    assert.ok(entry.role && entry.prompt && entry.productAction, entry.id);
  }
});

test('W659N P0 resolves operator actions only for the exact resident asset, paired object and radius', () => {
  const residentAssetIds = ['eoncity-creator-trade-6clips', 'eoncity-market-trade-terminal', 'citizen-variant-6clips'];
  const available = resolveEonCityW659gNpcOperatorsNearPosition({
    districtId: 'realm-relay',
    position: { x: -8.7, z: 7.5 },
    residentAssetIds,
    residentStationIds: []
  });
  assert.deepEqual(available.map((entry) => entry.id), ['creator-trade-master']);
  assert.equal(available[0].districtId, 'trade-dome');
  assert.equal(available[0].residentAssetId, 'eoncity-creator-trade-6clips');
  assert.equal(available[0].nearbyBuildingId, 'eoncity-market-trade-terminal');
  assert.ok(available[0].actions.some((entry) => entry.route === '/realm-studio'));

  assert.deepEqual(resolveEonCityW659gNpcOperatorsNearPosition({
    districtId: 'trade-dome',
    position: { x: -8.7, z: 7.5 },
    residentAssetIds: ['eoncity-creator-trade-6clips'],
    residentStationIds: []
  }), []);
  assert.deepEqual(resolveEonCityW659gNpcOperatorsNearPosition({
    districtId: 'trade-dome',
    position: { x: 0, z: 0 },
    residentAssetIds,
    residentStationIds: []
  }), []);
  assert.deepEqual(resolveEonCityW659gNpcOperatorsNearPosition({
    districtId: 'creator-atrium',
    position: { x: -8.7, z: 7.5 },
    residentAssetIds,
    residentStationIds: []
  }), []);
});

test('W659N P0 repairs the four audited operator district mismatches', () => {
  const byId = new Map(EON_CITY_W659G_NPC_OPERATORS.map((entry) => [entry.id, entry]));
  assert.equal(byId.get('creator-trade-master').districtId, 'trade-dome');
  assert.equal(byId.get('agent-theatre-operator').districtId, 'agent-theatre');
  assert.equal(byId.get('vault-steward').districtId, 'vault-station');
  assert.equal(byId.get('architect-sovereign').districtId, 'orientation-hall');
  assert.ok(getEonCityW659gNpcActionsForDistrict('realm-relay').some((entry) => entry.operatorId === 'creator-trade-master'));
});

test('W731 launch graph excludes the superseded Productive City owner and district-only activation', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const core = read('assets/js/city/eon-city-play-core.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.ok(product.indexOf('excludeW649DistrictAssets') < product.indexOf('functionalRuntime.start()'));
  assert.match(product, /resolveEonCityW659gNpcOperatorsNearPosition/);
  assert.doesNotMatch(product, /getEonCityW659gNpcActionsForDistrict/);
  assert.match(core, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.doesNotMatch(core, /w659n-product-layer|w649-district-runtime/);
  assert.equal((runtime.match(/runRenderLoop/g) || []).length, 1);
  assert.doesNotMatch(product, /runRenderLoop/);
});
