import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  buildEonCityW667WorldCell,
  getEonCityW667WorldGrammarSummary,
  validateEonCityW667WorldCell
} from '../../assets/js/city/w667/eon-city-w667-expanse-world-grammar.js';
import {
  applyEonCityShellIdentityCoherence,
  getEonCityShellIdentityLabel
} from '../../assets/js/city/eon-city-shell-identity-coherence.js';
import {
  resolveEonCityW670BuildingVisual,
  resolveEonCityW670CellVisualLanguage
} from '../../assets/js/city/w670/eon-city-w670-expanse-visual-language.js';
import {
  W670_FINAL_RECONCILIATION_CONTRACT,
  validateW670FinalReconciliationContract
} from '../../config/w670-final-reconciliation-contract.mjs';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W670 final reconciliation contract preserves source truth and owner-proof boundary', () => {
  const validation = validateW670FinalReconciliationContract();
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(W670_FINAL_RECONCILIATION_CONTRACT.truthBoundaries.githubActionsArtifactsAllowed, false);
  assert.equal(W670_FINAL_RECONCILIATION_CONTRACT.truthBoundaries.ownerGameplayRecordingStillRequired, true);
  assert.equal(W670_FINAL_RECONCILIATION_CONTRACT.releaseGates.ownerGameplayRecording, 'pending-after-source-and-live-gates');
});

test('W670 Home and City identity copy remains coherent after sign-in resolves', () => {
  assert.equal(getEonCityShellIdentityLabel('signed-in'), 'Open profile and settings');
  assert.equal(getEonCityShellIdentityLabel('guest'), 'Sign in to EONAPP');
  const attributes = new Map();
  const shortcut = {
    dataset: {},
    setAttribute(name, value) { attributes.set(name, String(value)); }
  };
  const documentRef = {
    body: { dataset: { eonIdentityState: 'signed-in' } },
    querySelector(selector) { return selector === '[data-eon-mobile-profile]' ? shortcut : null; }
  };
  const result = applyEonCityShellIdentityCoherence({ documentRef });
  assert.equal(result.ok, true);
  assert.equal(result.signedIn, true);
  assert.equal(attributes.get('aria-label'), 'Open profile and settings');
  assert.equal(attributes.get('title'), 'Profile and settings');
  assert.equal(shortcut.dataset.identityState, 'signed-in');

  const home = read('index.html');
  const city = read('eoncity.html');
  assert.match(home, /Local-first · Files stay local/);
  assert.doesNotMatch(home, /Guest mode · Files stay local/);
  assert.match(city, /eon-city-shell-identity-coherence\.js/);
});

test('W670 Expanse grammar exceeds the approved diversity minimums', () => {
  const summary = getEonCityW667WorldGrammarSummary();
  const minimums = W670_FINAL_RECONCILIATION_CONTRACT.worldDiversityMinimums;
  assert.ok(summary.regionArchetypeCount >= minimums.regionArchetypes, JSON.stringify(summary));
  assert.ok(summary.streetProfileCount >= minimums.streetProfiles, JSON.stringify(summary));
  assert.ok(summary.terrainProfileCount >= minimums.terrainProfiles, JSON.stringify(summary));
  assert.ok(summary.publicSpaceProfileCount >= minimums.publicSpaceProfiles, JSON.stringify(summary));
  assert.ok(summary.skylineProfileCount >= minimums.skylineProfiles, JSON.stringify(summary));
  assert.ok(summary.buildingFormCount >= minimums.buildingForms, JSON.stringify(summary));
  assert.ok(summary.landmarkTypeCount >= minimums.landmarkTypes, JSON.stringify(summary));
  assert.ok(summary.gameplayPurposeCount >= minimums.gameplayPurposes, JSON.stringify(summary));
  assert.ok(summary.approximateCombinationSpace > 1_000_000_000, String(summary.approximateCombinationSpace));
});

