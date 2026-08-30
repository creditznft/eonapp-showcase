#!/usr/bin/env node
/** W607 local source gate for direct City gameplay mechanics. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_DIRECT_HUD_ACTIONS,
  describeEonCityLandmarkApproach,
  resolveEonCityCameraRelativeMove,
  resolveEonCityInputIntent,
  validateEonCityGameplayContract
} from '../assets/js/city/eon-city-gameplay-contract.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [runtime, station, css] = await Promise.all([
  readFile(path.join(ROOT, 'assets/js/city/eon-city-play-babylon.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/js/eon-city-play-station.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/css/eon-city-play.css'), 'utf8')
]);
const issues = [];
const validation = validateEonCityGameplayContract();
if (!validation.ok) issues.push(...validation.errors);
for (const expected of ['resolveEonCityCameraRelativeMove', 'resolveEonCityInputIntent', 'eon-universe-landmark-hit-volume', 'onLandmarkApproach']) {
  if (!runtime.includes(expected)) issues.push(`runtime-missing:${expected}`);
}
for (const expected of ['data-eon-play-approach-prompt', 'data-eon-play-approach-review', 'data-eon-play-approach-guide', 'Nothing opens automatically']) {
  if (!station.includes(expected)) issues.push(`station-missing:${expected}`);
}
for (const expected of ['.eon-play-approach-prompt', '.eon-city-overlay-open .eon-play-approach-prompt']) {
  if (!css.includes(expected)) issues.push(`css-missing:${expected}`);
}
const right = resolveEonCityCameraRelativeMove({ input: { strafe: 1 }, cameraForward: { x: 0, z: 1 } });
if (!(right.x > 0 && Math.abs(right.z) < 0.0001)) issues.push('screen-right-regression');
const intent = resolveEonCityInputIntent({ keyboard: { x: 0 }, touch: { x: 0.7 }, controller: { x: 0.9 } });
if (intent.source !== 'touch') issues.push('input-priority-regression');
const approach = describeEonCityLandmarkApproach({ player: { x: 1, z: 1 }, landmark: { id: 'command-centre', label: 'Command Centre', x: 0, z: 0, radius: 3 } });
if (!approach?.inRange || approach.autoNavigation || approach.opensRoute || approach.executesWork) issues.push('approach-contract-regression');
const result = Object.freeze({
  schema: 'eon.city.w607.gameplay-contract-gate.v1',
  ok: issues.length === 0,
  issues: Object.freeze(issues),
  directHudActions: EON_CITY_DIRECT_HUD_ACTIONS,
  controls: Object.freeze({ screenRight: right, activeInput: intent, approach }),
  limitations: Object.freeze([
    'No real browser canvas or device input is executed by this source gate.',
    'Controller, touch and collision acceptance remain browser/device evidence requirements.'
  ])
});
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
