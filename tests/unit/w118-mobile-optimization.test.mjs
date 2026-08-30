import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {
  buildW118MobileOptimizationPlan,
  resolveW118DeviceProfile,
  scoreW118MobileOptimizationPlan,
  validateW118MobileOptimizationPlan,
  W118_MOBILE_OPTIMIZATION_SCHEMA
} from '../../assets/js/realm3d/engine/EonCityMobileOptimizationRuntime.js';

const bootSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EngineBoot.js', import.meta.url), 'utf8');
const mobileControlsSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/MobileControls.js', import.meta.url), 'utf8');
const cssSource = fs.readFileSync(new URL('../../assets/css/realm3d.css', import.meta.url), 'utf8');
const packageSource = fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8');

test('W118 detects desktop-capable devices and allows Neon/high-detail graphics', () => {
  const profile = resolveW118DeviceProfile({
    mobile: false,
    touch: false,
    width: 1600,
    height: 950,
    memory: 8,
    cores: 8,
    dpr: 1.5,
    webgl2: true,
    requestedQuality: 'neon'
  });
  assert.equal(profile.schema, W118_MOBILE_OPTIMIZATION_SCHEMA);
  assert.equal(profile.tier, 'desktop-ultra');
  assert.equal(profile.recommendedQuality, 'neon');
  assert.equal(profile.detailMode, 'desktop-rich');
  assert.equal(profile.interactionMode, 'mouse-keyboard-aim');
});

test('W118 forces pocket/low devices to essential targets while preserving interaction', () => {
  const plan = buildW118MobileOptimizationPlan({
    quality: 'neon',
    world: 'eon-city',
    device: {
      mobile: true,
      touch: true,
      width: 390,
      height: 760,
      memory: 2,
      cores: 4,
      dpr: 3,
      saveData: true,
      requestedQuality: 'neon'
    }
  });
  const validation = validateW118MobileOptimizationPlan(plan);
  assert.equal(validation.ok, true);
  assert.equal(plan.targetQuality, 'low');
  assert.equal(plan.mobileEssentialMode, true);
  assert.equal(plan.controlPlan.minTouchTargetPx, 48);
  assert.equal(plan.controlPlan.stickyUseButton, true);
  assert.equal(plan.interactionPlan.everyMajorVisualKeepsUseTarget, true);
  assert.equal(plan.voicePlan.textFallbackAlwaysActive, true);
  assert.ok(scoreW118MobileOptimizationPlan(plan) >= 98);
});

test('W118 portrait plan keeps mobile usable with one-thumb controls and 2D fallback', () => {
  const plan = buildW118MobileOptimizationPlan({
    quality: 'standard',
    activeInteriorId: 'ai',
    device: { mobile: true, touch: true, width: 412, height: 915, memory: 4, cores: 6, requestedQuality: 'standard' }
  });
  assert.equal(plan.portraitPlan.active, true);
  assert.equal(plan.portraitPlan.safe2dFallbackButton, true);
  assert.equal(plan.controlPlan.oneThumbLayout, true);
  assert.equal(plan.controlPlan.typedFallbackAlwaysVisible, true);
  assert.equal(plan.memoryPlan.releaseDistantInteriors, true);
  assert.equal(plan.activeInteriorId, 'ai');
});

test('W118 is wired into EngineBoot, touch controls, CSS, and package QA scripts', () => {
  assert.match(bootSource, /EonCityMobileOptimizationRuntime/);
  assert.match(bootSource, /realmMobileOptimizationSession/);
  assert.match(bootSource, /getW118MobileOptimizationState/);
  assert.match(bootSource, /data-realm3d-mobile-health/);
  assert.match(mobileControlsSource, /setOptimizationProfile/);
  assert.match(mobileControlsSource, /data-w118-primary-use/);
  assert.match(cssSource, /realm3d-w118-mobile-optimized/);
  assert.match(cssSource, /realm3d-w118-desktop-rich/);
  assert.match(cssSource, /min-height: 48px/);
  assert.match(packageSource, /qa:w118-mobile-optimization/);
  assert.match(packageSource, /qa:w113-w118-eoncity-next-wave/);
});
