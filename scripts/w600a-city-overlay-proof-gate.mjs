#!/usr/bin/env node
/**
 * W600A source gate — validates the exact prerequisites for a real signed-in
 * browser rerun. This does not impersonate Google or declare production proof.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCityOverlayInputIsolationContract } from '../assets/js/city/eon-city-gameplay-contract.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  ['scripts/w599-run-authenticated-eoncity.mjs', 'CITY_OVERLAY_POINTER_INTERCEPT'],
  ['scripts/w599-run-authenticated-eoncity.mjs', 'inspectPointerOwnership'],
  ['scripts/w599-run-authenticated-eoncity.mjs', 'data-eon-play-close-start-here'],
  ['assets/js/eon-city-play-station.js', 'eonCityOverlayClose'],
  ['assets/js/eon-city-play-station.js', 'eon-city-overlay-open'],
  ['assets/css/eon-city-play.css', 'z-index:1200'],
  ['assets/css/eon-city-play.css', 'pointer-events:none']
];

const contract = getEonCityOverlayInputIsolationContract();
const issues = [];
if (contract.minimumZIndex < 1200 || !contract.requiresCanvasHitTestExclusion || !contract.requiresPointerEvents) {
  issues.push('overlay-contract-incomplete');
}
for (const [relative, token] of required) {
  const text = await readFile(path.join(ROOT, relative), 'utf8');
  if (!text.includes(token)) issues.push(`missing:${relative}:${token}`);
}
const result = Object.freeze({
  schema: 'eon.city.w600a.overlay-proof-gate.v1',
  ok: issues.length === 0,
  issues: Object.freeze(issues),
  contract,
  limitations: Object.freeze([
    'This gate does not attach to a browser or sign in.',
    'AUTHENTICATED_CITY_AND_GATE_PROVEN still requires the normal-browser production runner.'
  ])
});
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
