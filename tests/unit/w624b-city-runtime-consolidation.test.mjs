import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EON_CITY_RUNTIME_ASSET_MANIFEST, validateEonCityRuntimeAssetManifest } from '../../assets/js/city/eon-city-runtime-asset-manifest.js';
import { createEonCityRuntimeStateMachine, EON_CITY_RUNTIME_STATES, getEonCityRuntimeStateContract } from '../../assets/js/city/eon-city-runtime-state-machine.js';
import { validateW624bCityRuntimeContract } from '../../config/w624b-city-runtime-consolidation-contract.mjs';

test('W624B runtime state machine follows deterministic named stages', () => {
  let now = 100;
  const machine = createEonCityRuntimeStateMachine({ now: () => ++now });
  assert.equal(machine.getSnapshot().state, 'idle');
  assert.equal(machine.getSnapshot().progress, 0);
  machine.transition('checking-access', 'test');
  machine.transition('loading-shell', 'allowed');
  machine.transition('loading-core', 'core');
  machine.transition('core-ready', 'first-frame');
  machine.transition('streaming-detail', 'detail');
  machine.transition('ready', 'settled');
  assert.equal(machine.getSnapshot().state, 'ready');
  assert.equal(machine.getSnapshot().progress, 100);
  assert.equal(machine.getSnapshot().timerBasedProgress, false);
  assert.equal(machine.getSnapshot().evidence.length, 7);
});

test('W624B rejects impossible runtime transitions and supports honest recovery', () => {
  const machine = createEonCityRuntimeStateMachine();
  assert.throws(() => machine.transition('ready', 'skip'), /Invalid EON City runtime transition/);
  machine.transition('checking-access', 'check');
  machine.transition('loading-shell', 'allowed');
  machine.transition('loading-core', 'core');
  machine.degrade('low-memory');
  assert.equal(machine.getSnapshot().state, 'degraded');
  machine.transition('loading-core', 'retry');
  machine.fail('required-asset');
  assert.equal(machine.getSnapshot().state, 'recoverable-error');
  machine.dispose('exit');
  assert.equal(machine.getSnapshot().state, 'disposed');
});

test('W624B state copy covers every visible state with actions', () => {
  const contract = getEonCityRuntimeStateContract();
  assert.deepEqual(contract.states, EON_CITY_RUNTIME_STATES);
  assert.equal(contract.recoveryCases.length, 12);
  for (const state of contract.states) {
    assert.ok(contract.copy[state].title);
    assert.ok(contract.copy[state].detail);
    assert.ok(Array.isArray(contract.copy[state].actions));
  }
});

test('W624B manifest is same-origin, tiered and integrity controlled', () => {
  assert.equal(validateEonCityRuntimeAssetManifest().ok, true);
  assert.equal(EON_CITY_RUNTIME_ASSET_MANIFEST.coreRequired.length, 5);
  assert.equal(EON_CITY_RUNTIME_ASSET_MANIFEST.optionalStreamed.length, 5);
  assert.ok(EON_CITY_RUNTIME_ASSET_MANIFEST.fallbacks.length >= 4);
  for (const asset of [...EON_CITY_RUNTIME_ASSET_MANIFEST.coreRequired, ...EON_CITY_RUNTIME_ASSET_MANIFEST.optionalStreamed]) {
    assert.match(asset.path, /^\/assets\/city\//);
    assert.equal(asset.remoteRequired, false);
    assert.equal(fs.existsSync(new URL(`../../${asset.path.replace(/^\//, '')}`, import.meta.url)), true);
  }
  assert.ok(EON_CITY_RUNTIME_ASSET_MANIFEST.coreRequired.every((asset) => asset.integrity?.startsWith('sha256-')));
});

test('W624B contract freezes one owner and preserves real-proof boundaries', () => {
  assert.equal(validateW624bCityRuntimeContract().ok, true);
  assert.equal(EON_CITY_RUNTIME_STATES.length, 11);
  assert.equal(EON_CITY_RUNTIME_ASSET_MANIFEST.truth.remoteArtDependency, false);
  assert.equal(EON_CITY_RUNTIME_ASSET_MANIFEST.truth.targetFramesAreRuntimeAssets, false);
});
