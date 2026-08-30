import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW766AInitialState, createEonExpanseW766APersistence, validateEonExpanseW766AState } from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

const activation = () => ({
  activationId: 'future-region-activation:preview:storm-sector',
  regionId: 'storm-sector',
  packageDigest: 'a'.repeat(64),
  buildDigest: 'b'.repeat(64),
  deploymentChannel: 'preview',
  activatedAt: 1234,
  gatewayActivated: true,
  regionRendered: false,
  explicitOwnerAction: true,
  automaticActivation: false,
  privateContentStored: false,
  privatePath: '/remove/me'
});

test('W793B persists only normalized gateway activation state', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5000 });
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  const written = persistence.write({ ...base, futureRegionActivation: activation() });
  assert.equal(written.ok, true);
  const restored = persistence.read(base).futureRegionActivation;
  assert.equal(restored.regionId, 'storm-sector');
  assert.equal(restored.gatewayActivated, true);
  assert.equal(restored.regionRendered, false);
  assert.equal(restored.privatePath, undefined);
});

test('W793B drops forged rendered or automatic activation state', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5000 });
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  persistence.write({ ...base, futureRegionActivation: { ...activation(), regionRendered: true } });
  assert.equal(persistence.read(base).futureRegionActivation, null);
  persistence.write({ ...base, futureRegionActivation: { ...activation(), automaticActivation: true } });
  assert.equal(persistence.read(base).futureRegionActivation, null);
});

test('W793B foundation validation accepts gateway-only state and rejects unsafe claims', () => {
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  assert.equal(validateEonExpanseW766AState({ ...base, futureRegionActivation: activation() }).ok, true);
  const invalid = validateEonExpanseW766AState({ ...base, futureRegionActivation: { ...activation(), regionRendered: true } });
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.join(','), /future-region-activation-boundary-invalid/);
});
