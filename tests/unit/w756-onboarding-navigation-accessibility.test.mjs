import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W756_SCHEMA,
  buildEonCityW756ExperiencePlan,
  validateEonCityW756ExperiencePlan
} from '../../assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W756 keeps the first fifteen seconds, minute and three-minute journey explicit', () => {
  const plan = buildEonCityW756ExperiencePlan();
  assert.equal(plan.schema, EON_CITY_W756_SCHEMA);
  assert.equal(plan.onboarding.first15Seconds.length, 3);
  assert.equal(plan.onboarding.first60Seconds.length, 3);
  assert.equal(plan.onboarding.firstThreeMinutes.length, 3);
  assert.equal(plan.onboarding.automaticNavigation, false);
  assert.equal(plan.onboarding.permissionPressure, false);
  assert.equal(plan.noAutomaticWork, true);
  assert.equal(validateEonCityW756ExperiencePlan(plan).ok, true);
});

test('W756 provides every essential station through the semantic non-3D path', () => {
  const plan = buildEonCityW756ExperiencePlan();
  assert.equal(plan.stationCount, 10);
  assert.equal(plan.accessibility.screenReaderStationCount, 10);
  assert.equal(plan.accessibility.semanticAlternative, true);
  assert.equal(plan.accessibility.keyboardOnly, true);
  assert.equal(plan.accessibility.touchOnly, true);
  assert.equal(plan.accessibility.focusRestoration, true);
  assert.equal(plan.accessibility.escapeClosesDialogs, true);
});

test('W756 mobile rules preserve safe areas, 48px targets and both orientations', () => {
  const portrait = buildEonCityW756ExperiencePlan({ width: 390, height: 844, coarsePointer: true });
  const landscape = buildEonCityW756ExperiencePlan({ width: 844, height: 390, coarsePointer: true });
  assert.equal(portrait.mobile.portraitDock, 'bottom-sheet');
  assert.equal(landscape.mobile.landscapeDock, 'split-view');
  assert.ok(portrait.mobile.minimumTouchTargetPx >= 48);
  assert.equal(portrait.mobile.safeAreas, true);
  assert.equal(portrait.mobile.orientationLock, false);
  assert.equal(portrait.mobile.fullscreenAutomatic, false);
});

test('W756 recovery is fail-closed and never reloads or navigates automatically', () => {
  const plan = buildEonCityW756ExperiencePlan();
  assert.equal(plan.recovery.retryRequiresExplicitAction, true);
  assert.equal(plan.recovery.restart3dRequiresExplicitAction, true);
  assert.equal(plan.recovery.nativeWorkspaceFallback, true);
  assert.equal(plan.recovery.preservesPrivateDrafts, true);
  assert.equal(plan.recovery.automaticReload, false);
  assert.equal(plan.recovery.automaticNavigation, false);
});

test('W756 controller source traps focus, restores focus and exposes truthful ambience controls', () => {
  const source = read('assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js');
  assert.match(source, /aria-modal/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /event\.key !== 'Tab'/);
  assert.match(source, /focusOutsideBeforeHide/);
  assert.ok(source.indexOf('focusOutsideBeforeHide(restoreFocus') < source.indexOf('setPanelOpen(false)'));
  assert.match(source, /This is not a real-weather claim/);
  assert.match(source, /explicitUserAction: true/);
  assert.match(source, /automaticWork: false/);
});

test('W756 runtime and CSS wire one semantic map without a duplicate scene', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const sw = read('sw.js');
  assert.match(runtime, /EON_CITY_CORE_RUNTIME_SCHEMA = 'eon\.city\.command-centre-runtime\.w75[6-9]\.v1'/);
  assert.match(runtime, /createEonCityW756SemanticNavigationController/);
  assert.match(runtime, /getOnboardingNavigationAccessibilityPlan/);
  assert.match(runtime, /openAccessibleCityMap/);
  assert.match(runtime, /semanticNavigationController\?\.dispose/);
  const accessibility = read('assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js');
  assert.match(accessibility, /\.eon-city-w756-semantic-map/);
  assert.match(accessibility, /min-height:48px/);
  assert.match(accessibility, /@media\(forced-colors:active\)/);
  assert.match(accessibility, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(sw, /RELEASE_ID = 'w765-2026-07-31-release-identity-source-template'/);
});
