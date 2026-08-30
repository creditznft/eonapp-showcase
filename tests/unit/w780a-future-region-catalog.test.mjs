import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_EXPANSE_W780A_FUTURE_REGIONS,
  getEonExpanseW780AFutureRegion,
  validateEonExpanseW780AFutureRegionCatalog
} from '../../assets/js/city/w780/eon-expanse-w780a-future-region-catalog.js';

test('W780A defines the eight approved future-region families from the master programme', () => {
  const validation = validateEonExpanseW780AFutureRegionCatalog();
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.deepEqual(EON_EXPANSE_W780A_FUTURE_REGIONS.map((entry) => entry.id), [
    'storm-sector', 'glass-desert', 'forge-wilds', 'silent-city',
    'oceanic-light', 'time-meridian', 'archive-noir', 'eonbot-temple'
  ]);
});

test('W780A gives every future region authored art, environmental, audio and mission requirements', () => {
  for (const entry of EON_EXPANSE_W780A_FUTURE_REGIONS) {
    assert.ok(entry.architecture.length >= 3);
    assert.ok(entry.heroRequirements.length >= 3);
    assert.ok(entry.environment.length >= 3);
    assert.ok(entry.audio.length >= 3);
    assert.ok(entry.missionFamilies.length >= 3);
  }
});

test('W780A keeps every future region locked and forbids primitive hero presentation', () => {
  for (const entry of EON_EXPANSE_W780A_FUTURE_REGIONS) {
    assert.equal(entry.automaticUnlock, false);
    assert.equal(entry.publicReleaseReady, false);
    assert.equal(entry.requiresAuthoredHeroAssets, true);
    assert.equal(entry.rawPrimitiveHeroAllowed, false);
    assert.equal(entry.renderDevelopmentProxiesAsFinishedArt, false);
  }
});

test('W780A resolves only maintained region IDs', () => {
  assert.equal(getEonExpanseW780AFutureRegion('archive-noir')?.label, 'Archive Noir');
  assert.equal(getEonExpanseW780AFutureRegion('unknown-region'), null);
});
