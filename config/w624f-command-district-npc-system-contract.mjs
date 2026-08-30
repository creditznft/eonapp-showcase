import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES,
  EON_CITY_COMMAND_DISTRICT_NPC_LOD_PROFILES,
  EON_CITY_COMMAND_DISTRICT_NPC_STATES,
  createEonCityCommandDistrictNpcController,
  getEonCityCommandDistrictNpcPlan,
  getEonCityCommandDistrictNpcReview,
  validateEonCityCommandDistrictNpcPlan
} from '../assets/js/city/eon-city-command-district-npc-system.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const freeze = (value) => Object.freeze(value);

export const W624F_COMMAND_DISTRICT_NPC_CONTRACT = freeze({
  schema: 'eonapp.w624f-command-district-npc-contract.2026-07-11.v1',
  canonicalRoute: '/eoncity',
  runtimeOwner: 'assets/js/city/eon-city-runtime-owner.js',
  npcModule: 'assets/js/city/eon-city-command-district-npc-system.js',
  rendererModule: 'assets/js/city/eon-city-play-babylon.js',
  stationModule: 'assets/js/eon-city-play-station.js',
  cssModule: 'assets/css/eon-city-play.css',
  archetypeCount: 4,
  stateCount: 9,
  lodProfiles: freeze(Object.keys(EON_CITY_COMMAND_DISTRICT_NPC_LOD_PROFILES)),
  finalQualityExpansionAllowed: false,
  physicalDeviceCrowdProofPending: true,
  ownerVisualApprovalPending: true
});

