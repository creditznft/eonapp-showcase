import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { EON_CITY_W649_DISTRICT_MANIFEST, validateEonCityW649DistrictManifest } from '../assets/js/city/w649/eon-city-w649-district-manifest.js';
import { EON_CITY_W659F_NPC_ROLES, getEonCityW659fNpcRoleCoverage, validateEonCityW659fNpcRoles } from '../assets/js/city/w659f/eon-city-w659f-npc-role-registry.js';

export const RT97_CITY_LOCAL_READINESS_SCHEMA = 'eonapp.rt97.city-local-readiness.v1';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const read = (relativePath) => fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const hasAll = (text, fragments) => fragments.every((fragment) => text.includes(fragment));

function check(errors, condition, code) {
  if (!condition) errors.push(code);
}

export function runRt97CityLocalReadinessGate() {
  const errors = [];

  const districtValidation = validateEonCityW649DistrictManifest();
  check(errors, districtValidation.ok === true, `district-manifest:${districtValidation.errors.join(',') || 'invalid'}`);
  check(errors, districtValidation.count === 9, `district-count:${districtValidation.count}`);
  check(errors, EON_CITY_W649_DISTRICT_MANIFEST.truth?.preloadAll === false, 'district-preload-all-must-be-false');
  for (const district of EON_CITY_W649_DISTRICT_MANIFEST.districts) {
    if (district.id === 'bootstrap') continue;
    check(errors, district.proximityLoad === true, `district-proximity-load:${district.id}`);
    check(errors, district.unloadOnExit === true, `district-unload-on-exit:${district.id}`);
  }

  const npcValidation = validateEonCityW659fNpcRoles();
  const npcCoverage = getEonCityW659fNpcRoleCoverage();
  check(errors, npcValidation.ok === true, `npc-registry:${npcValidation.errors.join(',') || 'invalid'}`);
  check(errors, npcCoverage.ok === true, `npc-coverage:${npcCoverage.missingAssetIds.join(',') || 'incomplete'}`);
  check(errors, npcCoverage.coveredCharacterCount === npcCoverage.effectiveCharacterCount, 'npc-character-coverage-incomplete');
  check(errors, EON_CITY_W659F_NPC_ROLES.every((role) => role.localOnly === true && role.autoExecute === false && role.privateDataRead === false), 'npc-role-safety-boundary');
  check(errors, EON_CITY_W659F_NPC_ROLES.every((role) => role.actions.every((action) => action.reviewRequired === true && action.explicitUserAction === true && action.autoExecute === false && action.autoNavigate === false && action.privateDataRead === false)), 'npc-action-review-boundary');

  const districtRuntime = read('assets/js/city/w649/eon-city-w649-district-runtime.js');
  check(errors, /const MAX_RESIDENT_DISTRICTS\s*=\s*2\s*;/.test(districtRuntime), 'district-resident-budget');
  check(errors, hasAll(districtRuntime, [
    'const controller = new AbortController()',
    "resident.controller?.abort?.(reason)",
    'for (const record of resident.records.values()) disposeRecord(record)',
    "resident.root?.dispose?.(false, true)",
    "activeLoad.controller.abort('district-runtime-dispose')",
    "unloadDistrict(districtId, 'city-runtime-dispose')"
  ]), 'district-abort-dispose-lifecycle');
  check(errors, hasAll(districtRuntime, ['localOnly: true', 'remoteAssets: false', 'visualCertificationPending: true']), 'district-local-truth-boundary');

  const commandHub = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  check(errors, hasAll(commandHub, [
    "surfaceShelf?.removeEventListener?.('click', onSurfaceShelfClick)",
    "globalThis.removeEventListener?.('pagehide', onPageHide)",
    "canvas.removeEventListener('webglcontextlost', onContextLost, false)",
    "canvas.removeEventListener('webglcontextrestored', handleContextRestored, false)",
    "globalThis.document?.removeEventListener?.('visibilitychange', onVisibilityChange)",
    'inputLockManager.dispose',
    'localAssetRuntime?.dispose?.()',
    'engine.stopRenderLoop()',
    'scene.dispose()',
    'engine.dispose()'
  ]), 'command-hub-destroy-lifecycle');

  const localAssets = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  check(errors, /const maxResidentAssets\s*=/.test(localAssets) && localAssets.includes('resident-asset-budget'), 'local-asset-resident-budget');
  check(errors, hasAll(localAssets, [
    'for (const record of records.values()) record.dispose?.()',
    'records.clear()',
    'inflight.clear()'
  ]), 'local-asset-dispose-lifecycle');

  const immersiveControls = read('assets/js/city/eon-city-immersive-controls.js');
  const inputContract = read('assets/js/city/eon-city-input-contract.js');
  const overlayCoordinator = read('assets/js/city/eon-city-overlay-coordinator.js');
  for (const [label, source] of [['immersive-controls', immersiveControls], ['input-contract', inputContract], ['overlay-coordinator', overlayCoordinator]]) {
    check(errors, source.includes('pagehide') && source.includes('orientationchange') && source.includes('visibilitychange'), `${label}:lifecycle-release`);
    check(errors, source.includes('removeEventListener'), `${label}:lifecycle-teardown`);
  }
  check(errors, immersiveControls.includes('pointercancel') && inputContract.includes('pointercancel'), 'touch-pointer-cancel-boundary');
  check(errors, overlayCoordinator.includes('clearGameplayInput') && overlayCoordinator.includes('setModalState(null)'), 'modal-input-convergence-boundary');

  const headers = read('_headers');
  check(errors, /\/assets\/\*\s*\n\s*Cache-Control:\s*public, max-age=0, must-revalidate/.test(headers), 'mutable-assets-revalidate-policy');
  for (const route of ['/assets/city/immutable/*', '/assets/city/w649/*', '/assets/city/w659f/*']) {
    const routeIndex = headers.indexOf(route);
    const window = routeIndex >= 0 ? headers.slice(routeIndex, routeIndex + 180) : '';
    check(errors, routeIndex >= 0 && /max-age=31556952, immutable/.test(window), `immutable-cache-policy:${route}`);
  }

  const serviceWorkers = [read('sw.js'), read('public/sw.js'), read('service-worker/eonapp-service-worker.js')].map((source) => source.replace(/\r\n/g, '\n'));
  const workerDigests = serviceWorkers.map(sha256);
  check(errors, new Set(workerDigests).size === 1, 'service-worker-mirrors-diverged');
  check(errors, serviceWorkers[0].includes("const PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'"), 'stable-city-asset-cache-name');
  check(errors, serviceWorkers[0].includes('cacheFirst: true') && serviceWorkers[0].includes('releaseStable: true'), 'stable-city-cache-truth');

  const physicalPending = Object.freeze([
    'real weak Android 25-30 FPS and frame-time acceptance',
    'real-phone camera clipping, right-thumb sensitivity, collision and unstuck feel',
    'Android WebGL context-loss, screen-lock, app-switch and memory-pressure recovery',
    'long-session JavaScript heap/GPU resource trend on physical devices',
    'protected Preview/Production cold-vs-warm transfer measurements'
  ]);

  const codeReady = errors.length === 0;
  return Object.freeze({
    schema: RT97_CITY_LOCAL_READINESS_SCHEMA,
    status: codeReady ? 'code-pass-physical-pending' : 'fail',
    codeReady,
    releaseReady: false,
    errors: Object.freeze(errors),
    districtCount: districtValidation.count,
    npcRoleCount: npcValidation.roleCount,
    characterCoverage: `${npcCoverage.coveredCharacterCount}/${npcCoverage.effectiveCharacterCount}`,
    maxResidentDistricts: 2,
    serviceWorkerSha256: workerDigests[0],
    physicalPending
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = runRt97CityLocalReadinessGate();
  console.log(JSON.stringify(result, null, 2));
  if (!result.codeReady) process.exitCode = 1;
}
