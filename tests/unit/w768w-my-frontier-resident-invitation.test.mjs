import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  deriveEonExpanseW768WResidentInvitationView,
  validateEonExpanseW768WResidentInvitationAction
} from '../../assets/js/city/w768/eon-expanse-w768w-my-frontier-resident-invitation.js';

const completedAt = 1785792700000;
const missionLedger = Object.freeze({ missions: Object.freeze({
  'beyond-the-gate': Object.freeze({ status: 'completed', completedAt }),
  'echoes-in-the-archive': Object.freeze({ status: 'completed', completedAt: completedAt + 1000 }),
  'the-broken-line': Object.freeze({ status: 'available', completedAt: 0 }),
  'the-first-reveal': Object.freeze({ status: 'locked', completedAt: 0 })
}) });
const unlocked = Object.freeze({ unlocked: true, residents: Object.freeze({}) });

test('W768W exposes one ordered explicit invitation from completed character arcs', () => {
  const view = deriveEonExpanseW768WResidentInvitationView({ myFrontierState: unlocked, missionLedger });
  assert.equal(view.visible, true);
  assert.equal(view.rows.length, 6);
  assert.equal(view.readyCount, 2);
  assert.equal(view.action.residentId, 'pathfinder');
  assert.equal(view.action.receiptId, `character-arc:pathfinder:beyond-the-gate:${completedAt}`);
  assert.equal(view.automaticInvitation, false);
});

test('W768W advances to the next ready resident after a verified invitation', () => {
  const view = deriveEonExpanseW768WResidentInvitationView({ myFrontierState: { ...unlocked, residents: { 'resident-pathfinder': 'pathfinder' } }, missionLedger });
  assert.equal(view.invitedCount, 1);
  assert.equal(view.action.residentId, 'navigator');
  assert.equal(view.rows.find((row) => row.residentId === 'pathfinder').status, 'invited-signal-active');
});

test('W768W keeps incomplete and pending resident bridges unavailable', () => {
  const view = deriveEonExpanseW768WResidentInvitationView({ myFrontierState: unlocked, missionLedger });
  assert.equal(view.rows.find((row) => row.residentId === 'maintenance-specialist').status, 'character-arc-incomplete');
  assert.equal(view.rows.find((row) => row.residentId === 'creator-trade-master').status, 'native-receipt-bridge-pending');
  assert.equal(view.rows.find((row) => row.residentId === 'vault-steward').receiptId, '');
});

test('W768W requires explicit action and rejects stale receipt identity', () => {
  const view = deriveEonExpanseW768WResidentInvitationView({ myFrontierState: unlocked, missionLedger });
  assert.equal(validateEonExpanseW768WResidentInvitationAction(view).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW768WResidentInvitationAction(view, { explicitUserAction: true, expectedReceiptId: 'forged' }).reason, 'resident-invitation-action-stale');
  const valid = validateEonExpanseW768WResidentInvitationAction(view, { explicitUserAction: true, expectedSlotId: view.action.slotId, expectedResidentId: view.action.residentId, expectedReceiptId: view.action.receiptId, expectedCompletedAt: view.action.completedAt });
  assert.equal(valid.ok, true);
  assert.equal(valid.awardsXp, false);
});

test('W768W owns no runtime, persistence, progression or automatic invitation authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768w-my-frontier-resident-invitation.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(|localStorage|fetch\s*\(|awardXp|completeObjective|inviteResident\s*\(/);
});

test('W768W is wired through the canonical mission board and reviewed overlay action', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(runtime, /deriveEonExpanseW768WResidentInvitationView/);
  assert.match(runtime, /validateEonExpanseW768WResidentInvitationAction/);
  assert.match(runtime, /onInviteMyFrontierResident/);
  assert.match(runtime, /inviteExpanseMyFrontierResident/);
  assert.match(runtime, /myFrontierResidents/);
  assert.match(overlay, /my-frontier-invite-resident/);
  assert.match(overlay, /onInviteMyFrontierResidentAction/);
  assert.match(overlay, /residentReceiptId|expectedReceiptId/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\s*\(/g) || []).length, 1);
});
