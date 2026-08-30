#!/usr/bin/env node
import fs from 'node:fs';
import {
  buildEonCityW710ContinuousCoreFabric,
  getEonCityW710ContinuousCoreFabricTruth,
  validateEonCityW710ContinuousCoreFabric
} from '../assets/js/city/w710/eon-city-w710-continuous-core-fabric.js';
import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from '../assets/js/city/eon-city-connected-core.js';

const renderer = fs.readFileSync(new URL('../assets/js/city/eon-city-connected-core-babylon.js', import.meta.url), 'utf8');
const coreSource = fs.readFileSync(new URL('../assets/js/city/eon-city-connected-core.js', import.meta.url), 'utf8');
const balanced = buildEonCityConnectedCorePlan({ quality: 'balanced', mode: 'explore' });
const fabric = balanced.continuousFabric;
const truth = getEonCityW710ContinuousCoreFabricTruth();
const allQualitiesValid = ['lite', 'balanced', 'cinematic'].every((quality) => {
  const plan = buildEonCityConnectedCorePlan({ quality, mode: 'explore' });
  return validateEonCityConnectedCorePlan(plan).ok && validateEonCityW710ContinuousCoreFabric(plan.continuousFabric).ok;
});

const checks = [
  ['all-quality-plans-valid', allQualitiesValid],
  ['continuous-ground-and-underside', fabric.continuousGround.seamless && fabric.undersideShield.opaqueFromBelow && fabric.coverage.groundCoverageRatio === 1 && fabric.coverage.noUncoveredTerrain],
  ['urban-density-and-preserved-sanctums', fabric.counts.infillBlockCount >= 40 && fabric.coverage.occupiedCellRatio >= 0.52 && fabric.districtExclusionZones.length === 9 && fabric.districtExclusionZones.every((entry) => entry.sanctumPreserved)],
  ['roads-plazas-skyline-and-borders', fabric.roads.length >= 17 && fabric.plazas.length >= 4 && fabric.skylineLayers.length === 3 && fabric.borderCorridors.length === 4 && fabric.borderCorridors.some((entry) => entry.flagshipGateway)],
  ['connected-core-authority', /buildEonCityW710ContinuousCoreFabric/.test(coreSource) && /continuousFabric/.test(coreSource) && validateEonCityConnectedCorePlan(balanced).ok],
  ['existing-scene-renderer-integration', /w710-continuous-core-deck/.test(renderer) && /continuous-core-infill-block/.test(renderer) && /continuous-core-public-plaza/.test(renderer) && /continuous-core-skyline-/.test(renderer) && /continuous-core-border-corridor/.test(renderer)],
  ['no-second-babylon-owner', !/new\s+(?:Engine|Scene)\s*\(/.test(renderer) && !/runRenderLoop\s*\(/.test(renderer) && !/createElement\s*\(\s*['"]canvas/.test(renderer)],
  ['truth-boundaries', truth.continuousUrbanGround && truth.authoredSanctumsPreserved && truth.threeSkylineDepths && truth.physicalBorderContinuations && truth.oneCanonicalScene && !truth.startsSecondRenderer && !truth.automaticNavigation && !truth.automaticEntry && !truth.readsPrivateWork]
];

for (const [id, pass] of checks) console.log(`[W710] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W710] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
