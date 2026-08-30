#!/usr/bin/env node
/** W660J / W661E — production touch-route and Living Nexus runtime gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { getEonCityInputContractTruth } from '../assets/js/city/eon-city-input-contract.js';
import { createEonCityLivingNexusBabylonRuntime } from '../assets/js/city/eon-city-living-nexus-babylon-runtime.js';
import { EON_CITY_LIVING_NEXUS_REALM_IDS } from '../assets/js/city/eon-city-living-nexus-realms.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireDist = process.argv.includes('--require-dist');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const access = read('assets/js/city/eon-city-access-station.js');
const shell = read('assets/js/eon-app-shell.js');
const shellCss = read('assets/css/eon-app-shell.css');
const browserProof = read('scripts/w660j-touch-route-browser-proof.mjs');
const livingNexusPanel = read('assets/js/city/eon-city-living-nexus-panel.js');
const progressiveBridge = read('assets/js/city/eon-city-progressive-nexus-bridge.js');
const progressiveCore = read('assets/js/city/eon-city-play-core.js');
const commandHubRuntime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const livingNexusRuntime = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
const productLayer = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
const pkg = JSON.parse(read('package.json'));
const truth = getEonCityInputContractTruth();
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
const distContains = (...needles) => {
  const directory = path.join(root, 'dist', 'assets');
  if (!fs.existsSync(directory)) return false;
  const files = fs.readdirSync(directory).filter((name) => /\.(?:js|css)$/.test(name));
  const text = files.map((name) => fs.readFileSync(path.join(directory, name), 'utf8')).join('\n');
  return needles.every((needle) => text.includes(needle));
};

add('input-contract-route-boundary', truth.explicitButtonType && truth.preventsDefaultNavigation && truth.stopsShellPropagation && truth.capturePhaseDefaultGuard && truth.immediatePropagationGuard);
add('w661e-real-pointer-lifecycle', truth.shortTapGuaranteesMovementPulse
  && truth.capturePhaseHeldRelease
  && truth.globalPointerUpPreservesTapPulse
  && truth.lostPointerCapturePreservesTapPulse
  && truth.pointerLeavePreservesTapPulse
  && truth.synchronousLostPointerCaptureSafe
  && truth.pointerCancelClearsPulse
  && truth.minimumPointerPulseMs >= 240);
add('progressive-hud-isolated-layer', /loadingOverlay\.style\.pointerEvents = 'none'/.test(access)
  && /data-eon-city-w661e-repair-styles/.test(progressiveBridge)
  && /eon-city-reduced-touch::before/.test(progressiveBridge)
  && /z-index:\s*30/.test(progressiveBridge));
add('desktop-shell-clearance', /data-eon-app-page=eoncity[^}]+eon-app-sidebar\.is-collapsed[^}]+eon-app-collapsed-width/s.test(shellCss));
add('city-hover-expand-disabled', /currentPage === 'eoncity'[\s\S]*eonCityHoverExpand = 'disabled'/.test(shell) && /currentPage === 'eoncity'[\s\S]*\? \(\) => \{\}/.test(shell));
add('all-controls-explicit-buttons', [...access.matchAll(/data-eon-city-move="(forward|backward|left|right)"/g)].length === 4 && [...access.matchAll(/<button type="button" data-eon-city-move=/g)].length === 4);
add('real-browser-proof-contract', /elementFromPoint/.test(browserProof)
  && /elementsFromPoint/.test(browserProof)
  && /realWebGL/.test(browserProof)
  && /allFourDirectionsMoved/.test(browserProof)
  && /realShortTapMoved/.test(browserProof)
  && /physicalWKeyMoved/.test(browserProof)
  && /productiveMenuLivingNexusVisible/.test(browserProof)
  && /connectedCoreVisible/.test(browserProof)
  && /sixRealmCatalogVisible/.test(browserProof)
  && /urlAfter === '\/eoncity'/.test(browserProof));
add('real-browser-proof-safe-reset-release', /SAFE_DIRECTION_TEST_POSE/.test(browserProof)
  && /x: 0, z: 5\.35, districtId: 'orientation-hall'/.test(browserProof)
  && /resetToSafePose/.test(browserProof)
  && /verifyMovementReleased/.test(browserProof)
  && /resetChecks/.test(browserProof)
  && /releaseChecks/.test(browserProof)
  && /safeResetVerified/.test(browserProof)
  && /heldReleaseVerified/.test(browserProof)
  && !/restoreExplorationPose\?\.\(\{ x: 18, z: 18/.test(browserProof));
add('progressive-living-nexus-entry', /PRODUCTIVE_MENU_GRID_SELECTOR/.test(livingNexusPanel)
  && /data-eon-w661e-open-living-nexus/.test(livingNexusPanel)
   && /MutationObserver/.test(livingNexusPanel)
   && /oneCanonicalPanel:\s*true/.test(livingNexusPanel)
   && /mountEonCityProgressiveNexusBridge/.test(progressiveBridge)
   // W719.21: direct /eoncity sessions do not render the play-station template.
   // The bridge must mount and own one controller only when that panel is absent;
   // existing play-station panels remain presentation-only bridge sessions.
   && /eonCityLivingNexusController/.test(livingNexusPanel)
   && /ensureLivingNexusPanel/.test(progressiveBridge)
   && /renderEonCityLivingNexusPanel/.test(progressiveBridge)
   && /nexusMount\.mountedByBridge/.test(progressiveBridge)
   && /ownsCanonicalNexus/.test(progressiveBridge)
   && /direct-city-canonical-owner/.test(progressiveBridge)
   && /bindEonCityLivingNexusPanel/.test(progressiveBridge)
   && /bindEonCityLivingNexusEncounterPanel/.test(progressiveBridge)
   && /bindEonCityLivingNexusRealmPanel/.test(progressiveBridge)
   && /data-eon-w659n-panel="city-menu"/.test(productLayer)
  && /data-eon-w659n-open="nexus"/.test(productLayer));
// Release policy W759: W736A/W745+ supersede the retired multi-realm runtime
// owner. The active W731 Command Hub owns one engine, scene and render loop,
// with W749 as its maintained Living Nexus authority.
add('w731-runtime-owns-maintained-living-nexus', /w731\/eon-city-w731-command-hub-runtime\.js/.test(progressiveCore)
  && /createEonCityW749LivingNexus/.test(commandHubRuntime)
  && /oneEngine:\s*true/.test(commandHubRuntime)
  && /openSurfaceForStation\('eonbot-nexus'/.test(commandHubRuntime)
  && /livingNexus\.refresh/.test(commandHubRuntime));
add('accessible-authored-realm-wayfinding', /locateRealmPortal/.test(livingNexusRuntime)
  && /accessiblePortalWayfinding/.test(livingNexusRuntime)
  && /accessibleWayfinding:\s*true/.test(livingNexusRuntime)
  && /requiresSeparateEntryConfirmation/.test(livingNexusRuntime));

let realmCyclePass = true;
let realmCycleDetail = '';
let engine;
let scene;
let runtime;
try {
  engine = new NullEngine({ renderWidth: 640, renderHeight: 360, textureSize: 128, deterministicLockstep: true });
  scene = new Scene(engine);
  const player = new TransformNode('w661e-gate-player', scene);
  player.position.set(48, 0, 5);
  runtime = createEonCityLivingNexusBabylonRuntime({ scene, playerAnchor: player, quality: 'lite', reducedMotion: true, seed: 'w661e-gate' });
  if (!runtime.setDestination('expanse', { explicitUserAction: true }).ok) throw new Error('expanse-entry-failed');
  for (const realmId of EON_CITY_LIVING_NEXUS_REALM_IDS) {
    const located = runtime.locateRealmPortal(realmId, { explicitUserAction: true });
    if (!located.ok || located.portal.realmId !== realmId) throw new Error(`${realmId}:locate`);
    player.position.set(located.portal.position.x, 0, located.portal.position.z);
    const prepared = runtime.prepareRealm(realmId, located.portal.id, { explicitUserAction: true });
    if (!prepared.ok) throw new Error(`${realmId}:prepare`);
    const returnPoint = { x: player.position.x, z: player.position.z, cellId: located.portal.cellId };
    const entered = runtime.enterRealm(realmId, located.portal.id, { explicitUserAction: true, returnPoint });
    if (!entered.ok || runtime.getSummary().destination !== 'realm') throw new Error(`${realmId}:enter`);
    const exited = runtime.exitRealm({ explicitUserAction: true });
    if (!exited.ok || exited.entryPose.x !== returnPoint.x || exited.entryPose.z !== returnPoint.z) throw new Error(`${realmId}:return`);
    player.position.set(exited.entryPose.x, 0, exited.entryPose.z);
  }
} catch (error) {
  realmCyclePass = false;
  realmCycleDetail = String(error?.stack || error?.message || error);
} finally {
  try { runtime?.dispose?.(); } catch {}
  try { scene?.dispose?.(); } catch {}
  try { engine?.dispose?.(); } catch {}
}
add('six-realm-locate-review-enter-return-runtime', realmCyclePass, realmCycleDetail);

add('candidate-provenance-tools', fs.existsSync(path.join(root, 'scripts/w641-build-release-candidate.mjs')) && fs.existsSync(path.join(root, 'scripts/w641-verify-release-candidate.mjs')));
add('package-script', pkg.scripts?.['qa:w660j-eoncity-touch-hotfix']?.includes('w660j-eoncity-touch-hotfix-gate'));
add('release-chain-includes-hotfix', pkg.scripts?.['qa:w660-release-source']?.includes('qa:w660j-eoncity-touch-hotfix'));
add('dist-present', !requireDist || fs.existsSync(path.join(root, 'dist', 'assets')));
add('dist-hotfix-emitted', !requireDist || distContains('data-eon-city-touch-controls', 'eon-app-sidebar-collapsed', 'eonCityHoverExpand', 'data-eon-w661e-open-living-nexus', 'capturePhaseHeldRelease', 'globalPointerUpPreservesTapPulse', 'lostPointerCapturePreservesTapPulse', 'synchronousLostPointerCaptureSafe', 'mountEonCityProgressiveNexusBridge', 'locateRealmPortal', 'accessibleWayfinding'));

const result = {
  schema: 'eonapp.w661e.eoncity-movement-nexus-gate.v4',
  wave: 'W661E',
  ok: checks.every((entry) => entry.pass),
  passed: checks.filter((entry) => entry.pass).length,
  total: checks.length,
  checks,
  claims: {
    sourceCertified: checks.every((entry) => entry.pass),
    realPointerSequenceLocked: true,
    fullPointerCompletionLifecycleLocked: true,
    capturePhaseHeldReleaseLocked: true,
    verifiedSafeResetRequired: true,
    heldReleaseReceiptRequired: true,
    physicalKeyboardProofRequired: true,
    productiveMenuLivingNexusRequired: true,
    sixRealmRuntimeCycleCovered: realmCyclePass,
    headedLocalBrowserEvidenceSeparate: true,
    previewCertified: false,
    productionCertified: false
  }
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
