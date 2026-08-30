import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEonExpanseW768LAuthoredAssetCatalog,
  getEonExpanseW768LAuthoredAssetEntry,
  validateEonExpanseW768LAuthoredAssetCatalog
} from '../../assets/js/city/w768/eon-expanse-w768l-my-frontier-authored-asset-catalog.js';

const catalog = createEonExpanseW768LAuthoredAssetCatalog();

test('W768L covers every approved My Frontier building with one truthful asset state', () => {
  assert.equal(catalog.buildingCount, 19);
  assert.equal(catalog.readyAnchorCount + catalog.dedicatedBuildingPendingCount, 19);
  assert.equal(validateEonExpanseW768LAuthoredAssetCatalog(catalog).ok, true);
});

test('W768L ready anchors use same-origin content-hashed primary and fallback GLBs', () => {
  for (const entry of catalog.entries.filter((row) => row.status === 'authored-anchor-ready')) {
    assert.match(entry.variants.primary.path, /^\/assets\/city\//);
    assert.match(entry.variants.primary.path, /\.[a-f0-9]{12}\.glb$/i);
    assert.match(entry.variants.fallback.path, /\.[a-f0-9]{12}\.glb$/i);
    assert.equal(entry.remoteAssetAllowed, false);
  }
});

test('W768L does not disguise missing dedicated building art as a finished primitive', () => {
  const pending = getEonExpanseW768LAuthoredAssetEntry('reflection-garden');
  assert.equal(pending.status, 'dedicated-authored-building-pending');
  assert.match(pending.reason, /dedicated authored landscape kit/i);
  assert.equal(catalog.authoredAnchorsAreFinishedBuildings, false);
  assert.equal(catalog.foundationHiddenBeforeValidation, false);
  assert.equal(catalog.scaffoldingHiddenBeforeValidation, false);
});

test('W768L stores no private content and cannot construct or suppress fallbacks automatically', () => {
  for (const entry of catalog.entries) {
    assert.equal(entry.privateContentStored, false);
    assert.equal(entry.automaticConstruction, false);
    assert.equal(entry.automaticFallbackSuppression, false);
    assert.equal(entry.finishedBuilding, false);
  }
});
