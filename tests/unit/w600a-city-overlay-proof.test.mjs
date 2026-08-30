import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getEonCityOverlayInputIsolationContract } from '../../assets/js/city/eon-city-gameplay-contract.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W600A validates Start Here pointer ownership before the production runner clicks it', async () => {
  const runner = await readFile(path.join(ROOT, 'scripts/w599-run-authenticated-eoncity.mjs'), 'utf8');
  const station = await readFile(path.join(ROOT, 'assets/js/eon-city-play-station.js'), 'utf8');
  const css = await readFile(path.join(ROOT, 'assets/css/eon-city-play.css'), 'utf8');
  assert.match(runner, /inspectPointerOwnership/);
  assert.match(runner, /document\.elementsFromPoint/);
  assert.match(runner, /CITY_OVERLAY_POINTER_INTERCEPT/);
  assert.match(runner, /topMatchesControl/);
  assert.match(runner, /canvasIndex/);
  assert.match(runner, /data-eon-play-open-voice-consent/);
  assert.match(runner, /locator\('\[data-eon-play-interact\]'\)\.count\(\)\) === 0/);
  assert.match(station, /eonCityOverlayClose/);
  assert.match(station, /eon-city-overlay-open/);
  assert.match(css, /\.eon-play-first-run-panel\{z-index:1200/);
  assert.match(css, /\.eon-play-first-run-panel\[hidden\]\{display:none!important;pointer-events:none/);
});

test('W600A overlay contract remains a local user-action-only layer', () => {
  const contract = getEonCityOverlayInputIsolationContract();
  assert.equal(contract.minimumZIndex, 1200);
  assert.equal(contract.requiresCanvasHitTestExclusion, true);
  assert.equal(contract.requiresPointerEvents, true);
  assert.equal(contract.userActionRequired, true);
  assert.equal(contract.remoteNetwork, false);
});
