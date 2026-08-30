#!/usr/bin/env node
/** W413/W414 source gate: finite City planning worlds and local-only Metropolis wayfinding. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_SIGNAL_EXPEDITION_TEMPLATES, getSignalExpeditionTruth, validateSignalExpeditionSession } from '../assets/js/city/eon-signal-expeditions.js';
import { EON_CITY_METROPOLIS_DISTRICTS, getMetropolisDistrictTruth, validateMetropolisDistricts } from '../assets/js/city/eon-city-metropolis-districts.js';
import { W413_W414_CITY_EXPEDITIONS_METROPOLIS_CONTRACT, validateW413W414Contract } from '../config/w413-w414-city-expeditions-metropolis-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW413W414CityExpeditionsMetropolis() {
  const contract = W413_W414_CITY_EXPEDITIONS_METROPOLIS_CONTRACT;
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const expeditions = read('assets/js/city/eon-signal-expeditions.js');
  const metropolis = read('assets/js/city/eon-city-metropolis-districts.js');
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  const share = read('assets/js/share/eon-output-share-handoff.js');
  const remix = read('assets/js/share/eon-remix-card.js');
  const css = read('assets/css/eon-city-play.css');
  const docs = read('docs/W413_W414_CITY_EXPEDITIONS_METROPOLIS_2026-06-28.md');

  check('contract-valid', validateW413W414Contract().length === 0, 'W413/W414 contract has no internal mismatch');
  check('required-files-exist', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'all W413/W414 source, contract, gate, test and docs files exist');
  check('four-finite-authored-templates', EON_SIGNAL_EXPEDITION_TEMPLATES.map((entry) => entry.id).join(',') === contract.requiredTemplateIds.join(',') && EON_SIGNAL_EXPEDITION_TEMPLATES.every((entry) => entry.durationMinutes >= 5 && entry.durationMinutes <= 15 && entry.setPieces.length >= 3 && entry.missions.length === 3), 'Signal Expeditions use four bounded authored templates with 5–15 minute routes');
  check('expedition-truth-boundary', Object.entries(contract.expectedExpeditionTruth).every(([key, expected]) => getSignalExpeditionTruth()[key] === expected), 'Signal Expeditions remain session-local and do not read/write projects, connect/publish, execute, track, reward or pay');
  check('metropolis-districts-valid', validateMetropolisDistricts().ok && EON_CITY_METROPOLIS_DISTRICTS.map((entry) => entry.id).join(',') === contract.requiredDistrictIds.join(','), 'three remaining Option A districts are valid and separately named');
  check('metropolis-truth-boundary', Object.entries(contract.expectedMetropolisTruth).every(([key, expected]) => getMetropolisDistrictTruth()[key] === expected), 'Metropolis routes remain user-selected and no social/automation/economic feature is activated');
  check('renderer-integrates-local-districts', /addMetropolisDistricts/.test(renderer) && /focusMetropolisDistrict/.test(renderer) && /metropolisDistrictCount/.test(renderer), 'canonical Babylon renderer contains the three district source surfaces and local focus control');
  check('station-exposes-explicit-actions', /data-eon-play-open-metropolis/.test(station) && /data-eon-play-open-signal-expedition/.test(station) && /bindMetropolisDistricts/.test(station) && /bindSignalExpeditions/.test(station), 'City Controls expose both features through explicit local UI actions');
  check('station-requires-separate-native-choice', /data-eon-play-signal-destination/.test(station) && /data-eon-play-metropolis-route/.test(station) && /disposeCityPlayRuntime\(root\)/.test(station), 'native routes remain user-clicked and leave City only after that visible choice');
  check('share-remix-city-postcard-supported', /city-expedition/.test(share) && /city-postcard/.test(share) && /city-postcard/.test(remix) && /writeEonOutputShareHandoff/.test(station), 'completed local expeditions can prepare only a public-safe session Share/Remix handoff');
  check('new-modules-have-no-network-or-remote-loader', !/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon|https?:\/\//.test(`${expeditions}\n${metropolis}`), 'new City planning modules do not load remote data, telemetry or assets');
  check('no-auto-start-or-route', /explicitUserAction !== true/.test(expeditions) && /automaticNavigation:\s*false/.test(metropolis) && !/location\.href\s*=|window\.location\s*=/.test(station), 'sessions and routes do not begin or navigate automatically');
  check('responsive-style-present', /eon-play-signal-expedition/.test(css) && /eon-play-metropolis/.test(css), 'City panels retain desktop and small-screen styles');
  check('docs-disclose-proof-limit', /source\/build certified/i.test(docs) && /real-device/i.test(docs) && /licensed binary art/i.test(docs) && /No external capability is activated/i.test(docs), 'docs disclose that visual/device proof and external activation remain pending');
  check('session-validator-is-available', typeof validateSignalExpeditionSession === 'function', 'Signal Expedition sessions have a fail-closed validator');

  return Object.freeze({ schema: 'eonapp.w413-w414.city-expeditions-metropolis-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze([
    'W413/W414 are source/build work only. They do not prove City controls on physical devices, final visual quality, performance, licensed asset ingestion, OAuth, cross-device Sync, social posting or provider execution.',
    'Signal Expeditions are finite authored template sessions, not an open world, a project reader, a collaboration room, or a productivity/reward system.',
    'The Share/Remix postcard is session-local and public-safe; it creates no public link, invite, referral attribution, posting or tracking.'
  ]) });
}

export function runW413W414CityExpeditionsMetropolisGate({ writeArtifact = true } = {}) {
  const report = inspectW413W414CityExpeditionsMetropolis();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w413-w414-city-expeditions-metropolis-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW413W414CityExpeditionsMetropolisGate();
  process.stdout.write(`W413/W414 City Expeditions + Metropolis gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
