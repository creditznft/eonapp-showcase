#!/usr/bin/env node
/** W421 source gate: art review must expose real local art without final-art claims. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCityArtReviewSummary, getCityCinematicShots, validateCityArtReview } from '../assets/js/city/eon-city-art-review.js';
import { W421_CITY_ART_REVIEW_CONTRACT, validateW421CityArtReviewContract } from '../config/w421-city-art-review-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW421CityArtReview() {
  const contract = W421_CITY_ART_REVIEW_CONTRACT;
  const runtime = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  const css = read('assets/css/eon-city-play.css');
  const docs = read('docs/W421_CITY_ART_REVIEW_AND_CINEMATIC_VIEWS_2026-06-28.md');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const review = getCityArtReviewSummary({ quality: 'cinematic' });
  check('contract-valid', validateW421CityArtReviewContract().length === 0, 'W421 contract has no internal mismatch');
  check('required-files-exist', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'art review source, runtime/UI/CSS, gate, test and docs exist');
  check('six-local-shots-valid', validateCityArtReview().ok && contract.requiredShotIds.every((id, index) => getCityCinematicShots()[index]?.id === id), 'the six W421 base compositions remain first and bounded in the local review list');
  check('review-reports-shipped-vector-art', review.originalVectorArtShipped === true && review.vectorArt.catalogCount >= 18 && review.originalArtEntries.length === review.vectorArt.catalogCount && review.binaryArtShipped === false, 'review exposes actual shipped original vector art without binary-art confusion');
  check('runtime-applies-shot-locally', /setCinematicShot\(shotId/.test(runtime) && /getCityCinematicShot/.test(runtime) && /camera\.setTarget/.test(runtime), 'Babylon runtime applies a requested bounded local composition');
  check('ui-is-explicit-and-non-capturing', /data-eon-play-open-art-review/.test(station) && /data-eon-play-art-shot/.test(station) && /No screenshot, video, upload or device probe/.test(station), 'City Controls exposes a non-capturing art review panel');
  check('responsive-art-review-style', /eon-play-art-review-panel/.test(css) && /eon-play-art-review-grid/.test(css), 'art-review presentation has City-native responsive styling');
  check('final-art-boundary-preserved', /not final binary art/i.test(docs) && /real-device visual proof/i.test(docs) && /finalInstitutionalArtClaim:\s*false/.test(read('assets/js/city/eon-city-art-review.js')), 'docs and source retain final-art and real-device limits');
  return Object.freeze({ schema: 'eonapp.w421.city-art-review-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), finalArtClaim: false, externalEvidenceRequired: Object.freeze(['human visual review', 'real-device City visual and performance proof', 'W417 reviewed binary-art release evidence']) });
}

export function runW421CityArtReviewGate({ writeArtifact = true } = {}) {
  const report = inspectW421CityArtReview();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w421-city-art-review-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW421CityArtReviewGate();
  process.stdout.write(`W421 City art-review gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
