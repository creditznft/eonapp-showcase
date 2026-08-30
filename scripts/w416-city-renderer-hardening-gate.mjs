#!/usr/bin/env node
/** W416 source gate: procedural City surfaces must use PBR, and shadows must be cinematic-only. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCityProceduralRendererProfile } from '../assets/js/city/eon-city-procedural-renderer-profile.js';
import { W416_CITY_RENDERER_HARDENING_CONTRACT, validateW416CityRendererHardeningContract } from '../config/w416-city-renderer-hardening-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW416CityRendererHardening() {
  const contract = W416_CITY_RENDERER_HARDENING_CONTRACT;
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const docs = read('docs/W416_CITY_RENDERER_HARDENING_2026-06-28.md');
  const profile = getEonCityProceduralRendererProfile();
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  check('contract-valid', validateW416CityRendererHardeningContract().length === 0, 'W416 contract has no internal mismatch');
  check('required-files-exist', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'renderer, policy, gate, test and docs exist');
  check('pbr-world-material', /import \{ PBRMetallicRoughnessMaterial \}/.test(renderer) && /new PBRMetallicRoughnessMaterial\(name, scene\)/.test(renderer) && /material\.baseColor/.test(renderer) && /material\.metallic/.test(renderer) && /material\.roughness/.test(renderer), 'primary world surfaces use a PBR metallic/roughness material');
  check('dynamic-panels-exception-only', /function makeDisplayMaterial/.test(renderer) && /new StandardMaterial\(name, scene\)/.test(renderer) && /DynamicTexture/.test(renderer), 'legacy StandardMaterial is restricted to local dynamic text panels');
  check('cinematic-shadows-only', /function addCinematicShadows/.test(renderer) && /quality !== 'cinematic'/.test(renderer) && /new ShadowGenerator\(1024, key\)/.test(renderer) && /usePercentageCloserFiltering = true/.test(renderer), 'soft-shadow work is opt-in cinematic-only');
  check('bounded-shadow-cost', /slice\(0, 144\)/.test(renderer) && /rain\|ambient-light-pod/.test(renderer), 'cinematic shadow casters are bounded and transient effects are excluded');
  check('profile-truthful', profile.primaryWorldMaterial === contract.rendererProfile.primaryWorldMaterial && profile.shadows.cinematic === true && profile.shadows.balanced === false && profile.finalBinaryArt === false && profile.remoteAssets === false, 'exported renderer profile stays truthful about source-only visual scope');
  check('no-network-or-final-art-claim', !/fetch\s*\(|XMLHttpRequest|WebSocket|https?:\/\//.test(renderer) && /not final licensed art/i.test(docs) && /real-device/i.test(docs), 'renderer contains no remote loader and docs preserve visual/device proof limits');
  return Object.freeze({ schema: 'eonapp.w416.city-renderer-hardening-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['W416 improves the original procedural fallback. It does not ship final licensed/original City binaries or prove a physical-device visual/performance result.']) });
}

export function runW416CityRendererHardeningGate({ writeArtifact = true } = {}) {
  const report = inspectW416CityRendererHardening();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w416-city-renderer-hardening-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW416CityRendererHardeningGate();
  process.stdout.write(`W416 City renderer hardening gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
