import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEonExpanseW768BMyFrontierState } from '../../assets/js/city/w768/eon-expanse-w768b-my-frontier-state.js';
import { deriveEonExpanseW768CConstructionPermit, validateEonExpanseW768CConstructionPermit } from '../../assets/js/city/w768/eon-expanse-w768c-my-frontier-construction-permit.js';
import { createEonExpanseW768DConstructionLedger, validateEonExpanseW768DConstructionLedger } from '../../assets/js/city/w768/eon-expanse-w768d-my-frontier-construction-ledger.js';

const campaignReceipt = Object.freeze({ id: 'campaign:signal-restoration:complete', campaignId: 'signal-restoration', completedAt: 1785792600000, totalXp: 2100, cosmeticId: 'signal-vanguard-glow' });
const verifyCampaignReceipt = ({ campaignReceipt: value }) => value?.id === campaignReceipt.id && value?.completedAt === campaignReceipt.completedAt ? { ok: true, receipt: campaignReceipt } : { ok: false, reason: 'campaign-receipt-mismatch' };

function setup() {
  const frontier = createEonExpanseW768BMyFrontierState({ verifyCampaignReceipt });
  frontier.unlockMyFrontier({ campaignReceipt, explicitUserAction: true });
  frontier.selectBuilding({ plotId: 'plot-transit', buildingId: 'regional-transit-station', explicitUserAction: true });
  const permit = deriveEonExpanseW768CConstructionPermit({ myFrontierState: frontier.getState(), plotId: 'plot-transit', buildingId: 'regional-transit-station', campaignReceipt, verifyCampaignReceipt });
  const verifyConstructionPermit = ({ permit: candidate }) => candidate?.permitId === permit.permitId ? validateEonExpanseW768CConstructionPermit(permit) : { ok: false, reason: 'construction-permit-stale' };
  const verifyConstructionRecord = ({ record }) => record?.permitId === permit.permitId ? { ok: true } : { ok: false };
  return { frontier, permit, verifyConstructionPermit, verifyConstructionRecord };
}

test('W768D constructs only after explicit current-permit revalidation and awards no XP', () => {
  const { frontier, permit, verifyConstructionPermit, verifyConstructionRecord } = setup();
  const ledger = createEonExpanseW768DConstructionLedger({ verifyConstructionPermit, verifyConstructionRecord, now: () => 1785794000000 });
  assert.equal(ledger.confirmConstruction({ permit }).reason, 'explicit-user-action-required');
  assert.equal(ledger.confirmConstruction({ permit: { ...permit, sourceReceiptId: 'changed' }, explicitUserAction: true }).reason, 'construction-permit-stale');
  const result = ledger.confirmConstruction({ permit, explicitUserAction: true });
  assert.equal(result.ok, true);
  assert.equal(result.awardsXp, false);
  assert.equal(result.constructionReceipt.awardsXp, false);
  assert.equal(ledger.getSafeProjection(frontier.getState()).plots.find((entry) => entry.plotId === 'plot-transit').status, 'constructed');
  assert.equal(validateEonExpanseW768DConstructionLedger(ledger.getState()).ok, true);
});

test('W768D is idempotent and prevents conflicting replacement on an occupied plot', () => {
  const { permit, verifyConstructionPermit, verifyConstructionRecord } = setup();
  const ledger = createEonExpanseW768DConstructionLedger({ verifyConstructionPermit, verifyConstructionRecord, now: () => 1785794000000 });
  ledger.confirmConstruction({ permit, explicitUserAction: true });
  assert.equal(ledger.confirmConstruction({ permit, explicitUserAction: true }).reason, 'building-already-constructed');
  const conflicting = { ...permit, permitId: permit.permitId.replace('regional-transit-station', 'gateway-terminal'), buildingId: 'gateway-terminal' };
  const permissiveVerifier = ({ permit: candidate }) => validateEonExpanseW768CConstructionPermit(candidate);
  const conflictLedger = createEonExpanseW768DConstructionLedger({ initial: ledger.getState(), verifyConstructionPermit: permissiveVerifier, verifyConstructionRecord, now: () => 1785795000000 });
  assert.equal(conflictLedger.confirmConstruction({ permit: conflicting, explicitUserAction: true }).reason, 'plot-already-constructed');
});

test('W768D restores only independently verified construction records', () => {
  const { permit, verifyConstructionPermit, verifyConstructionRecord } = setup();
  const initial = { records: [
    { plotId: permit.plotId, buildingId: permit.buildingId, permitId: permit.permitId, sourceReceiptId: permit.sourceReceiptId, authority: permit.authority, constructedAt: 1785794000000 },
    { plotId: 'plot-creator', buildingId: 'creator-workshop', permitId: 'forged', sourceReceiptId: 'private-prompt', authority: 'productive', constructedAt: 1785794000000 }
  ], privatePrompt: 'must disappear', rawCoordinates: { x: 999 } };
  const ledger = createEonExpanseW768DConstructionLedger({ initial, verifyConstructionPermit, verifyConstructionRecord });
  assert.equal(ledger.getState().records.length, 1);
  assert.equal(ledger.getState().records[0].permitId, permit.permitId);
  assert.doesNotMatch(JSON.stringify(ledger.getState()), /must disappear|private-prompt|999/);
});

test('W768D remains a bounded ledger with no renderer, network, XP or automatic build authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768d-my-frontier-construction-ledger.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(/);
  assert.doesNotMatch(source, /fetch\s*\(|localStorage|onAwardXp|automaticConstruction\s*:\s*true|awardsXp\s*:\s*true/);
});
