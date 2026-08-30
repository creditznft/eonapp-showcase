import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW770EBuildingPresentationView } from '../../assets/js/city/w770/eon-expanse-w770e-my-frontier-building-presentation-view.js';

const planningView = { visible: true, rows: [
  { plotId: 'plot-creator', label: 'Creator District Plot', constructedBuildingId: 'creator-workshop', plannedBuildingId: '', status: 'constructed' },
  { plotId: 'plot-knowledge', label: 'Knowledge District Plot', constructedBuildingId: '', plannedBuildingId: 'project-atlas', status: 'planned' }
] };

test('W770E reports visibly presented compositions without claiming bespoke art completion', () => {
  const view = deriveEonExpanseW770EBuildingPresentationView({ planningView, rendererSummary: { buildingCompositions: { plots: [{ plotId: 'plot-creator', compositionReady: true, requestedPartCount: 2, presentedPartCount: 2, suppressScaffolding: true }] } } });
  assert.equal(view.rows[0].status, 'authored-composition-presented');
  assert.equal(view.rows[0].scaffoldingSuppressed, true);
  assert.equal(view.rows[0].foundationPreserved, true);
  assert.equal(view.rows[0].bespokeArtStatus, 'bespoke-building-skin-pending');
  assert.equal(view.finishedBespokeBuildingCount, 0);
});

test('W770E keeps truthful fallback visible for loading and rejected required components', () => {
  const loading = deriveEonExpanseW770EBuildingPresentationView({ planningView, rendererSummary: { buildingCompositions: { plots: [{ plotId: 'plot-creator', status: 'loading-authored-composition', requiredPartCount: 2, presentedRequiredCount: 1 }] } } });
  assert.equal(loading.rows[0].status, 'authored-composition-loading');
  assert.equal(loading.rows[0].scaffoldingSuppressed, false);
  const rejected = deriveEonExpanseW770EBuildingPresentationView({ planningView, rendererSummary: { buildingCompositions: { plots: [{ plotId: 'plot-creator', status: 'rejected-authored-composition', rejectedRequiredCount: 1 }] } } });
  assert.equal(rejected.rows[0].status, 'authored-composition-rejected');
  assert.match(rejected.rows[0].detail, /scaffolding remain visible/i);
});

test('W770E does not request assets for planned holograms or expose private data', () => {
  const view = deriveEonExpanseW770EBuildingPresentationView({ planningView });
  assert.equal(view.rows[1].status, 'planned-hologram');
  assert.equal(view.privateContentStored, false);
  assert.equal(view.assetPathsExposed, false);
  assert.equal(view.automaticRetry, false);
});

test('W770E owns no loader, network, persistence, retry or progression authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w770/eon-expanse-w770e-my-frontier-building-presentation-view.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /SceneLoader|LoadAssetContainer|fetch\s*\(|localStorage|sessionStorage|setTimeout|setInterval|awardXp|confirmConstruction|retry/);
});
