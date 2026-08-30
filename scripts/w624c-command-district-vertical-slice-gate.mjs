#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES } from '../config/route-contract.mjs';
import { W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT, validateW624cCommandDistrictContract } from '../config/w624c-command-district-vertical-slice-contract.mjs';
import { EON_CITY_RUNTIME_STATES } from '../assets/js/city/eon-city-runtime-state-machine.js';
import { EON_CITY_RUNTIME_ASSET_MANIFEST } from '../assets/js/city/eon-city-runtime-asset-manifest.js';
import {
  EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES,
  EON_CITY_COMMAND_DISTRICT_DESTINATIONS,
  EON_CITY_COMMAND_DISTRICT_JOURNEY,
  EON_CITY_COMMAND_DISTRICT_PATHS,
  EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS,
  getEonCityCommandDistrictVerticalSlicePlan,
  validateEonCityCommandDistrictVerticalSlice
} from '../assets/js/city/eon-city-command-district-vertical-slice.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const failures = [];
const check = (id, ok, detail = '') => { checks.push({ id, ok: Boolean(ok), detail }); if (!ok) failures.push(`${id}${detail ? `: ${detail}` : ''}`); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const plan = getEonCityCommandDistrictVerticalSlicePlan();
const planValidation = validateEonCityCommandDistrictVerticalSlice(plan);
const contractValidation = validateW624cCommandDistrictContract();
const renderer = read(W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT.renderer);
const station = read(W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT.station);
const access = read('assets/js/city/eon-city-access-station.js');
const architecture = read(W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT.architecture);
const actions = read(W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT.preparedActions);
const cityPage = read('eoncity.html');
const shellCss = read('assets/css/eon-app-shell.css');
const primaryRoutes = new Set(PRIMARY_APP_ROUTES.map((entry) => entry.from));

check('contract-valid', contractValidation.ok, contractValidation.errors.join(','));
check('slice-valid', planValidation.ok, planValidation.errors.join(','));
check('required-files', [W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT.verticalSlice, W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT.renderer, W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT.station].every(exists), 'slice/renderer/station');
check('productive-nocturne', plan.artDirection === 'Productive Nocturne' && renderer.includes('w624c-command-district-vertical-slice'), 'final art direction and runtime root');
check('six-destinations', EON_CITY_COMMAND_DISTRICT_DESTINATIONS.length === 6 && W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT.requiredDestinationIds.every((id) => EON_CITY_COMMAND_DISTRICT_DESTINATIONS.some((entry) => entry.id === id)), 'agent/create/forge/project/archive/signal');
check('canonical-routes', EON_CITY_COMMAND_DISTRICT_DESTINATIONS.every((entry) => primaryRoutes.has(entry.action.route)), EON_CITY_COMMAND_DISTRICT_DESTINATIONS.map((entry) => entry.action.route).join(','));
check('review-first-actions', actions.includes('getEonCityCommandDistrictDestination') && station.includes('prepareCityPlayAction') && station.includes('confirmPreparedCityAction') && !/location\.assign|window\.location|location\.href\s*=/.test(station), 'prepare/review/confirm only');
check('agent-theatre-honest-boundary', architecture.includes("id: 'agent-theatre'") && architecture.includes('representsLiveAgent: false') && renderer.includes("operationalState: 'dormant-until-receipt'"), 'no fake running agents');
check('creator-forge-destinations', renderer.includes("id: 'creator-atrium'") && renderer.includes("id: 'forge-bay'") && plan.destinations.some((entry) => entry.action.route === '/create') && plan.destinations.some((entry) => entry.action.route === '/forge'), 'authored silhouettes and canonical routes');
check('project-archive-signal', plan.destinations.some((entry) => entry.id === 'project-dock') && plan.destinations.some((entry) => entry.id === 'archive-canopy') && plan.destinations.some((entry) => entry.id === 'signal-sail'), 'three readable work landmarks');
check('first-ten-seconds', EON_CITY_COMMAND_DISTRICT_JOURNEY.firstTenSeconds.length === 4 && EON_CITY_COMMAND_DISTRICT_JOURNEY.firstTenSeconds.at(-1)?.second === 10, 'four timed hero cues');
check('first-sixty-seconds', EON_CITY_COMMAND_DISTRICT_JOURNEY.firstSixtySeconds.length === 5 && EON_CITY_COMMAND_DISTRICT_JOURNEY.firstSixtySeconds.at(-1)?.second === 60, 'five guided milestones');
check('authored-path-network', EON_CITY_COMMAND_DISTRICT_PATHS.length >= 7 && renderer.includes('w624c-path-'), 'arrival and six branches');
check('collision-coverage', EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES.length >= 7 && renderer.includes('createEonCityStaticCollisionVolumes({ landmarks: CITY_PLAY_LANDMARKS })'), 'authored landmark collision circles plus corrected cores');
check('safe-spawn', plan.spawn.id === 'arrival-plaza-spawn' && renderer.includes('EON_CITY_COMMAND_DISTRICT_SPAWN.x') && renderer.includes('EON_CITY_COMMAND_DISTRICT_SPAWN.z'), 'single authoritative arrival spawn');
check('unstuck-coverage', EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS.length >= 6 && renderer.includes('findEonCityCommandDistrictUnstuckPoint') && renderer.includes('unstuck()') && station.includes('data-eon-play-unstuck'), 'nearest authored safe point');
check('human-scale-props', renderer.includes('w624c-plaza-lantern') && renderer.includes('w624c-arrival-plaza-deck') && renderer.includes('warm-human-light'), 'plaza, lamps, path scale');
check('lighting-fog-sky-preserved', renderer.includes('addLighting') && renderer.includes('addOpenSkyProfile') && renderer.includes('fog'), 'existing Productive Nocturne atmosphere remains active');
const authorizedBootBlock = access.indexOf("if (view.kind === 'boot')");
const corePreloader = access.indexOf('const preloadCore = () =>', authorizedBootBlock);
const automaticEntry = access.indexOf('const automaticEntry = enter()', corePreloader);
const coreImportCount = (access.match(/import\('\.\/eon-city-play-core\.js'\)/g) || []).length;
const canonicalCoreOwner = authorizedBootBlock >= 0
  && corePreloader > authorizedBootBlock
  && automaticEntry > corePreloader
  && coreImportCount === 1
  && !access.includes('eon-city-runtime-owner.js');
const canonicalCollapsedShell = cityPage.includes('eon-app-shell.js')
  && cityPage.includes('data-eon-app-shell="1"')
  && cityPage.includes('data-eon-app-page="eoncity"')
  && shellCss.includes('body.eon-app-sidebar-collapsed')
  && shellCss.includes('body[data-eon-app-shell="1"] > main')
  && shellCss.includes('margin-left: var(--eon-app-rail-width)');
check('w624b-one-owner', canonicalCoreOwner && canonicalCollapsedShell && EON_CITY_RUNTIME_STATES.length === 11, 'authorized core owner, canonical collapsed shell and eleven states');
check('w624b-manifest-boundary', EON_CITY_RUNTIME_ASSET_MANIFEST.coreRequired.length === 5 && EON_CITY_RUNTIME_ASSET_MANIFEST.optionalStreamed.length === 5 && EON_CITY_RUNTIME_ASSET_MANIFEST.truth.remoteArtDependency === false, 'core/optional/local fallbacks');
check('compatibility-documents-static', W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT.frozenW624bBoundaries.compatibilityDocumentsStatic && ['eoncity-play.html', 'eoncity-3d.html', 'eoncity-lite.html'].every((file) => { const source = read(file); return source.includes('http-equiv="refresh"') && !source.includes('type="module"'); }), 'no alternate renderer documents');
check('performance-budget', plan.performanceBudget.maxNewInteractiveLandmarks === 6 && plan.performanceBudget.maxDynamicLightsAdded === 2 && plan.performanceBudget.remoteArtRequired === false && plan.performanceBudget.audioStartsAutomatically === false, 'bounded authored slice');
check('no-fake-operational-state', plan.fakeOperationalActivity === false && !/fake activity|job is running|agents are working/i.test(JSON.stringify(plan)), 'proof-gated language');
check('evidence-boundary', plan.finalQualityExpansionAllowed === false && plan.requiredIndependentScore === 90 && W624C_COMMAND_DISTRICT_VERTICAL_SLICE_CONTRACT.evidenceBoundary.sourceCanProveVisualScore === false, 'runtime/owner proof remains required');

const report = {
  schema: 'eonapp.w624c-command-district-vertical-slice-gate.v1',
  generatedAt: new Date().toISOString(),
  status: failures.length ? 'failed' : 'passed',
  checks,
  destinationCount: plan.destinations.length,
  pathCount: plan.paths.length,
  collisionVolumeCount: plan.collisionVolumes.length,
  unstuckPointCount: plan.unstuckPoints.length,
  firstTenSecondCueCount: plan.journey.firstTenSeconds.length,
  firstSixtySecondMilestoneCount: plan.journey.firstSixtySeconds.length,
  sourceArchitecturePass: failures.length === 0,
  runtimeVisualScore: null,
  physicalDeviceProof: false,
  ownerVisualApproval: false,
  expansionBeyondCommandDistrictAllowed: false,
  nextWave: 'W624D'
};
fs.mkdirSync(path.join(root, 'reports', 'w624c-command-district'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'w624c-command-district', 'launch-board.json'), `${JSON.stringify(report, null, 2)}\n`);

if (failures.length) {
  console.error(`W624C gate failed (${failures.length}/${checks.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`W624C gate passed ${checks.length}/${checks.length}.`);
console.log(`${plan.destinations.length} destinations, ${plan.paths.length} paths, ${plan.collisionVolumes.length} collision volumes, ${plan.unstuckPoints.length} safe points.`);
console.log('Source architecture is green. Runtime visual score, physical-device performance and owner approval remain separate evidence lanes.');
