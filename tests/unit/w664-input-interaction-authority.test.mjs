import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { bindEonCityDirectionalControls } from '../../assets/js/city/eon-city-input-contract.js';
import { resolveEonCityCameraRelativeMovement } from '../../assets/js/city/eon-city-camera-relative-movement.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) <= 1e-8, `${label}: expected ${expected}, received ${actual}`);

class FakeButton {
  constructor(direction) {
    this.dataset = { eonCityMove: direction };
    this.listeners = new Map();
    this.attributes = new Map();
  }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  removeEventListener(name) { this.listeners.delete(name); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  closest() { return this; }
  setPointerCapture() {}
  hasPointerCapture() { return false; }
  releasePointerCapture() {}
  emit(name, extra = {}) {
    this.listeners.get(name)?.({
      type: name,
      target: this,
      button: 0,
      pointerId: 4,
      timeStamp: 20,
      preventDefault() {},
      stopPropagation() {},
      stopImmediatePropagation() {},
      ...extra
    });
  }
}

class FakeRoot {
  constructor(button) { this.button = button; this.listeners = new Map(); }
  querySelectorAll() { return [this.button]; }
  querySelector() { return null; }
  contains(value) { return value === this.button; }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  removeEventListener(name) { this.listeners.delete(name); }
}

function fakeEnvironment() {
  return {
    performance: { now: () => 20 },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    addEventListener() {},
    removeEventListener() {},
    setTimeout(handler) { handler(); return 1; },
    clearTimeout() {},
    requestAnimationFrame(handler) { handler(20); return 1; },
    cancelAnimationFrame() {}
  };
}

test('W664 camera authority preserves screen directions at eight camera headings', () => {
  const target = { x: 0, y: 0.8, z: 0 };
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4;
    const cameraPosition = { x: Math.sin(angle) * 10, y: 7, z: -Math.cos(angle) * 10 };
    const dx = target.x - cameraPosition.x;
    const dz = target.z - cameraPosition.z;
    const length = Math.hypot(dx, dz);
    const forward = { x: dx / length, z: dz / length };
    const right = { x: forward.z, z: -forward.x };
    const cases = [
      ['forward', { inputForward: 1 }, forward],
      ['backward', { inputForward: -1 }, { x: -forward.x, z: -forward.z }],
      ['right', { inputRight: 1 }, right],
      ['left', { inputRight: -1 }, { x: -right.x, z: -right.z }]
    ];
    for (const [label, intent, expected] of cases) {
      const result = resolveEonCityCameraRelativeMovement({ ...intent, cameraPosition, cameraTarget: target });
      assert.equal(result.active, true, `heading ${index} ${label}`);
      near(result.x, expected.x, `heading ${index} ${label} x`);
      near(result.z, expected.z, `heading ${index} ${label} z`);
    }
  }
});

test('W664 D-pad identifies its input source instead of mutating an anonymous direction set', () => {
  const button = new FakeButton('left');
  const rootNode = new FakeRoot(button);
  const calls = [];
  const dispose = bindEonCityDirectionalControls(rootNode, {
    setMove(direction, active, options) { calls.push({ direction, active, options }); },
    setAnalogMove() {}
  }, {
    selector: '[data-eon-city-move]',
    datasetKey: 'eonCityMove',
    environment: fakeEnvironment(),
    controlSource: 'touch-dpad'
  });
  button.emit('pointerdown');
  assert.deepEqual(calls.at(-1), {
    direction: 'left',
    active: true,
    options: { source: 'touch-dpad', inputKind: 'directional-control' }
  });
  assert.equal(button.attributes.get('data-eon-city-input-source'), 'touch-dpad');
  dispose();
  assert.ok(calls.some((entry) => entry.direction === 'left' && entry.active === false && entry.options?.source === 'touch-dpad'));
});

test('current Command Hub keeps keyboard and touch sources independent and exposes live vector diagnostics', () => {
  const source = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const access = read('assets/js/city/eon-city-access-station.js');
  assert.match(source, /const movement = \{ forward: new Set\(\), backward: new Set\(\), left: new Set\(\), right: new Set\(\) \}/);
  assert.match(source, /setMove\(directionName = '', active = false, options = \{\}\)/);
  assert.match(access, /controlSource: 'touch-dpad'/, 'access station should label the D-pad source');
  assert.match(source, /getInputDiagnostics/);
  assert.match(source, /manual-camera-relative/);
  assert.match(source, /heldKeys/);
});

test('W664 visible NPC meshes and functional station meshes own exact click interactions', () => {
  const districtRuntime = read('assets/js/city/w649/eon-city-w649-district-runtime.js');
  const productLayer = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  assert.match(districtRuntime, /interactiveCharacter \? 'w649-district-npc-mesh'/);
  assert.match(districtRuntime, /const interactionKind = interactiveCharacter \? 'npc'/);
  assert.match(districtRuntime, /mesh\.isPickable = true/);
  assert.match(productLayer, /PointerEventTypes\.POINTERPICK/);
  assert.match(productLayer, /findOperatorForAsset/);
  assert.match(productLayer, /focusPickedInteraction/);
  assert.match(productLayer, /Only this resident's actions are shown/);
  assert.match(productLayer, /Transit cannot replace an NPC interaction/);
});

test('W664 local branch retains the W663 production stylesheet exposure repair', () => {
  const sync = read('scripts/sync-public-assets.mjs');
  assert.match(sync, /assets\/css\/eon-continue\.css/);
  assert.match(sync, /assets\/css\/eon-nexus-living-core\.css/);
});
