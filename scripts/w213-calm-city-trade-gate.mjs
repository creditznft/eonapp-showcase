import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const required = [
  'assets/js/eon-city-3d-station.js',
  'assets/js/city/eon-city-3d-model.js',
  'assets/js/city/eon-city-3d-renderer.js',
  'assets/css/eon-city-3d-station.css',
  'assets/js/market-intelligence/market-intelligence-receipt.js',
  'assets/js/market-intelligence/market-intelligence-safety-contract.js',
  'scripts/w375-market-intelligence-safety-gate.mjs',
  'tests/unit/w213-calm-city-trade.test.mjs'
];
for (const file of required) assert.equal(fs.existsSync(path.join(root, file)), true, `missing ${file}`);
const html = read('eoncity-3d.html');
const station = read('assets/js/eon-city-3d-station.js');
const trade = read('assets/js/trade/eon-trade-page.js');
const tradeHtml = read('trade.html');
const contract = read('assets/js/market-intelligence/market-intelligence-safety-contract.js');
assert.match(html, /eon-city-3d-station\.js/);
assert.doesNotMatch(html, /realm3d\/eon-city-app\.js|EngineBoot\.js/);
assert.match(station, /getEonCity3dCapability/);
assert.match(station, /renderFallback/);
assert.match(station, /renderWebglStation/);
assert.match(station, /import\('\.\/city\/eon-city-3d-renderer\.js'\)/);
assert.match(station, /same local CityWorldState/);
assert.match(trade, /createMarketIntelligenceReceipt/);
assert.match(tradeHtml, /Research Lab/);
assert.match(tradeHtml, /Scenario Studio/);
assert.match(tradeHtml, /Export safety receipt/);
assert.match(contract, /externalNetwork:\s*false/);
assert.match(contract, /liveExecution:\s*false/);
assert.match(contract, /economicIncentives:\s*false/);
console.log('W213 calm EON City + Research Lab safety gate: PASS');
