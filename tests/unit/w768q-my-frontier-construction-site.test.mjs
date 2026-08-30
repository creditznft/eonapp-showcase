import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768IVisualFoundation } from '../../assets/js/city/w768/eon-expanse-w768i-my-frontier-visual-model.js';
import { deriveEonExpanseW768QConstructionSite, validateEonExpanseW768QConstructionSite } from '../../assets/js/city/w768/eon-expanse-w768q-my-frontier-construction-site.js';

const base = Object.freeze({ available: true, action: Object.freeze({ plotId: 'plot-central-command', buildingId: 'command-core', buildingLabel: 'Command Core', permitId: 'permit', sourceReceiptId: 'receipt', rendererSchema: 'renderer' }) });
const target = deriveEonExpanseW768IVisualFoundation({ unlocked: true }).plots.find((entry) => entry.plotId === 'plot-central-command').interactionAnchor;

test('W768Q requires physical presence at the authored construction plot', () => {
  const far = deriveEonExpanseW768QConstructionSite({ constructionAction: base, playerPosition: { x: 0, z: 0 } });
  const near = deriveEonExpanseW768QConstructionSite({ constructionAction: base, playerPosition: target });
  assert.equal(far.available, false);
  assert.equal(far.status, 'travel-to-construction-site');
  assert.equal(near.available, true);
  assert.equal(near.status, 'physical-site-ready');
  assert.equal(near.action.physicalPresenceRequired, true);
});

test('W768Q rejects stale site, plot and building identities', () => {
  const view = deriveEonExpanseW768QConstructionSite({ constructionAction: base, playerPosition: target });
  assert.equal(validateEonExpanseW768QConstructionSite(view).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW768QConstructionSite(view, { explicitUserAction: true, expectedSiteToken: view.action.siteToken, expectedPlotId: 'plot-central-command', expectedBuildingId: 'command-core' }).ok, true);
  assert.equal(validateEonExpanseW768QConstructionSite(view, { explicitUserAction: true, expectedSiteToken: 'changed' }).reason, 'construction-site-changed');
  assert.equal(validateEonExpanseW768QConstructionSite(view, { explicitUserAction: true, expectedPermitId: 'changed' }).reason, 'construction-site-permit-changed');
});

test('W768Q provides one bounded EONBOT inspection target without changing progression', () => {
  const view = deriveEonExpanseW768QConstructionSite({ constructionAction: base, playerPosition: target });
  assert.equal(view.companionReaction.kind, 'my-frontier-construction');
  assert.equal(view.companionReaction.action, 'construction-terminal');
  assert.ok(view.companionReaction.distance <= 7.5);
  assert.equal(view.grantsXp, false);
  assert.equal(view.mutatesMissionState, false);
});

test('W768Q forbids remote construction, teleport and additional runtime ownership', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768q-my-frontier-construction-site.js', import.meta.url), 'utf8');
  const view = deriveEonExpanseW768QConstructionSite({ constructionAction: base, playerPosition: { x: 0, z: 0 } });
  assert.equal(view.remoteConstructionAllowed, false);
  assert.equal(view.automaticMovement, false);
  assert.equal(view.privateContentStored, false);
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)|runRenderLoop|teleport|awardXp/);
});

test('W768Q is wired through the canonical runtime and reviewed overlay action', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(runtime, /deriveEonExpanseW768QConstructionSite/);
  assert.match(runtime, /validateEonExpanseW768QConstructionSite/);
  assert.match(runtime, /playerPosition:\s*playerAnchor\.position/);
  assert.match(runtime, /expanseCompanionBehavior\.react\(validated\.companionReaction/);
  assert.match(overlay, /expectedSiteToken:\s*action\?\.siteToken/);
  assert.equal((runtime.match(/new\s+(?:BABYLON\.)?Engine/g) || []).length, 1);
  assert.equal((runtime.match(/new\s+(?:BABYLON\.)?Scene/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop/g) || []).length, 1);
});
