import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES } from '../../config/route-contract.mjs';
import {
  assessCityPlayCapability,
  normalizeCityPlayQuality,
  CITY_PLAY_CAPABILITY_SCHEMA
} from '../../assets/js/city/eon-city-play-capability.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W249/W392 keep Babylon dynamically scoped while canonical EON City enters directly', () => {
  const direct = PRIMARY_APP_ROUTES.find((route) => route.from === '/eoncity');
  assert.deepEqual(direct && { file: direct.file, lifecycle: direct.lifecycle, expected: direct.expected }, {
    file: 'eoncity.html', lifecycle: 'direct-babylon-city', expected: ['Checking City access']
  });
  assert.equal(PRIMARY_APP_ROUTES.some((route) => route.from === '/eoncity/play'), false);
  const directCity = read('eoncity.html');
  const station = read('assets/js/eon-city-play-station.js');
  const accessStation = read('assets/js/city/eon-city-access-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const chat = read('chat.html');
  assert.match(directCity, /data-eon-city-direct-entry/);
  assert.match(directCity, /Checking City access/);
  assert.match(directCity, /eon-city-access-station\.js/);
  assert.doesNotMatch(directCity, /<script[^>]+eon-city-play-station\.js|<script[^>]+eon-city-portal\.js/);
  assert.match(accessStation, /await importImpl\(EON_CITY_HEAVY_BOOT_MODULE\)/);
  assert.match(station, /import\('\.\/city\/eon-city-play-babylon\.js'\)/);
  assert.match(station, /requestFullscreen: false/);
  assert.match(station, /data-eon-play-enter-fullscreen/);
  assert.doesNotMatch(station, /from\s+['"]@babylonjs\//);
  assert.match(scene, /from\s+['"]@babylonjs\/core\//);
  assert.doesNotMatch(chat, /babylon|eon-city-play/i);
});

test('W249 Immersive Work Mode is full-screen and landscape-first with accessible touch controls and a safe fallback', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const css = read('assets/css/eon-city-play.css');
  assert.match(station, /requestFullscreen/);
  assert.match(station, /orientation\?\.lock\?\.\('landscape'\)/);
  assert.match(station, /data-play-move/);
  assert.match(station, /pointerdown/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /orientation:portrait/);
  assert.match(css, /min-height:3\.5rem/);
  assert.match(scene, /webglcontextlost/);
  assert.match(scene, /onFallback/);
  assert.match(station, /pagehide/);
  assert.doesNotMatch(station, /pagehide[^\n]*\{\s*once:\s*true\s*\}/);
});

test('W249 Immersive Work Mode only records local performance evidence and cannot execute product actions', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(station, /CITY_PLAY_LOCAL_PROOF_KEY/);
  assert.match(station, /remoteTelemetry:\s*false/);
  assert.match(station, /remoteAssets:\s*false/);
  assert.match(scene, /remoteTelemetry:\s*false/);
  assert.match(scene, /remoteAssets:\s*false/);
  assert.match(station, /Prepared route · review required/);
  assert.doesNotMatch(station, /location\.assign|window\.location/);
  assert.doesNotMatch(station, /location\.assign|window\.location/);
  assert.doesNotMatch(`${station}\n${scene}`, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);
  assert.match(station, /ensureCityWorldState/);
  assert.match(station, /getCityWorldPublicSummary/);
});

test('W249 capability policy is a local hint rather than a device lockout', () => {
  const lowTier = assessCityPlayCapability({ webgl: true, cores: 4, memoryGb: 4, isMobile: true, reducedMotion: false, saveData: false });
  assert.equal(lowTier.schema, CITY_PLAY_CAPABILITY_SCHEMA);
  assert.equal(lowTier.eligible, true);
  assert.equal(lowTier.recommendedQuality, 'lite');
  assert.equal(lowTier.lowTier, true);
  assert.equal(lowTier.landscapeRecommended, true);
  assert.equal(normalizeCityPlayQuality('cinematic', lowTier), 'cinematic');

  const reduced = assessCityPlayCapability({ webgl: true, cores: 12, memoryGb: 16, reducedMotion: true, saveData: false });
  assert.equal(reduced.eligible, true);
  assert.equal(normalizeCityPlayQuality('cinematic', reduced), 'lite');

  const fallback = assessCityPlayCapability({ webgl: false, cores: 8, memoryGb: 8 });
  assert.equal(fallback.eligible, false);
  assert.match(fallback.guidance, /EON City/);
});
