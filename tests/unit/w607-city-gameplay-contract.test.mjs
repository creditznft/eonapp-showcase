import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_DIRECT_HUD_ACTIONS,
  describeEonCityLandmarkApproach,
  resolveEonCityCameraRelativeMove,
  resolveEonCityInputIntent,
  validateEonCityGameplayContract
} from '../../assets/js/city/eon-city-gameplay-contract.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W607 keeps named City actions and rejects generic Interact as a primary HUD action', () => {
  const validation = validateEonCityGameplayContract();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.deepEqual(EON_CITY_DIRECT_HUD_ACTIONS.map((action) => action.id), ['command-room', 'eonbot', 'districts', 'menu']);
  assert.equal(EON_CITY_DIRECT_HUD_ACTIONS.some((action) => /^interact$/i.test(action.label)), false);
});

test('W607 maps positive strafe to visible screen-right and does not mix input channels', () => {
  const right = resolveEonCityCameraRelativeMove({ input: { strafe: 1 }, cameraForward: { x: 0, z: 1 } });
  assert.equal(right.directionConvention, 'positive-strafe-is-screen-right');
  assert.equal(right.x, 1);
  assert.equal(right.z, 0);
  const left = resolveEonCityCameraRelativeMove({ input: { strafe: -1 }, cameraForward: { x: 0, z: 1 } });
  assert.equal(left.x, -1);
  assert.equal(left.z, 0);
  const active = resolveEonCityInputIntent({ keyboard: { x: 0 }, touch: { x: 0.5 }, controller: { x: 0.9 } });
  assert.equal(active.source, 'touch');
  assert.equal(active.strafe, 0.5);
});

test('W607 landmark approaches clarify direct options without automatic navigation', () => {
  const approach = describeEonCityLandmarkApproach({
    player: { x: 2, z: 0 },
    landmark: { id: 'archive-gardens', label: 'Archive Gardens', x: 0, z: 0, radius: 3 }
  });
  assert.equal(approach.inRange, true);
  assert.equal(approach.prompt, 'Review Archive Gardens');
  assert.equal(approach.autoNavigation, false);
  assert.equal(approach.opensRoute, false);
  assert.equal(approach.executesWork, false);
});

test('W607 runtime uses direct hit volumes, approach signals and direct-entry prompt controls', async () => {
  const runtime = await readFile(path.join(ROOT, 'assets/js/city/eon-city-play-babylon.js'), 'utf8');
  const station = await readFile(path.join(ROOT, 'assets/js/eon-city-play-station.js'), 'utf8');
  const css = await readFile(path.join(ROOT, 'assets/css/eon-city-play.css'), 'utf8');
  assert.match(runtime, /eon-universe-landmark-hit-volume/);
  assert.match(runtime, /resolveEonCityCameraRelativeMove/);
  assert.match(runtime, /onLandmarkApproach/);
  assert.match(station, /data-eon-play-approach-prompt/);
  assert.match(station, /data-eon-play-approach-review/);
  assert.match(station, /data-eon-play-approach-guide/);
  assert.match(station, /Nothing opens automatically/);
  assert.match(css, /\.eon-play-approach-prompt/);
  assert.match(css, /\.eon-city-overlay-open \.eon-play-approach-prompt/);
});
