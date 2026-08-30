import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { W394_CITY_MOBILE_HUD_CONTRACT, validateW394CityMobileHudContract } from '../../config/w394-city-mobile-hud-contract.mjs';
import { inspectW394CityMobileHud } from '../../scripts/w394-city-mobile-hud-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W394 keeps direct City HUD calm without removing explicit City controls', () => {
  assert.deepEqual(validateW394CityMobileHudContract(), []);
  assert.deepEqual(W394_CITY_MOBILE_HUD_CONTRACT.directHud.primaryActions, ['explore', 'menu', 'exit-city']);
  const station = read('assets/js/eon-city-play-station.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /makeLauncher\('Explore', 'eonCityExploreOpen'/);
  assert.match(runtime, /makeLauncher\('Menu', 'eonCityMenuOpen'/);
  assert.match(station, /data-eon-play-enter-fullscreen/);
  assert.match(station, /data-eon-play-exit-city/);
});

test('W394 makes touch joystick-first and starts the direct minimap closed', () => {
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(station, /data-eon-play-touch-dpad hidden/);
  assert.match(station, /data-eon-play-toggle-touch-dpad/);
  assert.match(station, /let minimapVisible = !directEntry/);
  assert.match(station, /Touch D-pad hidden\. Analogue joystick remains the primary touch control\./);
});

test('W394 protects narrow Command Deck layout without adding a separate renderer', () => {
  const css = read('assets/css/eon-city-play.css');
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(css, /safe-area-inset/);
  assert.match(css, /max-height:520px\) and \(orientation:landscape\)/);
  assert.match(css, /eon-play-command-deck-grid\{grid-template-columns:repeat\(2/);
  assert.doesNotMatch(station, /location\.assign|window\.location|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|three\.module|THREE\./i);
});

test('W394 source proof is explicit about its device limitation', () => {
  const report = inspectW394CityMobileHud({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 8);
  assert.match(report.limitations.join(' '), /Real-device touch/i);
});
