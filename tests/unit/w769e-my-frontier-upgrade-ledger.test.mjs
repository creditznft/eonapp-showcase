import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEonExpanseW769EUpgradeLedger, validateEonExpanseW769EUpgradeLedger } from '../../assets/js/city/w769/eon-expanse-w769e-my-frontier-upgrade-ledger.js';

const action = { type: 'confirm-my-frontier-district-upgrade', plotId: 'plot-creator', buildingId: 'creator-workshop', currentLevel: 1, targetLevel: 2, permitId: 'my-frontier-upgrade:plot-creator:creator-workshop:2:receipt-new', sourceReceiptId: 'receipt-new', explicitUserActionRequired: true, reviewFirst: true };
const view = { schema: 'eon.expanse.my-frontier-district-upgrade.w769d.v1', available: true, status: 'operational-upgrade-ready', action };
const verifier = ({ upgradeView }) => ({ ok: true, action: upgradeView.action });
const recordVerifier = ({ record }) => ({ ok: record.plotId === 'plot-creator' && record.sourceReceiptId === 'receipt-new' });

test('W769E requires explicit action and current upgrade authority', () => {
  const ledger = createEonExpanseW769EUpgradeLedger({ verifyUpgradeView: verifier, verifyUpgradeRecord: recordVerifier, now: () => 900 });
  assert.equal(ledger.confirmUpgrade({ upgradeView: view }).reason, 'explicit-user-action-required');
  const unavailable = createEonExpanseW769EUpgradeLedger({ verifyUpgradeRecord: recordVerifier });
  assert.equal(unavailable.confirmUpgrade({ upgradeView: view, explicitUserAction: true }).reason, 'district-upgrade-authority-unavailable');
});

test('W769E confirms one idempotent operational upgrade and awards no XP', () => {
  const ledger = createEonExpanseW769EUpgradeLedger({ verifyUpgradeView: verifier, verifyUpgradeRecord: recordVerifier, now: () => 900 });
  const result = ledger.confirmUpgrade({ upgradeView: view, explicitUserAction: true });
  assert.equal(result.ok, true);
  assert.equal(result.record.level, 2);
  assert.equal(result.awardsXp, false);
  assert.equal(ledger.confirmUpgrade({ upgradeView: view, explicitUserAction: true }).reason, 'district-operational-upgrade-already-complete');
  assert.equal(validateEonExpanseW769EUpgradeLedger(ledger.getState()).ok, true);
});

test('W769E independently prunes forged persisted upgrade records', () => {
  const initial = { records: [{ plotId: 'plot-creator', buildingId: 'creator-workshop', level: 2, permitId: 'permit-forged', sourceReceiptId: 'receipt-forged', upgradedAt: 800 }] };
  const ledger = createEonExpanseW769EUpgradeLedger({ initial, verifyUpgradeRecord: recordVerifier });
  assert.equal(ledger.getState().records.length, 0);
});

test('W769E projects only unavailable, foundation or operational levels from canonical construction truth', () => {
  const ledger = createEonExpanseW769EUpgradeLedger({ verifyUpgradeView: verifier, verifyUpgradeRecord: recordVerifier, now: () => 900 });
  ledger.confirmUpgrade({ upgradeView: view, explicitUserAction: true });
  const projection = ledger.getSafeProjection({ plots: [{ plotId: 'plot-creator', constructedBuildingId: 'creator-workshop', status: 'constructed' }, { plotId: 'plot-knowledge', constructedBuildingId: 'archive-vault', status: 'constructed' }, { plotId: 'plot-signal', constructedBuildingId: '', status: 'planned' }] });
  assert.deepEqual(projection.plots.map((entry) => entry.level), [2, 1, 0]);
  assert.equal(projection.operationalCount, 1);
});

test('W769E owns no renderer, network, payment, progression or free-placement authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w769/eon-expanse-w769e-my-frontier-upgrade-ledger.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)|runRenderLoop|fetch\s*\(|awardXp|completeMission|payment|checkout|rawCoordinatesAccepted:\s*true/);
});