test('W670 sampled world is coherent, deterministic and visibly varied', () => {
  const minimums = W670_FINAL_RECONCILIATION_CONTRACT.worldDiversityMinimums;
  const signatures = new Set();
  const archetypes = new Set();
  const streets = new Set();
  const terrains = new Set();
  const publicSpaces = new Set();
  const skylines = new Set();
  const climates = new Set();
  const shapes = new Set();
  for (let x = -30; x < 30; x += 1) {
    for (let z = -30; z < 30; z += 1) {
      const cell = buildEonCityW667WorldCell({ x, z, seed: 'w670-owner-world' });
      assert.equal(validateEonCityW667WorldCell(cell).ok, true, `${x},${z}`);
      signatures.add(cell.variationSignature);
      archetypes.add(cell.region.archetype.id);
      streets.add(cell.streetProfile.id);
      terrains.add(cell.terrainProfile.id);
      publicSpaces.add(cell.publicSpaceProfile.id);
      skylines.add(cell.skylineProfile.id);
      climates.add(cell.microClimate.id);
      for (const lot of cell.lotPlan) shapes.add(resolveEonCityW670BuildingVisual(lot.form).shape);
      const visual = resolveEonCityW670CellVisualLanguage(cell);
      assert.equal(visual.privateDataRead, false);
      assert.equal(visual.networkRequestCreated, false);
      assert.ok(visual.terrain.id && visual.publicSpace.id && visual.street.topology && visual.skylineId);
    }
  }
  assert.ok(signatures.size >= minimums.uniqueVariationSignatures, `signatures:${signatures.size}`);
  assert.ok(archetypes.size >= minimums.sampledArchetypes, `archetypes:${archetypes.size}`);
  assert.ok(streets.size >= minimums.sampledStreetProfiles, `streets:${streets.size}`);
  assert.ok(terrains.size >= minimums.sampledTerrainProfiles, `terrains:${terrains.size}`);
  assert.ok(publicSpaces.size >= minimums.sampledPublicSpaces, `spaces:${publicSpaces.size}`);
  assert.ok(skylines.size >= minimums.sampledSkylineProfiles, `skylines:${skylines.size}`);
  assert.ok(climates.size >= 8, `climates:${climates.size}`);
  assert.ok(shapes.size >= 6, `building-shapes:${[...shapes].join(',')}`);

  const first = buildEonCityW667WorldCell({ x: 811, z: -2048, seed: 'w670-owner-world' });
  const again = buildEonCityW667WorldCell({ x: 811, z: -2048, seed: 'w670-owner-world' });
  const other = buildEonCityW667WorldCell({ x: 811, z: -2048, seed: 'w670-other-world' });
  assert.deepEqual(first, again);
  assert.notEqual(first.variationSignature, other.variationSignature);
});

test('W670 active Babylon renderer consumes terrain, street, public-space and building visual language', () => {
  const runtime = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
  assert.match(runtime, /eon-city-w670-expanse-visual-language\.js/);
  assert.match(runtime, /resolveEonCityW670CellVisualLanguage/);
  assert.match(runtime, /resolveEonCityW670BuildingVisual/);
  assert.match(runtime, /w670-expanse-terrain-feature/);
  assert.match(runtime, /w670-expanse-secondary-street/);
  assert.match(runtime, /w670-expanse-public-space/);
  assert.match(runtime, /buildingVisual\.shape/);
});

test('W670 maintained suite manifest and runner stay aligned', () => {
  const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
  const runner = read('scripts/run-current-unit-suite.mjs');
  assert.match(manifest.currentWave, /^W\d+$/);
  assert.ok(Number(manifest.currentWave.slice(1)) >= 670);
  assert.equal(manifest.testFileCount, manifest.testFiles.length);
  assert.ok(manifest.testFiles.includes('tests/unit/w670-final-reconciliation.test.mjs'));
  assert.match(runner, /tests\/unit\/w670-final-reconciliation\.test\.mjs/);
});
