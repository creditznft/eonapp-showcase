import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../assets/vendor/three.module.min.js';
import {
  SESSION13_MEGA_SCHEMA,
  SESSION13_PREFERENCE_STORAGE_KEY,
  SESSION13_JOURNEY_STORAGE_KEY,
  Session13MegaRuntime,
  buildSession13CompatibilityMatrix,
  detectSession13BrowserFamily,
  resolveSession13CompatibilityProfile,
  resolveSession13DistrictArrival,
  resolveSession13QualityIdentity,
  sanitizeSession13JourneyState,
  sanitizeSession13Preferences,
  scoreSession13ReleaseReadiness
} from '../../assets/js/realm3d/engine/EonCitySession13MegaRuntime.js';
import {
  SESSION13_WORLD_POLISH_SCHEMA,
  applySession13QualityToPolish,
  buildSession13WorldPolish
} from '../../assets/js/realm3d/engine/EonCitySession13WorldPolish.js';
import { buildEonCityVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';

class MemoryStorage {
  constructor(seed = {}) { this.data = new Map(Object.entries(seed)); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
}

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(...values) { values.forEach((value) => this.values.add(value)); }
  remove(...values) { values.forEach((value) => this.values.delete(value)); }
  contains(value) { return this.values.has(value); }
  toggle(value, force) {
    if (force === true) { this.values.add(value); return true; }
    if (force === false) { this.values.delete(value); return false; }
    if (this.values.has(value)) { this.values.delete(value); return false; }
    this.values.add(value); return true;
  }
}

class FakeNode {
  constructor() {
    this.hidden = true;
    this.textContent = '';
    this.dataset = {};
    this.attrs = new Map();
    this.focused = false;
  }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
  focus() { this.focused = true; }
  querySelector(selector) {
    if (!this.children) this.children = new Map();
    if (!this.children.has(selector)) this.children.set(selector, new FakeNode());
    return this.children.get(selector);
  }
}

class FakeRoot extends EventTarget {
  constructor() {
    super();
    this.dataset = {};
    this.classList = new FakeClassList();
    this.nodes = new Map();
  }
  querySelector(selector) {
    if (!this.nodes.has(selector)) this.nodes.set(selector, new FakeNode());
    return this.nodes.get(selector);
  }
}

class FakeWindow extends EventTarget {
  constructor() {
    super();
    this.navigator = { maxTouchPoints: 0, deviceMemory: 8, hardwareConcurrency: 8, connection: { saveData: false }, onLine: true, userAgent: 'Mozilla/5.0 Chrome/149 Safari/537.36', platform: 'Win32' };
    this.performance = { now: () => 1000 };
  }
  setTimeout(fn) { fn(); return 1; }
  clearTimeout() {}
  requestIdleCallback(fn) { fn(); return 1; }
}

class FakeCanvas extends EventTarget {}

test('Session 13 stores only safe visual preferences', () => {
  const clean = sanitizeSession13Preferences({
    cinematicTransitions: false,
    arrivalCards: true,
    routeBeacons: false,
    qualityIdentityChip: true,
    apiKey: 'never',
    seedPhrase: 'never'
  });
  assert.equal(clean.schema, SESSION13_MEGA_SCHEMA);
  assert.equal(clean.cinematicTransitions, false);
  assert.equal(clean.routeBeacons, false);
  assert.equal('apiKey' in clean, false);
  assert.equal('seedPhrase' in clean, false);
});

test('Session 13 compatibility profiles prefer fallback, conservative, portable, and showcase safely', () => {
  assert.equal(resolveSession13CompatibilityProfile({ webgl: false }).profile, 'safe-2d');
  assert.equal(resolveSession13CompatibilityProfile({ webgl: true, deviceMemory: 2, hardwareConcurrency: 2 }).profile, 'conservative');
  assert.equal(resolveSession13CompatibilityProfile({ webgl: true, mobile: true, deviceMemory: 4 }).profile, 'portable');
  const showcase = resolveSession13CompatibilityProfile({ webgl: true, webgl2: true, deviceMemory: 8, hardwareConcurrency: 8 });
  assert.equal(showcase.profile, 'showcase');
  assert.equal(showcase.recommendedQuality, 'neon');
});

test('Session 13 quality identities make low, standard, and neon intentional', () => {
  assert.equal(resolveSession13QualityIdentity({ quality: 'low' }).id, 'signal');
  assert.equal(resolveSession13QualityIdentity({ quality: 'standard' }).id, 'studio');
  assert.equal(resolveSession13QualityIdentity({ quality: 'neon' }).id, 'aurora');
  assert.equal(resolveSession13QualityIdentity({ quality: 'neon', basicDevice: true }).quality, 'low');
  assert.equal(resolveSession13QualityIdentity({ quality: 'neon', reducedMotion: true }).motionScale, 0);
});

test('Session 13 district arrival uses hysteresis and does not flicker at boundaries', () => {
  const districts = [
    { id: 'spawn', label: 'Spawn Plaza', position: [0, 0] },
    { id: 'ai', label: 'AI Tower', position: [0, -20] }
  ];
  const arrived = resolveSession13DistrictArrival({ districts, position: { x: 0, z: -18 }, previousId: '' });
  assert.equal(arrived.activeId, 'ai');
  assert.equal(arrived.arrived, true);
  const held = resolveSession13DistrictArrival({ districts, position: { x: 0, z: -8 }, previousId: 'ai' });
  assert.equal(held.activeId, 'ai');
  assert.equal(held.arrived, false);
  const departed = resolveSession13DistrictArrival({ districts, position: { x: 30, z: 30 }, previousId: 'ai' });
  assert.equal(departed.activeId, '');
  assert.equal(departed.departed, true);
});

test('Session 13 sanitizes resumable journey state and keeps the compatibility matrix honest', () => {
  const journey = sanitizeSession13JourneyState({
    milestones: {
      arrival: { completed: true, count: 2, lastAt: '2026-06-10T00:00:00.000Z' },
      unknown: { completed: true, count: 99 }
    },
    lastWorld: 'private-workstation',
    lastDistrictId: 'ai'
  });
  assert.deepEqual(Object.keys(journey.milestones), ['arrival']);
  assert.equal(journey.lastWorld, 'private-workstation');
  const browser = detectSession13BrowserFamily('Mozilla/5.0 (Linux; Android 15) SamsungBrowser/28 Chrome/130', 'Linux armv8l');
  assert.equal(browser.id, 'samsung-android');
  const matrix = buildSession13CompatibilityMatrix({
    compatibility: resolveSession13CompatibilityProfile({ webgl: true, mobile: true }),
    browser,
    evidence: { 'chromium-desktop': true }
  });
  assert.equal(matrix.length, 6);
  assert.equal(matrix.find((row) => row.id === 'samsung-android')?.status, 'runtime-ready');
  assert.equal(matrix.find((row) => row.id === 'chromium-desktop')?.status, 'automated-proof');
  assert.equal(matrix.some((row) => row.physicalEvidence), false);
});

test('Session 13 readiness score preserves physical-device and normal-host blockers honestly', () => {
  const report = scoreSession13ReleaseReadiness({
    sourceGate: true,
    cumulativeRegression: true,
    actualWorldArt: true,
    browserCompatibility: true,
    fallbackRecovery: true,
    criticalJourney: true,
    physicalMobile: false,
    normalHostEndurance: false
  });
  assert.equal(report.implementationComplete, true);
  assert.equal(report.releaseCertified, false);
  assert.deepEqual(report.blockers, ['physicalMobile', 'normalHostEndurance']);
  assert.equal(report.score, 75);
});

test('Session 13 runtime drives compatibility, arrivals, transitions, and focus recovery', () => {
  const storage = new MemoryStorage({ [SESSION13_PREFERENCE_STORAGE_KEY]: JSON.stringify({ arrivalCards: true }) });
  const root = new FakeRoot();
  const windowTarget = new FakeWindow();
  const documentTarget = { activeElement: new FakeNode() };
  const arrivals = [];
  let position = { x: 0, z: -18 };
  const runtime = new Session13MegaRuntime({
    root,
    storage,
    windowTarget,
    documentTarget,
    now: (() => { let value = 0; return () => (value += 250); })(),
    getState: () => ({
      webgl: true,
      webgl2: true,
      quality: 'standard',
      world: 'eon-city',
      districts: [{ id: 'ai', label: 'AI Tower', icon: 'AI', description: 'Provider health', position: [0, -20] }],
      player: position
    }),
    onDistrictArrival: (district) => arrivals.push(district.id)
  }).mount();
  runtime.update();
  assert.equal(root.dataset.realmEnhancementSession, 'w98-session13');
  assert.equal(root.dataset.qualityIdentity, 'studio');
  assert.deepEqual(arrivals, ['ai']);
  runtime.focusStation({ id: 'screen-code', label: 'Code Maker' });
  const canvas = new FakeNode();
  runtime.restoreWorldFocus(canvas);
  assert.equal(canvas.focused, true);
  position = { x: 30, z: 30 };
  runtime.update();
  const telemetry = runtime.getTelemetry();
  assert.equal(telemetry.districtArrivals, 1);
  assert.equal(telemetry.stationFocuses, 1);
  assert.equal(telemetry.focusRestores, 1);
  assert.ok(telemetry.transitions >= 2);
  runtime.destroy();
});

test('Session 13 runtime persists safe journey milestones and recovers network and graphics lifecycle', () => {
  const storage = new MemoryStorage();
  const root = new FakeRoot();
  const windowTarget = new FakeWindow();
  const canvas = new FakeCanvas();
  const statuses = [];
  const fallbacks = [];
  const runtime = new Session13MegaRuntime({
    root,
    canvas,
    storage,
    windowTarget,
    getState: () => ({ webgl: true, webgl2: true, quality: 'standard', world: 'eon-city', districts: [], player: { x: 0, z: 0 } }),
    onStatus: (message) => statuses.push(message),
    onFallback: (detail) => fallbacks.push(detail)
  }).mount();
  runtime.recordEvent('eonbot-opened', { world: 'eon-city' });
  runtime.recordEvent('world-entered', { world: 'private-workstation' });
  runtime.recordEvent('station-opened', { world: 'private-workstation' });
  assert.ok(storage.getItem(SESSION13_JOURNEY_STORAGE_KEY));
  assert.equal(Object.keys(runtime.getTelemetry().journey.milestones).length, 4);
  windowTarget.navigator.onLine = false;
  windowTarget.dispatchEvent(new Event('offline'));
  assert.equal(root.dataset.networkState, 'offline');
  const lost = new Event('webglcontextlost', { cancelable: true });
  canvas.dispatchEvent(lost);
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  assert.equal(root.dataset.graphicsState, 'restored');
  assert.equal(runtime.getTelemetry().contextLosses, 1);
  assert.equal(runtime.getTelemetry().contextRestores, 1);
  assert.equal(fallbacks.length, 0);
  assert.ok(statuses.some((message) => message.includes('Offline mode')));
  runtime.destroy();
});

test('Session 13 actual-world polish creates eight signatures and deliberate quality layers', () => {
  const map = buildEonCityVoxelWorld();
  const built = buildSession13WorldPolish({ map, quality: 'standard' });
  assert.equal(built.stats.schema, SESSION13_WORLD_POLISH_SCHEMA);
  assert.equal(built.stats.distinctLandmarkSignatures, 8);
  assert.equal(built.stats.storyClusterCount, 9);
  assert.equal(built.stats.actualWorldGeometry, true);
  assert.equal(built.stats.intentionalLowMode, true);
  let signatureCount = 0;
  let standardOnly = 0;
  built.group.traverse((object) => {
    if (String(object.name || '').startsWith('session13-signature:')) signatureCount += 1;
    if (object.userData?.session13MinQuality === 'standard') standardOnly += 1;
  });
  assert.equal(signatureCount, 8);
  assert.ok(standardOnly > 0);
  applySession13QualityToPolish(built.group, 'low');
  let hiddenStandard = 0;
  built.group.traverse((object) => {
    if (object.userData?.session13MinQuality === 'standard' && object.visible === false) hiddenStandard += 1;
  });
  assert.ok(hiddenStandard > 0);
  built.group.traverse((object) => {
    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => material.dispose?.());
  });
  assert.ok(built.group instanceof THREE.Group);
});