export function validateW624fCommandDistrictNpcContract() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const plan = getEonCityCommandDistrictNpcPlan({ lod: 'balanced' });
  const lite = getEonCityCommandDistrictNpcPlan({ lod: 'lite' });
  const disabled = getEonCityCommandDistrictNpcPlan({ lod: 'disabled' });
  const validation = validateEonCityCommandDistrictNpcPlan(plan);
  const controller = createEonCityCommandDistrictNpcController({ lod: 'balanced' });
  const station = read(W624F_COMMAND_DISTRICT_NPC_CONTRACT.stationModule);
  const renderer = read(W624F_COMMAND_DISTRICT_NPC_CONTRACT.rendererModule);
  const moduleSource = read(W624F_COMMAND_DISTRICT_NPC_CONTRACT.npcModule);
  const css = read(W624F_COMMAND_DISTRICT_NPC_CONTRACT.cssModule);
  const owner = read(W624F_COMMAND_DISTRICT_NPC_CONTRACT.runtimeOwner);
  const compatibility = ['eoncity-play.html', 'eoncity-3d.html', 'eoncity-lite.html'].map(read).join('\n');

  add('npc-plan-valid', validation.ok, validation.errors.join(', ') || 'bounded local plan valid');
  add('four-distinct-archetypes', EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.length === 4 && new Set(EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.map((entry) => entry.id)).size === 4, EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.map((entry) => entry.id).join(', '));
  add('nine-bounded-states', EON_CITY_COMMAND_DISTRICT_NPC_STATES.length === 9 && new Set(EON_CITY_COMMAND_DISTRICT_NPC_STATES).size === 9, EON_CITY_COMMAND_DISTRICT_NPC_STATES.join(', '));
  add('real-role-route-mappings', EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.every((entry) => (entry.routes || []).every((route) => ['/projects', '/create', '/forge', '/automations', '/library', '/workspace'].includes(route.route))), 'all guides map to canonical current routes');
  add('automation-proof-gated', getEonCityCommandDistrictNpcReview('automation-operator')?.state === 'unavailable' && /No job, queue, customer, schedule/.test(getEonCityCommandDistrictNpcReview('automation-operator')?.truthRule || ''), 'automation operator is dormant and receipt-bound');
  add('review-requires-second-action', EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.every((entry) => getEonCityCommandDistrictNpcReview(entry.id)?.requiresSeparateRouteConfirmation), 'all guide interactions are review-first');
  add('authored-paths-only', plan.authoredPathIds.length === 4 && plan.entities.every((entry) => entry.pathId.endsWith('-branch')), plan.authoredPathIds.join(', '));
  add('spawn-and-unstuck-clear', plan.entities.every((entry) => entry.minSpawnDistance > 1.8 && entry.minUnstuckDistance >= .55), 'all path endpoints clear protected recovery areas');
  add('collision-aware-endpoints', validation.ok && plan.entities.every((entry) => entry.collisionRadius === .34), 'authored endpoints avoid W624C collision volumes');
  add('weak-device-lod', lite.activeEntities.length === 2 && disabled.activeEntities.length === 0 && !disabled.lod.motionEnabled, 'lite retains two silhouettes; disabled retains productive navigation without NPCs');
  add('controller-explicit-review', controller.requestState('project-guide', 'talk').reason === 'explicit-review-required' && controller.requestReview('project-guide').ok, 'talk/listen/point/work require visible user review');
  add('work-state-never-executes', controller.requestState('project-guide', 'work', { explicitUserAction: true }).workExecuted === false, 'work presentation resolves without executing work');
  add('clean-disposal', controller.dispose().disposed === true && controller.getSnapshot().activeCount === 0, 'local state clears on disposal');
  add('station-imports-bounded-controller', /eon-city-command-district-npc-system\.js/.test(station) && /bindCommandDistrictNpcSystem/.test(station), 'station binds W624F system');
  add('visible-guide-controls', /data-eon-play-npc-toggle/.test(station) && /data-eon-play-npc-review/.test(station) && /data-eon-play-npc-lod/.test(station) && /data-eon-play-npc-stay/.test(station), 'visible review, stay and LOD controls present');
  add('renderer-uses-production-plan', /getEonCityCommandDistrictNpcPlan/.test(renderer) && /command-district-production-npc/.test(renderer) && /requestCommandDistrictNpcState/.test(renderer), 'renderer creates and reports bounded NPCs');
  add('renderer-performance-fallback', /commandDistrictNpcSetLod\?\.\('lite'\)/.test(renderer) && /setCommandDistrictNpcLod/.test(renderer), 'performance protection can reduce optional guides');
  add('caption-first-accessibility', /Captions first/.test(station) && /aria-live="polite"/.test(station) && /prefers-reduced-motion/.test(css), 'captions, keyboard buttons and reduced-motion CSS present');
  add('no-hidden-auto-navigation', !/location\.assign|location\.replace|window\.open|history\.pushState/.test(moduleSource), 'NPC contract cannot navigate');
  add('no-private-commercial-mutation', !/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|checkout|billing mutation|referral mutation|vault mutation/i.test(moduleSource), 'NPC module is storage/network/commercial blind');
  add('no-fake-operational-claims', !/job is running|queue active|customer waiting|payment complete|reward earned|successfully published|autonomous agent/i.test(JSON.stringify(plan)), 'no invented work or commercial status');
  add('w624e-orbit-preserved', /bindEonbotOrbitCompanion/.test(station) && /getEonbotOrbitSummary/.test(renderer), 'Orbit remains present and separate');
  add('w624d-wayfinder-camera-preserved', /getWayfinderSummary/.test(renderer) && /cycleWayfinderCamera/.test(renderer), 'Wayfinder and camera remain present');
  add('single-runtime-owner-preserved', /mountEonCityPlayStation/.test(owner) && !/eon-city-play-station\.js/.test(compatibility), 'W624B owner and compatibility retirement preserved');
  add('no-district-expansion-or-visual-claim', W624F_COMMAND_DISTRICT_NPC_CONTRACT.finalQualityExpansionAllowed === false && W624F_COMMAND_DISTRICT_NPC_CONTRACT.ownerVisualApprovalPending && W624F_COMMAND_DISTRICT_NPC_CONTRACT.physicalDeviceCrowdProofPending, 'NPC source does not certify runtime art or crowd performance');

  return freeze({
    schema: W624F_COMMAND_DISTRICT_NPC_CONTRACT.schema,
    ok: checks.every((entry) => entry.pass),
    checks: freeze(checks),
    passed: checks.filter((entry) => entry.pass).length,
    total: checks.length
  });
}
