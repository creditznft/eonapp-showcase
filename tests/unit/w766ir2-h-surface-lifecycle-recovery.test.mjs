import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  createEonCityW766IR2InputLockLeaseManager,
  getEonCityW766IR2OrphanedInputLockOwners
} from '../../assets/js/city/w766/eon-city-w766ir2-input-lock-leases.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const semanticMap = read('assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js');
const readiness = read('assets/js/city/eon-city-runtime-identity.js');
const finalRecoveryBrowser = read('tests/e2e/w766ir2-final-recovery.spec.ts');

const lifecycle = (overrides = {}) => ({
  logicalOpen: false,
  connected: false,
  accessibilityHidden: true,
  intentionallyHidden: true,
  transitionActive: false,
  successorOwnerId: '',
  geometryVisible: false,
  ...overrides
});

test('W766IR2-H never treats transient geometry as authority over a logically open Menu', () => {
  let clock = 1_000;
  const manager = createEonCityW766IR2InputLockLeaseManager({ now: () => clock });
  assert.equal(manager.acquire('city-menu', { source: 'visible-click' }).ok, true);
  clock = 6_000;
  const orphaned = getEonCityW766IR2OrphanedInputLockOwners({
    snapshot: manager.getSnapshot(),
    surfaceState: {
      cityMenu: lifecycle({
        logicalOpen: true,
        connected: true,
        accessibilityHidden: false,
        intentionallyHidden: false,
        geometryVisible: false
      })
    },
    at: clock,
    graceMs: 1_200
  });
  assert.deepEqual(orphaned, []);
});

test('W766IR2-H protects maintained transitions and active successor surfaces', () => {
  let clock = 10_000;
  const manager = createEonCityW766IR2InputLockLeaseManager({ now: () => clock });
  manager.acquire('city-menu');
  manager.acquire('expanse-entry-review');
  clock = 12_500;

  const transitioning = getEonCityW766IR2OrphanedInputLockOwners({
    snapshot: manager.getSnapshot(),
    surfaceState: {
      cityMenu: lifecycle({ transitionActive: true, successorOwnerId: 'expanse-entry-review' }),
      expanseReview: lifecycle({ logicalOpen: true, connected: true, accessibilityHidden: false, intentionallyHidden: false })
    },
    at: clock,
    graceMs: 1_200
  });
  assert.deepEqual(transitioning, []);
});

test('W766IR2-H still recovers a mature lease after the controller closes and the root disappears', () => {
  let clock = 20_000;
  const manager = createEonCityW766IR2InputLockLeaseManager({ now: () => clock });
  manager.acquire('city-menu');
  clock = 22_000;
  const orphaned = getEonCityW766IR2OrphanedInputLockOwners({
    snapshot: manager.getSnapshot(),
    surfaceState: { cityMenu: lifecycle() },
    at: clock,
    graceMs: 1_200
  });
  assert.equal(orphaned.length, 1);
  assert.equal(orphaned[0].ownerId, 'city-menu');
  assert.equal(orphaned[0].lifecycle.logicalOpen, false);
  assert.equal(orphaned[0].lifecycle.connected, false);
});

test('W766IR2-H leaves a controller-closed but still visible surface for explicit reconciliation instead of auto-closing it', () => {
  let clock = 30_000;
  const manager = createEonCityW766IR2InputLockLeaseManager({ now: () => clock });
  manager.acquire('city-menu');
  clock = 32_000;
  const orphaned = getEonCityW766IR2OrphanedInputLockOwners({
    snapshot: manager.getSnapshot(),
    surfaceState: {
      cityMenu: lifecycle({ connected: true, accessibilityHidden: false, intentionallyHidden: false, geometryVisible: true })
    },
    at: clock,
    graceMs: 1_200
  });
  assert.deepEqual(orphaned, []);
});

test('W766IR2-H runtime exposes controller lifecycle separately from geometry diagnostics', () => {
  assert.match(runtime, /const inspectNodePresentation =/);
  assert.match(runtime, /const inspectSurfaceLifecycle =/);
  assert.match(runtime, /logicalOpen: lifecycle\.logicalOpen === true/);
  assert.match(runtime, /geometryVisible: presentation\.geometryVisible/);
  assert.match(runtime, /cityMenu: inspectSurfaceLifecycle\('cityMenu', menu\)/);
  assert.match(runtime, /accessibleMap: semanticSurfaceState/);
  assert.doesNotMatch(runtime, /cityMenu: uiState\.cityMenu === true/);
  assert.doesNotMatch(runtime, /accessibleMap: semanticNavigationController\?\.isVisible\?\.\(\) === true/);
});

