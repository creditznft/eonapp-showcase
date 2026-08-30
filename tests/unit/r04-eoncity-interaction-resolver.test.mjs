import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEonCityR04LabelBudget, resolveEonCityR04MeshInteraction } from '../../assets/js/city/r04/eon-city-r04-interaction-resolver.js';

test('R04 resolves an authored child mesh to its semantic station owner', () => {
  const owner = { name: 'station-root', metadata: { stationId: 'project-atlas', interactionRole: 'structure' }, parent: null };
  const child = { name: 'decorative-panel', metadata: { decorativeOnly: true, interactive: false }, parent: owner };
  const result = resolveEonCityR04MeshInteraction(child);
  assert.equal(result.ok, true);
  assert.equal(result.stationId, 'project-atlas');
  assert.equal(result.ownerMesh, owner);
  assert.equal(result.ownerDepth, 1);
  assert.equal(result.decorativeChildResolvedToOwner, true);
});

test('R04 returns no action for genuinely decorative meshes without a semantic owner', () => {
  const result = resolveEonCityR04MeshInteraction({ metadata: { decorativeOnly: true }, parent: null });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'decorative-no-semantic-owner');
});

test('R04 clamps viewport-driven label budget to one through three', () => {
  assert.equal(resolveEonCityR04LabelBudget({ dataset: { eonCityLabelBudget: '1' } }), 1);
  assert.equal(resolveEonCityR04LabelBudget({ dataset: { eonCityLabelBudget: '2' } }), 2);
  assert.equal(resolveEonCityR04LabelBudget({ dataset: { eonCityLabelBudget: '9' } }), 3);
});
