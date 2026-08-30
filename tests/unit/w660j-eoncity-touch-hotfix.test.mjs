import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  bindEonCityDirectionalControls,
  getEonCityInputContractTruth
} from '../../assets/js/city/eon-city-input-contract.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

class FakeButton {
  constructor(direction) {
    this.dataset = { eonCityMove: direction };
    this.listeners = new Map();
    this.attributes = new Map();
    this.capturedPointerId = null;
  }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  removeEventListener(name) { this.listeners.delete(name); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  closest() { return this; }
  setPointerCapture(pointerId) { this.capturedPointerId = pointerId; }
  hasPointerCapture(pointerId) { return this.capturedPointerId === pointerId; }
  releasePointerCapture(pointerId) {
    if (this.capturedPointerId !== pointerId) return;
    this.capturedPointerId = null;
    this.emit('lostpointercapture', { pointerId });
  }
  emit(name, extra = {}) {
    let prevented = false;
    let stopped = false;
    let immediate = false;
    this.listeners.get(name)?.({
      type: name,
      target: this,
      button: 0,
      pointerId: 1,
      preventDefault() { prevented = true; },
      stopPropagation() { stopped = true; },
      stopImmediatePropagation() { immediate = true; },
      ...extra
    });
    return { prevented, stopped, immediate };
  }
}

class FakeRoot {
  constructor(buttons) { this.buttons = buttons; this.capture = new Map(); }
  querySelectorAll() { return this.buttons; }
  contains(button) { return this.buttons.includes(button); }
  addEventListener(name, handler, options) { if (options?.capture) this.capture.set(name, handler); }
  removeEventListener(name) { this.capture.delete(name); }
  emitCapture(name, target) {
    let prevented = false;
    this.capture.get(name)?.({
      type: name,
      target,
      preventDefault() { prevented = true; }
    });
    return { prevented };
  }
}

class FakeEnvironment {
  constructor() {
    this.now = 100;
    this.listeners = new Map();
    this.documentListeners = new Map();
    this.timers = new Map();
    this.timerId = 0;
    this.performance = { now: () => this.now };
    this.document = {
      visibilityState: 'visible',
      addEventListener: (name, handler) => this.documentListeners.set(name, handler),
      removeEventListener: (name) => this.documentListeners.delete(name)
    };
  }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  removeEventListener(name) { this.listeners.delete(name); }
  setTimeout(handler, delay) {
    const id = ++this.timerId;
    this.timers.set(id, { handler, at: this.now + Number(delay || 0) });
    return id;
  }
  clearTimeout(id) { this.timers.delete(id); }
  advance(ms) { this.now += ms; }
  emit(name) { this.listeners.get(name)?.({ type: name }); }
  flushTimers() {
    const timers = [...this.timers.entries()].sort((left, right) => left[1].at - right[1].at);
    for (const [id, timer] of timers) {
      this.now = Math.max(this.now, timer.at);
      if (!this.timers.has(id)) continue;
      this.timers.delete(id);
      timer.handler();
    }
  }
}

test('W661E directional controls prevent default and stop immediate shell propagation', () => {
  const button = new FakeButton('forward');
  const rootNode = new FakeRoot([button]);
  const moves = [];
  const runtime = { setMove(direction, active) { moves.push([direction, active]); } };
  const environment = new FakeEnvironment();
  const dispose = bindEonCityDirectionalControls(rootNode, runtime, {
    selector: '[data-eon-city-move]', datasetKey: 'eonCityMove', environment
  });
  const result = button.emit('pointerdown');
  assert.deepEqual(result, { prevented: true, stopped: true, immediate: true });
  assert.ok(moves.some(([direction, active]) => direction === 'forward' && active === true));
  environment.advance(20);
  button.emit('pointerup');
  assert.ok(moves.some(([direction, active]) => direction === 'forward' && active === false));
  dispose();
});

test('W661E capture-phase pointerup releases a held direction before target completion', () => {
  const button = new FakeButton('left');
  const rootNode = new FakeRoot([button]);
  const moves = [];
  const runtime = { setMove(direction, active) { moves.push([direction, active]); } };
  const environment = new FakeEnvironment();
  const dispose = bindEonCityDirectionalControls(rootNode, runtime, {
    selector: '[data-eon-city-move]', datasetKey: 'eonCityMove', environment, minimumPointerPulseMs: 240
  });

  button.emit('pointerdown');
  assert.deepEqual(moves.at(-1), ['left', true]);
  environment.advance(320);
  const capture = rootNode.emitCapture('pointerup', button);
  assert.equal(capture.prevented, true);
  assert.deepEqual(moves.at(-1), ['left', false], 'capture phase must release a held direction even if target propagation is suppressed later');
  button.emit('pointerup');
  assert.deepEqual(moves.at(-1), ['left', false], 'a long hold must not create a residual tap pulse');
  dispose();
});

test('W661E full pointer completion lifecycle preserves the bounded short-tap movement pulse', () => {
  const button = new FakeButton('forward');
  const rootNode = new FakeRoot([button]);
  const moves = [];
  const runtime = { setMove(direction, active) { moves.push([direction, active]); } };
  const environment = new FakeEnvironment();
  const dispose = bindEonCityDirectionalControls(rootNode, runtime, {
    selector: '[data-eon-city-move]', datasetKey: 'eonCityMove', environment, minimumPointerPulseMs: 240
  });

  button.emit('pointerdown');
  environment.advance(25);
  rootNode.emitCapture('pointerup', button);
  assert.deepEqual(moves.at(-1), ['forward', false], 'capture phase releases the physical press before target completion');
  button.emit('pointerup');
  assert.deepEqual(moves.at(-1), ['forward', true], 'target pointerup must start the remaining bounded pulse');
  button.emit('lostpointercapture');
  assert.deepEqual(moves.at(-1), ['forward', true], 'delayed lostpointercapture must preserve the new tap pulse');
  button.emit('pointerleave');
  assert.deepEqual(moves.at(-1), ['forward', true], 'pointerleave after a completed tap must preserve the new tap pulse');
  environment.emit('pointerup');
  assert.deepEqual(moves.at(-1), ['forward', true], 'window pointerup must preserve the new tap pulse');
  button.emit('click');
  assert.deepEqual(moves.at(-1), ['forward', true], 'the following click is consumed as the same activation');
  environment.flushTimers();
  assert.deepEqual(moves.at(-1), ['forward', false], 'the bounded pulse must release after its timer');
  dispose();
});

test('W661E pulse expiry clears stale activation when the browser suppresses the synthetic click', () => {
  const button = new FakeButton('forward');
  const rootNode = new FakeRoot([button]);
  const moves = [];
  const runtime = { setMove(direction, active) { moves.push([direction, active]); } };
  const environment = new FakeEnvironment();
  const dispose = bindEonCityDirectionalControls(rootNode, runtime, {
    selector: '[data-eon-city-move]', datasetKey: 'eonCityMove', environment, minimumPointerPulseMs: 240
  });

  button.emit('pointerdown');
  environment.advance(25);
  rootNode.emitCapture('pointerup', button);
  button.emit('pointerup');
  environment.flushTimers();
  assert.deepEqual(moves.at(-1), ['forward', false]);
  button.emit('click');
  assert.deepEqual(moves.at(-1), ['forward', true]);
  environment.flushTimers();
  assert.deepEqual(moves.at(-1), ['forward', false]);
  dispose();
});

test('W661E cancellation and lifecycle cleanup still clear active pulses immediately', () => {
  const button = new FakeButton('forward');
  const rootNode = new FakeRoot([button]);
  const moves = [];
  const runtime = { setMove(direction, active) { moves.push([direction, active]); } };
  const environment = new FakeEnvironment();
  const dispose = bindEonCityDirectionalControls(rootNode, runtime, {
    selector: '[data-eon-city-move]', datasetKey: 'eonCityMove', environment
  });

  button.emit('pointerdown');
  environment.advance(10);
  rootNode.emitCapture('pointerup', button);
  button.emit('pointerup');
  assert.deepEqual(moves.at(-1), ['forward', true]);
  environment.emit('pointercancel');
  assert.deepEqual(moves.at(-1), ['right', false], 'releaseAll clears all canonical directions');
  assert.ok(moves.some(([direction, active]) => direction === 'forward' && active === false));
  dispose();
});

test('W660J source gives the City a collapsed rail and fixed input layer', () => {
  const access = read('assets/js/city/eon-city-access-station.js');
  const shell = read('assets/js/eon-app-shell.js');
  const shellCss = read('assets/css/eon-app-shell.css');
  assert.match(shellCss, /data-eon-app-page=eoncity[^}]+eon-app-sidebar\.is-collapsed[^}]+eon-app-collapsed-width/s);
  assert.match(access, /zIndex:\s*'20'/);
  assert.match(access, /loadingOverlay\.style\.pointerEvents = 'none'/);
  assert.match(shell, /eonCityHoverExpand = 'disabled'/);
});

