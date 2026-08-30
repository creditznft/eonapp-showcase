import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_WAYFINDER_CAMERA_PROFILES,
  EON_CITY_WAYFINDER_INPUT_CONTRACT,
  EON_CITY_WAYFINDER_STATES,
  EON_CITY_WAYFINDER_VISUAL_PROFILE,
  validateEonCityWayfinderExperience
} from '../assets/js/city/eon-city-wayfinder-experience.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const freeze = (value) => Object.freeze(value);

export const W624D_WAYFINDER_CAMERA_CONTRACT = freeze({
  schema: 'eonapp.w624d-wayfinder-camera-contract.2026-07-11.v1',
  canonicalRoute: '/eoncity',
  accessRoute: '/api/city/access',
  runtimeOwner: 'assets/js/city/eon-city-runtime-owner.js',
  wayfinderModule: 'assets/js/city/eon-city-wayfinder-experience.js',
  rendererModule: 'assets/js/city/eon-city-play-babylon.js',
  stationModule: 'assets/js/eon-city-play-station.js',
  requiredStates: EON_CITY_WAYFINDER_STATES,
  cameraProfiles: EON_CITY_WAYFINDER_CAMERA_PROFILES.map((entry) => entry.id),
  visualProfile: EON_CITY_WAYFINDER_VISUAL_PROFILE,
  inputContract: EON_CITY_WAYFINDER_INPUT_CONTRACT,
  finalQualityExpansionAllowed: false,
  physicalDeviceProofPending: true,
  ownerVisualApprovalPending: true
});

export function validateW624dWayfinderCameraContract() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const moduleValidation = validateEonCityWayfinderExperience();
  const renderer = read(W624D_WAYFINDER_CAMERA_CONTRACT.rendererModule);
  const station = read(W624D_WAYFINDER_CAMERA_CONTRACT.stationModule);
  const owner = read(W624D_WAYFINDER_CAMERA_CONTRACT.runtimeOwner);
  const eoncity = read('eoncity.html');
  const accessStation = read('assets/js/city/eon-city-access-station.js');
  const compatibility = ['eoncity-play.html', 'eoncity-3d.html', 'eoncity-lite.html'].map(read).join('\n');

  add('wayfinder-contract-valid', moduleValidation.ok, moduleValidation.errors.join(', ') || 'nine-state Wayfinder contract valid');
  add('nine-authored-states', EON_CITY_WAYFINDER_STATES.length === 9, EON_CITY_WAYFINDER_STATES.join(', '));
  add('inclusive-cosmetic-only', EON_CITY_WAYFINDER_VISUAL_PROFILE.inclusive && !EON_CITY_WAYFINDER_VISUAL_PROFILE.sexualized && EON_CITY_WAYFINDER_VISUAL_PROFILE.cosmeticOnly && !EON_CITY_WAYFINDER_VISUAL_PROFILE.payToWin, 'inclusive, non-sexualized, cosmetic-only');
  add('five-camera-profiles', EON_CITY_WAYFINDER_CAMERA_PROFILES.length === 5, W624D_WAYFINDER_CAMERA_CONTRACT.cameraProfiles.join(', '));
  add('input-no-hidden-navigation', !EON_CITY_WAYFINDER_INPUT_CONTRACT.hiddenAutoNavigation && !EON_CITY_WAYFINDER_INPUT_CONTRACT.automaticInteraction && !EON_CITY_WAYFINDER_INPUT_CONTRACT.automaticRouteOpen, 'all inputs remain user-directed and review-first');
  add('renderer-imports-wayfinder', /eon-city-wayfinder-experience\.js/.test(renderer), 'renderer imports W624D contract');
  add('renderer-authored-silhouette', /productive-nocturne-wayfinder|wayfinder-route-spine|wayfinder-coat-left/.test(renderer), 'distinct Productive Nocturne silhouette present');
  add('renderer-all-states', /interact: 'Interact'.*inspect: 'Inspect'.*celebrate: 'Celebrate'.*'sit-work': 'SitWork'.*recovery: 'Recovery'/s.test(renderer), 'authored transient rig states wired');
  add('renderer-camera-collision', /resolveEonCityWayfinderCamera/.test(renderer) && /EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES/.test(renderer), 'camera checks Command District collision volumes');
  add('renderer-camera-controls', /setWayfinderCameraProfile/.test(renderer) && /cycleWayfinderCamera/.test(renderer) && /resetWayfinderCamera/.test(renderer), 'camera runtime controls present');
  add('renderer-recovery-preserves-safe-points', /findEonCityCommandDistrictUnstuckPoint/.test(renderer) && /wayfinderStateDirector\.request\('recovery'/.test(renderer), 'W624C nearest-safe-point recovery preserved');
  add('keyboard-camera-contract', /KeyC/.test(renderer) && /KeyR/.test(renderer), 'C cycles and R resets camera');
  add('controller-camera-contract', /GAMEPAD_CAMERA_CYCLE_BUTTON/.test(renderer) && /GAMEPAD_CAMERA_RESET_BUTTON/.test(renderer), 'controller shoulder mapping present');
  add('touch-visible-camera-controls', /data-eon-play-camera-cycle/.test(station) && /data-eon-play-camera-reset/.test(station), 'visible touch/click camera controls present');
  add('visible-pose-controls', /data-eon-play-wayfinder-state="inspect"/.test(station) && /data-eon-play-wayfinder-state="sit-work"/.test(station), 'local authored pose previews present');
  add('portrait-guidance-honest', /Landscape is recommended/.test(station) && /cannot force orientation/i.test(station), 'portrait fallback remains honest');
  add('single-runtime-owner-preserved', /mountEonCityPlayStation/.test(owner) && !/eon-city-play-station\.js/.test(compatibility), 'W624B owner and compatibility retirement preserved');
  add('canonical-document-preserved', /eon-city-access-station\.js/.test(eoncity) && /eon-city-play-core\.js/.test(accessStation) && /preloadCore/.test(accessStation) && !/eon-city-runtime-owner\.js/.test(accessStation), '/eoncity delegates through the access station to the authenticated Babylon core, not the retired monolithic owner');
  add('no-route-or-commercial-effects', !/location\.assign|checkout|referral reward|provider request/i.test(read(W624D_WAYFINDER_CAMERA_CONTRACT.wayfinderModule)), 'Wayfinder module is local presentation only');
  add('expansion-still-blocked', W624D_WAYFINDER_CAMERA_CONTRACT.finalQualityExpansionAllowed === false && W624D_WAYFINDER_CAMERA_CONTRACT.ownerVisualApprovalPending, 'no district expansion or visual approval claimed');

  return freeze({ schema: W624D_WAYFINDER_CAMERA_CONTRACT.schema, ok: checks.every((entry) => entry.pass), checks: freeze(checks), passed: checks.filter((entry) => entry.pass).length, total: checks.length });
}
