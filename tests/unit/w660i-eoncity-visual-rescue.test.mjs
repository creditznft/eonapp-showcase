import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import {
  EON_CITY_W660I_DISTRICTS,
  resolveEonCityW660iDistrictAtPosition,
  validateEonCityW660iDistrictConfigs
} from '../../assets/js/city/w660i/eon-city-w660i-district-config.js';
import { createEonCityW660iDistrictComposition } from '../../assets/js/city/w660i/eon-city-w660i-district-composition.js';
import {
  EON_CITY_W660_NEXUS_DISTRICT_IDS,
  EON_CITY_W660_NEXUS_STATIONS,
  EON_CITY_W660_NEXUS_INTERACTION_RADIUS
} from '../../assets/js/city/w660/eon-city-w660-nexus-stations.js';
import {
  EON_CITY_W660I_TERMINALS,
  getNearestEonCityW660iTerminal,
  validateEonCityW660iTerminals
} from '../../assets/js/city/w660i/eon-city-w660i-terminal-registry.js';
import { EON_CITY_W659F_DESTINATIONS, createEonCityW659fTransportRuntime } from '../../assets/js/city/w659f/eon-city-w659f-transport-runtime.js';
import {
  bindEonCityDirectionalControls,
  getEonCityInputContractTruth,
  normalizeEonCityMovementDirection
} from '../../assets/js/city/eon-city-input-contract.js';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

class FakeButton {
  constructor(direction) {
    this.dataset = { playMove: direction };
    this.attributes = new Map();
    this.listeners = new Map();
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  removeEventListener(name) { this.listeners.delete(name); }
  setPointerCapture() {}
  releasePointerCapture() {}
  hasPointerCapture() { return false; }
  closest(selector) { return selector.includes('data-play-move') ? this : null; }
  fire(name, extra = {}) {
    let prevented = false;
    let stopped = false;
    let immediateStopped = false;
    this.listeners.get(name)?.({
      target: this,
      button: 0,
      pointerId: 7,
      key: '',
      repeat: false,
      preventDefault() { prevented = true; },
      stopPropagation() { stopped = true; },
      stopImmediatePropagation() { immediateStopped = true; },
      ...extra
    });
    return { prevented, stopped, immediateStopped };
  }
}

class FakeRoot {
  constructor(buttons) {
    this.buttons = buttons;
    this.listeners = new Map();
  }
  querySelectorAll() { return this.buttons; }
  contains(button) { return this.buttons.includes(button); }
  addEventListener(name, handler, options = {}) { this.listeners.set(`${name}:${Boolean(options?.capture)}`, handler); }
  removeEventListener(name, _handler, options = {}) { this.listeners.delete(`${name}:${Boolean(options?.capture)}`); }
  fireCapture(name, target) {
    let prevented = false;
    this.listeners.get(`${name}:true`)?.({
      target,
      preventDefault() { prevented = true; }
    });
    return { prevented };
  }
}

function fakeEnvironment() {
  const listeners = new Map();
  const documentListeners = new Map();
  return {
    document: {
      visibilityState: 'visible',
      addEventListener(name, handler) { documentListeners.set(name, handler); },
      removeEventListener(name) { documentListeners.delete(name); }
    },
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
    addEventListener(name, handler) { listeners.set(name, handler); },
    removeEventListener(name) { listeners.delete(name); }
  };
}

test('W660I defines exactly nine visually distinct district configurations', () => {
  const validation = validateEonCityW660iDistrictConfigs();
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(EON_CITY_W660I_DISTRICTS.length, 9);
  assert.deepEqual(EON_CITY_W660I_DISTRICTS.map((entry) => entry.label), [
    'Orientation Hall', 'Transit Network', 'Agent Theatre', 'Creator Atrium', 'Forge Basilica',
    'Command Centre', 'Archive Canopy', 'Vault Station', 'Trade Dome'
  ]);
  assert.equal(new Set(EON_CITY_W660I_DISTRICTS.map((entry) => entry.signatureLandmarkId)).size, 9);
  assert.equal(new Set(EON_CITY_W660I_DISTRICTS.map((entry) => entry.activeAssetGroupId)).size, 9);
  assert.ok(EON_CITY_W660I_DISTRICTS.every((entry) => entry.terminals.length >= 2));
  assert.ok(EON_CITY_W660I_DISTRICTS.every((entry) => entry.skyline.length >= 3));
  assert.ok(EON_CITY_W660I_DISTRICTS.every((entry) => resolveEonCityW660iDistrictAtPosition(entry.arrival)?.id === entry.id));
});

test('W660I transport uses the canonical district labels and remains review-first', () => {
  assert.deepEqual(EON_CITY_W659F_DESTINATIONS.map((entry) => entry.label), EON_CITY_W660I_DISTRICTS.map((entry) => entry.label));
  assert.equal(EON_CITY_W659F_DESTINATIONS.some((entry) => /Knowledge Archive|Local AI Observatory/.test(entry.label)), false);
  const transport = createEonCityW659fTransportRuntime({ now: (() => { let value = 1000; return () => ++value; })() });
  assert.equal(transport.request('command-centre').ok, false);
  const review = transport.request('command-centre', { explicitUserAction: true });
  assert.equal(review.ok, true);
  assert.equal(review.reviewRequired, true);
  assert.equal(review.autoTravel, false);
  const confirmed = transport.confirm(review.token, { explicitUserAction: true });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.destination.label, 'Command Centre');
  assert.equal(confirmed.receipt.workExecuted, false);
  assert.equal(confirmed.receipt.privateDataTransferred, false);
});



