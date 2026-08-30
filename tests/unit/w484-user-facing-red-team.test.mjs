import test from 'node:test';
import assert from 'node:assert/strict';
import { W484_USER_FACING_RED_TEAM_CONTRACT, validateW484UserFacingRedTeamContract } from '../../config/w484-user-facing-red-team-contract.mjs';
import { inspectW484UserFacingRedTeam } from '../../scripts/w484-user-facing-red-team-gate.mjs';

test('W484 contract validates launch UX, viral, business and IoT decisions', () => {
  assert.deepEqual(validateW484UserFacingRedTeamContract(), []);
  assert.equal(W484_USER_FACING_RED_TEAM_CONTRACT.remainingExecutionWaves.length, 2);
  assert.equal(W484_USER_FACING_RED_TEAM_CONTRACT.truth.automaticPostingAllowedNow, false);
  assert.equal(W484_USER_FACING_RED_TEAM_CONTRACT.truth.iotRemoteControlAllowedNow, false);
});

test('W484 source gate proves hover-expand shell and red-team plan', () => {
  const result = inspectW484UserFacingRedTeam();
  assert.equal(result.status, 'pass');
  assert.equal(result.remainingWaveCountBeforeOwnerGo, 2);
  assert.ok(result.plan.includes('collapsed desktop sidebar that expands on hover/focus'));
  assert.ok(result.shareableObjects.includes('eoncity-postcard'));
});
