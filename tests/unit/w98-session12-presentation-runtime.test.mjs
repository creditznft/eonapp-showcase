import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION12_PRESENTATION_SCHEMA,
  SESSION12_PRESENTATION_STORAGE_KEY,
  Session12PresentationRuntime,
  auditSession12PublicCopy,
  resolveSession12HudMode,
  resolveSession12ViewportProfile,
  sanitizeSession12PresentationPreferences,
  scoreSession12Presentation
} from '../../assets/js/realm3d/engine/EonCitySession12PresentationRuntime.js';

class MemoryStorage {
  constructor(seed = {}) { this.data = new Map(Object.entries(seed)); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
}

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(...values) { values.forEach((value) => this.values.add(value)); }
  remove(...values) { values.forEach((value) => this.values.delete(value)); }
  toggle(value, force) {
    if (force === true) { this.values.add(value); return true; }
    if (force === false) { this.values.delete(value); return false; }
    if (this.values.has(value)) { this.values.delete(value); return false; }
    this.values.add(value); return true;
  }
  contains(value) { return this.values.has(value); }
}

class FakeButton {
  constructor(mode = '') {
    this.dataset = { realm3dHudMode: mode };
    this.attrs = new Map();
    this.classList = new FakeClassList();
  }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
}

class FakeRoot extends EventTarget {
  constructor() {
    super();
    this.dataset = {};
    this.classList = new FakeClassList();
    this.clientWidth = 1280;
    this.clientHeight = 800;
    this.buttons = ['guided', 'minimal', 'diagnostic'].map((mode) => new FakeButton(mode));
    this.label = { textContent: '' };
    this.hint = { hidden: false };
  }
  querySelectorAll(selector) {
    if (selector === '[data-realm3d-hud-mode]') return this.buttons;
    if (selector.includes('data-session12-public-copy')) return [];
    return [];
  }
  querySelector(selector) {
    if (selector === '[data-realm3d-hud-mode-label]') return this.label;
    if (selector === '[data-realm3d-controls-hint]') return this.hint;
    return null;
  }
}

class FakeWindow extends EventTarget {
  constructor(width = 1280, height = 800, maxTouchPoints = 0) {
    super();
    this.innerWidth = width;
    this.innerHeight = height;
    this.navigator = { maxTouchPoints };
  }
}

test('Session 12 preference sanitizer stores only presentation state', () => {
  const clean = sanitizeSession12PresentationPreferences({
    hudMode: 'diagnostic',
    controlsHintDismissed: 1,
    introCompact: true,
    apiKey: 'should-not-survive',
    seedPhrase: 'never'
  });
  assert.equal(clean.schema, SESSION12_PRESENTATION_SCHEMA);
  assert.equal(clean.hudMode, 'diagnostic');
  assert.equal(clean.controlsHintDismissed, true);
  assert.equal('apiKey' in clean, false);
  assert.equal('seedPhrase' in clean, false);
  assert.equal(sanitizeSession12PresentationPreferences({ hudMode: 'unknown' }).hudMode, 'guided');
});

test('Session 12 viewport profiles cover desktop, short landscape, portrait, and basic devices', () => {
  assert.equal(resolveSession12ViewportProfile({ width: 1440, height: 900 }).profile, 'desktop-cinematic');
  assert.equal(resolveSession12ViewportProfile({ width: 844, height: 390, mobile: true, touch: true }).profile, 'phone-landscape');
  assert.equal(resolveSession12ViewportProfile({ width: 390, height: 844, mobile: true, touch: true }).profile, 'phone-portrait');
  const basic = resolveSession12ViewportProfile({ width: 390, height: 844, basicDevice: true });
  assert.equal(basic.profile, 'basic-device');
  assert.equal(basic.minimumTargetPx, 44);
});

test('Session 12 HUD resolution prioritizes safety and clean photo presentation', () => {
  assert.equal(resolveSession12HudMode({ requested: 'diagnostic' }), 'diagnostic');
  assert.equal(resolveSession12HudMode({ requested: 'diagnostic', panelOpen: true }), 'minimal');
  assert.equal(resolveSession12HudMode({ requested: 'guided', screenFocused: true }), 'minimal');
  assert.equal(resolveSession12HudMode({ requested: 'guided', photoMode: true }), 'minimal');
  assert.equal(resolveSession12HudMode({ requested: 'diagnostic', basicDevice: true }), 'minimal');
});

test('Session 12 public-copy audit rejects internal wave labels and unsafe promises', () => {
  const good = auditSession12PublicCopy('Explore a stylized browser-based 3D city. Sound stays opt-in and private keys never appear in-world.');
  assert.equal(good.ok, true);
  const internal = auditSession12PublicCopy('Session 11 release build. W98 roadmap.');
  assert.equal(internal.ok, false);
  assert.ok(internal.violations.includes('internal-session-label'));
  assert.ok(internal.violations.includes('internal-wave-label'));
  const unsafe = auditSession12PublicCopy('Guaranteed earnings and browse any website automatically.');
  assert.equal(unsafe.ok, false);
  assert.ok(unsafe.violations.includes('guaranteed-earnings'));
  assert.ok(unsafe.violations.includes('unsafe-browser-claim'));
});

test('Session 12 presentation score requires truthful copy, large targets, and zero overlap', () => {
  const viewport = resolveSession12ViewportProfile({ width: 390, height: 844, mobile: true });
  const pass = scoreSession12Presentation({
    viewport,
    copyAudit: auditSession12PublicCopy('Private-safe guided city.'),
    targetCount: 6,
    undersizedTargets: 0,
    overlapCount: 0,
    overflowPx: 0
  });
  assert.equal(pass.ok, true);
  assert.equal(pass.score, 100);
  const fail = scoreSession12Presentation({ viewport, copyAudit: auditSession12PublicCopy('Session 12'), targetCount: 1, undersizedTargets: 2, overlapCount: 1, overflowPx: 12 });
  assert.equal(fail.ok, false);
  assert.ok(fail.score < 100);
});

test('Session 12 runtime mounts, persists safe HUD state, and adapts viewport', () => {
  const root = new FakeRoot();
  const storage = new MemoryStorage();
  const windowTarget = new FakeWindow(1440, 900, 0);
  const statuses = [];
  const runtime = new Session12PresentationRuntime({
    root,
    storage,
    windowTarget,
    documentTarget: new EventTarget(),
    getState: () => ({ mobile: false, basicDevice: false, panelOpen: false, screenFocused: false }),
    onStatus: (message) => statuses.push(message)
  }).mount();
  assert.equal(root.dataset.realmPresentationSession, 'w98-session12');
  assert.equal(root.dataset.viewportProfile, 'desktop-cinematic');
  assert.equal(root.dataset.hudMode, 'guided');
  runtime.setHudMode('diagnostic');
  assert.equal(root.dataset.hudMode, 'diagnostic');
  const stored = storage.getItem(SESSION12_PRESENTATION_STORAGE_KEY);
  assert.match(stored, /"hudMode":"diagnostic"/);
  assert.doesNotMatch(stored, /apiKey|privateKey|seedPhrase|token|secret/i);
  runtime.dismissControlsHint();
  assert.equal(root.hint.hidden, true);
  windowTarget.innerWidth = 844;
  windowTarget.innerHeight = 390;
  runtime.updateViewport({ mobile: true, touch: true });
  assert.equal(root.dataset.viewportProfile, 'phone-landscape');
  assert.ok(statuses.some((message) => /diagnostic/i.test(message)));
  runtime.destroy();
});