test('W660I gives every district at least two visible review-first product terminals', () => {
  const validation = validateEonCityW660iTerminals();
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(EON_CITY_W660I_TERMINALS.length, 24);
  for (const district of EON_CITY_W660I_DISTRICTS) {
    assert.ok(validation.districtCounts[district.id] >= 2, district.id);
    const firstTerminalId = district.terminals[0];
    const terminal = EON_CITY_W660I_TERMINALS.find((entry) => entry.id === firstTerminalId);
    const nearest = getNearestEonCityW660iTerminal(terminal.position, district.id);
    assert.equal(nearest.entry.id, firstTerminalId);
    assert.equal(nearest.distance, 0);
    assert.ok(terminal.actions.every((entry) => entry.reviewRequired && !entry.autoExecute && !entry.autoNavigate && !entry.privateDataRead));
  }
});

test('W660I places exactly one visible Nexus station within arrival range of every district', () => {
  assert.deepEqual([...EON_CITY_W660_NEXUS_DISTRICT_IDS], EON_CITY_W660I_DISTRICTS.map((entry) => entry.id));
  assert.equal(EON_CITY_W660_NEXUS_STATIONS.length, 9);
  for (const district of EON_CITY_W660I_DISTRICTS) {
    const matches = EON_CITY_W660_NEXUS_STATIONS.filter((entry) => entry.districtId === district.id);
    assert.equal(matches.length, 1, district.id);
    const station = matches[0];
    const distance = Math.hypot(station.position.x - district.arrival.x, station.position.z - district.arrival.z);
    assert.ok(distance <= Math.max(station.interactionRadius, EON_CITY_W660_NEXUS_INTERACTION_RADIUS), `${district.id}:${distance}`);
    assert.ok(station.actions.length >= 2);
  }
});

test('W660I touch controls normalize up/down and block navigation propagation', () => {
  assert.equal(normalizeEonCityMovementDirection('up'), 'forward');
  assert.equal(normalizeEonCityMovementDirection('down'), 'backward');
  const buttons = ['up', 'down', 'left', 'right'].map((direction) => new FakeButton(direction));
  const calls = [];
  const root = new FakeRoot(buttons);
  const dispose = bindEonCityDirectionalControls(root, { setMove(direction, enabled) { calls.push([direction, enabled]); } }, { environment: fakeEnvironment() });
  for (const button of buttons) assert.equal(button.attributes.get('type'), 'button');
  const capture = root.fireCapture('click', buttons[3]);
  assert.equal(capture.prevented, true);
  const down = buttons[3].fire('pointerdown');
  assert.equal(down.prevented, true);
  assert.equal(down.stopped, true);
  assert.equal(down.immediateStopped, true);
  assert.deepEqual(calls.at(-1), ['right', true]);
  const up = buttons[3].fire('pointerup');
  assert.equal(up.prevented, true);
  assert.equal(up.stopped, true);
  assert.deepEqual(calls.at(-1), ['right', false]);
  buttons[0].fire('click');
  assert.ok(calls.some(([direction, enabled]) => direction === 'forward' && enabled === true));
  assert.ok(calls.some(([direction, enabled]) => direction === 'forward' && enabled === false));
  dispose();
  const truth = getEonCityInputContractTruth();
  assert.equal(truth.explicitButtonType, true);
  assert.equal(truth.preventsDefaultNavigation, true);
  assert.equal(truth.stopsShellPropagation, true);
  assert.equal(truth.pointerCancelRelease, true);
  assert.equal(truth.capturePhaseDefaultGuard, true);
  assert.equal(truth.immediatePropagationGuard, true);
});

