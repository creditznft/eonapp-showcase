#!/usr/bin/env node
/** W455.1 static source gate for EON Noir world composition. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_NOIR_WORLD_COMPOSITION_SCHEMA,
  getEonNoirArchitectureSummary,
  getEonNoirWorldCompositionPlan,
  validateEonNoirArchitecture
} from '../assets/js/city/eon-city-noir-architecture.js';
import { validateW455ANoirWorldCompositionContract } from '../config/w455a-noir-world-composition-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW455ANoirWorldComposition() {
  const source = read('assets/js/city/eon-city-noir-architecture.js');
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const summary = getEonNoirArchitectureSummary();
  const plans = ['lite', 'balanced', 'cinematic'].map((quality) => getEonNoirWorldCompositionPlan({ quality }));
  const errors = [
    ...validateEonNoirArchitecture().errors,
    ...validateW455ANoirWorldCompositionContract(summary, plans[1])
  ];
  const ensure = (condition, message) => { if (!condition) errors.push(message); };

  ensure(plans.every((plan) => plan.schema === EON_NOIR_WORLD_COMPOSITION_SCHEMA), 'Each quality profile must use the W455.1 composition schema.');
  ensure(plans[0].ambientTransit.count === 0 && plans[1].ambientTransit.count === 1 && plans[2].ambientTransit.count === 2, 'World composition must scale decorative transit deliberately across Lite, Balanced and Cinematic.');
  ensure(plans.every((plan) => plan.ambientTransit.decorativeOnly === true && plan.ambientTransit.passengerData === false && plan.ambientTransit.routeData === false && plan.ambientTransit.stationStatus === false && plan.ambientTransit.simulatedTraffic === false), 'Ambient transit must not become a population, route or status system.');
  ensure(/createAmbientTransitCourier/.test(source) && /simulatedTraffic: false/.test(source), 'World layer must render original decorative couriers and keep traffic simulation disabled.');
  ensure(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|document\.cookie/i.test(source), 'World composition must remain local-only and network/storage-free.');
  ensure(/scene\.metadata\.noirWorldComposition/.test(renderer) && /ambientTransitCount/.test(renderer), 'Babylon City must expose world-composition metadata for local proof tooling.');
  ensure(summary.worldCompositionSchema === EON_NOIR_WORLD_COMPOSITION_SCHEMA && summary.ambientTransitDecorativeOnly === true, 'Architecture summary must disclose the W455.1 composition bridge.');

  return Object.freeze({
    schema: 'eonapp.w455.1.noir-world-composition-gate.v1',
    wave: 'W455.1',
    status: errors.length ? 'fail' : 'pass',
    sourceOnly: true,
    qualityProfiles: Object.freeze(plans.map((plan) => Object.freeze({ quality: plan.quality, skylineTowerCount: plan.skylineTowerCount, ambientTransitCount: plan.ambientTransit.count }))),
    errors: Object.freeze(errors),
    limitations: Object.freeze([
      'This source pass does not ship final licensed GLB/glTF landmarks, real weather/audio mixing, browser visual proof, device thermal proof or human art approval.',
      'Ambient transit is decorative world motion only; it has no passengers, schedule, route data, station state or task/activity claim.'
    ])
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW455ANoirWorldComposition();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  const directory = path.join(root, 'artifacts', 'w455a-noir-world-composition-gate');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`W455.1 EON Noir world-composition source gate passed (${report.qualityProfiles.map((entry) => `${entry.quality}:${entry.ambientTransitCount}`).join(', ')} ambient couriers).\n`);
}
