#!/usr/bin/env node
/** W420 static source gate: local cinematic art direction, no external LUTs. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_CINEMATIC_ART_DIRECTION, getCityCinematicArtDirection, validateCityCinematicArtDirection } from '../assets/js/city/eon-city-cinematic-art-direction.js';
import { W420_CITY_CINEMATIC_ART_DIRECTION_CONTRACT, validateW420CityCinematicArtDirectionContract } from '../config/w420-city-cinematic-art-direction-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW420CityCinematicArtDirection() {
  const contract = W420_CITY_CINEMATIC_ART_DIRECTION_CONTRACT;
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const direction = read('assets/js/city/eon-city-cinematic-art-direction.js');
  const docs = read('docs/W420_CITY_CINEMATIC_ART_DIRECTION_2026-06-28.md');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  check('contract-valid', validateW420CityCinematicArtDirectionContract().length === 0, 'W420 contract has no internal mismatch');
  check('required-files-exist', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'source, renderer, contract, gate, test and docs exist');
  check('profile-valid', validateCityCinematicArtDirection().ok && Object.keys(EON_CITY_CINEMATIC_ART_DIRECTION).join(',') === contract.requiredQualities.join(','), 'Lite, Balanced and Cinematic profiles are bounded and present');
  check('no-remote-lut-or-user-data', !/https?:\/\//i.test(direction) && !/colorGradingTexture|remoteLut:\s*true|userData:\s*true/i.test(direction), 'art direction uses no remote LUT, texture or user data');
  check('renderer-applies-local-profile', /applyCinematicArtDirection/.test(renderer) && /ImageProcessingConfiguration/.test(renderer) && /toneMappingEnabled/.test(renderer) && /vignetteEnabled/.test(renderer) && /ditheringEnabled/.test(renderer), 'renderer applies local tone mapping plus bounded vignette and optional anti-grain settings');
  check('source-only-claims-preserved', /finalVisualCertification:\s*false/.test(direction) && /not final binary art/i.test(docs) && /real-device visual proof/i.test(docs), 'W420 does not claim final art or device evidence');
  const cinematic = getCityCinematicArtDirection({ quality: 'cinematic' });
  check('cinematic-profile-bounded', cinematic.toneMapping === 'aces' && cinematic.vignette.enabled === true && cinematic.dithering.enabled === false && cinematic.localOnly === true && cinematic.remoteLut === false, 'Cinematic uses bounded local ACES composition without screen grain');
  return Object.freeze({ schema: 'eonapp.w420.city-cinematic-art-direction-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), finalBinaryArt: false, externalEvidenceRequired: Object.freeze(['human art review', 'real-device visual/performance proof', 'W417 binary art intake']) });
}

export function runW420CityCinematicArtDirectionGate({ writeArtifact = true } = {}) {
  const report = inspectW420CityCinematicArtDirection();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w420-city-cinematic-art-direction-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW420CityCinematicArtDirectionGate();
  process.stdout.write(`W420 cinematic art-direction gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
