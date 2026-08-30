import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { getEonCityObjectIdentity } from '../../assets/js/city/eon-city-runtime-identity.js';
import { createEonCityW766IR2InputLockLeaseManager } from '../../assets/js/city/w766/eon-city-w766ir2-input-lock-leases.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W766IR2-B survives twenty City Menu and accessible-map cycles without changing runtime identities', () => {
  const manager = createEonCityW766IR2InputLockLeaseManager();
  const engine = {};
  const scene = {};
  const canvas = {};
  const player = {};
  const camera = {};
  const before = [engine, scene, canvas, player, camera].map((value, index) => getEonCityObjectIdentity(value, `cycle-${index}`));

  for (let cycle = 0; cycle < 20; cycle += 1) {
    assert.equal(manager.acquire('city-menu', { source: `cycle-${cycle}` }).ok, true);
    assert.equal(manager.isMovementBlocked(), true);
    assert.equal(manager.releaseAllForOwner('city-menu', 'cycle-close').ok, true);
    assert.equal(manager.acquire('accessible-map', { source: `cycle-${cycle}` }).ok, true);
    assert.equal(manager.isMovementBlocked(), true);
    assert.equal(manager.releaseAllForOwner('accessible-map', 'cycle-close').ok, true);
    assert.equal(manager.isMovementBlocked(), false);
  }

  const after = [engine, scene, canvas, player, camera].map((value, index) => getEonCityObjectIdentity(value, `cycle-${index}`));
  assert.deepEqual(after, before);
  assert.deepEqual(manager.getSnapshot().activeOwnerIds, []);
});

test('W766IR2-B runtime routes every blocking surface through the named lease authority', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /createEonCityW766IR2InputLockLeaseManager/);
  assert.match(runtime, /onAcquireInputLease: acquireInputLease/);
  assert.match(runtime, /onReleaseInputLease: releaseInputLease/);
  assert.match(runtime, /acquireInputLease\('work-surface'/);
  assert.match(runtime, /acquireInputLease\('accessible-map'/);
  assert.match(runtime, /acquireInputLease\('city-readiness'/);
  assert.match(runtime, /inputLockManager\.getSnapshot\(\)/);
  assert.match(runtime, /inputLockManager\.isMovementBlocked\(\)/);
  assert.doesNotMatch(runtime, /onMenuOpen:\s*\(\)\s*=>\s*clearInput/);
});

test('W766IR2-B accessible map fully styles controls and exposes all maintained outside actions', () => {
  const source = read('assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js');
  assert.match(source, /appearance:none!important/);
  assert.match(source, /\.eon-city-w756-semantic-map button:focus-visible/);
  assert.match(source, /\.eon-city-w756-semantic-map button:disabled/);
  assert.match(source, /button\[aria-busy=true\]/);
  assert.match(source, /@media\(forced-colors:active\)/);
  assert.match(source, /data-eon-city-semantic-review-transit/);
  assert.match(source, /data-eon-city-semantic-open-readiness/);
  assert.match(source, /data-eon-city-semantic-review-expanse/);
  assert.match(source, /Outside destinations/);
  assert.match(source, /Movement remains available/);
  assert.match(source, /hide\(\{ reason: 'surface-handoff', restoreFocus: false, successorOwnerId: successor \}\)/);
  assert.match(source, /handoff: true/);
  assert.match(source, /onOpen\(\{ ownerId: 'accessible-map'/);
  assert.match(source, /onClose\(\{ ownerId: 'accessible-map'/);
});

test('W766IR2-B readiness view acquires and releases its movement lease explicitly', () => {
  const identity = read('assets/js/city/eon-city-runtime-identity.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(identity, /setLifecycleHandlers/);
  assert.match(identity, /lifecycleHandlers\.onShow/);
  assert.match(identity, /lifecycleHandlers\.onHide/);
  assert.match(runtime, /runtimeReadinessAuthority\?\.setLifecycleHandlers/);
  assert.match(runtime, /runtimeReadinessAuthority\?\.hide\?\.\('runtime-destroyed'\)/);
  assert.match(runtime, /inputLockManager\.dispose\('runtime-destroyed'\)/);
});
