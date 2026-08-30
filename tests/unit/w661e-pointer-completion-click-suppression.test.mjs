import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bindEonCityDirectionalControls,
  getEonCityInputContractTruth
} from '../../assets/js/city/eon-city-input-contract.js';

class FakeButton {
  constructor(direction = 'forward') {
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
    if (this.capturedPointerId === pointerId) this.capturedPointerId = null;
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
  constructor(buttons) {
    this.buttons = buttons;
    this.capture = new Map();
  }
  querySelectorAll() { return this.buttons; }
  querySelector() { return null; }
  contains(button) { return this.buttons.includes(button); }
  addEventListener(name, handler, options) {
    if (options?.capture) this.capture.set(name, handler);
  }
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

function createHarness() {
  const button = new FakeButton();
  const root = new FakeRoot([button]);
  const environment = new FakeEnvironment();
  const moves = [];
  const analog = [];
  const runtime = {
    setMove(direction, active) { moves.push([direction, active]); },
    setAnalogMove(vector) { analog.push({ ...vector }); }
  };
  const dispose = bindEonCityDirectionalControls(root, runtime, {
    selector: '[data-eon-city-move]',
    datasetKey: 'eonCityMove',
    environment,
    minimumPointerPulseMs: 240
  });
  return { button, root, environment, moves, analog, dispose };
}

const activeStarts = (moves) => moves.filter(([direction, active]) => direction === 'forward' && active === true).length;

function dispatchPointer({ button, root, environment, downTime, upTime, pointerType = 'mouse', handlerAdvance = 0 }) {
  button.emit('pointerdown', { timeStamp: downTime, pointerType, isTrusted: true });
  environment.advance(handlerAdvance);
  root.emitCapture('pointerup', button, { timeStamp: upTime, pointerType, isTrusted: true });
  button.emit('pointerup', { timeStamp: upTime, pointerType, isTrusted: true });
}

test('W661E delayed lostpointercapture cannot turn a completed long hold click into a new movement pulse', () => {
  const { button, root, environment, moves, dispose } = createHarness();
  dispatchPointer({ button, root, environment, downTime: 1000, upTime: 1320, handlerAdvance: 20 });
  assert.equal(activeStarts(moves), 1, 'the long hold must have only its original movement start');

  // Chromium may dispatch capture loss after target pointerup and before click.
  button.emit('lostpointercapture', { timeStamp: 1320.5, pointerType: 'mouse', isTrusted: true });
  button.emit('click', { timeStamp: 1321, detail: 1, isTrusted: true });

  assert.equal(activeStarts(moves), 1, 'the browser completion click must be consumed after delayed capture loss');
  assert.deepEqual(moves.at(-1), ['forward', false]);
  assert.deepEqual(root.__eonCityReadInputState(), {
    schema: 'eon.city.input-contract.w661e.v6.state.v1',
    activeDirections: [],
    pulseDirections: [],
    pulseLifecycle: [],
    pointerClickSuppressedDirections: []
  });
  dispose();
});

test('W661E short tap keeps exactly one bounded pulse while its trusted completion click is consumed', () => {
  const { button, root, environment, moves, dispose } = createHarness();
  dispatchPointer({ button, root, environment, downTime: 2000, upTime: 2025, pointerType: 'touch', handlerAdvance: 320 });
  assert.equal(activeStarts(moves), 2, 'original press plus one bounded tap pulse');

  button.emit('lostpointercapture', { timeStamp: 2025.5, pointerType: 'touch', isTrusted: true });
  button.emit('click', { timeStamp: 2026, detail: 1, isTrusted: true, sourceCapabilities: { firesTouchEvents: true } });
  assert.equal(activeStarts(moves), 2, 'trusted completion click must not add another pulse');
  assert.deepEqual(moves.at(-1), ['forward', true]);

  environment.flushTimers();
  assert.deepEqual(moves.at(-1), ['forward', false]);
  dispose();
});

test('W661E suppressed browser click marker expires with a short pulse when the browser emits no click', () => {
  const { button, root, environment, moves, dispose } = createHarness();
  dispatchPointer({ button, root, environment, downTime: 2500, upTime: 2525, pointerType: 'touch', handlerAdvance: 25 });
  assert.deepEqual(root.__eonCityReadInputState().pointerClickSuppressedDirections, ['forward']);

  // Simulate a browser that suppresses the completion click entirely.
  environment.flushTimers();
  assert.deepEqual(root.__eonCityReadInputState().pointerClickSuppressedDirections, []);
  assert.deepEqual(moves.at(-1), ['forward', false]);

  // A later programmatic accessibility activation must not be swallowed.
  button.emit('click', { timeStamp: 2800, detail: 0, isTrusted: false });
  assert.deepEqual(moves.at(-1), ['forward', true]);
  environment.flushTimers();
  assert.deepEqual(moves.at(-1), ['forward', false]);
  dispose();
});

test('W661E programmatic accessible click remains available and explicit clear resets every input source', () => {
  const { button, root, environment, moves, analog, dispose } = createHarness();
  button.emit('click', { timeStamp: 3000, detail: 0, isTrusted: false });
  assert.equal(activeStarts(moves), 1);
  assert.deepEqual(moves.at(-1), ['forward', true]);

  root.__eonCityClearInputState();
  assert.deepEqual(moves.at(-1), ['right', false], 'clear publishes false for every canonical direction');
  assert.deepEqual(analog.at(-1), { x: 0, z: 0 });
  assert.deepEqual(root.__eonCityReadInputState().activeDirections, []);
  assert.deepEqual(root.__eonCityReadInputState().pulseDirections, []);

  environment.flushTimers();
  assert.deepEqual(moves.at(-1), ['right', false], 'cleared pulse timer cannot reactivate or append movement');
  dispose();
});

test('W661E truth contract locks completion-click suppression and diagnostics', () => {
  const truth = getEonCityInputContractTruth();
  assert.equal(truth.pointerCompletionClickSuppression, true);
  assert.equal(truth.delayedCaptureLossCannotReactivateMovement, true);
  assert.equal(truth.inputStateDiagnostics, true);
});
