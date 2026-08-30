import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768UResidentInspection, validateEonExpanseW768UResidentInspection } from '../../assets/js/city/w768/eon-expanse-w768u-my-frontier-resident-inspection.js';

const reserved = deriveEonExpanseW768UResidentInspection({ slotId: 'resident-navigator', myFrontierState: { unlocked: true, residents: {} } });
const invited = deriveEonExpanseW768UResidentInspection({ slotId: 'resident-navigator', myFrontierState: { unlocked: true, residents: { 'resident-navigator': 'navigator' } } });

test('W768U reports reserved and invited-signal states without inventing a resident body', () => {
  assert.equal(reserved.status, 'reserved-resident-station');
  assert.match(reserved.detail, /verified character-arc receipt/);
  assert.equal(invited.status, 'invited-anchor-awaiting-authored-resident');
  assert.match(invited.detail, /not presented until/);
  assert.equal(invited.residentBodyVisible, false);
});

test('W768U requires explicit action and rejects stale station identities', () => {
  assert.equal(validateEonExpanseW768UResidentInspection(reserved).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW768UResidentInspection(reserved, { explicitUserAction: true, expectedSlotId: reserved.slotId, expectedToken: reserved.expectedToken }).ok, true);
  assert.equal(validateEonExpanseW768UResidentInspection(reserved, { explicitUserAction: true, expectedToken: invited.expectedToken }).reason, 'resident-station-changed');
});

test('W768U remains unavailable before verified My Frontier unlock', () => {
  assert.equal(deriveEonExpanseW768UResidentInspection({ slotId: 'resident-navigator', myFrontierState: { unlocked: false } }).reason, 'my-frontier-locked');
});

test('W768U cannot invite, award XP, mutate missions or store private content', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768u-my-frontier-resident-inspection.js', import.meta.url), 'utf8');
  assert.equal(invited.automaticInvitation, false);
  assert.equal(invited.grantsXp, false);
  assert.equal(invited.mutatesMissionState, false);
  assert.equal(invited.privateContentStored, false);
  assert.doesNotMatch(source, /inviteResident\s*\(|awardXp|fetch\s*\(|localStorage|runRenderLoop|new\s+(?:BABYLON\.)?(?:Engine|Scene)/);
});

test('W768U is wired through the canonical plot renderer and shared interaction dispatcher', () => {
  const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
  const gateway = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(renderer, /expanse-my-frontier-resident-station/);
  assert.match(renderer, /deriveEonExpanseW768UResidentInspection/);
  assert.match(gateway, /action === 'inspect-my-frontier-resident-station'/);
  assert.match(gateway, /metadata\.slotId/);
  assert.match(runtime, /validateEonExpanseW768UResidentInspection/);
  assert.match(runtime, /w768u-my-frontier-resident-inspection/);
  assert.equal((runtime.match(/runRenderLoop/g) || []).length, 1);
});
