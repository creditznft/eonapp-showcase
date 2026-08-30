import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW766AInitialState, createEonExpanseW766APersistence, validateEonExpanseW766AState } from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

const packageDigest = 'a'.repeat(64);

test('W788B persists only a sanitized release review while keeping the gateway locked', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5000 });
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  persistence.write({
    ...base,
    futureRegionReleaseReview: {
      reviewId: 'future-region-release-review:storm-sector',
      regionId: 'storm-sector',
      packageDigest,
      reviewedAt: 4000,
      gatewayActivated: true,
      regionRendered: true,
      privatePrompt: 'remove'
    }
  });
  const restored = persistence.read(base);
  assert.equal(restored.futureRegionReleaseReview.regionId, 'storm-sector');
  assert.equal(restored.futureRegionReleaseReview.packageDigest, packageDigest);
  assert.equal(restored.futureRegionReleaseReview.status, 'release-reviewed-gateway-still-locked');
  assert.equal(restored.futureRegionReleaseReview.gatewayActivated, false);
  assert.equal(restored.futureRegionReleaseReview.regionRendered, false);
  assert.equal(restored.futureRegionReleaseReview.privatePrompt, undefined);
});

test('W788B drops malformed digest or unknown region state during reload', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5000 });
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  persistence.write({ ...base, futureRegionReleaseReview: { reviewId: 'future-region-release-review:storm-sector', regionId: 'storm-sector', packageDigest: 'bad', reviewedAt: 4000 } });
  assert.equal(persistence.read(base).futureRegionReleaseReview, null);
});

test('W788B state validation rejects release review activation claims', () => {
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  const validation = validateEonExpanseW766AState({ ...base, futureRegionReleaseReview: { privateContentStored: false, gatewayActivated: true } });
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join(','), /future-region-release-review-boundary-invalid/);
});
