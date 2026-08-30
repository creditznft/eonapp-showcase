import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { EON_CITY_W731_STATIONS } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { EON_CITY_W763_MENU_ORDER } from '../../assets/js/city/w760/eon-city-w760-w765-command-core-convergence.js';
import { validateEonCityW765R7WallDisplayContract } from '../../assets/js/city/w765/eon-city-w765r7-wall-display-gallery.js';

const wallSource = await readFile(new URL('../../assets/js/city/w765/eon-city-w765r7-wall-display-gallery.js', import.meta.url), 'utf8');
const runtimeSource = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W765R8 wall displays use two independent readable front faces', () => {
  assert.equal(validateEonCityW765R7WallDisplayContract({ stations: EON_CITY_W731_STATIONS }).ok, true);
  assert.match(wallSource, /interior-screen/);
  assert.match(wallSource, /exterior-screen/);
  assert.match(wallSource, /exteriorScreen\.rotation\.y = Math\.PI/);
  assert.match(wallSource, /interior-texture/);
  assert.match(wallSource, /exterior-texture/);
  assert.match(wallSource, /physical-backing/);
  assert.match(wallSource, /createHitProxy\('interior'/);
  assert.match(wallSource, /createHitProxy\('exterior'/);
  assert.match(wallSource, /faceCount: 2/);
  assert.match(wallSource, /hitProxyCount: 2/);
});

test('W765R8 exposes Mission Board plus the three-World launcher without a dead quick Open World action', () => {
  assert.deepEqual(EON_CITY_W763_MENU_ORDER, [
    'Living Nexus', 'Mission Board', 'Live Monitors', 'Share Command Center',
    'Creator Capture', 'Plans & Access', 'Accessible Map'
  ]);
  assert.match(runtimeSource, /data-eon-city-quick="missions">Mission Board/);
  assert.match(runtimeSource, /data-eon-city-featured="signal-frontier"/);
  assert.match(runtimeSource, /data-eon-city-featured="storm-sector"/);
  assert.match(runtimeSource, /data-eon-city-featured="my-frontier"/);
  assert.match(runtimeSource, /data-eon-city-menu-open-world>Open Signal Frontier/);
  assert.match(runtimeSource, /handoffFromMenu\(`quick-\$\{action \|\| 'unknown'\}`/);
  assert.match(runtimeSource, /data-eon-city-expanse-enter>Enter Signal Frontier/);
  assert.match(runtimeSource, /data-eon-city-expanse-cancel>Cancel/);
  assert.doesNotMatch(runtimeSource, /expanse-overlook/);
  assert.doesNotMatch(runtimeSource, /data-eon-city-quick="atlas">Atlas/);
});
