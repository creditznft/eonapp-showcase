import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const semanticMap = fs.readFileSync(new URL('../../assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js', import.meta.url), 'utf8');
const expanseOverlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
const finalBrowserProof = fs.readFileSync(new URL('../e2e/w766ir2-final-recovery.spec.ts', import.meta.url), 'utf8');

test('W766IR2-G keeps remote Expanse review open until explicit Enter or Cancel', () => {
  assert.match(runtime, /data-eon-city-menu-open-world>Open Signal Frontier/);
  assert.match(runtime, /else handoffFromMenu\('open-world-review', \(trigger\) => openExpanseReview\(trigger\)/);
  assert.match(runtime, /Explicitly opening the review from City Menu or the accessible map is a/);
  assert.doesNotMatch(runtime, /nearestDiscovery\?\.discovery\?\.id !== 'expanse-gate'/);
  assert.doesNotMatch(runtime, /reason: 'safe-navigation-away'/);
});

test('W766IR2-G performs atomic surface handoffs before opening a second blocking surface', () => {
  assert.match(runtime, /const handoffFromMenu =/);
  assert.match(runtime, /if \(!closeMenu\(reason, \{ restoreFocus: true, successorOwnerId \}\)\) return freeze\(\{ ok: false, reason: 'city-menu-release-failed' \}\)/);
  assert.match(runtime, /data-eon-city-menu-open-world>Open Signal Frontier/);
  assert.match(runtime, /else handoffFromMenu\('open-world-review', \(trigger\) => openExpanseReview\(trigger\)/);
  assert.match(semanticMap, /hide\(\{ reason: 'surface-handoff', restoreFocus: false, successorOwnerId: successor \}\)/);
  assert.match(semanticMap, /onReviewTransit, \[launcher\], \{ handoff: true/);
  assert.match(semanticMap, /onReviewExpanse, \[launcher\], \{ handoff: true/);
});

test('W766IR2-G closes Transit synchronously and recovers hidden overlay leases', () => {
  assert.match(runtime, /const closed = closeTransitReview\(\{ cancel: false, reason: `transit-\$\{choice\}-confirmed`, restoreFocus: false \}\)/);
  assert.doesNotMatch(runtime, /setTimeout\?\.\(\(\) => closeTransitReview/);
  assert.match(runtime, /getEonCityW766IR2OrphanedInputLockOwners/);
  assert.match(runtime, /orphaned-surface-recovery/);
  assert.match(runtime, /eonCityLastInputLockRecovery/);
});


test('W766IR2-G keeps lightweight overlays at foreground FPS and suspends dock-cap sampling', () => {
  assert.match(runtime, /const activeInputLockOwners = inputLockManager\.getSnapshot\(\)\.activeOwnerIds/);
  assert.match(runtime, /const backgroundPresentation = workSurfaceOpen \|\| activeInputLockOwners\.includes\('work-surface'\)/);
  assert.doesNotMatch(runtime, /const backgroundPresentation = inputLockManager\.isMovementBlocked\(\)/);
  assert.match(runtime, /if \(backgroundPresentation\) \{[\s\S]*fpsFrames = 0;[\s\S]*lowFpsSamples = 0;/);
  assert.match(runtime, /false sustained-11-fps performance-protection event/);
});

test('W766IR2-G recovers an under-floor camera without remounting the runtime', () => {
  assert.match(runtime, /camera\.checkCollisions = false/);
  assert.match(runtime, /inspectEonCityW747CameraFloorSafety/);
  assert.match(runtime, /const recoverUnsafeCamera =/);
  assert.match(runtime, /recoverUnsafeCamera\('before-scene-render'\)/);
  assert.match(runtime, /eonCityCameraSafetyRecovery/);
  assert.match(runtime, /w766ir2g-camera-floor-recovery/);
  assert.doesNotMatch(runtime, /recoverUnsafeCamera[\s\S]{0,1200}engine\.resize/);
});


test('W766IR2-G preserves the complete visible Transit and Expanse click chains', () => {
  assert.match(runtime, /button\.addEventListener\('click', \(\) => kind === 'station' \? onOpenStation\?\.\(entity\.id, button\) : onInspectDiscovery\?\.\(entity\.id, button\)\)/);
  assert.match(runtime, /if \(discovery\.id === 'transit-overlook'\) return ui\?\.openTransitReview\?\.\(trigger\)/);
  assert.match(runtime, /if \(discovery\.id === 'expanse-gate'\) return ui\?\.openExpanseReview\?\.\(trigger\)/);
  assert.match(runtime, /data-eon-city-transit-board/);
  assert.match(runtime, /confirmTransitChoice\('board', event\.currentTarget\)/);
  assert.match(runtime, /data-eon-city-expanse-enter/);
  assert.match(runtime, /enterExpanseFromReview\(event\.currentTarget\)/);
  assert.match(runtime, /const begin = starterAccess[\s\S]*expanseWorldMode\.beginEntry/);
  assert.match(runtime, /const activated = expanseWorldMode\.activate/);
  assert.match(runtime, /hideExpanseReview\(\{ restoreFocus: false, reason: 'entry-confirmed' \}\)/);
});

test('W766IR2-G catches controller exceptions and leaves movement recoverable', () => {
  assert.match(runtime, /transit-request-failed/);
  assert.match(runtime, /transit-confirmation-failed/);
  assert.match(runtime, /expanse-review-failed/);
  assert.match(runtime, /expanse-entry-failed/);
  assert.match(runtime, /releaseUiLease\('city-menu', 'menu-render-failed'\)/);
  assert.match(runtime, /Movement remains available/);
  assert.match(runtime, /const workSurfaceHostVisible = \(\) => \{[\s\S]*getComputedStyle/);
});


test('W766IR2-G keeps Expanse movement outside the Command Hub clamp and restores the Hub camera mode', () => {
  assert.match(runtime, /sanitizeEonExpanseW766APlayerPosition/);
  assert.match(runtime, /const next = expanseMovementActive[\s\S]*sanitizeEonExpanseW766APlayerPosition[\s\S]*: clampEonCityW731Position/);
  assert.match(runtime, /cameraMode = 'expanse-arrival'/);
  assert.match(runtime, /cameraMode = 'expanse-follow'/);
  assert.match(runtime, /camera: \{ alpha: camera\.alpha, beta: camera\.beta, radius: camera\.radius, target: camera\.target, mode: cameraMode \}/);
  assert.match(runtime, /cameraMode = restoredMode\.startsWith\('expanse-'\) \? 'follow' : restoredMode/);
});

test('W766IR2-G exposes a visible safe return control and truthful active world telemetry', () => {
  assert.match(expanseOverlay, /data-eon-expanse-ui':'return-hub/);
  assert.match(expanseOverlay, /Return to Command Hub/);
  assert.match(expanseOverlay, /onReturnToCommandHub/);
  assert.match(expanseOverlay, /returnHub\.hidden = !expanseActive/);
  assert.match(runtime, /onReturnToCommandHub: \(options = \{\}\) => runtime\?\.returnFromExpanse/);
  assert.match(runtime, /expanseActive: expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE'/);
  assert.match(runtime, /worldMode: expanseWorldMode\.getState\(\)/);
  assert.match(runtime, /cameraFloorSafety: inspectCameraFloorSafety\(\)/);
  assert.match(runtime, /lastPerformanceProtectionReason/);
});

test('W766IR2-G final Preview gate proves the real failure path rather than calling internal overlay APIs', () => {
  assert.match(finalBrowserProof, /guideToPhysicalDiscovery/);
  assert.match(finalBrowserProof, /data-eon-city-command-prompt/);
  assert.match(finalBrowserProof, /physicalTransitInteractionClicked/);
  assert.match(finalBrowserProof, /physicalExpanseInteractionClicked/);
  assert.match(finalBrowserProof, /proveExpanseMovementBeyondHubRadius/);
  assert.match(finalBrowserProof, /data-eon-expanse-ui="return-hub"/);
  assert.match(finalBrowserProof, /postReturnMovementObserved/);
  assert.match(finalBrowserProof, /noFalseLowFpsProtection/);
  assert.match(finalBrowserProof, /cameraFloorSafe/);
  assert.doesNotMatch(finalBrowserProof, /openTransitReview\?\./);
});