test('W660I district composition replaces the previous world without owning canvas or render loop', () => {
  const engine = new NullEngine({ renderWidth: 640, renderHeight: 360, textureSize: 512 });
  const scene = new Scene(engine);
  const camera = new ArcRotateCamera('camera', 0, 1, 10, Vector3.Zero(), scene);
  const playerAnchor = new TransformNode('player', scene);
  const composition = createEonCityW660iDistrictComposition({ scene, camera, playerAnchor, quality: 'balanced' });
  const first = composition.enterDistrict('orientation-hall');
  assert.equal(first.ok, true);
  assert.equal(composition.getSummary().activeLandmarkId, 'orientation-ascension-hall');
  const command = composition.enterDistrict('command-centre');
  assert.equal(command.ok, true);
  const summary = composition.getSummary();
  assert.equal(summary.activeDistrictId, 'command-centre');
  assert.equal(summary.activeLandmarkId, 'command-horizon-citadel');
  assert.equal(summary.activeAssetGroupId, 'command-centre-composition');
  assert.equal(summary.residentDistrictCount, 2, 'outgoing and incoming districts coexist during the seamless overlap');
  assert.equal(summary.ownsCanvas, false);
  assert.equal(summary.ownsRenderLoop, false);
  const transitionRoots = scene.transformNodes.filter((node) => node.name.startsWith('w660i-district-root-'));
  assert.equal(transitionRoots.length, 2, 'outgoing and incoming district roots overlap briefly');
  assert.equal(summary.residentDistrictCount, 2);
  assert.equal(summary.retiringDistrictId, 'orientation-hall');
  assert.ok(summary.transitions.some((entry) => entry.type === 'overlap-start'));
  for (let frame = 0; frame < 9; frame += 1) composition.update(0.1);
  const settledSummary = composition.getSummary();
  assert.equal(settledSummary.residentDistrictCount, 1, 'runtime retains only the active district after the 0.85 second overlap');
  assert.equal(settledSummary.retiringDistrictId, null);
  assert.equal(settledSummary.overlapProgress, 1);
  assert.ok(settledSummary.transitions.some((entry) => entry.type === 'unload'));
  assert.ok(settledSummary.transitions.some((entry) => entry.type === 'overlap-complete'));
  composition.dispose();
  scene.dispose();
  engine.dispose();
});

test('W660I source wiring awaits composition/residency and exposes one visible Nexus open control', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const core = read('assets/js/city/eon-city-play-core.js');
  const commandHub = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const access = read('assets/js/city/eon-city-access-station.js');
  const play = read('assets/js/eon-city-play-station.js');
  const pulse = read('assets/js/nexus/eon-nexus-pulse.js');
  const pulseCss = read('assets/css/eon-nexus-pulse.css');
  const shell = read('assets/js/eon-app-shell.js');
  const shellCss = read('assets/css/eon-app-shell.css');
  const deferred = read('assets/js/chat-page-deferred.js');
  assert.match(product, /await activateDistrictAssets\(destinationId/);
  assert.match(product, /data-eon-w660i-district-identity/);
  assert.match(product, /getNearestEonCityW660iTerminal/);
  assert.match(product, /interactionType:\s*'terminal'/);
  assert.match(product, /eonCityActiveLandmark/);
  assert.match(core, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.match(commandHub, /const startProgressiveAssets = async/);
  assert.match(access, /bindEonCityDirectionalControls/);
  assert.match(access, /eon-play-session eon-city-reduced-session eon-city-full-session/);
  assert.match(access, /eon-play-touch-controls eon-city-reduced-(?:touch|dpad)/);
  assert.match(access, /data-eon-city-exit/);
  assert.match(access, /loadingOverlay\.style\.pointerEvents = 'none'/);
  assert.match(access, /zIndex:\s*'20'/);
  assert.match(shellCss, /data-eon-app-page=eoncity[^}]+eon-app-sidebar\.is-collapsed[^}]+eon-app-collapsed-width/s);
  assert.match(shell, /currentPage === 'eoncity'[\s\S]*eonCityHoverExpand = 'disabled'/);
  assert.match(shell, /currentPage === 'eoncity'[\s\S]*\? \(\) => \{\}/);
  assert.match(play, /bindEonCityDirectionalControls/);
  assert.match(pulse, /eonNexusOpenControl\s*=\s*'1'/);
  assert.match(pulse, /eon-nexus-pulse__toggle-label/);
  assert.match(pulseCss, /z-index:\s*320/);
  const registry = read('assets/js/contracts/work-surface/eon-work-surface-registry.js');
  const cityContract = read('assets/js/city/w731/eon-city-w731-command-hub-contract.js');
  assert.doesNotMatch(deferred, /eon-nexus-chat-pulse|installEonNexusChatPulse|installDeferredEonNexusPulse/);
  assert.match(shell, /installEonQuickCommandSurface/);
  assert.match(registry, /id: 'nexus', label: 'Living Nexus'/);
  assert.match(cityContract, /id: 'eonbot-nexus'[\s\S]*?kind: 'nexus'/);
});
