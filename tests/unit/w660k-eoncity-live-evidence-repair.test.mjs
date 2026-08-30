import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { bindEonCityDirectionalControls } from '../../assets/js/city/eon-city-input-contract.js';
import { describeEonCityW660kTravelTiming } from '../../assets/js/city/w660k/eon-city-w660k-travel-presentation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

class FakeButton {
  constructor(direction) { this.dataset = { eonCityMove: direction }; this.listeners = new Map(); this.attributes = new Map(); }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  removeEventListener(name) { this.listeners.delete(name); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  closest() { return this; }
  emit(name, extra = {}) {
    this.listeners.get(name)?.({ target: this, type: name, button: 0, pointerId: 7, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}, ...extra });
  }
}
class FakeRoot {
  constructor(buttons) { this.buttons = buttons; }
  querySelectorAll() { return this.buttons; }
  contains(button) { return this.buttons.includes(button); }
  addEventListener() {}
  removeEventListener() {}
}

test('W660K a short pointer tap receives a deterministic minimum movement pulse', () => {
  const button = new FakeButton('forward');
  const moves = [];
  let clock = 1_000;
  const timers = [];
  const environment = {
    performance: { now: () => clock },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    addEventListener() {}, removeEventListener() {},
    setTimeout(handler, delay) { timers.push({ handler, delay }); return timers.length; }, clearTimeout() {}
  };
  const dispose = bindEonCityDirectionalControls(new FakeRoot([button]), { setMove(direction, active) { moves.push([direction, active]); } }, {
    selector: '[data-eon-city-move]', datasetKey: 'eonCityMove', environment, minimumPointerPulseMs: 220
  });
  button.emit('pointerdown');
  clock += 24;
  button.emit('pointerup');
  assert.deepEqual(moves.slice(0, 3), [['forward', false], ['forward', true], ['forward', false]]);
  assert.ok(moves.some(([direction, active]) => direction === 'forward' && active === true));
  assert.ok(timers.some(({ delay }) => delay >= 190));
  timers.at(-1).handler();
  assert.deepEqual(moves.at(-1), ['forward', false]);
  dispose();
});

test('W660K travel timing tells first-visit users what is happening', () => {
  assert.equal(describeEonCityW660kTravelTiming(200).phase, 'core');
  assert.equal(describeEonCityW660kTravelTiming(2_000).phase, 'assets');
  assert.equal(describeEonCityW660kTravelTiming(5_000).phase, 'first-visit');
  assert.equal(describeEonCityW660kTravelTiming(10_000).phase, 'slow');
});

test('W660K closes the map before streaming and exposes the world behind side-sheet panels', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const css = read('assets/css/eon-city-product-layer.css');
  assert.match(product, /closePanels\(\)[\s\S]*travelPresentation\.begin/);
  assert.match(product, /setPlayerPose\((?:arrivalDestination|result\.destination)\)[\s\S]*await activateDistrictAssets/);
  assert.match(product, /data-eon-w660k-arrival-toast/);
  assert.match(css, /place-items:center end/);
});

test('W660K district composition has layered skyline, traffic and three-light identity', () => {
  const composition = read('assets/js/city/w660i/eon-city-w660i-district-composition.js');
  assert.match(composition, /function buildDistrictVista/);
  assert.match(composition, /district-aerial-courier/);
  assert.match(composition, /vistaMeshCount/);
  assert.match(composition, /districtLightCount: active \? 3 : 0/);
});
