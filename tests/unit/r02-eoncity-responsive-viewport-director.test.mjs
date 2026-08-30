import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveEonCityR02ViewportProfile,
  recomposeEonCityR02CameraRadius
} from '../../assets/js/city/r02/eon-city-r02-viewport-director.js';

test('R02 classifies supported viewport families from the actual game container', () => {
  assert.equal(deriveEonCityR02ViewportProfile({ width: 390, height: 844, coarsePointer: true }).id, 'mobile-portrait');
  assert.equal(deriveEonCityR02ViewportProfile({ width: 844, height: 390, coarsePointer: true }).id, 'mobile-landscape');
  assert.equal(deriveEonCityR02ViewportProfile({ width: 768, height: 1024 }).id, 'tablet-portrait');
  assert.equal(deriveEonCityR02ViewportProfile({ width: 1024, height: 768 }).id, 'desktop-compact');
  assert.equal(deriveEonCityR02ViewportProfile({ width: 1440, height: 900 }).id, 'desktop-standard');
  assert.equal(deriveEonCityR02ViewportProfile({ width: 2560, height: 1080 }).id, 'desktop-wide');
});

test('R02 gives small viewports wider composition and lower label budgets', () => {
  const phone = deriveEonCityR02ViewportProfile({ width: 390, height: 844, coarsePointer: true });
  const desktop = deriveEonCityR02ViewportProfile({ width: 1440, height: 900 });
  assert.ok(phone.camera.radiusScale > desktop.camera.radiusScale);
  assert.ok(phone.camera.fov > desktop.camera.fov);
  assert.equal(phone.labelBudget, 1);
  assert.equal(phone.surfaceMode, 'bottom-sheet');
  assert.equal(desktop.labelBudget, 3);
  assert.equal(desktop.surfaceMode, 'dock');
});

test('R02 recomposes camera radius proportionally instead of resetting player zoom', () => {
  assert.equal(recomposeEonCityR02CameraRadius({ radius: 10, previousScale: 1, nextScale: 1.2, min: 6, max: 20 }), 12);
  assert.equal(recomposeEonCityR02CameraRadius({ radius: 18, previousScale: 1, nextScale: 1.2, min: 6, max: 20 }), 20);
  assert.equal(recomposeEonCityR02CameraRadius({ radius: 8, previousScale: 1.2, nextScale: 1, min: 6, max: 20 }), 6.6667);
});