test('W759 keeps Living Nexus ownership in the single W731 Command Hub runtime', () => {
  const core = read('assets/js/city/eon-city-play-core.js');
  const commandHub = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(core, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.match(commandHub, /createEonCityW749LivingNexus/);
  assert.match(commandHub, /oneEngine:\s*true/);
  assert.match(commandHub, /openSurfaceForStation\('eonbot-nexus'/);
});

test('W661E real-browser proof uses a verified authored safe pose and release receipts', () => {
  const browserProof = read('scripts/w660j-touch-route-browser-proof.mjs');
  assert.match(browserProof, /SAFE_DIRECTION_TEST_POSE = Object\.freeze\(\{ x: 0, z: 5\.35, districtId: 'orientation-hall' \}\)/);
  assert.match(browserProof, /resetToSafePose/);
  assert.match(browserProof, /verifyMovementReleased/);
  assert.match(browserProof, /resetChecks/);
  assert.match(browserProof, /releaseChecks/);
  assert.match(browserProof, /Safe reset failed before/);
  assert.match(browserProof, /Movement release remained active/);
  assert.doesNotMatch(browserProof, /restoreExplorationPose\?\.\(\{ x: 18, z: 18/);
});

test('W661E truth contract locks route, fixed-HUD and real pointer lifecycle boundaries', () => {
  const truth = getEonCityInputContractTruth();
  assert.equal(truth.preventsDefaultNavigation, true);
  assert.equal(truth.capturePhaseDefaultGuard, true);
  assert.equal(truth.capturePhaseHeldRelease, true);
  assert.equal(truth.immediatePropagationGuard, true);
  assert.equal(truth.fixedHudSeparationRequired, true);
  assert.equal(truth.shortTapGuaranteesMovementPulse, true);
  assert.equal(truth.globalPointerUpPreservesTapPulse, true);
  assert.equal(truth.lostPointerCapturePreservesTapPulse, true);
  assert.equal(truth.pointerLeavePreservesTapPulse, true);
  assert.equal(truth.synchronousLostPointerCaptureSafe, true);
  assert.equal(truth.pulseExpiryClearsStaleActivation, true);
  assert.equal(truth.pointerCancelClearsPulse, true);
});
