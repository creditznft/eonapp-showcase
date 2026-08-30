import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768KPlotInspection, validateEonExpanseW768KPlotInspection } from '../../assets/js/city/w768/eon-expanse-w768k-my-frontier-plot-inspection.js';

const state = Object.freeze({ unlocked: true, buildingChoices: Object.freeze({ 'plot-creator': 'creator-workshop', 'plot-central-command': 'command-core' }) });

test('W768K reports empty, planned and verified-foundation plot states truthfully', () => {
  const planned = deriveEonExpanseW768KPlotInspection({ plotId: 'plot-creator', myFrontierState: state, constructionProjection: { plots: [] } });
  const constructed = deriveEonExpanseW768KPlotInspection({ plotId: 'plot-central-command', myFrontierState: state, constructionProjection: { plots: [{ plotId: 'plot-central-command', constructedBuildingId: 'command-core', status: 'constructed' }] } });
  const empty = deriveEonExpanseW768KPlotInspection({ plotId: 'plot-knowledge', myFrontierState: state, constructionProjection: { plots: [] } });
  assert.equal(planned.status, 'planned-hologram');
  assert.match(planned.detail, /non-physical holographic plan/);
  assert.equal(constructed.status, 'constructed-foundation');
  assert.match(constructed.detail, /verified construction record/);
  assert.equal(empty.status, 'empty');
});

test('W768K requires an explicit action and rejects a stale plot token', () => {
  const view = deriveEonExpanseW768KPlotInspection({ plotId: 'plot-creator', myFrontierState: state, constructionProjection: { plots: [] } });
  assert.equal(validateEonExpanseW768KPlotInspection(view).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW768KPlotInspection(view, { explicitUserAction: true, expectedPlotId: 'plot-creator', expectedToken: view.expectedToken }).ok, true);
  assert.equal(validateEonExpanseW768KPlotInspection(view, { explicitUserAction: true, expectedToken: 'changed' }).reason, 'my-frontier-plot-state-changed');
});

test('W768K is wired to existing proximity and pointer interaction authority', () => {
  const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
  const gateway = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(renderer, /expanse-my-frontier-plot/);
  assert.match(renderer, /inspect-my-frontier-plot/);
  assert.match(gateway, /metadata\.plotId/);
  assert.match(gateway, /my-frontier-inspection-handler-unavailable/);
  assert.match(runtime, /deriveEonExpanseW768KPlotInspection/);
  assert.match(runtime, /w768k-my-frontier-plot-inspection/);
});

test('W768K inspection cannot award XP, open work automatically or expose private content', () => {
  const view = deriveEonExpanseW768KPlotInspection({ plotId: 'plot-creator', myFrontierState: state, constructionProjection: { plots: [] } });
  assert.equal(view.grantsXp, false);
  assert.equal(view.mutatesProgression, false);
  assert.equal(view.opensWorkspaceAutomatically, false);
  assert.equal(view.privateContentStored, false);
  assert.equal(view.rawCoordinatesExposed, false);
});
