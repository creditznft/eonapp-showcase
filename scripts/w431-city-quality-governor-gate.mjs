#!/usr/bin/env node
/** W431 static gate: one bounded local quality governor with no silent preference or route changes. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCityQualityGovernor, getCityQualityGovernorPolicy, getCityQualityGovernorTruth } from '../assets/js/city/eon-city-quality-governor.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW431CityQualityGovernor() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const governorSource = read('assets/js/city/eon-city-quality-governor.js');
  const truth = getCityQualityGovernorTruth();
  let time = 1000;
  const governor = createCityQualityGovernor({ quality: 'balanced', now: () => (time += 1) });
  let decision = null;
  for (let index = 0; index < 150; index += 1) decision = governor.recordFrame(42).decision || decision;
  const afterRecommendation = governor.getSnapshot();
  const afterProtection = governor.markProtectionApplied(decision?.reason || 'test-protection');
  let safeDecision = null;
  for (let index = 0; index < 320; index += 1) safeDecision = governor.recordFrame(58).decision || safeDecision;
  const lite = createCityQualityGovernor({ quality: 'lite', now: () => (time += 1) });
  let liteDecision = null;
  for (let index = 0; index < 220; index += 1) liteDecision = lite.recordFrame(82).decision || liteDecision;

  check('required-file', existsSync(path.join(root, 'assets/js/city/eon-city-quality-governor.js')), 'W431 governor module exists');
  check('quality-policy', getCityQualityGovernorPolicy('balanced').canApplyProtection === true && getCityQualityGovernorPolicy('lite').canApplyProtection === false, 'balanced/cinematic can recommend one protection pass while lite never self-degrades');
  check('bounded-protection', decision?.action === 'apply-protection' && afterRecommendation.protectionApplied === false && afterProtection.protectionApplied === true, 'a slow warmup recommends one local protection pass; the renderer must apply it deliberately');
  check('safe-mode-not-automatic', safeDecision?.action === 'recommend-safe-mode' && governor.getSnapshot().safeModeRecommended === true, 'persistent slowness offers visible low-detail recovery instead of changing routes or preferences');
  check('lite-does-not-loop', liteDecision === null && lite.getSnapshot().protectionApplied === false, 'lite remains a stable user-selected floor rather than an automatic downgrade loop');
  check('truth-boundary', truth.localOnly && truth.persistence === 'memory-only' && !truth.remoteTelemetry && !truth.modifiesSavedVisualPreference && !truth.automaticRouteChange && !truth.automaticSafeModeRestart, 'the governor never records telemetry, changes saved settings, or navigates/restarts City');
  check('no-browser-storage-or-network', !/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon/.test(governorSource), 'the governor has no browser persistence or transport path');
  check('renderer-integration', /createCityQualityGovernor/.test(renderer) && /qualityGovernor\.recordFrame/.test(renderer) && /qualityGovernor\.markProtectionApplied/.test(renderer) && /recommend-safe-mode/.test(renderer), 'the direct Babylon renderer uses the bounded governor for visible recovery guidance');
  return Object.freeze({ schema: 'eonapp.w431.city-quality-governor-gate.v1', wave: 'W431', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No real-device 30-minute run or measured frame budget is claimed.', 'This gate does not alter saved City profile preferences or create a device certification.']) });
}

export function runW431CityQualityGovernorGate({ writeArtifact = true } = {}) {
  const result = inspectW431CityQualityGovernor();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w431-city-quality-governor-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW431CityQualityGovernorGate();
  process.stdout.write(`W431 City quality-governor gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
