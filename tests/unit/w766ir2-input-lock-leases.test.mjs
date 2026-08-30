import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_W766IR2_INPUT_LOCK_OWNERS,
  createEonCityW766IR2InputLockLeaseManager,
  getEonCityW766IR2OrphanedInputLockOwners
} from '../../assets/js/city/w766/eon-city-w766ir2-input-lock-leases.js';

test('W766IR2-B input leases support exactly the six blocking owners', () => {
  assert.deepEqual(EON_CITY_W766IR2_INPUT_LOCK_OWNERS, [
    'city-menu', 'accessible-map', 'transit-review', 'work-surface', 'expanse-entry-review', 'city-readiness'
  ]);
});

test('W766IR2-B rejects duplicate acquire and unknown release while preserving active leases', () => {
  let clock = 100;
  const manager = createEonCityW766IR2InputLockLeaseManager({ now: () => ++clock });
  assert.equal(manager.acquire('city-menu', { source: 'launcher' }).ok, true);
  assert.equal(manager.acquire('city-menu').reason, 'duplicate-input-lock-acquire');
  assert.equal(manager.release('accessible-map').reason, 'unknown-input-lock-release');
  assert.equal(manager.isMovementBlocked(), true);
  assert.deepEqual(manager.getSnapshot().activeOwnerIds, ['city-menu']);
  assert.equal(manager.release('city-menu', 'close-button').ok, true);
  assert.equal(manager.isMovementBlocked(), false);
});

test('W766IR2-B releases every owner deterministically on disposal', () => {
  const manager = createEonCityW766IR2InputLockLeaseManager();
  manager.acquire('work-surface');
  manager.acquire('city-readiness');
  const result = manager.dispose();
  assert.equal(result.released, 2);
  assert.equal(manager.getSnapshot().activeOwnerIds.length, 0);
  assert.equal(manager.acquire('city-menu').reason, 'input-lock-manager-disposed');
});

test('W766IR2-G identifies only mature leases whose owning surface disappeared', () => {
  let clock = 1000;
  const manager = createEonCityW766IR2InputLockLeaseManager({ now: () => clock });
  manager.acquire('city-menu', { source: 'launcher' });
  manager.acquire('expanse-entry-review', { source: 'accessible-map' });

  clock = 1750;
  assert.deepEqual(getEonCityW766IR2OrphanedInputLockOwners({
    snapshot: manager.getSnapshot(),
    surfaceState: { cityMenu: false, expanseReview: false },
    at: clock,
    graceMs: 1200
  }), []);

  clock = 2300;
  assert.deepEqual(getEonCityW766IR2OrphanedInputLockOwners({
    snapshot: manager.getSnapshot(),
    surfaceState: { cityMenu: true, expanseReview: false },
    at: clock,
    graceMs: 1200
  }).map((entry) => entry.ownerId), ['expanse-entry-review']);
});
