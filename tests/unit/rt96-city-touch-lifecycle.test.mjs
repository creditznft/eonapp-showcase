import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const safeZone = fs.readFileSync(new URL('../../assets/js/city/l95/eon-city-l95-hud-safe-zone.js', import.meta.url), 'utf8');
const access = fs.readFileSync(new URL('../../assets/js/city/eon-city-access-station.js', import.meta.url), 'utf8');
const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');

test('RT96 phone HUD reserves the analogue joystick and declares simultaneous move/look intent', () => {
  assert.match(safeZone, /movementControl:\s*mobile \? 'analog-joystick'/);
  assert.match(safeZone, /cameraLookSurface:\s*mobile \? 'canvas-right-field'/);
  assert.match(safeZone, /simultaneousMoveLookAllowed:\s*mobile/);
  assert.match(safeZone, /movementFootprint/);
  assert.match(safeZone, /eonCityHudSimultaneousMoveLook/);
  assert.match(css, /\.eon-play-canvas-host,\.eon-play-canvas\{[^}]*touch-action:none/);
});

test('RT96 sprint UI and runtime state converge on blur, hidden lifecycle and teardown', () => {
  assert.match(access, /const resetTouchSprint = \(reason = 'lifecycle-reset'\)/);
  assert.match(access, /addEventListener\?\.\('blur', onInputLifecycleBlur\)/);
  assert.match(access, /visibilityState === 'hidden'/);
  assert.match(access, /removeEventListener\?\.\('visibilitychange', onInputVisibilityChange\)/);
  assert.match(access, /resetTouchSprint\('dispose'\)/);
});

test('RT96 analogue release immediately reconciles authored or fallback animation to idle', () => {
  assert.match(runtime, /if \(previousAxis\.active && !nextAxis\.active\)[\s\S]{0,260}forcePlayerIdle\?\.\('analog-release'\)/);
});

test('RT97 touch owners release movement across pagehide, orientation and hidden-document boundaries', () => {
  const analog = fs.readFileSync(new URL('../../assets/js/city/eon-city-immersive-controls.js', import.meta.url), 'utf8');
  const input = fs.readFileSync(new URL('../../assets/js/city/eon-city-input-contract.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/eon-city-overlay-coordinator.js', import.meta.url), 'utf8');
  assert.match(analog, /addEventListener\?\.\('pagehide', onPageHide\)/);
  assert.match(analog, /addEventListener\?\.\('orientationchange', onOrientationChange\)/);
  assert.match(analog, /document\?\.addEventListener\?\.\('visibilitychange', onVisibility\)/);
  assert.match(input, /addEventListener\?\.\('pagehide', onGlobalCancel\)/);
  assert.match(input, /addEventListener\?\.\('orientationchange', onGlobalCancel\)/);
  assert.match(overlay, /const onLifecycleBoundary = \(\) => \{/);
  assert.match(overlay, /clearGameplayInput\(getRuntime\?\.\(\)\)/);
  assert.match(overlay, /removeEventListener\?\.\('orientationchange', onLifecycleBoundary\)/);
});
