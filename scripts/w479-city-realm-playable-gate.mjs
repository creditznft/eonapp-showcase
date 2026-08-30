#!/usr/bin/env node
/** W479 source gate: the City is a truthful, local-first visual work loop. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W479_CITY_REALM_PLAYABLE_SCHEMA, W479_CITY_REQUIRED_SURFACES, W479_CITY_TRUTH, validateW479CityRealmPlayableContract } from '../config/w479-city-realm-playable-contract.mjs';
import { validateEonCityFirstRunPaths } from '../assets/js/city/eon-city-first-run.js';
import { validateCityCreatorAtriumCards } from '../assets/js/city/eon-city-creator-atrium.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

export function inspectW479CityRealmPlayable({ root = ROOT, writeArtifact = true } = {}) {
  const errors = [...validateW479CityRealmPlayableContract(), ...validateEonCityFirstRunPaths().errors, ...validateCityCreatorAtriumCards().errors];
  const requiredFiles = [
    'config/w479-city-realm-playable-contract.mjs',
    'scripts/w479-city-realm-playable-gate.mjs',
    'tests/unit/w479-city-realm-playable.test.mjs',
    'docs/W479_CITY_REALM_PLAYABLE_SOURCE_STATUS_2026-07-02.md',
    'eoncity.html',
    'assets/js/eon-city-play-station.js',
    'assets/js/city/eon-city-first-run.js',
    'assets/js/city/eon-city-work-loop.js',
    'assets/js/city/eon-city-creator-atrium.js',
    'assets/js/realm-studio-page.js'
  ];
  for (const relative of requiredFiles) if (!fs.existsSync(path.join(root, relative))) errors.push(`W479 required file is missing: ${relative}`);
  for (const surface of W479_CITY_REQUIRED_SURFACES) {
    const source = path.join(root, surface.source);
    if (!fs.existsSync(source)) continue;
    if (!read(root, surface.source).includes(surface.marker)) errors.push(`W479 source marker missing for ${surface.id}: ${surface.marker}`);
  }
  const cityStation = read(root, 'assets/js/eon-city-play-station.js');
  for (const marker of ['data-eon-play-first-run-panel', 'data-eon-play-open-start-here', 'selectEonCityFirstRunPath', 'createCityWorkLoopProposal', 'getCityCreatorAtriumCards', 'data-eon-play-open-performance-lab']) {
    if (!cityStation.includes(marker)) errors.push(`W479 City station is missing ${marker}.`);
  }
  const forbiddenCityActivation = /startPlatformOAuth|uploadPlatformContent|schedulePost|fetch\s*\([^)]*(?:x\.com|tiktok|youtube|instagram|facebook|linkedin)/i;
  if (forbiddenCityActivation.test(cityStation)) errors.push('W479 City must not activate social publishing from the visual work loop.');
  const report = Object.freeze({
    schema: `${W479_CITY_REALM_PLAYABLE_SCHEMA}.gate-report`,
    sourceStatus: errors.length ? 'fail' : 'pass',
    releaseStatus: 'source-foundation-only-device-and-browser-evidence-pending',
    requiredSurfaceCount: W479_CITY_REQUIRED_SURFACES.length,
    truth: W479_CITY_TRUTH,
    errors: freeze(errors)
  });
  if (writeArtifact) {
    const outDir = path.join(root, 'artifacts', 'w479-city-realm-playable-gate');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

const freeze = (value) => Object.freeze(value);
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW479CityRealmPlayable();
  if (report.sourceStatus !== 'pass') {
    process.stderr.write(`${report.errors.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`W479 City/Realm playable source gate passed (${report.requiredSurfaceCount} required surfaces).\n`);
  }
}
