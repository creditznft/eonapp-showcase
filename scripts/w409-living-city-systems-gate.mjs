#!/usr/bin/env node
/** W409 source gate: living City systems remain local, honest and performance-governed. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W409_LIVING_CITY_SYSTEMS_CONTRACT, validateW409LivingCitySystemsContract } from '../config/w409-living-city-systems-contract.mjs';
import { EON_CITY_LIVING_SYSTEMS_BLUEPRINT, getCityLivingSystemsProfile, validateCityLivingSystemsBlueprint } from '../assets/js/city/eon-city-living-systems.js';
import { getCityArtIntakeSummary } from '../assets/js/city/eon-city-art-intake.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW409LivingCitySystems() {
  const city = read('assets/js/city/eon-city-play-babylon.js');
  const living = read('assets/js/city/eon-city-living-systems.js');
  const station = read('assets/js/eon-city-play-station.js');
  const commandDistrictNpcSystem = read('assets/js/city/eon-city-command-district-npc-system.js');
  const doc = read('docs/W409_LIVING_CITY_SYSTEMS_2026-06-28.md');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const blueprint = validateCityLivingSystemsBlueprint();
  const balanced = getCityLivingSystemsProfile({ quality: 'balanced' });
  const reduced = getCityLivingSystemsProfile({ quality: 'cinematic', reducedEffects: true });
  const art = getCityArtIntakeSummary({ quality: 'balanced' });

  check('contract-valid', validateW409LivingCitySystemsContract().length === 0, 'W409 contract has no internal mismatch');
  check('blueprint-valid', blueprint.ok, `W409 blueprint failed validation: ${blueprint.errors.join(' | ')}`);
  check('canonical-babylon', EON_CITY_LIVING_SYSTEMS_BLUEPRINT.publicEngine === 'babylon-eoncity' && EON_CITY_LIVING_SYSTEMS_BLUEPRINT.publicRoute === '/eoncity', 'W409 stays on canonical Babylon /eoncity');
  check('honest-living-behaviors', EON_CITY_LIVING_SYSTEMS_BLUEPRINT.npcBehavior.fabricatesWork === false && EON_CITY_LIVING_SYSTEMS_BLUEPRINT.npcBehavior.autoStartsWork === false && EON_CITY_LIVING_SYSTEMS_BLUEPRINT.ambientLife.remoteTraffic === false && EON_CITY_LIVING_SYSTEMS_BLUEPRINT.ambientLife.userTracking === false, 'NPC and ambient life never simulate user work or tracking');
  check('mission-board-is-nonrewarding', EON_CITY_LIVING_SYSTEMS_BLUEPRINT.missionBoard.visibleOnly === true && EON_CITY_LIVING_SYSTEMS_BLUEPRINT.missionBoard.autoStart === false && EON_CITY_LIVING_SYSTEMS_BLUEPRINT.missionBoard.autoOpenRoute === false && EON_CITY_LIVING_SYSTEMS_BLUEPRINT.missionBoard.reward === null, 'mission board is local wayfinding only');
  check('profile-reduces-effects', balanced.ambientPodCount === 3 && balanced.cycleMode === 'midnight-dawn' && reduced.ambientPodCount === 0 && reduced.cycleMode === 'static-night' && reduced.rainEnabled === false, 'quality profiles retain clear reduced-effects behavior');
  check('renderer-adds-living-systems', /function addLivingCitySystems/.test(city) && /living-mission-board/.test(city) && /living-ambient-light-pod/.test(city) && /living-dawn-wash/.test(city), 'Babylon renderer builds the mission board, ambient pods and light cycle');
  check('renderer-integrates-runtime', /runtimeState\.livingSystems = addLivingCitySystems/.test(city) && /runtimeState\.livingSystems\?\.getSummary/.test(city) && /EON_CITY_LIVING_SYSTEMS_BLUEPRINT/.test(city) && /engineStages\.add\('street-life'/.test(city), 'runtime exposes W409 local living-systems summary after the first-frame core');
  check('performance-governor-integrates', /livingSystems\?\.setReducedEffects\?\.\(true\)/.test(city) && /Performance protection reduced local visual effects/.test(city), 'existing performance protection disables optional W409 effects without changing work state');
  const legacyMicroPatrol = /root\.position\.x = x \+ Math\.sin/.test(city) && /root\.position\.z = z \+ Math\.cos/.test(city);
  const authoredBoundedPatrol = /createEonCityCommandDistrictNpcController/.test(city)
    && /getEonCityCommandDistrictNpcPlan/.test(city)
    && /productionPlan = getEonCityCommandDistrictNpcPlan/.test(city)
    && /productionController = createEonCityCommandDistrictNpcController/.test(city)
    && /EON_CITY_COMMAND_DISTRICT_PATHS/.test(commandDistrictNpcSystem)
    && /authoredPathIds/.test(commandDistrictNpcSystem)
    && /path: freeze\(\{ start, end, width: path\.width \}\)/.test(commandDistrictNpcSystem)
    && /autoNavigation: false/.test(commandDistrictNpcSystem)
    && /automaticExecution: false/.test(commandDistrictNpcSystem);
  check('npc-bounded-patrol', legacyMicroPatrol || authoredBoundedPatrol, 'guide NPCs use bounded local micro-patrol or the newer authored-path patrol contract');
  check('existing-mission-review-retained', /Prepared route · review required/.test(station) && /No background task, signature, purchase, reward, contract action, or external request will run/.test(station), 'station still requires explicit route review');
  check('w406b-candidate-boundary', art.shippedBinaryCount >= 8 && art.loadableCount === 5 && art.releaseReady === false && art.visualCertificationCaptured === false, 'W409 recognises local engineering candidates while retaining final-art proof boundaries');
  check('no-remote-or-user-data', !/https?:\/\//i.test(living) && EON_CITY_LIVING_SYSTEMS_BLUEPRINT.rendering.remoteAssets === false && EON_CITY_LIVING_SYSTEMS_BLUEPRINT.rendering.remoteTelemetry === false && EON_CITY_LIVING_SYSTEMS_BLUEPRINT.rendering.userData === false, 'W409 has no remote asset, telemetry or user-data path');
  check('candidate-runtime-truth-preserved', /createEonCityOriginalSceneArtRuntime/.test(city) && /originalSceneArtRuntime/.test(city), 'W409 does not confuse local candidate art with final visual certification');
  check('documentation-discloses-limit', /W611 current-state note/i.test(doc) && /final visual-release certification/i.test(doc) && /does not certify/i.test(doc), 'W409 documentation retains the current proof limitation');

  return Object.freeze({
    schema: 'eonapp.w409.living-city-systems-gate.v1',
    wave: W409_LIVING_CITY_SYSTEMS_CONTRACT,
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    limitations: Object.freeze([
      'This gate does not prove final art quality, real-device controls, GPU performance, human art review, weather realism or real-world time-of-day behavior.',
      'W409 retains W406B provenance, licensing, LOD, texture, mobile-fallback and final visual-release requirements for current local candidates.',
      'The mission board remains visual wayfinding. Native routes still require the existing explicit review and user click.'
    ])
  });
}

export function runW409LivingCitySystemsGate({ writeArtifact = true } = {}) {
  const report = inspectW409LivingCitySystems();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w409-living-city-systems-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW409LivingCitySystemsGate();
  process.stdout.write(`W409 Living City Systems gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
