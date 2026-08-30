import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768JMyFrontierPresentation, validateEonExpanseW768JMyFrontierPresentation } from '../../assets/js/city/w768/eon-expanse-w768j-my-frontier-presentation.js';

test('W768J renders plans only as holograms and verified records only as foundations and scaffolding', () => {
  const view = deriveEonExpanseW768JMyFrontierPresentation({
    myFrontierState: { unlocked: true, buildingChoices: { 'plot-central-command': 'command-core', 'plot-creator': 'creator-workshop' } },
    constructionProjection: { plots: [
      { plotId: 'plot-central-command', status: 'constructed', plannedBuildingId: 'command-core', constructedBuildingId: 'command-core' },
      { plotId: 'plot-creator', status: 'planned', plannedBuildingId: 'creator-workshop', constructedBuildingId: '' }
    ] }
  });
  assert.equal(validateEonExpanseW768JMyFrontierPresentation(view).ok, true);
  assert.equal(view.constructedFoundationCount, 1);
  assert.equal(view.plannedCount, 1);
  assert.equal(view.plots.find((entry) => entry.plotId === 'plot-central-command').finishedHeroVisible, false);
  assert.equal(view.plots.find((entry) => entry.plotId === 'plot-creator').status, 'planned-hologram');
});

test('W768J does not infer construction from a plan alone', () => {
  const view = deriveEonExpanseW768JMyFrontierPresentation({ myFrontierState: { unlocked: true, buildingChoices: { 'plot-knowledge': 'archive-vault' } }, constructionProjection: { plots: [] } });
  const row = view.plots.find((entry) => entry.plotId === 'plot-knowledge');
  assert.equal(row.hologramVisible, true);
  assert.equal(row.foundationVisible, false);
  assert.equal(row.scaffoldingVisible, false);
});

test('W768J renderer contains truthful separate visual states and no finished primitive hero', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
  assert.match(source, /planned-hologram/);
  assert.match(source, /verified-foundation/);
  assert.match(source, /scaffold-post/);
  assert.match(source, /deriveEonExpanseW768JMyFrontierPresentation/);
  assert.doesNotMatch(source, /finishedHeroPrimitives\s*:\s*[1-9]|automaticConstruction\s*:\s*true/);
});

test('W768J stores no private content and accepts no coordinates', () => {
  const view = deriveEonExpanseW768JMyFrontierPresentation();
  assert.equal(view.privateContentStored, false);
  assert.equal(view.rawCoordinatePlacementAllowed, false);
  assert.equal(view.automaticConstruction, false);
});

test('W768J runtime synchronizes plan and construction projections on every authoritative change', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /function getCurrentMyFrontierVisualPayload\(\)/);
  assert.match(runtime, /constructionProjection: expanseMyFrontierConstruction\.getSafeProjection/);
  assert.match(runtime, /function syncExpanseMyFrontierVisuals\(\)/);
  assert.ok((runtime.match(/syncExpanseMyFrontierVisuals\(\)/g) || []).length >= 3);
  assert.match(runtime, /const activation = myFrontierRenderer\.activate\?\.\(getCurrentMyFrontierVisualPayload\(\)\)/);
});
