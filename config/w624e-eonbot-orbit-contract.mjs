import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_EONBOT_ORBIT_STATES,
  createEonCityEonbotOrbitController,
  createEonCityEonbotOrbitHint,
  validateEonCityEonbotOrbitExperience
} from '../assets/js/city/eon-city-eonbot-orbit-experience.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const freeze = (value) => Object.freeze(value);

export const W624E_EONBOT_ORBIT_CONTRACT = freeze({
  schema: 'eonapp.w624e-eonbot-orbit-contract.2026-07-11.v1',
  canonicalRoute: '/eoncity',
  accessRoute: '/api/city/access',
  runtimeOwner: 'assets/js/city/eon-city-runtime-owner.js',
  orbitModule: 'assets/js/city/eon-city-eonbot-orbit-experience.js',
  rendererModule: 'assets/js/city/eon-city-play-babylon.js',
  stationModule: 'assets/js/eon-city-play-station.js',
  requiredStates: EON_CITY_EONBOT_ORBIT_STATES,
  firstSixtySecondHintCount: 5,
  destinationHintCount: 6,
  finalQualityExpansionAllowed: false,
  physicalDeviceProofPending: true,
  liveAiConversationClaimed: false,
  autonomousAgentClaimed: false,
  ownerVisualApprovalPending: true
});

export function validateW624eEonbotOrbitContract() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const moduleValidation = validateEonCityEonbotOrbitExperience();
  const station = read(W624E_EONBOT_ORBIT_CONTRACT.stationModule);
  const renderer = read(W624E_EONBOT_ORBIT_CONTRACT.rendererModule);
  const owner = read(W624E_EONBOT_ORBIT_CONTRACT.runtimeOwner);
  const compatibility = ['eoncity-play.html', 'eoncity-3d.html', 'eoncity-lite.html'].map(read).join('\n');
  const controller = createEonCityEonbotOrbitController({ reducedMotion: false });
  const first = controller.updateContext({ routeStepId: 'arrival' });
  const repeat = controller.updateContext({ routeStepId: 'arrival' });
  const project = createEonCityEonbotOrbitHint({ savedProjectCount: 2 });
  const agent = createEonCityEonbotOrbitHint({ nearbyLandmarkId: 'agent-theatre' });

  add('orbit-contract-valid', moduleValidation.ok, moduleValidation.errors.join(', ') || 'nine-state local companion contract valid');
  add('nine-presentation-states', EON_CITY_EONBOT_ORBIT_STATES.length === 9 && new Set(EON_CITY_EONBOT_ORBIT_STATES).size === 9, EON_CITY_EONBOT_ORBIT_STATES.join(', '));
  add('route-and-destination-hints-complete', moduleValidation.routeHintCount === 5 && moduleValidation.destinationHintCount === 6, `${moduleValidation.routeHintCount} route hints / ${moduleValidation.destinationHintCount} destination hints`);
  add('non-repeating-first-route-hints', first.currentHint?.id === 'route:arrival' && repeat.currentHint?.id === 'route:arrival' && repeat.usedHintIds.length === 1, 'repeated context does not create a duplicate hint');
  add('saved-project-metadata-count-only', /2 private project portals/.test(project?.text || '') && /names, files, prompts, or project content/.test(project?.text || ''), 'only bounded portal count is surfaced');
  add('proof-gated-agent-warning', agent?.state === 'warn' && agent?.proofBoundary === true && /dormant/.test(agent?.text || ''), 'Agent Theatre stays dormant until real receipt');
  add('captions-primary-no-auto-media', moduleValidation.captionsFirst && !moduleValidation.microphoneStartsAutomatically && !moduleValidation.speechStartsAutomatically, 'captions primary; audio and microphone remain explicit');
  add('local-disposable-no-storage-network', !moduleValidation.browserStorageWritten && !moduleValidation.networkRequestCreated && !moduleValidation.privateDataRead, 'controller is memory-only and private-data blind');
  add('station-imports-orbit-controller', /eon-city-eonbot-orbit-experience\.js/.test(station) && /createEonCityEonbotOrbitController/.test(station), 'station imports W624E controller');
  add('visible-controls-present', /data-eon-play-orbit-mute/.test(station) && /data-eon-play-orbit-dismiss/.test(station) && /data-eon-play-orbit-less/.test(station) && /data-eon-play-orbit-help/.test(station) && /data-eon-play-orbit-restore/.test(station), 'mute, dismiss, show less, help and restore are visible');
  add('reduced-motion-wired', /eonPlayOrbitReducedMotion/.test(station) && /reducedMotion/.test(read(W624E_EONBOT_ORBIT_CONTRACT.orbitModule)), 'reduced-motion state is visible and deterministic');
  add('renderer-imports-orbit-presentation', /eon-city-eonbot-orbit-experience\.js/.test(renderer) && /setEonbotOrbitPresentation/.test(renderer), 'renderer has bounded presentation bridge');
  add('runtime-summary-exposes-local-orbit-only', /getEonbotOrbitSummary/.test(renderer) && /autoNavigation: false/.test(renderer) && /privateDataRead: false/.test(renderer), 'summary preserves local-only boundaries');
  add('no-hidden-auto-navigation', !/location\.assign|location\.replace|window\.open|history\.pushState/.test(read(W624E_EONBOT_ORBIT_CONTRACT.orbitModule)), 'Orbit module cannot navigate');
  add('no-private-or-commercial-mutation', !/localStorage|sessionStorage|indexedDB|checkout|billing|referral|vault|provider request/i.test(read(W624E_EONBOT_ORBIT_CONTRACT.orbitModule)), 'Orbit module has no storage, provider, billing, referral or Vault mutation');
  add('camera-path-obstruction-avoided', /pointer-events:none/.test(read('assets/css/eon-city-play.css')) && /minimumCameraDistance/.test(read('assets/js/city/eon-city-companion-director.js')), 'caption shell is non-blocking and formation remains camera-safe');
  add('w624d-camera-contract-preserved', /setWayfinderCameraProfile/.test(renderer) && /cycleWayfinderCamera/.test(renderer) && /resetWayfinderCamera/.test(renderer), 'five W624D camera controls preserved');
  add('w624c-destinations-preserved', /getEonCityCommandDistrictInteraction/.test(station) && /EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES/.test(renderer), 'W624C routes and collision volumes preserved');
  add('single-runtime-owner-preserved', /mountEonCityPlayStation/.test(owner) && !/eon-city-play-station\.js/.test(compatibility), 'W624B owner and compatibility retirement preserved');
  add('final-quality-expansion-still-blocked', W624E_EONBOT_ORBIT_CONTRACT.finalQualityExpansionAllowed === false && W624E_EONBOT_ORBIT_CONTRACT.ownerVisualApprovalPending, 'no district expansion or visual approval claimed');
  add('live-ai-and-autonomy-not-claimed', !W624E_EONBOT_ORBIT_CONTRACT.liveAiConversationClaimed && !W624E_EONBOT_ORBIT_CONTRACT.autonomousAgentClaimed, 'companion remains local presentation, not live AI');
  add('controller-disposal-fail-closed', controller.dispose().dismissed === true && controller.getSnapshot().currentHint === null, 'dispose clears hints and hides Orbit');

  return freeze({
    schema: W624E_EONBOT_ORBIT_CONTRACT.schema,
    ok: checks.every((entry) => entry.pass),
    checks: freeze(checks),
    passed: checks.filter((entry) => entry.pass).length,
    total: checks.length
  });
}
