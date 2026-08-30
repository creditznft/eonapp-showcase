import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W769H mission board exposes truthful upgrade rows and only one reviewed ready action', () => {
  assert.match(runtime, /deriveCurrentMyFrontierUpgradeBoard/);
  assert.match(runtime, /rows: freeze\(views\.map/);
  assert.match(runtime, /readyCount: views\.filter/);
  assert.match(runtime, /operationalCount: expanseMyFrontierUpgrades\.getState\(\)\.records\.length/);
  assert.match(runtime, /action: readySite\?\.action \|\| null/);
});

test('W769H overlay shows an upgrade button only for the canonical reviewed action', () => {
  assert.match(overlay, /data-eon-expanse-ui-action':'my-frontier-upgrade/);
  assert.match(overlay, /myFrontierDistrictUpgrade\?\.action/);
  assert.match(overlay, /confirm-my-frontier-district-upgrade/);
  assert.match(overlay, /onConfirmMyFrontierDistrictUpgradeAction/);
});

test('W769H revalidates plot, building, permit and receipt immediately before confirmation', () => {
  assert.match(runtime, /onConfirmMyFrontierDistrictUpgrade/);
  assert.match(runtime, /validateEonExpanseW769DDistrictUpgradeAction\(current/);
  assert.match(runtime, /expectedPlotId/);
  assert.match(runtime, /expectedBuildingId/);
  assert.match(runtime, /expectedPermitId/);
  assert.match(runtime, /expectedSourceReceiptId/);
});

test('W769H remains explicit, XP neutral and non-financial', () => {
  assert.match(runtime, /automaticUpgrade: false, grantsXp: false, paidShortcutAccepted: false/);
  assert.doesNotMatch(runtime + overlay, /autoConfirmMyFrontierDistrictUpgrade|payment[^\n]*my-frontier-upgrade|checkout[^\n]*my-frontier-upgrade/);
});
