#!/usr/bin/env node
/** W407/W611 static source gate: Arrival District remains local, user-directed and candidate-art honest. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCityArtIntakeSummary } from '../assets/js/city/eon-city-art-intake.js';
import { EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT, validateArrivalDistrictBlueprint } from '../assets/js/city/eon-city-arrival-district.js';
import { W407_ARRIVAL_DISTRICT_CONTRACT, validateW407ArrivalDistrictContract } from '../config/w407-arrival-district-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW407ArrivalDistrict({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const blueprint = validateArrivalDistrictBlueprint();
  const art = getCityArtIntakeSummary({ quality: 'balanced' });
  const city = read('assets/js/city/eon-city-play-babylon.js');
  const w406b = read('assets/js/city/eon-city-art-intake.js');
  const doc = read('docs/W407_ARRIVAL_DISTRICT_2026-06-28.md');

  check('contract-valid', validateW407ArrivalDistrictContract().length === 0, 'W407 contract has no internal mismatch');
  check('blueprint-valid', blueprint.ok, `W407 blueprint failed validation: ${blueprint.errors.join(' | ')}`);
  check('canonical-babylon', EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.publicEngine === 'babylon-eoncity' && EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.publicRoute === '/eoncity', 'Arrival District stays on canonical Babylon /eoncity');
  check('five-part-first-frame', EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.firstFrame.map((entry) => entry.id).join(',') === 'arrival-gate,wet-street-path,command-deck-exterior,skyline-depth,eonbot-companion', 'Arrival Gate, path, Command Deck, skyline and EONBOT are specified');
  check('first-mission-is-honest', EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.firstMission.autoStart === false && EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.firstMission.autoOpenRoute === false && EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.firstMission.reward === null, 'first mission is visible but never automatic or rewarding');
  check('w406b-boundary', art.shippedBinaryCount >= 8 && art.loadableCount === 5 && art.releaseReady === false && art.visualCertificationCaptured === false && /EON_CITY_ART_PIPELINE_POLICY/.test(w406b), 'W407 uses W406B local engineering candidates without treating them as final visual approval');
  check('renderer-builds-arrival-gate', /function addArrivalDistrict/.test(city) && /arrival-gate-pylon/.test(city) && /arrival-wet-street-path/.test(city) && /arrival-mission-beacon/.test(city), 'Babylon renderer builds the Arrival Gate, path and mission beacon');
  check('renderer-integrates-first-frame', /const arrivalDistrict = (runCityBootStage\('ARRIVAL_DISTRICT', \(\) => )?addArrivalDistrict/.test(city) && /EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT/.test(city) && /arrivalDistrict:\s*Object\.freeze/.test(city), 'Babylon runtime exposes the Arrival District state');
  check('companion-rain-command-deck-retained', /function addEonbot/.test(city) && /function addRain/.test(city) && /function addCommandCentre/.test(city), 'W407 retains companion, weather and Command Deck exterior');
  check('no-remote-or-user-data', !/https?:\/\//i.test(read('assets/js/city/eon-city-arrival-district.js')) && EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.rendering.remoteAssets === false && EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.rendering.userData === false, 'Arrival District has no remote asset or user-data path');
  check('candidate-runtime-truth-preserved', /createEonCityOriginalSceneArtRuntime/.test(city) && /originalSceneArtRuntime/.test(city), 'W407 sees the current local candidate-art runtime without creating an AAA/final release claim');
  check('documentation-discloses-limit', /W611 current-state note/i.test(doc) && /final visual-release certification/i.test(doc) && /does not certify/i.test(doc), 'W407 documentation distinguishes local candidates from visual proof');
  check('contract-source-only', W407_ARRIVAL_DISTRICT_CONTRACT.releaseRules.sourceOnly === true && W407_ARRIVAL_DISTRICT_CONTRACT.releaseRules.binaryAssets === false && W407_ARRIVAL_DISTRICT_CONTRACT.releaseRules.prohibitAutoOpenRoute === true, 'contract preserves source-only route boundaries');

  const report = Object.freeze({
    schema: 'eonapp.w407.arrival-district-gate.v1',
    wave: W407_ARRIVAL_DISTRICT_CONTRACT,
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    limitations: Object.freeze([
      'This gate does not prove visual quality, device controls, GPU performance, a human art review or real-world City screenshots.',
      'W407 can render current local engineering candidates, but final provenance review, KTX2/Basis packaging, device proof and owner approval remain separate.',
      'The first mission remains an on-screen local guide; it does not open, execute or complete work automatically.'
    ])
  });
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w407-arrival-district-gate');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW407ArrivalDistrict();
  process.stdout.write(`W407 Arrival District gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
