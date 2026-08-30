import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  EON_CITY_CELL_SIZE,
  getEonCityResidentCells,
  getEonCityResidentCellIds
} from '../../assets/js/city/eon-city-cell-streamer.js';
import {
  EON_CITY_LIVING_NEXUS_ENTRY_POSES,
  getEonCityLivingNexusSnapshot
} from '../../assets/js/city/eon-city-living-nexus-hybrid.js';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('W667 cell streamer keeps deterministic 5x5 residency around the player', () => {
  const first = getEonCityResidentCells({ x: 0, z: 0 }, { radius: 2 });
  const second = getEonCityResidentCells({ x: 0, z: 0 }, { radius: 2 });
  assert.equal(first.length, 25);
  assert.deepEqual(first, second);
  assert.equal(first.filter((entry) => entry.interactive).length, 9);
  assert.equal(first.filter((entry) => entry.residencyTier === 'horizon').length, 16);
  assert.equal(first.every((entry) => entry.privateDataRead === false && entry.networkRequestCreated === false), true);
});

test('W667 residency shifts incrementally instead of rebuilding the whole horizon', () => {
  const first = new Set(getEonCityResidentCellIds({ position: { x: 0, z: 0 }, radius: 2 }));
  const shifted = new Set(getEonCityResidentCellIds({ position: { x: EON_CITY_CELL_SIZE + 0.2, z: 0 }, radius: 2 }));
  const reused = [...first].filter((id) => shifted.has(id));
  const entered = [...shifted].filter((id) => !first.has(id));
  const exited = [...first].filter((id) => !shifted.has(id));
  assert.equal(reused.length, 20);
  assert.equal(entered.length, 5);
  assert.equal(exited.length, 5);
});

test('W667 Living Nexus Expanse exposes bounded streaming and practical infinite travel truth', () => {
  const snapshot = getEonCityLivingNexusSnapshot({ position: EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse, seed: 'w667-proof' });
  assert.equal(snapshot.expanse.residentCellCount, 25);
  assert.equal(snapshot.expanse.interactiveCellCount, 9);
  assert.equal(snapshot.expanse.horizonCellCount, 16);
  assert.equal(snapshot.secondCanvasCreated, false);
  assert.equal(snapshot.secondRenderLoopCreated, false);
  assert.equal(snapshot.privateDataRead, false);
  assert.equal(snapshot.networkRequestCreated, false);
});

test('W667 Babylon source uses incremental Map residency, lightweight horizon cells and exact encounter picks', () => {
  const runtime = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  assert.match(runtime, /const renderedCells = new Map\(\)/);
  assert.match(runtime, /lastStreamEnteredCellIds/);
  assert.match(runtime, /residencyTier: interactive \? 'interactive' : 'horizon'/);
  assert.match(runtime, /living-nexus-expanse-horizon-silhouette/);
  assert.match(runtime, /interactive: true, assetId: encounter\.id, interactionKind: 'expanse-encounter'/);
  assert.match(runtime, /visibleHardBorder: false/);
  assert.match(runtime, /incrementalCellRecycling: true/);
  assert.doesNotMatch(runtime, /for \(const node of renderedCells\) disposeNode/);
  assert.match(product, /interactionKind === 'expanse-encounter'/);
  assert.match(product, /eon:city:living-nexus:open-encounter/);
});
