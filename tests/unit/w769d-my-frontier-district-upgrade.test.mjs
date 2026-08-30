import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EON_CITY_PRODUCTIVE_RPG_SCHEMA } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { deriveEonExpanseW767WProductiveReceipt } from '../../assets/js/city/w766/eon-expanse-w767w-productive-receipt-bridge.js';
import { deriveEonExpanseW769DDistrictUpgrade, validateEonExpanseW769DDistrictUpgradeAction } from '../../assets/js/city/w769/eon-expanse-w769d-my-frontier-district-upgrade.js';

const plan = (receiptId = 'receipt-new', verifiedAt = 500) => ({ schema: EON_CITY_PRODUCTIVE_RPG_SCHEMA, missions: [{ id: 'creator', state: 'completed', outcome: { verified: true, kind: 'creator-guide-artifact', receiptId, verifiedAt, route: '/create', source: 'create' } }] });
const construction = { plotId: 'plot-creator', buildingId: 'creator-workshop', sourceReceiptId: 'receipt-old', constructedAt: 200 };

test('W769D requires independently verified construction before any upgrade', () => {
  const view = deriveEonExpanseW769DDistrictUpgrade();
  assert.equal(view.available, false);
  assert.equal(view.status, 'verified-construction-required');
});

test('W769D issues level-two readiness only from a fresh exact native receipt after construction', () => {
  const nativePlan = plan();
  const workspaceReceipt = deriveEonExpanseW767WProductiveReceipt(nativePlan, 'create-expedition');
  const view = deriveEonExpanseW769DDistrictUpgrade({ constructionRecord: construction, workspaceReceipt, nativePlan });
  assert.equal(view.available, true);
  assert.equal(view.targetLevel, 2);
  assert.equal(view.action.sourceReceiptId, 'receipt-new');
  assert.equal(view.automaticUpgrade, false);
});

test('W769D rejects reuse of the construction receipt and receipts predating construction', () => {
  const reusedPlan = plan('receipt-old', 500);
  assert.equal(deriveEonExpanseW769DDistrictUpgrade({ constructionRecord: construction, workspaceReceipt: deriveEonExpanseW767WProductiveReceipt(reusedPlan, 'create-expedition'), nativePlan: reusedPlan }).status, 'fresh-native-receipt-required');
  const oldPlan = plan('receipt-new', 100);
  assert.equal(deriveEonExpanseW769DDistrictUpgrade({ constructionRecord: construction, workspaceReceipt: deriveEonExpanseW767WProductiveReceipt(oldPlan, 'create-expedition'), nativePlan: oldPlan }).status, 'post-construction-native-receipt-required');
});

test('W769D keeps campaign and pending building families visibly unavailable until native bridges exist', () => {
  const campaign = deriveEonExpanseW769DDistrictUpgrade({ constructionRecord: { plotId: 'plot-transit', buildingId: 'regional-transit-station', sourceReceiptId: 'campaign', constructedAt: 100 } });
  assert.equal(campaign.status, 'native-district-upgrade-receipt-pending');
  const pending = deriveEonExpanseW769DDistrictUpgrade({ constructionRecord: { plotId: 'plot-signal', buildingId: 'broadcast-tower', sourceReceiptId: 'campaign', constructedAt: 100 } });
  assert.match(pending.status, /pending/);
});

test('W769D validation is explicit, stale-safe and owns no runtime or progression authority', () => {
  const nativePlan = plan();
  const view = deriveEonExpanseW769DDistrictUpgrade({ constructionRecord: construction, workspaceReceipt: deriveEonExpanseW767WProductiveReceipt(nativePlan, 'create-expedition'), nativePlan });
  assert.equal(validateEonExpanseW769DDistrictUpgradeAction(view).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW769DDistrictUpgradeAction(view, { explicitUserAction: true, expectedPermitId: 'wrong' }).reason, 'district-upgrade-permit-changed');
  assert.equal(validateEonExpanseW769DDistrictUpgradeAction(view, { explicitUserAction: true, expectedPermitId: view.action.permitId }).ok, true);
  const source = fs.readFileSync(new URL('../../assets/js/city/w769/eon-expanse-w769d-my-frontier-district-upgrade.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)|runRenderLoop|localStorage|awardXp|completeMission|fetch\s*\(/);
});
