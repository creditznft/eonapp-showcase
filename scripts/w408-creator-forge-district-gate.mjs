#!/usr/bin/env node
/** W408/W611 source gate: Creator Atrium and Forge Bay remain Babylon-native, local and user-directed. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W408_CREATOR_FORGE_DISTRICT_CONTRACT, validateW408CreatorForgeDistrictContract } from '../config/w408-creator-forge-district-contract.mjs';
import { EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT, getCreatorForgeDistrictDestinations, validateCreatorForgeDistrictBlueprint } from '../assets/js/city/eon-city-creator-forge-district.js';
import { getCityCreatorAtriumCards, getCityCreatorAtriumSummary } from '../assets/js/city/eon-city-creator-atrium.js';
import { getCityArtIntakeSummary } from '../assets/js/city/eon-city-art-intake.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW408CreatorForgeDistrict() {
  const city = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  const moduleSource = read('assets/js/city/eon-city-creator-forge-district.js');
  const doc = read('docs/W408_CREATOR_FORGE_DISTRICT_2026-06-28.md');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const blueprint = validateCreatorForgeDistrictBlueprint();
  const cards = getCityCreatorAtriumCards();
  const summary = getCityCreatorAtriumSummary();
  const destinations = getCreatorForgeDistrictDestinations();
  const art = getCityArtIntakeSummary({ quality: 'balanced' });

  check('contract-valid', validateW408CreatorForgeDistrictContract().length === 0, 'W408 contract has no internal mismatch');
  check('blueprint-valid', blueprint.ok, `W408 blueprint failed validation: ${blueprint.errors.join(' | ')}`);
  check('canonical-babylon', EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.publicEngine === 'babylon-eoncity' && EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.publicRoute === '/eoncity', 'Creator/Forge district stays on canonical Babylon /eoncity');
  check('two-authored-districts', EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.districts.map((district) => district.id).join(',') === 'creator-atrium,forge-bay', 'Creator Atrium and Forge Bay are separately declared');
  check('launches-match-w404', destinations.map((entry) => entry.route).sort().join(',') === cards.map((entry) => entry.route).sort().join(','), 'W408 uses the existing compact W404 local launch allowlist');
  check('user-review-boundary', EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.handoff.foregroundUserGestureOnly === true && EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.handoff.visibleReviewRequired === true && EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.handoff.automaticNavigation === false && EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.handoff.automaticExecution === false, 'W408 requires a visible foreground choice before native work');
  check('w404-panel-retained', /data-eon-play-open-creator-atrium/.test(station) && /data-eon-play-creator-atrium-panel/.test(station) && /Creator Atrium destination chosen/.test(station) && !/location\.assign|window\.location/.test(station), 'W408 reuses the local W404 launch board rather than hidden routing');
  check('renderer-builds-authored-eon-noir-landmarks', /function addCreatorForgeDistrict/.test(city) && /createEonNoirLandmark\(scene, \{/.test(city) && /type: 'creator-atrium'/.test(city) && /type: 'forge-basilica'/.test(city) && /sign-creator-atrium-noir/.test(city) && /sign-forge-bay-noir/.test(city), 'Babylon renderer builds separately authored EON Noir landmark silhouettes and wayfinding');
  check('runtime-exposes-district', /const creatorForgeDistrict = (runCityBootStage\('CREATOR_FORGE_DISTRICT', \(\) => )?addCreatorForgeDistrict/.test(city) && /creatorForgeDistrict:\s*Object\.freeze/.test(city) && /EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT/.test(city), 'Babylon runtime exposes the W408 district state');
  check('no-private-or-provider-surface', summary.displaysPrivateWork === false && summary.providerCalls === false && summary.credentials === false && summary.mediaBodies === false && EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.handoff.transfersPrivateWork === false && EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.handoff.startsProviderWork === false, 'W408 displays no private work and starts no provider task');
  check('w406b-candidate-boundary', art.shippedBinaryCount >= 8 && art.loadableCount === 5 && art.plannedCount === 3 && art.releaseReady === false && art.visualCertificationCaptured === false, 'W408 recognises the current local candidate layer while Creator/Forge remain planned');
  check('no-remote-or-user-data', !/https?:\/\//i.test(moduleSource) && EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.rendering.remoteAssets === false && EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.rendering.remoteTelemetry === false && EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.rendering.userData === false, 'W408 has no remote asset, telemetry or user-data path');
  check('candidate-runtime-truth-preserved', /createEonCityOriginalSceneArtRuntime/.test(city) && /originalSceneArtRuntime/.test(city), 'W408 does not confuse the candidate-art seam with final visual approval');
  check('documentation-discloses-limit', /W611 current-state note/i.test(doc) && /Creator and Forge remain planned/i.test(doc) && /does not certify/i.test(doc), 'W408 documentation distinguishes current candidates from planned Creator/Forge art');

  return Object.freeze({
    schema: 'eonapp.w408.creator-forge-district-gate.v1',
    wave: W408_CREATOR_FORGE_DISTRICT_CONTRACT,
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    limitations: Object.freeze([
      'This gate does not prove final art quality, device controls, GPU performance, a human art review or real-world City screenshots.',
      'W408 ships no binary asset and leaves W406B provenance, licensing and packaging release requirements intact.',
      'Creator and Forge destinations remain separate native surfaces selected by a visible user click; W408 does not run, publish, deploy or transfer work.'
    ])
  });
}

export function runW408CreatorForgeDistrictGate({ writeArtifact = true } = {}) {
  const report = inspectW408CreatorForgeDistrict();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w408-creator-forge-district-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW408CreatorForgeDistrictGate();
  process.stdout.write(`W408 Creator/Forge District gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
