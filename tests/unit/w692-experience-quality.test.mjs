import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  resolveEonCityW692ExperienceProfile,
  createEonCityW692FrameGovernor,
  validateEonCityW692ExperienceProfile,
  getEonCityW692Truth
} from '../../assets/js/city/w692/eon-city-w692-experience-quality.js';

test('W692 Focus and Explore preserve functional parity with different visual budgets', () => {
  const focus = resolveEonCityW692ExperienceProfile({ mode: 'focus', quality: 'cinematic' });
  const explore = resolveEonCityW692ExperienceProfile({ mode: 'explore', quality: 'cinematic' });
  assert.equal(validateEonCityW692ExperienceProfile(focus).ok, true);
  assert.equal(validateEonCityW692ExperienceProfile(explore).ok, true);
  assert.equal(focus.directWorkPriority, true);
  assert.equal(focus.discoveriesVisible, false);
  assert.equal(explore.directWorkPriority, false);
  assert.equal(explore.discoveriesVisible, true);
  assert.ok(focus.ambientPopulationMultiplier < explore.ambientPopulationMultiplier);
  assert.equal(focus.focusModeKeepsFastTravel, true);
  assert.equal(explore.exploreModeKeepsDirectActions, true);
  assert.equal(focus.essentialFeatureRequiresExploration, false);
});

test('W692 mobile portrait and accessibility profiles remain fully usable', () => {
  const profile = resolveEonCityW692ExperienceProfile({
    mode: 'explore', quality: 'cinematic', touch: true, viewportWidth: 390, viewportHeight: 844,
    deviceMemory: 4, hardwareConcurrency: 4, reducedMotion: true, highContrast: true,
    textScale: 1.4, screenReader: true
  });
  assert.equal(validateEonCityW692ExperienceProfile(profile).ok, true);
  assert.equal(profile.mobile, true);
  assert.equal(profile.portrait, true);
  assert.equal(profile.panelLayout, 'bottom-sheet');
  assert.equal(profile.minimumTouchTargetPx, 48);
  assert.equal(profile.motionEnabled, false);
  assert.equal(profile.portraitSafeLayout, true);
  assert.equal(profile.keyboardNavigation, true);
  assert.equal(profile.ariaLiveStatus, true);
  assert.equal(profile.colorNeverSoleSignal, true);
  assert.notEqual(profile.quality, 'cinematic');
});

test('W692 frame governor recommends only evidence-backed degradation', () => {
  let clock = 1000;
  const governor = createEonCityW692FrameGovernor({ initialQuality: 'cinematic', now: () => ++clock });
  for (let index = 0; index < 60; index += 1) governor.recordFrame(index < 35 ? 17 : 36);
  const state = governor.getSnapshot();
  assert.ok(state.recommendations.length >= 1);
  assert.equal(state.recommendations[0].nextQuality, 'balanced');
  assert.equal(state.recommendations[0].requiresExplicitUserAction, true);
  assert.equal(governor.applyRecommendation('balanced').reason, 'explicit-user-action-required');
  const applied = governor.applyRecommendation('balanced', { explicitUserAction: true });
  assert.equal(applied.ok, true);
  assert.equal(applied.quality, 'balanced');
  assert.equal(governor.applyRecommendation('cinematic', { explicitUserAction: true }).reason, 'governor-only-applies-lower-quality');
});

test('W692 long tasks and memory pressure never change routes or execute work', () => {
  const governor = createEonCityW692FrameGovernor({ initialQuality: 'balanced' });
  for (let index = 0; index < 4; index += 1) governor.recordLongTask(75);
  for (let index = 0; index < 3; index += 1) governor.recordMemory({ used: 900, limit: 1000 });
  const snapshot = governor.getSnapshot();
  assert.equal(snapshot.automaticQualityUpgrade, false);
  assert.equal(snapshot.automaticRouteChange, false);
  assert.equal(snapshot.automaticExecution, false);
  assert.ok(snapshot.recommendations.some((entry) => entry.nextQuality === 'lite'));
});

test('W692 active source owners consume mode and final polish authority', () => {
  const product = fs.readFileSync(new URL('../../assets/js/city/w659n/eon-city-w659n-product-layer.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../../assets/js/city/eon-city-living-nexus-babylon-runtime.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');
  assert.match(product, /resolveEonCityW692ExperienceProfile/);
  assert.match(product, /experienceProfile\.mode/);
  assert.match(runtime, /initialMode = 'explore'/);
  assert.match(runtime, /minimumTouchTargetPx/);
  assert.match(css, /W692 · final Focus\/Explore/);
  assert.match(css, /min-block-size: 48px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
});

test('W692 truth forbids automatic permissions, navigation and execution', () => {
  const truth = getEonCityW692Truth();
  assert.equal(truth.focusAndExploreParity, true);
  assert.equal(truth.mobilePortraitSafe, true);
  assert.equal(truth.reducedMotionFunctional, true);
  assert.equal(truth.performanceDowngradeRequiresEvidenceAndConfirmation, true);
  assert.equal(truth.automaticQualityUpgrade, false);
  assert.equal(truth.cameraPermissionAutomatic, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticExecution, false);
});
