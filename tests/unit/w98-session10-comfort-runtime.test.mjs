import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION10_COMFORT_SCHEMA,
  SESSION10_COMFORT_STORAGE_KEY,
  SESSION10_GAMEPAD_BUTTONS,
  Session10ComfortRuntime,
  applySession10RadialDeadzone,
  buildSession10WorldSummary,
  createSession10DefaultComfortPreferences,
  sanitizeSession10ComfortPreferences,
  sanitizeSession10ControllerBindings
} from '../../assets/js/realm3d/engine/EonCitySession10ComfortRuntime.js';

test('Session 10 comfort defaults keep every input method available', () => {
  const value = createSession10DefaultComfortPreferences();
  assert.equal(value.schema, SESSION10_COMFORT_SCHEMA);
  assert.equal(SESSION10_COMFORT_STORAGE_KEY, 'eon:realm3d:comfort-preferences:v1');
  assert.equal(value.controllerEnabled, true);
  assert.equal(value.announcements, true);
  assert.equal(value.comfortVignette, true);
  assert.ok(value.cameraBob > 0);
});

test('Session 10 reduced-motion defaults disable camera bob', () => {
  const value = createSession10DefaultComfortPreferences({ reducedMotion: true });
  assert.equal(value.reducedMotion, true);
  assert.equal(value.cameraBob, 0);
});

test('Session 10 preference migration allowlists comfort data and removes secrets', () => {
  const value = sanitizeSession10ComfortPreferences({
    mouseSensitivity: 9,
    fov: 140,
    uiScale: 0.1,
    highContrast: true,
    controllerBindings: { interact: 5, seedPhrase: 14 },
    apiKey: 'sk-never-store',
    walletAddress: '0xprivate',
    identity: { email: 'private@example.com' }
  });
  assert.equal(value.mouseSensitivity, 2);
  assert.equal(value.fov, 90);
  assert.equal(value.uiScale, 0.85);
  assert.equal(value.highContrast, true);
  assert.equal(value.controllerBindings.interact, 5);
  assert.equal(JSON.stringify(value).includes('sk-never-store'), false);
  assert.equal(JSON.stringify(value).includes('private@example.com'), false);
});

test('Session 10 controller remapping keeps only supported actions and button indexes', () => {
  const value = sanitizeSession10ControllerBindings({ jump: 3, sprint: 10, interact: 99, eonbot: 4, menu: -2, secret: 7 });
  assert.deepEqual(Object.keys(value).sort(), ['eonbot', 'interact', 'jump', 'menu', 'sprint'].sort());
  assert.equal(value.jump, 3);
  assert.equal(value.interact, SESSION10_GAMEPAD_BUTTONS.X);
  assert.equal(value.menu, SESSION10_GAMEPAD_BUTTONS.MENU);
});

test('Session 10 radial deadzone removes drift and preserves full-stick direction', () => {
  assert.deepEqual(applySession10RadialDeadzone(0.03, -0.04, 0.16), { x: 0, y: 0, magnitude: 0 });
  const right = applySession10RadialDeadzone(1, 0, 0.16);
  assert.equal(right.x, 1);
  assert.equal(right.y, 0);
  assert.equal(right.magnitude, 1);
  const diagonal = applySession10RadialDeadzone(0.8, 0.8, 0.16);
  assert.ok(diagonal.magnitude <= 1);
  assert.ok(diagonal.x > 0 && diagonal.y > 0);
});

test('Session 10 world descriptions are useful without relying on graphics or audio', () => {
  const summary = buildSession10WorldSummary({
    map: { kind: 'eon-city', label: 'EON City' },
    player: { x: 12.4, z: -7.8 },
    objective: { label: 'Visit AI Tower' },
    nearest: 'Nearest: AI Tower'
  });
  assert.match(summary, /EON City/);
  assert.match(summary, /position x 12, z -8/);
  assert.match(summary, /Visit AI Tower/);
  assert.match(summary, /E or Enter to interact/);
});


test('Session 10 runtime announces world descriptions without repeating basic-device callbacks', async () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  const live = { textContent: '' };
  const root = {
    dataset: {},
    style: { setProperty() {} },
    addEventListener() {},
    removeEventListener() {},
    querySelector(selector) {
      if (selector === '[data-realm3d-a11y-live]') return live;
      return null;
    },
    querySelectorAll() { return []; }
  };
  const basicCalls = [];
  const runtime = new Session10ComfortRuntime({
    root,
    storage,
    player: { setControlsProfile() {} },
    camera: { fov: 72, updateProjectionMatrix() {} },
    getState: () => ({
      map: { kind: 'eon-city', label: 'EON City' },
      player: { x: 4.4, z: 8.7 },
      objective: { label: 'Open the Workstation' },
      nearest: 'Nearest: Workstation Tower'
    }),
    onBasicDeviceChange: (...args) => basicCalls.push(args)
  });
  runtime.mount();
  runtime.setPreference('mouseSensitivity', 1.35);
  runtime.setPreference('fov', 80);
  runtime.setPreference('highContrast', true);
  assert.equal(basicCalls.length, 1, 'initial basic-device state should publish exactly once');
  const summary = runtime.describeWorld();
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.match(summary, /World summary\. EON City/);
  assert.equal(live.textContent, summary);
  assert.equal(runtime.getTelemetry().lastAnnouncement, summary);
  runtime.destroy();
});
