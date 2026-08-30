import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768IVisualFoundation } from '../../assets/js/city/w768/eon-expanse-w768i-my-frontier-visual-model.js';
import { deriveEonExpanseW769IUpgradeSite, validateEonExpanseW769IUpgradeSite } from '../../assets/js/city/w769/eon-expanse-w769i-my-frontier-upgrade-site.js';

const action = { type: 'confirm-my-frontier-district-upgrade', plotId: 'plot-creator', buildingId: 'creator-workshop', permitId: 'permit-upgrade', sourceReceiptId: 'receipt-new' };
const upgradeView = { available: true, action };
const target = deriveEonExpanseW768IVisualFoundation({ unlocked: true }).plots.find((entry) => entry.plotId === 'plot-creator').interactionAnchor;

test('W769I requires physical presence at the authored district before upgrade confirmation', () => {
  const far = deriveEonExpanseW769IUpgradeSite({ upgradeView, playerPosition: { x: 0, z: 0 } });
  assert.equal(far.available, false);
  assert.equal(far.status, 'travel-to-district-upgrade-site');
  const near = deriveEonExpanseW769IUpgradeSite({ upgradeView, playerPosition: target });
  assert.equal(near.available, true);
  assert.equal(near.action.physicalPresenceRequired, true);
  assert.equal(near.remoteUpgradeAllowed, false);
});

test('W769I produces one bounded EONBOT inspection reaction only for a ready physical site', () => {
  const near = deriveEonExpanseW769IUpgradeSite({ upgradeView, playerPosition: target });
  assert.equal(near.companionReaction.kind, 'my-frontier-upgrade');
  assert.equal(near.companionReaction.plotId, 'plot-creator');
  assert.equal(near.grantsXp, false);
  assert.equal(deriveEonExpanseW769IUpgradeSite({ upgradeView: { available: false }, playerPosition: target }).companionReaction, null);
});

test('W769I validation is explicit and stale-site safe', () => {
  const near = deriveEonExpanseW769IUpgradeSite({ upgradeView, playerPosition: target });
  assert.equal(validateEonExpanseW769IUpgradeSite(near).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW769IUpgradeSite(near, { explicitUserAction: true, expectedSiteToken: 'wrong' }).reason, 'district-upgrade-site-changed');
  assert.equal(validateEonExpanseW769IUpgradeSite(near, { explicitUserAction: true, expectedSiteToken: near.action.siteToken }).ok, true);
});

test('W769I is wired through mission board, overlay and public runtime confirmation', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(runtime, /deriveEonExpanseW769IUpgradeSite/);
  assert.match(runtime, /validateEonExpanseW769IUpgradeSite/);
  assert.match(runtime, /companionReaction = expanseCompanionBehavior\.react/);
  assert.match(runtime, /remoteUpgradeAllowed: false/);
  assert.match(overlay, /expectedSiteToken: action\?\.siteToken/);
});

test('W769I owns no movement, runtime, progression or automatic upgrade authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w769/eon-expanse-w769i-my-frontier-upgrade-site.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)|runRenderLoop|teleport|movePlayer|awardXp|completeMission|localStorage/);
});
