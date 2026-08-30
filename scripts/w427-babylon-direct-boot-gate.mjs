#!/usr/bin/env node
/** W427 static gate: one direct Babylon boot path with redacted same-route recovery. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W427_BABYLON_DIRECT_BOOT_CONTRACT, validateW427BabylonDirectBootContract } from '../config/w427-babylon-direct-boot-contract.mjs';
import { CITY_BOOT_MARKERS, getCityBootDiagnosticsTruth } from '../assets/js/city/eon-city-boot-diagnostics.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW427BabylonDirectBoot() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const station = read('assets/js/eon-city-play-station.js');
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const diagnostics = read('assets/js/city/eon-city-boot-diagnostics.js');
  check('contract-valid', validateW427BabylonDirectBootContract().length === 0, 'W427 contract has no internal violation');
  check('marker-set', CITY_BOOT_MARKERS.length === 9 && W427_BABYLON_DIRECT_BOOT_CONTRACT.diagnostics.markers.every((marker) => CITY_BOOT_MARKERS.includes(marker)), 'Diagnostic marker set covers every required boot state');
  check('diagnostics-boundary', getCityBootDiagnosticsTruth().localOnly && !getCityBootDiagnosticsTruth().remoteTransport && !getCityBootDiagnosticsTruth().rawErrorMessages, 'Boot diagnostics are redacted and session-local');
  check('diagnostics-no-network', !/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(diagnostics), 'Diagnostics do not transport data');
  check('direct-station-controller', /createCityBootController/.test(station) && /bootController\.begin\(\)/.test(station), 'Direct City station starts a bounded boot controller');
  check('direct-markers', ['CITY_IMPORT_FAILED', 'CITY_CANVAS_MOUNT_FAILED', 'CITY_CONTEXT_LOST', 'CITY_FIRST_FRAME_TIMEOUT'].every((marker) => station.includes(marker)), 'Station records direct import, canvas, context and first-frame recovery markers');
  check('same-route-recovery', /Start low-detail City/.test(station) && /Show safe City code/.test(station) && /Get City help/.test(station) && !/href="\/eoncity\/lite"/.test(station), 'Recovery stays in one City route with explicit user choices');
  check('renderer-first-frame', /onFirstFrame/.test(renderer) && /CITY_ENGINE_CREATE_FAILED/.test(renderer) && /CITY_ASSET_LOAD_FAILED/.test(renderer) && /CITY_CANVAS_MOUNT_FAILED/.test(renderer), 'Renderer reports a safe first frame and only classified boot failures');
  const fallbackSlice = station.slice(station.indexOf('function renderFallback('), station.indexOf('async function requestImmersion'));
  check('no-raw-error-support', !/error\?\.message|String\(reason/.test(fallbackSlice) && /Safe City code/.test(fallbackSlice), 'Recovery support detail exposes a safe marker instead of raw error text');
  return Object.freeze({ schema: 'eonapp.w427.babylon-direct-boot-gate.v1', wave: 'W427', status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Static source verification only.', 'No production browser navigation, universal WebGL startup, Lighthouse score, real-device frame timing, or support workflow was performed.']) });
}
export function runW427BabylonDirectBootGate({ writeArtifact = true } = {}) {
  const result = inspectW427BabylonDirectBoot();
  if (writeArtifact) { const directory = path.join(root, 'artifacts', 'w427-babylon-direct-boot-gate'); mkdirSync(directory, { recursive: true }); writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); }
  return result;
}
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW427BabylonDirectBootGate(); process.stdout.write(`W427 Babylon direct-boot gate passed (${result.checkCount}/${result.checkCount}).\n`); }
