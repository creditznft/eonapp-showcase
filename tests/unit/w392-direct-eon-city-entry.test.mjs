import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getRouteRow } from '../../config/route-contract.mjs';
import {
  W392_DIRECT_EON_CITY_ENTRY_CONTRACT,
  validateW392DirectEonCityEntryContract
} from '../../config/w392-direct-eon-city-entry-contract.mjs';
import { inspectW392DirectEonCityEntry } from '../../scripts/w392-direct-eon-city-entry-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W423/W554/W660 make EON City one identity-gated full Babylon route with same-route recovery', () => {
  assert.deepEqual(validateW392DirectEonCityEntryContract(), []);
  assert.equal(W392_DIRECT_EON_CITY_ENTRY_CONTRACT.directEntry.publicPortal, false);
  assert.equal(W392_DIRECT_EON_CITY_ENTRY_CONTRACT.directEntry.publicSecondCityMap, false);
  assert.equal(W392_DIRECT_EON_CITY_ENTRY_CONTRACT.directEntry.publicAccessStation, true);
  assert.equal(W392_DIRECT_EON_CITY_ENTRY_CONTRACT.directEntry.identityGateBeforeRenderer, true);
  assert.equal(W392_DIRECT_EON_CITY_ENTRY_CONTRACT.directEntry.heavyRendererAfterAuthorizedForegroundAccess, true);
  assert.equal(W392_DIRECT_EON_CITY_ENTRY_CONTRACT.directEntry.autoFullscreen, false);
  assert.equal(W392_DIRECT_EON_CITY_ENTRY_CONTRACT.directEntry.autoAudio, false);
  assert.deepEqual(getRouteRow('/eoncity') && { file: getRouteRow('/eoncity').file, lifecycle: getRouteRow('/eoncity').lifecycle }, {
    file: 'eoncity.html', lifecycle: 'direct-babylon-city'
  });
  const city = read('eoncity.html');
  const accessStation = read('assets/js/city/eon-city-access-station.js');
  assert.match(city, /data-eon-city-direct-entry/);
  assert.match(city, /Checking City access/);
  assert.match(city, /eon-city-access-station\.js/);
  assert.doesNotMatch(city, /<script[^>]+eon-city-play-station\.js|<script[^>]+eon-city-portal\.js/);
  assert.match(accessStation, /mountProgressiveCityNow\(root/);
  assert.match(accessStation, /EON City · Command Hub/);
  assert.match(accessStation, /mountBabylonCityProof/);
  const authorizedBootBlock = accessStation.indexOf("if (view.kind === 'boot')");
  const corePreloader = accessStation.indexOf('const preloadCore = () =>', authorizedBootBlock);
  const automaticEntry = accessStation.indexOf('const automaticEntry = enter()', corePreloader);
  assert.ok(authorizedBootBlock >= 0);
  assert.ok(corePreloader > authorizedBootBlock);
  assert.ok(automaticEntry > corePreloader);
  assert.equal((accessStation.match(/import\('\.\/eon-city-play-core\.js'\)/g) || []).length, 1);
  assert.doesNotMatch(accessStation, /eon-city-runtime-owner\.js/);
});

test('W423/W554/W660 keep the full local renderer deferred behind identity; recovery stays inside EON City', () => {
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(station, /requestFullscreen: false/);
  assert.match(station, /entryMode: 'direct'/);
  assert.match(station, /data-eon-play-enter-fullscreen/);
  assert.match(station, /data-eon-play-open-settings/);
  assert.match(station, /data-eon-play-settings-save/);
  assert.match(station, /direct-entry-no-audio/);
  assert.match(station, /EON City needs a lighter start/);
  assert.match(station, /Start low-detail City/);
  assert.doesNotMatch(station, /href="\/eoncity\/lite"/);
  assert.doesNotMatch(station, /location\.assign|window\.location|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/);
});

test('W423/W554/W660 source gate is green without claiming edge, device or gameplay proof', () => {
  const report = inspectW392DirectEonCityEntry({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 11);
  assert.match(report.limitations.join(' '), /Static source verification only/i);
});
