import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { W404_CITY_CREATOR_ATRIUM_CONTRACT, validateW404CityCreatorAtriumContract } from '../../config/w404-city-creator-atrium-contract.mjs';
import { getCityCreatorAtriumCards, getCityCreatorAtriumSummary, validateCityCreatorAtriumCards } from '../../assets/js/city/eon-city-creator-atrium.js';
import { inspectW404CityCreatorAtrium } from '../../scripts/w404-city-creator-atrium-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W404 keeps Creator Atrium compact, City-native, and launch-only', () => {
  assert.deepEqual(validateW404CityCreatorAtriumContract(), []);
  const cards = getCityCreatorAtriumCards();
  assert.equal(cards.length, 4);
  assert.equal(validateCityCreatorAtriumCards(cards).ok, true);
  assert.deepEqual(cards.map((card) => card.route), ['/workspace#creator-engine', '/forge', '/local-ai#creator-media', '/workspace#eon-asset-provenance-title']);
  const summary = getCityCreatorAtriumSummary();
  assert.equal(summary.localOnly, true);
  assert.equal(summary.displaysPrivateWork, false);
  assert.equal(summary.providerCalls, false);
  assert.equal(summary.credentials, false);
  assert.equal(summary.mediaBodies, false);
  assert.equal(summary.codeEditor, false);
  assert.equal(summary.mediaEditor, false);
});

test('W404 exposes Creator Atrium from City controls and keeps the full editor outside Babylon', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(station, /data-eon-play-open-creator-atrium/);
  assert.match(station, /data-eon-play-creator-atrium-panel/);
  assert.match(station, /Creator Atrium destination chosen/);
  assert.match(scene, /function addCreatorAtriumDisplays/);
  assert.match(scene, /CREATOR ATRIUM/);
  assert.match(scene, /focusCreatorAtrium\(\)/);
  assert.doesNotMatch(station, /location\.assign|window\.location|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/);
});

test('W404 static source gate is green without claiming creator execution proof', () => {
  const report = inspectW404CityCreatorAtrium({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 10);
  assert.match(report.limitations.join(' '), /Static source verification only/i);
});
