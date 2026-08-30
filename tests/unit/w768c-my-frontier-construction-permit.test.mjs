import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EON_CITY_PRODUCTIVE_RPG_SCHEMA } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { createEonExpanseW768BMyFrontierState } from '../../assets/js/city/w768/eon-expanse-w768b-my-frontier-state.js';
import { deriveEonExpanseW768CConstructionPermit, validateEonExpanseW768CConstructionPermit, listEonExpanseW768CConstructionAvailability } from '../../assets/js/city/w768/eon-expanse-w768c-my-frontier-construction-permit.js';

const campaignReceipt = Object.freeze({ id: 'campaign:signal-restoration:complete', campaignId: 'signal-restoration', completedAt: 1785792600000, totalXp: 2100, cosmeticId: 'signal-vanguard-glow' });
const verifyCampaignReceipt = ({ campaignReceipt: value }) => value?.id === campaignReceipt.id && value?.completedAt === campaignReceipt.completedAt ? { ok: true, receipt: campaignReceipt } : { ok: false, reason: 'campaign-receipt-mismatch' };
const nativePlan = Object.freeze({ schema: EON_CITY_PRODUCTIVE_RPG_SCHEMA, missions: Object.freeze([
  Object.freeze({ id: 'creator', state: 'completed', outcome: Object.freeze({ verified: true, kind: 'creator-guide-artifact', receiptId: 'creator:verified:1', route: '/create', source: 'creator', verifiedAt: 1785793000000 }) })
]) });
const creatorReceipt = Object.freeze({ schema: 'eon.city.expanse.productive-receipt-bridge.w767w.v1', missionId: 'create-expedition', workspaceId: 'create', status: 'completed', id: 'creator:verified:1', authoritySchema: EON_CITY_PRODUCTIVE_RPG_SCHEMA, nativeMissionId: 'creator', kind: 'creator-guide-artifact', route: '/create', source: 'creator', verifiedAt: 1785793000000, verified: true });

function unlocked() {
  const controller = createEonExpanseW768BMyFrontierState({ verifyCampaignReceipt });
  controller.unlockMyFrontier({ campaignReceipt, explicitUserAction: true });
  return controller;
}

test('W768C campaign structures require the exact finale receipt', () => {
  const controller = unlocked();
  controller.selectBuilding({ plotId: 'plot-transit', buildingId: 'regional-transit-station', explicitUserAction: true });
  assert.equal(deriveEonExpanseW768CConstructionPermit({ myFrontierState: controller.getState(), plotId: 'plot-transit', buildingId: 'regional-transit-station', campaignReceipt: { ...campaignReceipt, completedAt: 1 }, verifyCampaignReceipt }).reason, 'campaign-receipt-mismatch');
  const permit = deriveEonExpanseW768CConstructionPermit({ myFrontierState: controller.getState(), plotId: 'plot-transit', buildingId: 'regional-transit-station', campaignReceipt, verifyCampaignReceipt });
  assert.equal(permit.ok, true);
  assert.equal(permit.authority, 'campaign');
  assert.equal(validateEonExpanseW768CConstructionPermit(permit, { plotId: 'plot-transit', buildingId: 'regional-transit-station' }).ok, true);
});

test('W768C productive structures require the exact maintained native outcome', () => {
  const controller = unlocked();
  controller.selectBuilding({ plotId: 'plot-creator', buildingId: 'creator-workshop', explicitUserAction: true });
  assert.equal(deriveEonExpanseW768CConstructionPermit({ myFrontierState: controller.getState(), plotId: 'plot-creator', buildingId: 'creator-workshop', nativePlan, workspaceReceipt: { ...creatorReceipt, id: 'forged' } }).reason, 'native-workspace-receipt-mismatch');
  const permit = deriveEonExpanseW768CConstructionPermit({ myFrontierState: controller.getState(), plotId: 'plot-creator', buildingId: 'creator-workshop', nativePlan, workspaceReceipt: creatorReceipt });
  assert.equal(permit.ok, true);
  assert.equal(permit.authority, 'productive');
  assert.equal(permit.sourceReceiptId, 'creator:verified:1');
  assert.equal(permit.automaticConstruction, false);
});

test('W768C leaves unsupported future receipt families visibly pending', () => {
  const controller = unlocked();
  controller.selectBuilding({ plotId: 'plot-signal', buildingId: 'creator-capture-studio', explicitUserAction: true });
  const result = deriveEonExpanseW768CConstructionPermit({ myFrontierState: controller.getState(), plotId: 'plot-signal', buildingId: 'creator-capture-studio', campaignReceipt, nativePlan, verifyCampaignReceipt });
  assert.equal(result.ok, false);
  assert.equal(result.authority, 'pending');
  assert.equal(result.reason, 'native-creator-capture-receipt-pending');
  assert.equal(listEonExpanseW768CConstructionAvailability(controller.getState()).find((entry) => entry.plotId === 'plot-signal').unavailableReason, 'native-creator-capture-receipt-pending');
});

test('W768C rejects changed plans and creates no runtime or automatic action', () => {
  const controller = unlocked();
  controller.selectBuilding({ plotId: 'plot-knowledge', buildingId: 'archive-vault', explicitUserAction: true });
  assert.equal(deriveEonExpanseW768CConstructionPermit({ myFrontierState: controller.getState(), plotId: 'plot-knowledge', buildingId: 'research-observatory', nativePlan }).reason, 'planned-building-selection-required');
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768c-my-frontier-construction-permit.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(/);
  assert.doesNotMatch(source, /fetch\s*\(|localStorage|automaticConstruction\s*:\s*true/);
});
