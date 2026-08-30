#!/usr/bin/env node
/** W430 static gate: authored City vertical slice remains local, bounded and one Babylon route. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS, getCityAuthoredVerticalSlicePlan, getCityAuthoredVerticalSliceSummary, getCityAuthoredVerticalSliceTruth, validateCityAuthoredVerticalSlice } from '../assets/js/city/eon-city-authored-vertical-slice.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW430AuthoredCityVerticalSlice() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  const docs = read('docs/W430_W432_CITY_VERTICAL_SLICE_GOVERNOR_CERTIFICATION_FOUNDATION_2026-06-29.md');
  const plan = getCityAuthoredVerticalSlicePlan({ quality: 'balanced' });
  const summary = getCityAuthoredVerticalSliceSummary({ quality: 'balanced' });
  const truth = getCityAuthoredVerticalSliceTruth();
  const ids = EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS.map((entry) => entry.id);

  check('required-files', existsSync(path.join(root, 'assets/js/city/eon-city-authored-vertical-slice.js')) && existsSync(path.join(root, 'docs/W430_W432_CITY_VERTICAL_SLICE_GOVERNOR_CERTIFICATION_FOUNDATION_2026-06-29.md')), 'W430 contract and source documentation are present');
  check('contract-valid', validateCityAuthoredVerticalSlice().ok && summary.regionCount === 4, 'the authored vertical-slice registry validates with four regions');
  check('ordered-regions', JSON.stringify(ids) === JSON.stringify(['arrival-gate', 'command-district', 'creator-atrium', 'forge-bay']), 'the first-session City sequence is Arrival, Command, Creator, then Forge');
  check('quality-budgets', plan.markerBudget.maxAdditionalLights === 0 && plan.markerBudget.maxLabelTextures === 4 && plan.regions.every((entry) => entry.runtimeBudget.maxAdditionalLights === 0), 'W430 adds no dynamic lights and keeps wayfinding within quality budgets');
  check('truth-boundary', truth.canonicalRoute === '/eoncity' && truth.renderer === 'Babylon WebGL' && truth.finalBinaryArt === false && !truth.remoteAssets && !truth.remoteTelemetry && !truth.userDataInRenderer, 'W430 is source-controlled original art only and does not claim final binary art, transport, or private-work display');
  check('renderer-integration', /addAuthoredVerticalSliceWayfinding/.test(renderer) && /getCityAuthoredVerticalSliceSummary/.test(renderer) && /focusAuthoredVerticalSliceRegion/.test(renderer), 'the direct Babylon renderer creates bounded wayfinding and exposes a local focus control');
  check('station-review-control', /data-eon-play-open-district-guide/.test(station) && /data-eon-play-focus-authored-slice/.test(station) && /bindAuthoredVerticalSliceGuide/.test(station), 'the City UI exposes a deliberate district guide with no automatic route handoff');
  check('no-network-or-value-surface', !/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(read('assets/js/city/eon-city-authored-vertical-slice.js')) && !/wallet|payment|token|reward|loot|referral/i.test(JSON.stringify(plan)), 'the W430 registry neither transports data nor creates an economy or reward surface');
  check('documentation-boundary', /source-controlled original vector\/procedural/i.test(docs) && /final binary/i.test(docs) && /real-device/i.test(docs), 'documentation preserves the art provenance and external visual-proof boundary');
  return Object.freeze({ schema: 'eonapp.w430.authored-city-vertical-slice-gate.v1', wave: 'W430', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['Static source verification only.', 'No final GLB/GLTF art, asset-rights clearance, real-device frame capture, or visual certification is claimed.']) });
}

export function runW430AuthoredCityVerticalSliceGate({ writeArtifact = true } = {}) {
  const result = inspectW430AuthoredCityVerticalSlice();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w430-authored-city-vertical-slice-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW430AuthoredCityVerticalSliceGate();
  process.stdout.write(`W430 authored City vertical-slice gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
