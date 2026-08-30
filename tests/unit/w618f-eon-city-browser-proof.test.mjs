import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getEonCityCommandRoomModel, validateEonCityCommandRoomModel } from '../../assets/js/city/eon-city-command-room.js';
import { inspectW618fEonCityBrowserProofGate } from '../../scripts/w618f-eon-city-browser-proof-gate.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W618F keeps the upgraded Command Room model ready for full browser proof', () => {
  const model = getEonCityCommandRoomModel();
  assert.equal(model.defaultVisibleInDirectCity, true);
  assert.equal(model.optionalExploreMode, true);
  assert.deepEqual(model.keyboardShortcuts, ['C','P','N','F','B','I','A','W','L','V','R']);
  assert.equal(validateEonCityCommandRoomModel(model).ok, true);
});

test('W618F browser spec covers all eleven screens with review-first routing', () => {
  const spec = read('tests/e2e/w618f-eon-city-command-room-browser-proof.spec.ts');
  for (const id of ['eonbot','projects','create','forge','library','research','automations','workspace','local-ai','vault','realm-studio']) assert.match(spec, new RegExp(`['"]${id}['"]`));
  assert.match(spec, /data-eon-command-room-confirm/);
  assert.match(spec, /screen-click-matrix/);
  assert.match(spec, /second visible click/i);
});

test('W618F has shortcut, mobile, share, map and cache proof coverage', () => {
  const spec = read('tests/e2e/w618f-eon-city-command-room-browser-proof.spec.ts');
  for (const shortcut of ['C','P','N','F','B','I','A','W','L','V','R','Escape']) assert.match(spec, new RegExp(`['"]${shortcut}['"]`));
  assert.match(spec, /data-eon-share-popover/);
  assert.match(spec, /data-eon-play-travel-panel/);
  assert.match(spec, /w618f-mobile-portrait\.png/);
  assert.match(spec, /w618f-mobile-landscape\.png/);
  assert.match(spec, /serviceWorker/);
});

test('W618F preserves no-fake-commercial and no-fake-agent browser assertions', () => {
  const spec = read('tests/e2e/w618f-eon-city-command-room-browser-proof.spec.ts');
  assert.match(spec, /UNSAFE_COPY/);
  assert.match(spec, /cash out/);
  assert.match(spec, /payout/);
  assert.match(spec, /raw prompt/);
  assert.match(spec, /provider key/);
  assert.match(spec, /agent-theater-proof-bound/);
});

test('W618F source gate passes', () => {
  const report = inspectW618fEonCityBrowserProofGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.checks, 32);
});
