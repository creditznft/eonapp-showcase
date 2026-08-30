import assert from 'node:assert/strict';
import test from 'node:test';
import { bindEonCityDirectionalControls } from '../../assets/js/city/eon-city-input-contract.js';

class Button {
  constructor() { this.dataset = { eonCityMove: 'forward' }; this.listeners = new Map(); this.attributes = new Map(); }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  removeEventListener(name) { this.listeners.delete(name); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  closest() { return this; }
  setPointerCapture() {}
  hasPointerCapture() { return false; }
  emit(name, extra = {}) { this.listeners.get(name)?.({ type: name, target: this, button: 0, pointerId: 1, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}, ...extra }); }
}
class Root {
  constructor(button) { this.button = button; this.capture = new Map(); }
  querySelectorAll() { return [this.button]; }
  querySelector() { return null; }
  contains(button) { return button === this.button; }
  addEventListener(name, handler, options) { if (options?.capture) this.capture.set(name, handler); }
  removeEventListener(name) { this.capture.delete(name); }
  emitCapture(name, target, extra = {}) { this.capture.get(name)?.({ type: name, target, preventDefault() {}, ...extra }); }
}
class Clock {
  constructor() { this.now = 0; this.timers = new Map(); this.frames = new Map(); this.next = 0; this.listeners = new Map(); this.performance = { now: () => this.now }; this.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} }; }
  setTimeout(fn, delay) { const id = ++this.next; this.timers.set(id, { fn, at: this.now + delay }); return id; }
  clearTimeout(id) { this.timers.delete(id); }
  requestAnimationFrame(fn) { const id = ++this.next; this.frames.set(id, fn); return id; }
  cancelAnimationFrame(id) { this.frames.delete(id); }
  addEventListener(name, fn) { this.listeners.set(name, fn); }
  removeEventListener(name) { this.listeners.delete(name); }
  advance(ms) { this.now += ms; this.flushTimers(); }
  flushTimers() { for (;;) { const entry = [...this.timers.entries()].filter(([, t]) => t.at <= this.now).sort((a, b) => a[1].at - b[1].at)[0]; if (!entry) return; this.timers.delete(entry[0]); entry[1].fn(); } }
  frame() { const frames = [...this.frames.values()]; this.frames.clear(); for (const fn of frames) fn(this.now); this.flushTimers(); }
}
function harness() {
  const button = new Button(); const root = new Root(button); const environment = new Clock(); const moves = [];
  const dispose = bindEonCityDirectionalControls(root, { setMove: (direction, enabled) => moves.push([direction, enabled]) }, { selector: '[data-eon-city-move]', datasetKey: 'eonCityMove', environment, minimumPointerPulseMs: 240 });
  return { button, root, environment, moves, dispose };
}
function shortTap(h) { h.button.emit('pointerdown', { timeStamp: 0 }); h.root.emitCapture('pointerup', h.button, { timeStamp: 25 }); h.button.emit('pointerup', { timeStamp: 25 }); }

test('W661E frame-safe pulse survives 461ms and 700ms zero-frame stalls, then releases after a frame task', () => {
  for (const stall of [461, 700]) {
    const h = harness(); shortTap(h); h.environment.advance(stall);
    assert.deepEqual(h.root.__eonCityReadInputState().pulseDirections, ['forward'], `pulse survives ${stall}ms before a frame`);
    assert.deepEqual(h.moves.at(-1), ['forward', true]);
    h.environment.frame();
    assert.deepEqual(h.moves.at(-1), ['forward', false], `pulse releases after the post-stall frame for ${stall}ms`);
    assert.deepEqual(h.root.__eonCityReadInputState().pulseDirections, []); h.dispose();
  }
});

test('W661E frame before the minimum does not release early and safety cleanup is bounded', () => {
  const h = harness(); shortTap(h); h.environment.frame(); h.environment.advance(214);
  assert.deepEqual(h.moves.at(-1), ['forward', true]);
  h.environment.advance(1); assert.deepEqual(h.moves.at(-1), ['forward', false]);
  h.dispose();
  const stalled = harness(); shortTap(stalled); stalled.environment.advance(2_040);
  assert.deepEqual(stalled.moves.at(-1), ['forward', false], 'no-frame safety timeout clears the pulse'); stalled.dispose();
});
