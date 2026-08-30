#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonProjectDistrictTruth } from '../assets/js/city/eon-city-project-district-manifest.js';
import { W438_PROJECT_DISTRICT_CONTRACT, validateW438ProjectDistrictContract } from '../config/w438-project-district-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const read = (file) => readFileSync(path.join(root, file), 'utf8'); const ensure = (value, message) => assert.equal(Boolean(value), true, message);
export function inspectW438ProjectDistrict() {
  const checks = []; const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const manifest = read('assets/js/city/eon-city-project-district-manifest.js'); const workspace = read('assets/js/city/eon-city-project-district-workspace.js'); const renderer = read('assets/js/city/eon-city-play-babylon.js'); const station = read('assets/js/eon-city-play-station.js'); const updateSafe = read('assets/js/utils/update-safe-user-data.js'); const truth = getEonProjectDistrictTruth();
  check('required-files', ['assets/js/city/eon-city-project-district-manifest.js', 'assets/js/city/eon-city-project-district-workspace.js', 'config/w438-project-district-contract.mjs', 'tests/unit/w438-project-district.test.mjs'].every((file) => existsSync(path.join(root, file))), 'manifest, City workspace, contract and test exist');
  check('contract-valid', validateW438ProjectDistrictContract().length === 0 && W438_PROJECT_DISTRICT_CONTRACT.wave === 'W438', 'contract keeps City districts private and source-only');
  check('approval-and-privacy', /explicitUserAction/.test(manifest) && /explicitCitySafeLabelApproval/.test(manifest) && /SENSITIVE_TEXT/.test(manifest) && /projectReferenceExposed: false/.test(manifest), 'creation requires deliberate City-safe approval and strips private references');
  check('deterministic-render-plan', /buildEonProjectDistrictRenderPlan/.test(manifest) && /deterministicAnchor/.test(manifest) && /seedExposed: false/.test(manifest), 'render geometry is deterministic without exposing seed or private content');
  check('city-integration', /setProjectDistrictRenderPlans/.test(renderer) && /addPrivateProjectDistricts/.test(renderer) && /bindEonProjectDistrictWorkspace/.test(station), 'render plans are applied in the canonical Babylon City and controlled by a local panel');
  check('no-route-or-network', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|window\.open|location\.(?:assign|href)/.test(`${manifest}\n${workspace}`) && /remoteRequestCreated: false/.test(manifest), 'W438 creates neither a network request nor a new public City route');
  check('update-safe-key', updateSafe.includes('eon:city:project-districts:v1'), 'private local district registry is protected during updates');
  check('truth-boundary', truth.deterministicPrivateRendering === true && truth.projectReferencePubliclyExposed === false && truth.remoteGeneration === false && truth.deviceVisualProof === false, 'source work does not claim a live/private-public boundary or device visual proof');
  return Object.freeze({ schema: 'eonapp.w438.project-district-gate.v1', wave: 'W438', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No project prompt, file, title, account reference, seed or secret is displayed in City.', 'No actual device visual review or deployment proof was run.']) });
}
export function runW438ProjectDistrictGate({ writeArtifact = true } = {}) { const result = inspectW438ProjectDistrict(); if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w438-project-district-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); } return result; }
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW438ProjectDistrictGate(); process.stdout.write(`W438 project-district gate passed (${result.checkCount}/${result.checkCount}). No private project content was published.\n`); }
