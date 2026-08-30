import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => readFile(path.join(ROOT, relative), 'utf8');

test('W615 keeps the protected City route inside the normal app shell', async () => {
  const [city, css] = await Promise.all([
    read('eoncity.html'),
    read('assets/css/eon-city-play.css')
  ]);
  assert.match(city, /data-eon-app-shell="1"/);
  assert.match(city, /data-eon-app-page="eoncity"/);
  assert.match(city, /eon-app-shell\.css/);
  assert.match(city, /eon-app-shell\.js/);
  assert.match(css, /body\[data-eon-app-shell="1"\]\.eoncity-play-entry \{ overflow: auto; \}/);
  assert.match(css, /data-eon-city-route-state="running"\] \{ overflow: hidden; \}/);
});

test('W615 makes recovery one coherent, scrollable, non-disabled City surface', async () => {
  const [station, css] = await Promise.all([
    read('assets/js/eon-city-play-station.js'),
    read('assets/css/eon-city-play.css')
  ]);
  assert.match(station, /eon-play-gate-copy eon-play-fallback-copy/);
  assert.match(station, /Start low-detail City/);
  assert.match(station, /Retry full City/);
  assert.match(station, /Show safe City code/);
  assert.match(station, /Get City help/);
  assert.match(station, /eonCityRecoveryCode/);
  assert.match(station, /setCityRouteState\(root, 'recovery'\)/);
  assert.match(css, /\.eon-play-fallback \{ min-height: 100dvh; overflow: visible;/);
  assert.match(css, /button\.eon-play-tertiary \{ appearance: none;/);
});

test('W615 low-detail recovery preserves the named direct City controls', async () => {
  const station = await read('assets/js/eon-city-play-station.js');
  assert.match(station, /function startCitySafeMode\(root, capability\)/);
  assert.match(station, /entryMode: directEntry \? 'direct' : 'safe'/);
  assert.match(station, /lowDetailAlreadyTried/);
  assert.match(station, /eonCityRecoveryAttempt = 'low-detail'/);
  assert.doesNotMatch(station, /onSafeMode: \(\) => void startPlay\(root, capability, \{[^}]+entryMode: 'safe'/s);
});

test('W615 authenticated runner reports a bounded recovery state instead of timing out without context', async () => {
  const [runner, snapshot] = await Promise.all([
    read('scripts/w599-run-authenticated-eoncity.mjs'),
    read('scripts/w615-capture-authenticated-city-surface.mjs')
  ]);
  assert.match(runner, /inspectCitySurface/);
  assert.match(runner, /waitForCitySurface/);
  assert.match(runner, /CITY_RECOVERY_VISIBLE/);
  assert.match(runner, /CITY_RENDER_SURFACE_MISSING/);
  assert.match(runner, /standardShell/);
  assert.match(runner, /eonCityRecoveryCode/);
  assert.match(snapshot, /CITY_TAB_NOT_OPEN/);
  assert.match(snapshot, /connectOverCDP/);
  assert.match(snapshot, /never opens or navigates a browser tab/);
  assert.doesNotMatch(snapshot, /document\.cookie|storageState|google\.com/);
});
