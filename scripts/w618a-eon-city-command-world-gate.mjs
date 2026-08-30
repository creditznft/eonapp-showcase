#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildEonCityCommandWorldPlan,
  decideNextEonCityWave,
  validateEonCityCommandWorldPlan
} from '../assets/js/city/eon-city-command-world-plan.js';
import {
  EON_CITY_CONTROL_CONVENTION,
  resolveEonCityCameraRelativeMove,
  validateEonCityGameplayContract
} from '../assets/js/city/eon-city-gameplay-contract.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW618aEonCityCommandWorldGate() {
  const errors = [];
  const plan = buildEonCityCommandWorldPlan();
  const planValidation = validateEonCityCommandWorldPlan(plan);
  if (!planValidation.ok) errors.push(...planValidation.errors);

  const gameplayValidation = validateEonCityGameplayContract();
  if (!gameplayValidation.ok) errors.push(...gameplayValidation.errors.map((error) => `Gameplay: ${error}`));

  const right = resolveEonCityCameraRelativeMove({ input: { strafe: 1, forward: 0 }, cameraForward: { x: 0, z: 1 } });
  if (!(right.x > 0 && Math.abs(right.z) < 0.0001)) errors.push('Default Babylon camera screen-right remains inverted.');
  if (EON_CITY_CONTROL_CONVENTION.leftRightInverted !== false) errors.push('Control convention must explicitly mark left/right as not inverted.');
  if (EON_CITY_CONTROL_CONVENTION.clickToMoveDefaultForDirectCity !== true) errors.push('Direct City mouse travel must be on by default.');

  const station = read('assets/js/eon-city-play-station.js');
  const runtime = read('assets/js/city/eon-city-play-babylon.js');
  const css = read('assets/css/eon-city-play.css');
  const shell = read('assets/js/eon-app-shell.js');
  const pkg = JSON.parse(read('package.json'));

  for (const expected of [
    'buildEonCityCommandWorldPlan',
    'Command Room',
    'data-eon-play-command-room-strip',
    'data-eon-play-share-city',
    'defaultClickMove:',
    'Mouse travel: on'
  ]) {
    if (!station.includes(expected)) errors.push(`City station missing ${expected}.`);
  }
  for (const expected of [
    'EON_CITY_CONTROL_CONVENTION',
    'defaultClickMove = EON_CITY_CONTROL_CONVENTION.clickToMoveDefaultForDirectCity',
    'const clickMove = { enabled: Boolean(defaultClickMove)',
    'Click a district signal to inspect it'
  ]) {
    if (!runtime.includes(expected)) errors.push(`Babylon runtime missing ${expected}.`);
  }
  for (const expected of ['.eon-play-command-room-strip', '.eon-play-command-world-note', '.eon-play-first-run-grid{', 'W618A']) {
    if (!css.includes(expected)) errors.push(`City CSS missing ${expected}.`);
  }
  if (!pkg.scripts?.['qa:w618a-eon-city-command-world']) errors.push('package script missing: qa:w618a-eon-city-command-world');
  for (const expected of ['captureAndCleanIdentityReturnQuery', "searchParams.delete('account')", "searchParams.delete('accountCode')", 'history?.replaceState']) {
    if (!shell.includes(expected)) errors.push(`App shell missing OAuth/account return cleanup: ${expected}.`);
  }

  const nextBeforeProof = decideNextEonCityWave({});
  if (nextBeforeProof.next !== 'rt92-live' || nextBeforeProof.billingAllowed !== true || nextBeforeProof.browserMayGrantEntitlement !== false || nextBeforeProof.browserMayGrantReward !== false) errors.push('RT92 must keep live commercial rails server-authoritative while City acceptance continues.');
  const nextAfterCity = decideNextEonCityWave({ cityUsabilityPassed: true });
  if (nextAfterCity.next !== 'rt92-live' || nextAfterCity.billingAllowed !== true) errors.push('City usability progress must not disable the independent server-authoritative commercial rails.');

  return Object.freeze({
    schema: 'eon.city.w618a.command-world-gate.v1',
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    checks: 15,
    planSummary: Object.freeze({ layers: plan.layers.length, roadmap: plan.roadmap.map((wave) => wave.id), default: plan.layers.find((layer) => layer.defaultMode)?.id })
  });
}

const report = inspectW618aEonCityCommandWorldGate();
if (!report.ok) {
  console.error(`[W618A] EON City Command World gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W618A] EON City Command World gate passed (${report.checks}/15).`);
