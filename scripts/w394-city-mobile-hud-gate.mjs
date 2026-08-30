#!/usr/bin/env node
/** W394 static source gate: clean direct City HUD, safe touch controls, and narrow-screen Command Deck. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W394_CITY_MOBILE_HUD_CONTRACT, validateW394CityMobileHudContract } from '../config/w394-city-mobile-hud-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW394CityMobileHud() {
  const station = read('assets/js/eon-city-play-station.js');
  const css = read('assets/css/eon-city-play.css');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  check('contract-valid', validateW394CityMobileHudContract().length === 0, 'W394 contract has no internal violations');
  check('direct-hud-calm', /makeLauncher\('Explore', 'eonCityExploreOpen'/.test(runtime) && /makeLauncher\('Menu', 'eonCityMenuOpen'/.test(runtime) && /data-eon-play-exit-city/.test(station), 'canonical City HUD exposes Explore, Menu and Exit City while utility actions live inside Menu');
  check('city-controls-retain-agency', /data-eon-play-enter-fullscreen/.test(station) && /data-eon-play-toggle-map/.test(station) && /data-eon-play-open-settings/.test(station) && /data-eon-play-exit-city/.test(station), 'City controls sheet retains explicit fullscreen, map, settings and City Map choices');
  check('map-closed-direct', /let minimapVisible = !directEntry/.test(station) && /if \(minimap\) minimap\.hidden = !minimapVisible/.test(station), 'direct entry begins with local minimap closed');
  check('joystick-first', /data-eon-play-touch-dpad hidden/.test(station) && /data-eon-play-toggle-touch-dpad/.test(station) && /setTouchDpadVisible/.test(station), 'touch D-pad is hidden until explicitly enabled');
  check('no-route-execution', !/location\.assign|window\.location|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(station), 'City HUD does not auto-navigate or transmit');
  check('safe-area-css', /eon-play-command-deck-panel\{[^}]*safe-area-inset/.test(css) && /max-height:calc\(100dvh/.test(css), 'Command Deck panel respects safe areas and bounded viewport height');
  check('short-landscape-css', /max-height:520px\) and \(orientation:landscape\)/.test(css) && /eon-play-command-deck-grid\{grid-template-columns:repeat\(2/.test(css), 'short landscape keeps a compact two-column Command Deck');
  check('city-engine-boundary', !/three\.module|THREE\./i.test(station), 'W394 does not add a separate Three.js public City route');
  return Object.freeze({ schema: 'eonapp.w394.city-mobile-hud-gate.v1', wave: W394_CITY_MOBILE_HUD_CONTRACT.wave, status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Static source verification only.', 'Real-device touch, safe-area, and visual proof still require manual capture on target devices.']) });
}

export function runW394CityMobileHudGate({ writeArtifact = true } = {}) {
  const result = inspectW394CityMobileHud();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w394-city-mobile-hud-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW394CityMobileHudGate();
  process.stdout.write(`W394 City mobile/HUD gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
