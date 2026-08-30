import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bindEonCityDirectionalControls,
  getEonCityInputContractTruth
} from '../../assets/js/city/eon-city-input-contract.js';

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
    this.listeners.get(name)?.({
      type: name,
      target: this,
      button: 0,
      pointerId: 1,
      preventDefault() {},
      stopPropagation() {},
      stopImmediatePropagation() {},
      ...extra
    });
  }
}

class FakeRoot {
  constructor(buttons) { this.buttons = buttons; this.capture = new Map(); }
  querySelectorAll() { return this.buttons; }
  querySelector() { return null; }
  contains(button) { return this.buttons.includes(button); }
  addEventListener(name, handler, options) { if (options?.capture) this.capture.set(name, handler); }
  removeEventListener(name) { this.capture.delete(name); }
  emitCapture(name, target, extra = {}) {
    this.capture.get(name)?.({
      type: name,
      target,
      preventDefault() {},
      ...extra
    });
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
  flushTimers() {
    while (this.timers.size) {
      const [id, timer] = [...this.timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      this.now = Math.max(this.now, timer.at);
      if (!this.timers.has(id)) continue;
      this.timers.delete(id);
      timer.handler();
    }
  }
}

function createHarness(direction = 'forward') {
  const button = new FakeButton(direction);
  const root = new FakeRoot([button]);
  const environment = new FakeEnvironment();
  const moves = [];
  const runtime = { setMove(value, active) { moves.push([value, active]); } };
  const dispose = bindEonCityDirectionalControls(root, runtime, {
    selector: '[data-eon-city-move]',
    datasetKey: 'eonCityMove',
    environment,
    minimumPointerPulseMs: 240
  });
  return { button, root, environment, moves, dispose };
}

test('W661E physical 320ms hold cannot become a tap pulse when handler time advances only 20ms', () => {
  const { button, root, environment, moves, dispose } = createHarness();
  button.emit('pointerdown', { timeStamp: 1000 });
  environment.advance(20);
  root.emitCapture('pointerup', button, { timeStamp: 1320 });
  button.emit('pointerup', { timeStamp: 1320 });
  button.emit('click', { timeStamp: 1321 });
  environment.flushTimers();
  assert.deepEqual(moves.at(-1), ['forward', false]);
  assert.equal(moves.filter(([direction, active]) => direction === 'forward' && active === true).length, 1, 'held release must not create a second movement pulse');
  dispose();
});

test('W661E physical 25ms tap keeps its pulse even when handler time advances 320ms', () => {
  const { button, root, environment, moves, dispose } = createHarness();
  button.emit('pointerdown', { timeStamp: 2000 });
  environment.advance(320);
  root.emitCapture('pointerup', button, { timeStamp: 2025 });
  button.emit('pointerup', { timeStamp: 2025 });
  assert.deepEqual(moves.at(-1), ['forward', true], 'physical event duration must preserve the short-tap pulse');
  button.emit('click', { timeStamp: 2026 });
  environment.flushTimers();
  assert.deepEqual(moves.at(-1), ['forward', false]);
  dispose();
});

test('W661E truth contract records physical pointer timing authority', () => {
  const truth = getEonCityInputContractTruth();
  assert.equal(truth.physicalPointerTimestampDuration, true);
  assert.equal(truth.handlerDelayCannotCreateTapPulse, true);
});