test('W766IR2-H moves focus out before hiding maintained dialogs', () => {
  const expanseFocus = runtime.indexOf('focusOutsideSurfaceBeforeHide(expanseReview');
  const expanseHide = runtime.indexOf('setMaintainedDialogOpen(expanseReview, false)');
  const transitFocus = runtime.indexOf('focusOutsideSurfaceBeforeHide(transitReview');
  const transitHide = runtime.indexOf('setMaintainedDialogOpen(transitReview, false)');
  const menuFocus = runtime.indexOf('focusOutsideSurfaceBeforeHide(menu');
  const menuHide = runtime.indexOf('setMaintainedDialogOpen(menu, false');
  assert.ok(expanseFocus >= 0 && expanseFocus < expanseHide);
  assert.ok(transitFocus >= 0 && transitFocus < transitHide);
  assert.ok(menuFocus >= 0 && menuFocus < menuHide);
  assert.match(runtime, /node\.setAttribute\?\.\('inert', ''\)/);
  assert.match(runtime, /node\.removeAttribute\?\.\('inert'\)/);
});

test('W766IR2-H Accessible Map and Readiness use the same focus-safe lifecycle contract', () => {
  assert.match(semanticMap, /getSurfaceLifecycle:/);
  assert.match(semanticMap, /focusOutsideBeforeHide\(restoreFocus && lastFocus\?\.isConnected \? lastFocus : launcher\)/);
  assert.ok(semanticMap.indexOf('focusOutsideBeforeHide(restoreFocus') < semanticMap.indexOf('setPanelOpen(false)'));
  assert.match(readiness, /isOpen: \(\) => Boolean\(view\?\.isConnected\)/);
  assert.match(readiness, /getSurfaceLifecycle:/);
  assert.ok(readiness.indexOf("target?.focus?.({ preventScroll: true })") < readiness.indexOf('view?.remove?.()'));
});

test('W766IR2-H provides explicit atomic Menu routes to Transit and Readiness', () => {
  assert.match(runtime, /data-eon-city-menu-review-transit/);
  assert.match(runtime, /data-eon-city-menu-open-readiness/);
  assert.match(runtime, /handoffFromMenu\('review-transit'.*'transit-review'/s);
  assert.match(runtime, /handoffFromMenu\('open-readiness'.*'city-readiness'/s);
  assert.match(semanticMap, /successor: 'transit-review'/);
  assert.match(semanticMap, /successor: 'city-readiness'/);
});

test('W766IR2-H headed-browser contract waits beyond grace and exercises visible Menu handoffs', () => {
  assert.match(finalRecoveryBrowser, /waitForTimeout\(5_000\)/);
  assert.match(finalRecoveryBrowser, /menu-after-five-seconds/);
  assert.match(finalRecoveryBrowser, /data-eon-city-menu-review-transit/);
  assert.match(finalRecoveryBrowser, /data-eon-city-menu-open-readiness/);
  assert.match(finalRecoveryBrowser, /noFalseOrphanRecovery: true/);
  assert.match(finalRecoveryBrowser, /noAriaHiddenFocusedDescendantWarning: true/);
});

test('W766IR2-H supports repeated Menu and Map lease cycles without stale owners', () => {
  const manager = createEonCityW766IR2InputLockLeaseManager();
  for (let cycle = 0; cycle < 5; cycle += 1) {
    assert.equal(manager.acquire('city-menu', { source: `menu-${cycle}` }).ok, true);
    assert.equal(manager.releaseAllForOwner('city-menu', 'close-button').ok, true);
    assert.equal(manager.acquire('accessible-map', { source: `map-${cycle}` }).ok, true);
    assert.equal(manager.releaseAllForOwner('accessible-map', 'close-button').ok, true);
  }
  assert.equal(manager.isMovementBlocked(), false);
  assert.deepEqual(manager.getSnapshot().activeOwnerIds, []);
});

test('W766IR2-H preserves raw spatial and FPS evidence for headed-browser diagnosis', () => {
  assert.match(runtime, /const spatialReport = spatialDiagnostics\.getReport\(\)/);
  assert.match(runtime, /\[W747_SPATIAL_DIAGNOSTICS_BLOCKING\].*JSON\.stringify\(spatialReport\), spatialReport/);
  assert.match(runtime, /Owner-candidate gate blocked: spatial diagnostics must be clean before review/);
  assert.match(runtime, /const fpsTimeline = \[\]/);
  assert.match(runtime, /engineFps: Math\.round\(engine\.getFps\?\.\(\) \|\| 0\)/);
  assert.match(runtime, /fpsTimeline: freeze\(\[\.\.\.fpsTimeline\]\)/);
  assert.match(runtime, /\[W766IR2H_FPS_PROTECTION\].*JSON\.stringify\(evidence\), evidence/);
  assert.match(runtime, /activeInputLockOwners: freeze\(\[\.\.\.activeInputLockOwners\]\)/);
});
