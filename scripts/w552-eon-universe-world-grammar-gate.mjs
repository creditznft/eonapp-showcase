#!/usr/bin/env node
/** W552 source gate: restrained EON Universe world grammar, no network or value surfaces. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_UNIVERSE_CITY_INTERACTIONS, EON_UNIVERSE_RENDER_PROFILES, validateEonUniverseWorldGrammar } from '../assets/js/city/eon-universe-world-grammar.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => existsSync(path.join(root, relative));

export function inspectW552EonUniverseWorldGrammar({ writeArtifact = false } = {}) {
  const checks = [];
  const check = (id, condition, detail) => {
    checks.push({ id, pass: Boolean(condition), detail });
    assert.equal(Boolean(condition), true, `${id}: ${detail}`);
  };
  const grammar = read('assets/js/city/eon-universe-world-grammar.js');
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  check('required-files', [
    'assets/js/city/eon-universe-world-grammar.js',
    'tests/unit/w552-eon-universe-world-grammar.test.mjs',
    'assets/js/city/eon-city-play-babylon.js',
    'assets/js/eon-city-play-station.js'
  ].every(exists), 'world grammar, test and integrations exist');
  check('grammar-valid', validateEonUniverseWorldGrammar().ok, 'render profiles and finite interaction allowlist validate');
  check('three-quality-profiles', Object.keys(EON_UNIVERSE_RENDER_PROFILES).join(',') === 'lite,balanced,cinematic', 'quality profiles are finite and ordered');
  check('five-review-first-landmarks', EON_UNIVERSE_CITY_INTERACTIONS.length === 5 && EON_UNIVERSE_CITY_INTERACTIONS.every((entry) => entry.localOnly && entry.autoNavigation === false && entry.automaticExecution === false), 'only five finite local landmark interactions are exposed');
  check('renderer-applies-grammar', /getEonUniverseRenderProfile/.test(renderer) && /eonUniverseWorldGrammar/.test(renderer) && /worldRenderProfile\.glowIntensity/.test(renderer), 'renderer applies profile to camera, fog and glow');
  check('station-uses-grammar', /getEonUniverseCityInteraction/.test(station) && /data-eon-play-landmark-panel/.test(station), 'station presents world grammar only through visible interaction cards');
  check('no-network-or-value-surface', !/https?:\/\/|wallet|payment|token|reward|loot|referral|api[-_ ]?key|multiplayer|social/i.test(JSON.stringify(EON_UNIVERSE_CITY_INTERACTIONS)), 'world grammar interaction data contains no remote, monetary, credential or social surface');
  const report = Object.freeze({ schema: 'eon.city.w552.world-grammar.gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), finalBinaryArt: false, deviceEvidenceRequired: true });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w552-eon-universe-world-grammar-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW552EonUniverseWorldGrammar({ writeArtifact: true });
  process.stdout.write(`W552 EON Universe world grammar passed (${report.checkCount}/${report.checkCount}). Source proof only.\n`);
}
