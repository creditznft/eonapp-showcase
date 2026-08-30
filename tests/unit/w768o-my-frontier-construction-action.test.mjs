import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768OConstructionAction, validateEonExpanseW768OConstructionAction } from '../../assets/js/city/w768/eon-expanse-w768o-my-frontier-construction-action.js';

const readiness = { unlocked: true, rows: [{ plotId: 'plot-central-command', buildingId: 'command-core', buildingLabel: 'Command Core', status: 'permit-ready' }] };
const permit = { ok: true, plotId: 'plot-central-command', buildingId: 'command-core', permitId: 'permit:command', sourceReceiptId: 'receipt:finale' };
const renderer = { schema: 'renderer', canonicalScene: true, oneEngine: true, oneScene: true, oneRenderLoop: true, finishedHeroPrimitives: 0 };

test('W768O exposes one explicit construction action only when permit and canonical renderer are current', () => {
  const view = deriveEonExpanseW768OConstructionAction({ readiness, permit, rendererSummary: renderer });
  assert.equal(view.available, true);
  assert.equal(view.action.type, 'confirm-my-frontier-construction');
  assert.match(view.action.label, /Construct Command Core foundation/);
  assert.equal(validateEonExpanseW768OConstructionAction(view, { explicitUserAction: true, expectedPlotId: 'plot-central-command', expectedBuildingId: 'command-core', expectedPermitId: 'permit:command', expectedSourceReceiptId: 'receipt:finale', expectedRendererSchema: 'renderer' }).ok, true);
});

test('W768O refuses construction when the renderer cannot prove canonical foundation presentation', () => {
  const view = deriveEonExpanseW768OConstructionAction({ readiness, permit, rendererSummary: { ...renderer, canonicalScene: false } });
  assert.equal(view.available, false);
  assert.equal(view.status, 'renderer-not-ready');
});

test('W768O rejects stale permit, receipt and renderer identities', () => {
  const view = deriveEonExpanseW768OConstructionAction({ readiness, permit, rendererSummary: renderer });
  assert.equal(validateEonExpanseW768OConstructionAction(view, { explicitUserAction: true, expectedPermitId: 'changed' }).reason, 'construction-permit-changed');
  assert.equal(validateEonExpanseW768OConstructionAction(view, { explicitUserAction: true, expectedSourceReceiptId: 'changed' }).reason, 'construction-receipt-changed');
  assert.equal(validateEonExpanseW768OConstructionAction(view, { explicitUserAction: true, expectedRendererSchema: 'changed' }).reason, 'construction-renderer-changed');
});

test('W768O does not award XP, alter missions, open work or create a finished primitive hero', () => {
  const view = deriveEonExpanseW768OConstructionAction({ readiness, permit, rendererSummary: renderer });
  assert.equal(view.grantsXp, false);
  assert.equal(view.mutatesMissionState, false);
  assert.equal(view.opensWorkspaceAutomatically, false);
  assert.equal(view.createsFinishedPrimitiveHero, false);
  assert.equal(view.privateContentStored, false);
});


test('W768O is wired as a separate reviewed UI action through the canonical runtime', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(runtime, /deriveCurrentMyFrontierConstructionAction/);
  assert.match(runtime, /deriveEonExpanseW768OConstructionAction/);
  assert.match(runtime, /validateEonExpanseW768QConstructionSite/);
  assert.match(runtime, /onConfirmMyFrontierConstruction/);
  assert.match(runtime, /confirmConstruction\(\{ permit, explicitUserAction: true \}\)/);
  assert.match(overlay, /my-frontier-construct/);
  assert.match(overlay, /onConfirmMyFrontierConstructionAction/);
  assert.match(overlay, /expectedPermitId/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\s*\(/g) || []).length, 1);
});
