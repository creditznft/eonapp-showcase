import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  deriveEonExpanseW768VResidentReceipt,
  listEonExpanseW768VResidentAvailability,
  validateEonExpanseW768VResidentReceipt
} from '../../assets/js/city/w768/eon-expanse-w768v-my-frontier-resident-authority.js';

const completedAt = 1785792700000;
const missionLedger = Object.freeze({
  missions: Object.freeze({
    'beyond-the-gate': Object.freeze({ status: 'completed', completedAt }),
    'echoes-in-the-archive': Object.freeze({ status: 'completed', completedAt: completedAt + 1000 }),
    'the-broken-line': Object.freeze({ status: 'available', completedAt: 0 }),
    'the-first-reveal': Object.freeze({ status: 'locked', completedAt: 0 })
  })
});

test('W768V derives an exact resident receipt only from a completed maintained character arc', () => {
  const result = deriveEonExpanseW768VResidentReceipt({ residentId: 'pathfinder', missionLedger });
  assert.equal(result.ok, true);
  assert.deepEqual(result.receipt, {
    id: `character-arc:pathfinder:beyond-the-gate:${completedAt}`,
    residentId: 'pathfinder',
    completedAt,
    privateContentStored: false
  });
  assert.equal(result.mutatesMissionAuthority, false);
  assert.equal(result.awardsXp, false);
});

test('W768V rejects incomplete, forged and wrong-slot resident authorities', () => {
  assert.equal(deriveEonExpanseW768VResidentReceipt({ residentId: 'maintenance-specialist', missionLedger }).reason, 'character-arc-incomplete');
  const current = deriveEonExpanseW768VResidentReceipt({ residentId: 'pathfinder', missionLedger });
  assert.equal(validateEonExpanseW768VResidentReceipt({ slotId: 'resident-navigator', residentId: 'pathfinder', residentReceipt: current.receipt, missionLedger }).reason, 'resident-slot-policy-mismatch');
  assert.equal(validateEonExpanseW768VResidentReceipt({ slotId: 'resident-pathfinder', residentId: 'pathfinder', residentReceipt: { ...current.receipt, completedAt: 1 }, missionLedger }).reason, 'resident-receipt-mismatch');
});

test('W768V keeps productive resident bridges explicitly pending instead of fabricating receipts', () => {
  assert.equal(deriveEonExpanseW768VResidentReceipt({ residentId: 'creator-trade-master', missionLedger }).reason, 'native-receipt-bridge-pending');
  assert.equal(deriveEonExpanseW768VResidentReceipt({ residentId: 'vault-steward', missionLedger }).reason, 'native-receipt-bridge-pending');
});

test('W768V reports privacy-safe availability for all six authored resident slots', () => {
  const list = listEonExpanseW768VResidentAvailability({ missionLedger });
  assert.equal(list.length, 6);
  assert.equal(list.find((entry) => entry.residentId === 'pathfinder').status, 'receipt-ready');
  assert.equal(list.find((entry) => entry.residentId === 'creator-trade-master').status, 'native-receipt-bridge-pending');
  assert.doesNotMatch(JSON.stringify(list), /prompt|document|apiKey|secret/i);
});


test('W768V is wired to the one canonical City runtime for reload verification', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /validateEonExpanseW768VResidentReceipt/);
  assert.match(runtime, /verifyCurrentMyFrontierResidentReceipt/);
  assert.match(runtime, /verifyResidentReceipt:\s*verifyCurrentMyFrontierResidentReceipt/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\s*\(/g) || []).length, 1);
});

test('W768V is a pure authority and cannot render, persist, network or award progression', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768v-my-frontier-resident-authority.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(|fetch\s*\(|localStorage|awardXp|completeObjective/);
});
