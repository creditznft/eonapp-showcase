import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW766AInitialState, createEonExpanseW766APersistence, validateEonExpanseW766AState } from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

test('W783B persists only a maintained reviewed future-region programme', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5000 });
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  const write = persistence.write({
    ...base,
    futureRegionProgrammeReview: {
      reviewId: 'future-region-review:archive-noir',
      regionId: 'archive-noir',
      reviewedAt: 4000,
      gatewayActivated: true,
      regionRendered: true,
      privatePrompt: 'must disappear'
    }
  });
  assert.equal(write.ok, true);
  const restored = persistence.read(base);
  assert.equal(restored.futureRegionProgrammeReview.regionId, 'archive-noir');
  assert.equal(restored.futureRegionProgrammeReview.status, 'programme-reviewed-not-unlocked');
  assert.equal(restored.futureRegionProgrammeReview.gatewayActivated, false);
  assert.equal(restored.futureRegionProgrammeReview.regionRendered, false);
  assert.equal(restored.futureRegionProgrammeReview.privatePrompt, undefined);
});

test('W783B drops malformed or unknown programme review state during reload', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5000 });
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  persistence.write({ ...base, futureRegionProgrammeReview: { reviewId: 'future-region-review:unknown', regionId: 'unknown', reviewedAt: 4000 } });
  assert.equal(persistence.read(base).futureRegionProgrammeReview, null);
});

test('W783B state validation rejects any programme state claiming activation or release', () => {
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  const validation = validateEonExpanseW766AState({ ...base, futureRegionProgrammeReview: { privateContentStored: false, gatewayActivated: true } });
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join(','), /future-region-programme-boundary-invalid/);
});
