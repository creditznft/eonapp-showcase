import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonCityLivingNexusController } from '../../assets/js/city/eon-city-living-nexus-hybrid.js';

const blockedStorage = Object.freeze({
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
  removeItem() { throw new Error('blocked'); }
});

test('W719.13 Living Nexus keeps explicit mode and destination changes for the current session when storage is blocked', () => {
  const controller = createEonCityLivingNexusController({ storage: blockedStorage, getPosition: () => ({ x: 0, z: 0 }) });
  const mode = controller.setMode('focus', { explicitUserAction: true });
  assert.equal(mode.ok, true);
  assert.equal(mode.persisted, false);
  assert.equal(mode.reason, 'session-only-storage-unavailable');
  assert.equal(controller.getSnapshot().mode, 'focus');

  const destination = controller.selectDestination('expanse', { explicitUserAction: true });
  assert.equal(destination.ok, true);
  assert.equal(destination.persisted, false);
  assert.equal(controller.getSnapshot().destination, 'expanse');
  assert.equal(controller.getSnapshot().mode, 'focus');
});
