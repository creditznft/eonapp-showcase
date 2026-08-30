#!/usr/bin/env node
/** W404 source gate: Creator Atrium / Forge Bay stay local, launch-only, and City-native. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W404_CITY_CREATOR_ATRIUM_CONTRACT, validateW404CityCreatorAtriumContract } from '../config/w404-city-creator-atrium-contract.mjs';
import { getCityCreatorAtriumCards, getCityCreatorAtriumSummary, validateCityCreatorAtriumCards } from '../assets/js/city/eon-city-creator-atrium.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW404CityCreatorAtrium() {
  const registry = read('assets/js/city/eon-city-creator-atrium.js');
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const css = read('assets/css/eon-city-play.css');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const cards = getCityCreatorAtriumCards();
  const summary = getCityCreatorAtriumSummary();
  const noTransport = !/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\s*\(/.test(`${registry}\n${station}\n${scene}`);

  check('contract-valid', validateW404CityCreatorAtriumContract().length === 0, 'W404 contract has no internal violations');
  check('registry-compact', validateCityCreatorAtriumCards(cards).ok && cards.length === 4, 'Atrium has four allowlisted local destinations');
  check('creator-and-forge', cards.some((card) => card.route === '/workspace#creator-engine') && cards.some((card) => card.route === '/forge'), 'City opens canonical Creator Engine and Forge only after a user click');
  check('local-media-and-receipts', cards.some((card) => card.route === '/local-ai#creator-media') && cards.some((card) => card.route === '/workspace#eon-asset-provenance-title'), 'City exposes local media guidance and source receipts without rendering their contents');
  check('station-controls-entry', /data-eon-play-open-creator-atrium/.test(station) && /data-eon-play-creator-atrium-panel/.test(station) && /Creator Atrium/.test(station), 'Creator Atrium is reachable through the City controls sheet');
  check('station-user-click-only', /Creator Atrium destination chosen/.test(station) && !/location\.assign|window\.location/.test(station), 'Atrium destinations stay explicit foreground choices without programmatic navigation');
  check('city-native-scene', /function addCreatorAtriumDisplays/.test(scene) && /CREATOR ATRIUM/.test(scene) && /focusCreatorAtrium\(\)/.test(scene), 'Babylon scene contains an in-world Creator Atrium and local focus method');
  check('no-private-or-provider-surface', /displaysPrivateWork: false/.test(scene) && summary.displaysPrivateWork === false && summary.providerCalls === false && summary.credentials === false && summary.mediaBodies === false && noTransport, 'City reads no private work and starts no provider, credential, media, or transport operation');
  check('no-editor-duplicate', summary.codeEditor === false && summary.mediaEditor === false && /launch board/i.test(registry), 'Atrium is a launch board, not a duplicate code or media editor');
  check('responsive-css', /eon-play-creator-atrium-panel/.test(css) && /safe-area-inset/.test(css) && /max-height:calc\(100dvh/.test(css), 'Atrium panel is safe-area aware and height bounded');
  check('city-engine-boundary', !/three\.module|THREE\./i.test(`${registry}\n${station}`), 'W404 does not create a separate Three.js public City route');
  return Object.freeze({
    schema: 'eonapp.w404.city-creator-atrium-gate.v1',
    wave: W404_CITY_CREATOR_ATRIUM_CONTRACT.wave,
    status: 'pass',
    checkCount: checks.length,
    checks,
    limitations: Object.freeze(['Static source verification only.', 'No real City screenshot, device walkthrough, local model installation, provider generation, code editing, media editing, file transfer, or social publication is enabled in this wave.'])
  });
}

export function runW404CityCreatorAtriumGate({ writeArtifact = true } = {}) {
  const result = inspectW404CityCreatorAtrium();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w404-city-creator-atrium-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW404CityCreatorAtriumGate();
  process.stdout.write(`W404 City Creator Atrium gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
