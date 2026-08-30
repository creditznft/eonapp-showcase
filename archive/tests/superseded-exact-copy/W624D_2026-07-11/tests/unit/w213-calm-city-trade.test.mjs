import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMarketIntelligenceReceipt, validateMarketIntelligenceReceipt } from '../../assets/js/market-intelligence/market-intelligence-receipt.js';
import { MARKET_INTELLIGENCE_SAFETY_CONTRACT } from '../../assets/js/market-intelligence/market-intelligence-safety-contract.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W213/W224/W360 keep City Overview resilient and use an explicit WebGL device gate', () => {
  const html = read('eoncity-3d.html');
  const station = read('assets/js/eon-city-3d-station.js');
  const map = read('assets/js/eon-operator-map.js');
  assert.match(html, /eon-city-3d-station\.js/);
  assert.doesNotMatch(html, /realm3d\/eon-city-app\.js|EngineBoot\.js/);
  assert.match(station, /getEonCity3dCapability/);
  assert.match(station, /reducedMotion/);
  assert.match(station, /saveData/);
  assert.match(station, /webgl/);
  assert.match(station, /same local CityWorldState/);
  assert.match(map, /Spatial Command Space/i);
  assert.doesNotMatch(map, /legacy 3D experience/);
});

test('W213/W224/W255 route directory is derived from the canonical City landmark registry and makes no simulation claim', () => {
  const station = read('assets/js/eon-city-3d-station.js');
  const cityEngine = read('assets/js/city/eon-city-2d-engine.js');
  const registry = read('assets/js/city/city-landmark-registry.js');
  assert.match(station, /CITY_DISTRICTS/);
  assert.match(cityEngine, /CITY_LANDMARKS\.map\(toCityDistrict\)/);
  for (const route of ['/', '/projects', '/workspace', '/realm-studio', '/local-ai']) {
    assert.match(registry, new RegExp(`route: '${route.replace('/', '\\/')}'`));
  }
  assert.doesNotMatch(registry, /route: '\/(?:market|vault|trade|library)'/);
  assert.match(station, /No background simulation started/);
  assert.match(station, /does not introduce a second inventory, game economy, NPC crowd, market, reward loop, or background simulation/i);
});

test('W213 Trade safety receipt now proves local Research Lab boundaries', () => {
  const receipt = createMarketIntelligenceReceipt({ datasets: [], theses: [], evidence: [], forecasts: [] }, { now: 2000 });
  assert.equal(validateMarketIntelligenceReceipt(receipt).ok, true);
  assert.equal(receipt.dataBoundary.externalNetworkRequest, false);
  assert.equal(receipt.dataBoundary.liveMarketData, false);
  assert.equal(receipt.activityBoundary.orderCreation, false);
  assert.equal(receipt.activityBoundary.orderTransmission, false);
  assert.equal(receipt.activityBoundary.credentialCollection, false);
  assert.equal(receipt.forecastBoundary.monetaryIncentives, false);
  assert.equal(receipt.forecastBoundary.transferableValue, false);
  assert.equal(MARKET_INTELLIGENCE_SAFETY_CONTRACT.liveExecution, false);
  assert.equal(MARKET_INTELLIGENCE_SAFETY_CONTRACT.externalNetwork, false);
});

test('W213 current Realm Studio sharing does not promise payouts or expose a raw local snapshot URL', () => {
  const studio = read('assets/js/realm-studio-page.js');
  const runtime = read('assets/js/utils/realm-share-runtime.js');
  const publicManifest = read('assets/js/realm/public-realm-manifest.js');
  const source = `${studio}\n${runtime}\n${publicManifest}`;
  assert.match(studio, /createRealmShareLink/);
  assert.match(runtime, /createSignedShareLink/);
  assert.match(runtime, /destination: `\/u\/\$\{handle\}`/);
  assert.match(source, /No central link registry, reward, payout, or public store was used/);
  assert.doesNotMatch(source, /realmworld\.html\?realm=/);
  assert.doesNotMatch(source, /ownerEarnsFromSales|revenueShareActive|referralRewardsActive/);
});
